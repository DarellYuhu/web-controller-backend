import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { execa } from 'execa';
import Docker from 'dockerode';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  articleSchema,
  categorySchema,
  sectionSchema,
} from './generator.schema';
import { writeFile } from 'fs/promises';
import { z } from 'zod/v4';
import { MinioService } from '@/minio/minio.service';

@Injectable()
export class GeneratorService {
  private readonly docker: Docker;
  private readonly TEMPLATE_REPOSITORY: string;
  private readonly logger = new Logger(GeneratorService.name, {
    timestamp: true,
  });
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    this.TEMPLATE_REPOSITORY = process.env.TEMPLATE_REPOSITORY ?? '';
  }

  async generate(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { deployment: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const lastDp = project.deployment[0];
    const targetFldr = './tmp/web-template';
    const name = project.slug;
    await execa('rm', ['-rf', targetFldr]);
    await execa('git', ['clone', this.TEMPLATE_REPOSITORY, targetFldr]);
    await this.buildImg(projectId, targetFldr, name);
    if (lastDp && lastDp.status === 'running') {
      await this.rmDeploy(lastDp.id);
    }
    const dpData = await this.deployCtr(
      `${targetFldr}/${name}.tar.gz`,
      name,
      project.port,
    );
    await this.prisma.deployment.create({
      data: {
        ...dpData,
        projectId: project.id,
      },
    });
    this.logger.log('Web generated successfully');
  }

  private async rmDeploy(dpId: string) {
    this.logger.log('Remove Deployment');
    try {
      const container = this.docker.getContainer(dpId);
      const State = (await container.inspect()).State;
      if (State.Status === 'running' || State.Status === 'exited') {
        // await container.stop();
        await container.remove({ force: true });
      }
      await this.prisma.deployment.update({
        where: { id: dpId },
        data: { status: 'exited' },
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Fail remove deployment');
    }
  }

  private async deployCtr(imgPath: string, imgName: string, port: number) {
    this.logger.log('Deploying container');
    try {
      await this.docker.loadImage(imgPath);
      const container = await this.docker.createContainer({
        Image: imgName,
        name: `${imgName}-ctr`,
        HostConfig: {
          PortBindings: {
            '3000/tcp': [{ HostPort: `${port}`, HostIp: '127.0.0.1' }],
          },
        },
      });
      await container.start();
      const { Id, State, Name } = await this.docker
        .getContainer(`${imgName}-ctr`)
        .inspect();
      return { id: Id, status: State.Status, name: Name };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Fail deploy container');
    }
  }

  private async seedData(projectId: string, dir: string) {
    this.logger.log('Seeding data');
    try {
      // const mainSectionArticles = await this.prisma.article.findMany({where: {Section: {not}}});
      const rawArticles = await this.prisma.article.findMany({
        where: { projectId },
        include: { Section: true, author: true, image: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      const rawCategories = await this.prisma.category.findMany();
      const articles = await Promise.all(
        rawArticles.map(async (itm) => {
          if (itm.image)
            await this.minio.copyObjectToLocal(
              itm.image.fullPath,
              dir.concat(`/public/assets/${itm.image.name}`),
            );
          return {
            id: itm.id,
            title: itm.title,
            contents: itm.contents,
            categoryId: itm.categoryId,
            authorName: itm.author?.name,
            datePublished:
              itm.datePublished?.toISOString() ?? new Date().toISOString(),
            slug: itm.slug,
            imageUrl: itm.image
              ? `/assets/${itm.image.name}`
              : '/assets/news-img-placeholder.png',
          };
        }),
      );
      const highlights = rawArticles
        .filter((item) => item.Section?.type === 'Highlight')
        .map((item) => ({ articleId: item.id }));
      const topPicks = rawArticles
        .filter((item) => item.Section?.type === 'TopPick')
        .map((item) => ({ articleId: item.id }));
      const populars = rawArticles
        .filter((item) => item.Section?.type === 'Popular')
        .map((item) => ({ articleId: item.id }));
      const articlePath = await this.writeTmpData(
        dir,
        'article-data',
        articles,
        articleSchema,
      );
      const categoryPath = await this.writeTmpData(
        dir,
        'category-data',
        rawCategories,
        categorySchema,
      );
      const highlightPath = await this.writeTmpData(
        dir,
        'highlight-data',
        highlights,
        sectionSchema,
      );
      const popularPath = await this.writeTmpData(
        dir,
        'popular-data',
        populars,
        sectionSchema,
      );
      const topPickPath = await this.writeTmpData(
        dir,
        'top-pick-data',
        topPicks,
        sectionSchema,
      );
      await execa('npm', ['i'], { cwd: dir });
      await execa(
        'npx',
        ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'],
        { cwd: dir, env: { DATABASE_URL: 'file:./prod.db' } },
      );
      await execa(
        'npx',
        ['prisma', 'generate', '--schema', 'prisma/schema.prisma'],
        { cwd: dir },
      );
      await execa('npx', ['prisma', 'db', 'seed'], {
        cwd: dir,
        env: {
          DATABASE_URL: 'file:./prod.db',
          FROM_CONTROLLER: 'true',
          CATEGORIES_DATA: categoryPath,
          ARTICLES_DATA: articlePath,
          HIGHLIGHTS_DATA: highlightPath,
          TOPPICKS_DATA: topPickPath,
          POPULARS_DATA: popularPath,
        },
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Fail build image');
    }
  }

  private async writeTmpData(
    dir: string,
    name: string,
    data: unknown,
    schema: z.ZodType,
  ) {
    schema.parse(data);
    const filename = name.concat('.json');
    await writeFile(dir.concat('/', filename), JSON.stringify(data));
    return filename;
  }

  private async buildImg(projectId: string, dir: string, name: string) {
    try {
      await this.seedData(projectId, dir);
      this.logger.log('Build img');
      await execa('sh', ['-c', 'echo "DATABASE_URL=file:./prod.db" > .env'], {
        cwd: dir,
      });
      await execa('docker', ['build', '-t', name, '.'], {
        cwd: dir,
        env: { DATABASE_URL: 'file:./prod.db' },
      });
      await execa('sh', ['-c', `docker save ${name} | gzip > ${name}.tar.gz`], {
        cwd: dir,
      });
      await execa('docker', ['rmi', name]);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Fail build image');
    }
  }
}
