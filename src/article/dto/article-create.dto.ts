import { Prisma } from 'generated/prisma';

export class CreateArticleDto implements Prisma.ArticleCreateInput {
  article: string;
  title: string;
  authorName: string;
  datePublished: string;
  imageUrl: string;
  tag: string;
}
