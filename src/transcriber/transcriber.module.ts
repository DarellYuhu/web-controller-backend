import { Global, Module } from '@nestjs/common';
import { TranscriberService } from './transcriber.service';
import { TranscriberController } from './transcriber.controller';

@Global()
@Module({
  controllers: [TranscriberController],
  providers: [TranscriberService],
  exports: [TranscriberService],
})
export class TranscriberModule {}
