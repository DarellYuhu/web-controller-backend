import { Controller, Post } from '@nestjs/common';
import { GeneratorService } from './generator.service';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}
  @Post()
  async generate() {
    await this.generatorService.generate();
    return { message: 'success' };
  }
}
