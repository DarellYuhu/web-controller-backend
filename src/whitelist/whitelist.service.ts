import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddPromptsDto } from './dto/add-prompts.dto';

@Injectable()
export class WhitelistService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: string[]) {
    return this.prisma.whitelist.createMany({
      data: payload.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  async findAll() {
    const data = await this.prisma.whitelist.findMany({
      include: { whitelistPrompt: { include: { prompt: true } } },
    });
    return data.map(({ whitelistPrompt, ...rest }) => ({
      ...rest,
      prompts: whitelistPrompt.map((list) => list.prompt),
    }));
  }

  addPrompts(whitelistId: string, payload: AddPromptsDto) {
    return this.prisma.whitelistPrompt.createMany({
      data: payload.data.map((promptId) => ({ whitelistId, promptId })),
      skipDuplicates: true,
    });
  }
}
