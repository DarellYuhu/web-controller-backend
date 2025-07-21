import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreatePromptDto } from './dto/create-prompt.dto';

@Injectable()
export class PromptService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreatePromptDto) {
    return this.prisma.prompt.createMany({
      data: payload.data,
    });
  }

  findAll() {
    return this.prisma.prompt.findMany();
  }
}
