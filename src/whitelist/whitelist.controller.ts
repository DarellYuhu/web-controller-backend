import { Body, Controller, Get, Post } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { MetadataCreateDto } from 'src/dtos/metadata-create-dto';

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
}
