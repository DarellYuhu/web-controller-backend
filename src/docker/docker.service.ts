import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import Dockerode from 'dockerode';
import { execa } from 'execa';
import mime from 'mime';

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private readonly NODE_ENV = process.env.NODE_ENV;
  private readonly docker = new Dockerode({
    socketPath: '/var/run/docker.sock',
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  async rmDeploy(dpId: string) {
    this.logger.log('Remove Deployment');
    try {
      const container = this.docker.getContainer(dpId);
      const State = (await container.inspect()).State;
      if (State.Status === 'running' || State.Status === 'exited') {
        await container.remove({ force: true });
      }
      await this.prisma.deployment.update({
        where: { id: dpId },
        data: { status: 'exited' },
      });
    } catch (err) {
      this.logger.error('Fail remove deployment');
      if ((err as { statusCode: number }).statusCode === 404)
        return this.logger.warn(`Container with ID: ${dpId} not found`);
      console.log(err);
      throw err;
    }
  }

  async buildImg(opts: {
    id: string;
    dir: string;
    slug: string;
    name: string;
    desc: string;
  }) {
    try {
      this.logger.log('Build img');
      const { logo } = await this.prisma.project.findUniqueOrThrow({
        where: { id: opts.id },
        select: { logo: true },
      });
      await execa(
        'sh',
        [
          '-c',
          'echo "DATABASE_URL=file:./prod.db\nWEBSITE_NAME=' +
            opts.name +
            '\nWEBSITE_DESC=' +
            opts.desc +
            '" > .env',
        ],
        {
          cwd: opts.dir,
        },
      );
      if (logo) {
        await execa(
          'sh',
          [
            '-c',
            `echo 'LOGO_PATH=/assets/logo.${mime.getExtension(logo.contentType)}' >> .env`,
          ],
          { cwd: opts.dir },
        );
      }
      await execa('docker', ['build', '-t', opts.slug, '.'], {
        cwd: opts.dir,
      });
      await execa(
        'sh',
        ['-c', `docker save ${opts.slug} | gzip > ${opts.slug}.tar.gz`],
        {
          cwd: opts.dir,
        },
      );
      await execa('docker', ['rmi', opts.slug]);
    } catch (err) {
      this.logger.error('Fail build image');
      console.log(err);
      throw err;
    }
  }

  async deployCtr(imgPath: string, imgName: string, port: number) {
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
      this.logger.error('Fail deploy container');
      throw err;
    }
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'prune-images-scheduler' })
  async pruneImage() {
    this.logger.log('Prune dangling images');
    if (this.NODE_ENV === 'development')
      this.scheduler.deleteCronJob('prune-images-scheduler');
    await this.docker.pruneImages();
  }
}
