import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import { execa } from 'execa';
import * as Docker from 'dockerode';

@Injectable()
export class GeneratorService {
  private docker = new Docker({ socketPath: '/var/run/docker.sock' });

  async generate() {
    const targetFldr = './tmp/web-template';
    const name = 'web-release-1';
    if (!fs.existsSync(targetFldr)) {
      await execa('git', [
        'clone',
        'https://github.com/DarellYuhu/web-template.git',
        targetFldr,
      ]);
    }
    await this.buildImg(targetFldr, name);
    await this.deployCtr(`${targetFldr}/${name}.tar.gz`, name);
  }

  async deployCtr(imgPath: string, imgName: string) {
    console.log('preperation');
    await this.docker.loadImage(imgPath);
    console.log('laod');
    const container = await this.docker.createContainer({
      Image: imgName,
      name: `${imgName}-ctr`,
      HostConfig: { PortBindings: { '3000/tcp': [{ HostPort: '3010/tcp' }] } },
    });
    await container.start();
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
