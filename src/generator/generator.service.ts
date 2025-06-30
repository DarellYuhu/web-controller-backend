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
    const lastDp = project.Deployment[0];
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

  async rmDeploy(dpId: string) {
    try {
      const container = this.docker.getContainer(dpId);
      console.log(container);
      const State = (await container.inspect()).State;
      if (State.Status === 'running') {
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

  async deployCtr(imgPath: string, imgName: string, port: string) {
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

  async buildImg(dir: string, name: string) {
    try {
      await execa('docker', ['build', '-t', name, '.'], { cwd: dir });
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
