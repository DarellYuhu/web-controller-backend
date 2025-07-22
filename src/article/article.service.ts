import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { convert } from 'html-to-text';
import { TranscriberService } from 'src/transcriber/transcriber.service';
import { sample, shuffle } from 'lodash';
import gis from 'async-g-i-s';
import { MinioService } from 'src/minio/minio.service';
import mime from 'mime';
import { Prisma, SectionType } from 'generated/prisma';
import { AuthorService } from 'src/author/author.service';
import { TagService } from 'src/tag/tag.service';
import { ProjectService } from 'src/project/project.service';
import { UpdateArticleDto } from './dto/update-article.dto';
import { getRandomImgName } from 'src/utils';
import axios from 'axios';

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name, {
    timestamp: true,
  });
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly transcriber: TranscriberService,
    private readonly minio: MinioService,
    private readonly author: AuthorService,
    private readonly tag: TagService,
    private readonly project: ProjectService,
  ) {}

  create(payload: CreateArticleDto) {
    const slug = slugify(payload.title);
    return this.prisma.article.create({ data: { ...payload, slug } });
  }

  createMany(payload: Prisma.ArticleCreateManyInput[]) {
    return this.prisma.article.createMany({
      data: payload,
      skipDuplicates: true,
    });
  }

  async findAll({
    projectId,
    sectionType,
    cursor,
  }: {
    projectId?: string;
    sectionType?: string;
    cursor?: { id: string; createdAt: string };
  }) {
    const query: Prisma.ArticleWhereInput = {
      projectId,
    };
    if (sectionType) query.Section = { type: sectionType as SectionType };
    const isCursored = cursor && cursor?.id !== '';
    const data = await this.prisma.article.findMany({
      where: query,
      include: { category: true, project: true, image: true, author: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(isCursored && {
        skip: 1,
        cursor: {
          createdAt_id: {
            createdAt: cursor.createdAt,
            id: cursor.id,
          },
        },
      }),
      take: 10,
    });
    const normalized = await Promise.all(
      data.map(async (article) => {
        return {
          ...article,
          imageUrl: article.image
            ? await this.minio.getImageUrl(
                article.image.bucket,
                article.image.path,
              )
            : await this.minio.getImageUrl('media', 'news-img-placeholder.png'),
          author: article.author?.name,
          category: article.category?.name,
          project: article.project?.name,
        };
      }),
    );
    const lastItm = normalized[normalized.length - 1];
    return {
      data: normalized,
      cursor: { id: lastItm.id, createdAt: lastItm.createdAt },
    };
  }

  async findById(id: string) {
    const article = await this.prisma.article
      .findUniqueOrThrow({
        where: { id },
        include: { category: true, project: true, image: true, author: true },
      })
      .catch(() => {
        throw new NotFoundException('Article not found');
      });
    return {
      ...article,
      imageUrl: article.image
        ? await this.minio.getImageUrl(article.image.bucket, article.image.path)
        : await this.minio.getImageUrl('media', 'news-img-placeholder.png'),
      author: article.author?.name,
      category: article.category?.name,
      project: article.project?.name,
    };
  }

  async update(id: string, { image, ...payload }: UpdateArticleDto) {
    let imageId: string | undefined = undefined;
    if (image) {
      const name = getRandomImgName(image.mimetype);
      imageId = await this.minio.addFile({
        name,
        buffer: image.buffer,
        contentType: image.mimetype,
        bucket: 'media',
        path: `image/${name}`,
      });
    }
    const project = await this.prisma.project.findMany({
      where: { projectTag: { some: { tagId: payload.tagId } } },
      orderBy: { updatedAt: 'desc' },
    });
    const updateArticle = this.prisma.article.update({
      where: { id },
      data: {
        ...payload,
        projectId: project[0].id,
        imageId,
      },
    });
    const updateProject = this.prisma.project.update({
      where: { id: project[0].id },
      data: { updatedAt: new Date() },
    });
    await this.prisma.$transaction([updateArticle, updateProject]);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async fetchScheduler() {
    this.logger.verbose('Scheduler running...');
    // this.scheduler.deleteCronJob('article-fetching');
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
    const authors = await this.author.findAll();

    if (whitelisted.length > 0) {
      const generatedArticles = await this.generateContents(whitelisted);
      this.logger.verbose('Inserting AICG... (Whitelisted)');
      const payload = generatedArticles.map((item, idx) => ({
        title: item.title,
        slug: slugify(item.title),
        id: item.id.toString(),
        categoryId: item.category,
        contents: item.news,
        authorId: authors[idx % authors.length].id,
        imageId: item.imageId,
        imgPrompt: item.imgPrompt,
      }));
      await this.createMany(payload);
    }

    if (nonWhitelisted.length > 0) {
      const generatedArticles = await this.generateContents(nonWhitelisted);
      const tags = await this.tag.findAll();
      const projects = await this.project.findAll();
      this.logger.verbose('Inserting AICG... (Non-whitelisted)');
      const payload = generatedArticles.map((item, idx) => ({
        title: item.title,
        slug: slugify(item.title),
        id: item.id.toString(),
        categoryId: item.category,
        contents: item.news,
        projectId: projects[idx % projects.length].id,
        authorId: authors[idx % authors.length].id,
        imageId: item.imageId,
        tagId: tags[idx % tags.length].id,
        imgPrompt: item.imgPrompt,
      }));
      await this.createMany(payload);
    }
    this.logger.verbose('Scheduler end...');
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
    const whitelistFilter = await this.prisma.whitelist.findMany({
      where: { whitelistPrompt: { some: {} } },
      include: { whitelistPrompt: { include: { prompt: true } } },
    });
    const whitelisted: ParsedArticle[] = [];
    const nonWhitelisted: ParsedArticle[] = [];
    fulfilled.forEach((item) => {
      const isWhiteListed = shuffle(whitelistFilter).find(({ name }) =>
        item.content.toLowerCase().includes(name.toLowerCase()),
      );
      const prompt = sample(isWhiteListed?.whitelistPrompt);
      if (isWhiteListed)
        whitelisted.push({ ...item, prompt: prompt?.prompt.text });
      else nonWhitelisted.push(item);
    });
    return { whitelisted, nonWhitelisted };
  }

  private async generateContents(payload: ParsedArticle[]) {
    this.logger.verbose(`Generating contents... (size: ${payload.length})`);
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
          item.prompt,
        ),
      })),
    );
    this.logger.verbose('Contents Generated...');
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
    this.logger.verbose('Images fetched...');
    return filtered;
  }

  private async getImage(prompt: string) {
    try {
      const result = await gis(prompt);
      const randomSelect = shuffle(result)[0];
      if (!randomSelect) return randomSelect;
      const response = await axios.get<ArrayBuffer>(randomSelect.url, {
        responseType: 'arraybuffer',
      });
      const contentType = response.headers['content-type'] as string;

      if (!contentType.startsWith('image/')) {
        return undefined;
      }

      const random4Digit = Math.floor(1000 + Math.random() * 9000);
      const name = `image-${Date.now()}-${random4Digit}.${mime.getExtension(contentType)}`;
      console.log('buffer pass');
      const buffer = Buffer.from(response.data);
      const id = await this.minio.addFile({
        buffer,
        contentType,
        name,
        path: `image/${name}`,
        bucket: 'media',
      });
      return id;
    } catch {
      this.logger.error('Fail fetch image');
      return undefined;
    }
  }
}
