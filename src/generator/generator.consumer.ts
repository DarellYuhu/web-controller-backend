import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GeneratorService } from './generator.service';
import { Logger } from '@nestjs/common';

type JobType = Job<{ id: string; name: string }>;

@Processor('web-generator-queue')
export class GeneratorConsumer extends WorkerHost {
  private logger = new Logger(GeneratorConsumer.name);

  constructor(private readonly generator: GeneratorService) {
    super();
  }

  async process(job: JobType): Promise<any> {
    switch (job.name) {
      case 'web-generator-worker':
        await this.generator.generate(job.data.id);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: JobType) {
    this.logger.log(`Generating website ${job.data.name} (${job.id})`);
  }

  @OnWorkerEvent('stalled')
  onStall(jobId: string) {
    this.logger.error(`Stall project (${jobId})`);
  }
}
