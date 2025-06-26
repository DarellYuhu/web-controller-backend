import { Controller, Param, Post } from '@nestjs/common';
import { GeneratorService } from './generator.service';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}
  @Post(':projectId')
  async generate(@Param('projectId') projectId: string) {
    await this.generatorService.generate(projectId);
    return { message: 'success' };
  }
}
