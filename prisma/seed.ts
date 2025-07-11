import { Prisma, PrismaClient } from 'generated/prisma';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';
import { Client } from 'minio';

const prisma = new PrismaClient();
const minio = new Client({
  endPoint: process.env.MINIO_HOST || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  useSSL: false,
});

async function main() {
  const CATEGORY_LIST = [
    'Technology',
    'Health',
    'Lifestyle',
    'Education',
    'Finance',
  ];
  const tags = ['wayland', 'waybar'];
  const whitelist = ['Cebuanos', 'Baricuatro', 'Yomiuri'];
  await minio.fPutObject(
    'media',
    'news-img-placeholder.png',
    'assets/news-img-placeholder.png',
  );
  // await prisma.$transaction(async (db) => {
  //   const tagsData = await db.tag.createManyAndReturn({
  //     data: tags.map((item) => ({ name: item })),
  //     skipDuplicates: true,
  //   });
  //   const authorsData = await db.author.createManyAndReturn({
  //     data: Array.from({ length: 10 }).map(() => ({
  //       name: faker.person.fullName(),
  //     })),
  //   });
  //   await db.whitelist.createMany({
  //     data: whitelist.map((item) => ({ name: item })),
  //     skipDuplicates: true,
  //   });
  //   const project = await db.project.create({
  //     data: {
  //       name: 'Goood Website',
  //       slug: slugify('Good Website', { lower: true, strict: true }),
  //       description: 'description for the website',
  //       port: 3009,
  //       projectTag: {
  //         createMany: { data: tagsData.map((item) => ({ tagId: item.id })) },
  //       },
  //     },
  //   });
  //   const category = await db.category.createManyAndReturn({
  //     data: CATEGORY_LIST.map((item) => ({
  //       name: item,
  //       slug: slugify(item),
  //     })),
  //   });
  //   const article = await db.article.createManyAndReturn({
  //     data: Array.from({ length: 50 }).map(
  //       (): Prisma.ArticleCreateManyInput => {
  //         const title = faker.lorem.sentence();
  //         return {
  //           tagId: faker.helpers.arrayElement(tagsData.map((item) => item.id)),
  //           authorId: faker.helpers.arrayElement(
  //             authorsData.map((item) => item.id),
  //           ),
  //           contents: faker.lorem.paragraphs(4),
  //           slug: slugify(title),
  //           datePublished: faker.date.past(),
  //           title,
  //           projectId: project.id,
  //           categoryId: faker.helpers.arrayElement(
  //             category.map((item) => item.id),
  //           ),
  //         };
  //       },
  //     ),
  //   });
  //   await db.highlight.createMany({
  //     data: faker.helpers.arrayElements(
  //       article.map((item) => ({
  //         articleId: item.id,
  //       })),
  //       4,
  //     ),
  //   });
  //   await db.topPick.createMany({
  //     data: faker.helpers.arrayElements(
  //       article.map((item) => ({
  //         articleId: item.id,
  //       })),
  //       4,
  //     ),
  //   });
  //   await db.popular.createMany({
  //     data: faker.helpers.arrayElements(
  //       article.map((item) => ({
  //         articleId: item.id,
  //       })),
  //       4,
  //     ),
  //   });
  // });
}

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
