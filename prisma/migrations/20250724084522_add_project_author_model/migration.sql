-- CreateTable
CREATE TABLE "ProjectAuthor" (
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAuthor_projectId_authorId_key" ON "ProjectAuthor"("projectId", "authorId");

-- AddForeignKey
ALTER TABLE "ProjectAuthor" ADD CONSTRAINT "ProjectAuthor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAuthor" ADD CONSTRAINT "ProjectAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
