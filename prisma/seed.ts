import { Prisma, PrismaClient } from 'generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const CATEGORY_LIST = [
    'Technology',
    'Health',
    'Lifestyle',
    'Education',
    'Finance',
  ];
  await prisma.$transaction(async (db) => {
    const project = await db.project.create({
      data: {
        name: 'wayland_project',
        port: '3009',
        tag: ['ancestor', 'palawein'],
      },
    });
    const category = await db.category.createManyAndReturn({
      data: CATEGORY_LIST.map((item) => ({
        name: item,
        short: item.replace(' ', '_').toLowerCase(),
      })),
    });
    const article = await db.article.createManyAndReturn({
      data: Array.from({ length: 50 }).map(
        (): Prisma.ArticleCreateManyInput => ({
          article: faker.lorem.paragraphs(4),
          authorName: faker.person.fullName(),
          datePublished: faker.date.past(),
          imageUrl: faker.image.url(),
          tag: faker.helpers.arrayElement(['ancestor', 'palawein']),
          title: faker.lorem.sentence(),
          projectId: project.id,
          categoryId: faker.helpers.arrayElement(
            category.map((item) => item.id),
          ),
        }),
      ),
    });
    await db.highlight.createMany({
      data: faker.helpers.arrayElements(
        article.map((item) => ({
          articleId: item.id,
        })),
        4,
      ),
    });
    await db.topPick.createMany({
      data: faker.helpers.arrayElements(
        article.map((item) => ({
          articleId: item.id,
        })),
        4,
      ),
    });
    await db.popular.createMany({
      data: faker.helpers.arrayElements(
        article.map((item) => ({
          articleId: item.id,
        })),
        4,
      ),
    });
  });
}

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
