import { z } from 'zod/v4';

export const categorySchema = z.array(
  z.object({
    id: z.string().nonempty(),
    name: z.string(),
    slug: z.string(),
  }),
);

export const articleSchema = z.array(
  z.object({
    id: z.string().nonempty(),
    title: z.string(),
    contents: z.string(),
    categoryId: z.string(),
    authorName: z.string(),
    datePublished: z.iso.datetime(),
    slug: z.string(),
    imageUrl: z.string(),
  }),
);

export const sectionSchema = z.array(
  z.object({
    articleId: z.string().nonempty(),
  }),
);
