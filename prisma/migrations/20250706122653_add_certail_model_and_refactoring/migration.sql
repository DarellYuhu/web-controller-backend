/*
  Warnings:

  - You are about to drop the column `authorName` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `Project` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagId` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "authorName",
DROP COLUMN "tag",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "tagId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "tag";

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTag" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Whitelist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_name_key" ON "Author"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTag_projectId_tagId_key" ON "ProjectTag"("projectId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_name_key" ON "Whitelist"("name");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
