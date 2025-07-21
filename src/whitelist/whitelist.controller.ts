import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { MetadataCreateDto } from 'src/dtos/metadata-create-dto';
import { AddPromptsDto } from './dto/add-prompts.dto';

@Controller('whitelist')
export class WhitelistController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @Post()
  create(@Body() payload: MetadataCreateDto) {
    return this.whitelistService.create(payload.data);
  }

  @Get()
  findAll() {
    return this.whitelistService.findAll();
  }

  @Post(':id/prompts') addPrompts(
    @Param('id') id: string,
    @Body() payload: AddPromptsDto,
  ) {
    return this.whitelistService.addPrompts(id, payload);
  }
}
