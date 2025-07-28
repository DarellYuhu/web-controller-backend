import { Injectable, Logger } from '@nestjs/common';
import { execa } from 'execa';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  articleSchema,
  categorySchema,
  sectionSchema,
} from './generator.schema';
import { writeFile } from 'fs/promises';
import { z } from 'zod/v4';
import { MinioService } from '@/minio/minio.service';
import { DockerService } from '@/docker/docker.service';
import { unionBy } from 'lodash';

@Injectable()
export class GeneratorService {
  private readonly TEMPLATE_REPOSITORY: string;
  private readonly logger = new Logger(GeneratorService.name, {
    timestamp: true,
  });
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly docker: DockerService,
  ) {
    this.TEMPLATE_REPOSITORY = process.env.TEMPLATE_REPOSITORY ?? '';
  }

  async generate(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { deployment: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const lastDp = project.deployment[0];
    const targetFldr = './tmp/web-template';
    const slug = project.slug;
    await execa('rm', ['-rf', targetFldr]);
    await execa('git', ['clone', this.TEMPLATE_REPOSITORY, targetFldr]);
    await this.seedData(projectId, targetFldr);
    await this.docker.buildImg({
      slug,
      id: projectId,
      dir: targetFldr,
      desc: project.description,
      name: project.name,
    });
    if (lastDp && lastDp.status === 'running') {
      await this.docker.rmDeploy(lastDp.id);
    }
    const dpData = await this.docker.deployCtr(
      `${targetFldr}/${slug}.tar.gz`,
      slug,
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

  private async seedData(projectId: string, dir: string) {
    this.logger.log('Seeding data');
    try {
      const project = await this.prisma.project.findUniqueOrThrow({
        where: { id: projectId },
        include: { icon: true, logo: true },
      });
      const mainSectionArticles = await this.prisma.article.findMany({
        where: { Section: { isNot: null } },
        include: { Section: true, author: true, image: true },
        orderBy: { createdAt: 'desc' },
      });
      const otherArticles = await this.prisma.article.findMany({
        where: { projectId: project.id, authorId: { not: null } },
        include: { Section: true, author: true, image: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      const rawArticles = unionBy(mainSectionArticles, otherArticles, 'id');
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
      if (project.icon) {
        await this.minio.copyObjectToLocal(
          project.icon.fullPath,
          dir.concat(`/src/app/${project.icon.name}`),
        );
      }
      if (project.logo) {
        await this.minio.copyObjectToLocal(
          project.logo.fullPath,
          dir.concat(`/public/assets/${project.logo.name}`),
        );
      }
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
      this.logger.error('Fail seeding data');
      console.log(err);
      throw err;
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
}
