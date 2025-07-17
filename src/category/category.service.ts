import { Injectable } from '@nestjs/common';
import { slugify } from '@/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: string[]) {
    return this.prisma.category.createMany({
      data: payload.map((name) => ({ name, slug: slugify(name) })),
      skipDuplicates: true,
    });
  }

  findAll() {
    return this.prisma.category.findMany();
  }
}
