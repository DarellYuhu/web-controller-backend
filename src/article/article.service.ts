import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { convert } from 'html-to-text';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { TranscriberService } from 'src/transcriber/transcriber.service';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly scheduler: SchedulerRegistry,
    private readonly transcriber: TranscriberService,
    @InjectQueue('article')
    private readonly generateArticleQueue: Queue,
  ) {}

  create(payload: CreateArticleDto) {
    const slug = slugify(payload.title);
    return this.prisma.article.create({ data: { ...payload, slug } });
  }

  createMany(payload: ParsedArticle[]) {
    return this.prisma.article.createMany({
      data: payload.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        slug: slugify(item.title),
      })),
    });
  }

  async findAll() {
    const data = await this.prisma.article.findMany({
      include: { category: true, project: true },
    });
    return data.map((article) => ({
      ...article,
      category: article.category?.name,
      project: article.project?.name,
    }));
  }

  @Cron(CronExpression.EVERY_5_SECONDS, { name: 'article-fetching' })
  async fetchScheduler() {
    this.scheduler.deleteCronJob('article-fetching');
    const { data } = await firstValueFrom(
      this.http.get<ArticleFetch[]>('/page/list'),
    );
    const articles = (
      await this.prisma.article.findMany({
        select: { id: true },
      })
    ).map((item) => item.id);
    const filteredArticle = data
      .filter((item) => !articles.includes(item.id.toString()))
      .slice(0, 1);
    const { whitelisted, nonWhitelisted } =
      await this.getArticleContent(filteredArticle);
    if (whitelisted.length > 0) await this.createMany(whitelisted);
    if (nonWhitelisted.length > 0) await this.generateContents(nonWhitelisted);

    // await this.generateArticleQueue.add('generate-articles', nonWhitelisted);
  }

  private async getArticleContent(payload: ArticleFetch[]) {
    const result = await Promise.allSettled(
      payload.map(async (a) => {
        const { data } = await firstValueFrom(
          this.http.get<string>(`/page/p/${a.id}`),
        );
        return {
          id: a.id,
          date: a.date,
          title: a.title,
          content: convert(data, {
            wordwrap: false,
          }),
        };
      }),
    );
    const fulfilled = result
      .filter((res) => res.status === 'fulfilled')
      .map((item) => item.value);
    const whitelistFilter = await this.prisma.whitelist.findMany();
    const whitelisted: ParsedArticle[] = [];
    const nonWhitelisted: ParsedArticle[] = [];
    fulfilled.forEach((item) => {
      const isWhiteListed = whitelistFilter.some(({ name }) =>
        item.content.toLowerCase().includes(name.toLowerCase()),
      );
      if (isWhiteListed) whitelisted.push(item);
      else nonWhitelisted.push(item);
    });
    return { whitelisted, nonWhitelisted };
  }

  private async generateContents(payload: ParsedArticle[]) {
    console.log('generating contents...');
    const categories = await this.prisma.category.findMany({
      omit: { slug: true },
    });
    const stringifyCategories = categories
      .map((c) => `{${c.id}: ${c.name}}`)
      .join(', ');
    const aiRes = await Promise.allSettled(
      payload.map(async (item) => ({
        ...item,
        generated: await this.transcriber.generateWithPrompt(
          item.content,
          stringifyCategories,
        ),
      })),
    );
    const filtered = aiRes
      .filter((res) => res.status === 'fulfilled')
      .map((item) => item.value);
    return filtered;
  }
}
