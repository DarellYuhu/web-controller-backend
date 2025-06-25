import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';

@Injectable()
export class GeneratorService {
  generate() {
    const targetFldr = './tmp/web-template';
    if (!fs.existsSync(targetFldr)) {
      exec(
        `git clone https://github.com/DarellYuhu/web-template.git ${targetFldr}`,
      );
    }
    console.log('Web template cloned successfully.');
  }
}
