import { Controller } from '@nestjs/common';
import { TranscriberService } from './transcriber.service';

@Controller('transcriber')
export class TranscriberController {
  constructor(private readonly transcriberService: TranscriberService) {}
}
