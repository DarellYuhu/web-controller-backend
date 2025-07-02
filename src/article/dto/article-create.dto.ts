import { Prisma } from 'generated/prisma';

export class CreateArticleDto implements Prisma.ArticleCreateInput {
  slug: string;
  contents: string;
  title: string;
  authorName: string;
  datePublished: string;
  imageUrl: string;
  tag: string;
}
