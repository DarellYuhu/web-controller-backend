import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'web-generator-queue' })],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
