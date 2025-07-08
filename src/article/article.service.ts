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
import { shuffle } from 'lodash';
import gis from 'async-g-i-s';
import { MinioService } from 'src/minio/minio.service';
import mime from 'mime';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly scheduler: SchedulerRegistry,
    private readonly transcriber: TranscriberService,
    private readonly minio: MinioService,
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
    console.log('execute');
    this.scheduler.deleteCronJob('article-fetching');
    const { data } = await firstValueFrom(
      this.http.get<ArticleMetadata[]>('/page/list'),
    );
    const articles = (
      await this.prisma.article.findMany({
        select: { id: true },
      })
    ).map((item) => item.id);
    const filteredArticle = data.filter(
      (item) => !articles.includes(item.id.toString()),
    );
    const { whitelisted, nonWhitelisted } =
      await this.getArticleContent(filteredArticle);
    if (whitelisted.length > 0) await this.createMany(whitelisted);
    if (nonWhitelisted.length > 0)
      await this.generateContents(nonWhitelisted.slice(0, 2));
  }

  private async getArticleContent(payload: ArticleMetadata[]) {
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
    console.log(`generating contents (size: ${payload.length})...`);
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
    console.log('...article generated');
    const filtered = await Promise.all(
      aiRes
        .filter((res) => res.status === 'fulfilled')
        .map(async (item) => {
          const { value } = item;
          return {
            id: value.id,
            imageId: await this.getImage(item.value.generated.imgPrompt),
            ...value.generated,
          };
        }),
    );
    console.log('image processing complete');
    console.log(filtered);
    return filtered;
  }

  private async getImage(prompt: string) {
    const result = await gis(prompt);
    const randomSelect = shuffle(result)[0];
    if (!randomSelect) return randomSelect;
    const response = await firstValueFrom(
      this.http.get<ArrayBuffer>(randomSelect.url, {
        responseType: 'arraybuffer',
      }),
    );
    const contentType = response.headers['content-type'] as string;
    if (!contentType.startsWith('image/')) {
      throw new Error('Fail fetch image');
    }

    const random4Digit = Math.floor(1000 + Math.random() * 9000);
    const name = `image-${Date.now()}-${random4Digit}.${mime.getExtension(contentType)}`;
    const buffer = Buffer.from(response.data);
    const id = await this.minio.addFile({
      buffer,
      contentType,
      name,
      path: `image/${name}`,
    });
    return id;
  }

  // async searchFromGoogle(prompt: string) {
  //   const { data } = await firstValueFrom(
  //     this.http.get(`/customsearch/v1`, {
  //       baseURL: 'https://www.googleapis.com',
  //       params: {
  //         key: process.env.IMAGE_SEARCH_API_KEY,
  //         // searchType: 'image',
  //         // imgSize: 'medium',
  //         q: prompt,
  //       },
  //     }),
  //   );
  //   console.log(data);
  // }
}
