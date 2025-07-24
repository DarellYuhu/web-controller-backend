import { slugify } from '@/utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from 'generated/prisma';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class ProjectService {
  private readonly NODE_ENV = process.env.NODE_ENV;
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerRegistry,
    @InjectQueue('web-generator-queue') private generatorQueue: Queue,
  ) {}

  create(payload: CreateProjectDto) {
    const { tagIds, authorIds, ...rest } = payload;
    return this.prisma.project.create({
      data: {
        ...rest,
        slug: slugify(rest.name),
        projectAuthor: {
          createMany: { data: authorIds.map((authorId) => ({ authorId })) },
        },
        projectTag: {
          createMany: { data: tagIds.map((tagId) => ({ tagId })) },
        },
      },
    });
  }

  async findById(id: string) {
    const data = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        projectTag: { include: { tag: true } },
        projectAuthor: { select: { author: true } },
      },
    });
    const normalize = {
      ...data,
      projectTag: data.projectTag.map((t) => t.tag.name),
      projectAuthor: data.projectAuthor.map((a) => a.author.name),
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

  async generateManually(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.generatorQueue.add(
      'web-generator-worker',
      {
        id: project.id,
        name: project.name,
      },
      { jobId: project.id, removeOnComplete: true, removeOnFail: true },
    );
  }

  // @Cron(CronExpression.EVERY_5_SECONDS, { name: 'checking' })
  // async clearQueue() {
  //   this.scheduler.deleteCronJob('checking');
  //   const jobs = await this.generatorQueue.getJobs(['paused', 'failed']);
  //   console.log(jobs);
  //   await this.generatorQueue.clean(0, 10, 'failed');
  //   console.log('cleared');
  // }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'web-generator-scheduler' })
  async generateScheduler() {
    if (this.NODE_ENV === 'development')
      this.scheduler.deleteCronJob('web-generator-scheduler');
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);
    const projects = await this.prisma.project.findMany({
      where: { deployment: { every: { createdAt: { lt: oneHourAgo } } } },
    });

    await this.generatorQueue.addBulk(
      projects.map((it) => ({
        name: 'web-generator-worker',
        data: { id: it.id, name: it.name },
        opts: { jobId: it.id, removeOnComplete: true, removeOnFail: true },
      })),
    );
  }
}
