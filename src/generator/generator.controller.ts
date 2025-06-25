import { Controller, Post } from '@nestjs/common';
import { GeneratorService } from './generator.service';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}
  @Post()
  generate() {
    this.generatorService.generate();
    return { message: 'success' };
  }
}
