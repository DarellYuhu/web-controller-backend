import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import Dockerode from 'dockerode';
import { execa } from 'execa';

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private readonly docker = new Dockerode({
    socketPath: '/var/run/docker.sock',
  });

  constructor(private readonly prisma: PrismaService) {}

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
      throw err;
    }
  }

  async buildImg(dir: string, name: string) {
    try {
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
      this.logger.error('Fail build image');
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
}
