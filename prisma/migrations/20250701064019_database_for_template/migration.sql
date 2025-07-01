/*
  Warnings:

  - You are about to drop the column `category` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT,
ADD CONSTRAINT "Article_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "Article_id_key";

-- CreateTable
CREATE TABLE "Highlight" (
    "articleId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TopPick" (
    "articleId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Popular" (
    "articleId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_articleId_key" ON "Highlight"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "TopPick_articleId_key" ON "TopPick"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Popular_articleId_key" ON "Popular"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_short_key" ON "Category"("short");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopPick" ADD CONSTRAINT "TopPick_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Popular" ADD CONSTRAINT "Popular_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
