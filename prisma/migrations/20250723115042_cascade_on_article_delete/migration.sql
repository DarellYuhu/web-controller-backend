-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_articleId_fkey";

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
