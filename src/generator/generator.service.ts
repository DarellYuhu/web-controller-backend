import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { execa } from 'execa';
import Docker from 'dockerode';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GeneratorService {
  private readonly docker: Docker;
  constructor(private readonly prisma: PrismaService) {
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  async generate(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { Deployment: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const lastDp = project.Deployment[0];
    const targetFldr = './tmp/web-template';
    const name = project.name;
    await execa('rm', ['-rf', targetFldr]);
    await execa('git', [
      'clone',
      // 'https://github.com/DarellYuhu/web-template.git',
      '/home/darell/Projects/web-generator/web-template',
      targetFldr,
    ]);
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
  }

  private async rmDeploy(dpId: string) {
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
    try {
      await this.docker.loadImage(imgPath);
      const container = await this.docker.createContainer({
        Image: imgName,
        name: `${imgName}-ctr`,
        HostConfig: {
          PortBindings: { '3000/tcp': [{ HostPort: `${port}/tcp` }] },
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
    try {
      const articles = await this.prisma.article.findMany({
        where: { projectId },
        include: { highlight: true, topPick: true, popular: true },
      });
      const categories = await this.prisma.category.findMany();
      const highlights = articles
        .filter((item) => item.highlight)
        .map((item) => ({ articleId: item.id }));
      const topPicks = articles
        .filter((item) => item.topPick)
        .map((item) => ({ articleId: item.id }));
      const populars = articles
        .filter((item) => item.popular)
        .map((item) => ({ articleId: item.id }));
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
          CATEGORIES_DATA: JSON.stringify(categories),
          ARTICLES_DATA: JSON.stringify(articles),
          HIGHLIGHTS_DATA: JSON.stringify(highlights),
          TOPPICKS_DATA: JSON.stringify(topPicks),
          POPULARS_DATA: JSON.stringify(populars),
        },
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('Fail build image');
    }
  }

  async buildImg(projectId: string, dir: string, name: string) {
    try {
      await this.seedData(projectId, dir);
      await execa('bash', ['-c', 'echo "DATABASE_URL=file:./prod.db" > .env'], {
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
