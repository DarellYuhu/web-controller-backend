import { Module } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { ProjectModule } from '@/project/project.module';
import { GeneratorConsumer } from './generator.consumer';

@Module({
  imports: [ProjectModule],
  providers: [GeneratorService, GeneratorConsumer],
  exports: [GeneratorService],
})
export class GeneratorModule {}
