import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WhitelistService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: string[]) {
    return this.prisma.whitelist.createMany({
      data: payload.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  findAll() {
    return this.prisma.whitelist.findMany();
  }
}
