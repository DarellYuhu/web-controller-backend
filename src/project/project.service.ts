import { slugify } from '@/utils';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from 'generated/prisma';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateProjectDto) {
    const { tagIds, ...rest } = payload;
    return this.prisma.project.create({
      data: {
        ...rest,
        slug: slugify(rest.name),
        projectTag: {
          createMany: { data: tagIds.map((tagId) => ({ tagId })) },
        },
      },
    });
  }

  async findById(id: string) {
    const data = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: { projectTag: { include: { tag: true } } },
    });
    const normalize = {
      ...data,
      projectTag: data.projectTag.map((t) => t.tag.name),
    };
    return normalize;
  }

  async findAll() {
    const data = await this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { projectTag: { include: { tag: true } } },
    });
    return data.map(({ projectTag, ...item }) => ({
      ...item,
      projectTag: projectTag.map((t) => t.tag.name),
    }));
  }

  async update(id: string, payload: UpdateProjectDto) {
    const data: Prisma.ProjectUpdateInput = {};
    if (payload.newSection)
      data.section = {
        createMany: { data: payload.newSection, skipDuplicates: true },
      };

    return this.prisma.project.update({ where: { id }, data });
  }
}
