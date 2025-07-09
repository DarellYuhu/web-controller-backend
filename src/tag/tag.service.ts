import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: string[]) {
    return this.prisma.tag.createMany({
      data: payload.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  findAll() {
    return this.prisma.tag.findMany();
  }
}
