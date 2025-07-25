import { Module } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { ProjectModule } from '@/project/project.module';
import { GeneratorConsumer } from './generator.consumer';
import { DockerModule } from '@/docker/docker.module';

@Module({
  imports: [ProjectModule, DockerModule],
  providers: [GeneratorService, GeneratorConsumer],
  exports: [GeneratorService],
})
export class GeneratorModule {}
