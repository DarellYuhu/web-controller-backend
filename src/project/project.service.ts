import { getRandomImgName, slugify } from '@/utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from 'generated/prisma';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { DockerService } from '@/docker/docker.service';
import { MinioService } from '@/minio/minio.service';

@Injectable()
export class ProjectService {
  private readonly NODE_ENV = process.env.NODE_ENV;
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerRegistry,
    private readonly docker: DockerService,
    private readonly minio: MinioService,
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
    const { deployment, ...data } = await this.prisma.project.findUniqueOrThrow(
      {
        where: { id },
        include: {
          projectTag: { include: { tag: true } },
          projectAuthor: { select: { author: true } },
          deployment: { orderBy: { createdAt: 'desc' } },
          logo: true,
          icon: true,
        },
      },
    );
    const normalize = {
      ...data,
      projectTag: data.projectTag.map((t) => t.tag.name),
      projectAuthor: data.projectAuthor.map((a) => a.author.name),
      status: deployment[0].status,
      logo:
        data.logo &&
        (await this.minio.getImageUrl(data.logo.bucket, data.logo.path)),
      icon:
        data.icon &&
        (await this.minio.getImageUrl(data.icon.bucket, data.icon.path)),
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

  async update(
    id: string,
    { newSection, icon, logo, ...payload }: UpdateProjectDto,
  ) {
    const data: Prisma.ProjectUpdateInput = { ...payload };
    if (payload.name) data.slug = slugify(payload.name);
    if (logo) {
      const name = getRandomImgName(logo.mimetype);
      const id = await this.minio.addFile({
        name,
        path: `image/${name}`,
        bucket: 'media',
        buffer: logo.buffer,
        contentType: logo.mimetype,
      });
      data.logo = { connect: { id } };
    }
    if (icon) {
      const name = getRandomImgName(icon.mimetype);
      const id = await this.minio.addFile({
        name,
        path: `image/${name}`,
        bucket: 'media',
        buffer: icon.buffer,
        contentType: icon.mimetype,
      });
      data.icon = { connect: { id } };
    }
    if (newSection)
      data.section = {
        createMany: { data: newSection, skipDuplicates: true },
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

  async stopDeployment(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { deployment: { orderBy: { createdAt: 'desc' } }, id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const dpId = project.deployment[0].id;
    if (dpId) {
      await this.docker.rmDeploy(dpId);
      await this.prisma.project.update({
        where: { id: project.id },
        data: { isStopManually: true },
      });
    }
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
      where: {
        deployment: { every: { createdAt: { lt: oneHourAgo } } },
        isStopManually: false,
      },
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
