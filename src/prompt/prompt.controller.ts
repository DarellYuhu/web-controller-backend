import { Body, Controller, Get, Post } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  create(@Body() payload: CreatePromptDto) {
    return this.promptService.create(payload);
  }

  @Get()
  findAll() {
    return this.promptService.findAll();
  }
}
