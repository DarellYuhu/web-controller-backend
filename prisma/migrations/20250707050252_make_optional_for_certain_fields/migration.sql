-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_tagId_fkey";

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "contents" DROP NOT NULL,
ALTER COLUMN "authorId" DROP NOT NULL,
ALTER COLUMN "tagId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
