/*
  Warnings:

  - You are about to drop the `Highlight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Popular` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TopPick` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('Highlight', 'TopPick', 'Popular');

-- DropForeignKey
ALTER TABLE "Highlight" DROP CONSTRAINT "Highlight_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Popular" DROP CONSTRAINT "Popular_articleId_fkey";

-- DropForeignKey
ALTER TABLE "TopPick" DROP CONSTRAINT "TopPick_articleId_fkey";

-- DropTable
DROP TABLE "Highlight";

-- DropTable
DROP TABLE "Popular";

-- DropTable
DROP TABLE "TopPick";

-- CreateTable
CREATE TABLE "Section" (
    "articleId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_articleId_key" ON "Section"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_articleId_projectId_key" ON "Section"("articleId", "projectId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
