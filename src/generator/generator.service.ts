import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
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
    const targetFldr = './tmp/web-template';
    const name = project.name;
    if (!fs.existsSync(targetFldr)) {
      await execa('git', [
        'clone',
        'https://github.com/DarellYuhu/web-template.git',
        targetFldr,
      ]);
    }
    await this.buildImg(targetFldr, name);
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

  async rmDeploy(dpId: string) {
    const container = this.docker.getContainer(dpId);
    await container.stop();
    await container.remove();
  }

  async deployCtr(imgPath: string, imgName: string, port: string) {
    console.log('preperation');
    await this.docker.loadImage(imgPath);
    console.log('laod');
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
  }

  async buildImg(dir: string, name: string) {
    await execa('docker', ['build', '-t', name, '.'], { cwd: dir }).catch(
      () => {
        throw new InternalServerErrorException('Build image fail');
      },
    );
    await execa('sh', ['-c', `docker save ${name} | gzip > ${name}.tar.gz`], {
      cwd: dir,
    }).catch(() => {
      throw new InternalServerErrorException(
        'Fail save image to comporessed file',
      );
    });
    await execa('docker', ['rmi', name]).catch(() => {
      new InternalServerErrorException(
        'Fail remove image from docker local registry',
      );
    });
  }
}
