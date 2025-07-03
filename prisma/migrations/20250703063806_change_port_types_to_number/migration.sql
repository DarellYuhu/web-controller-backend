/*
  Warnings:

  - Changed the type of `port` on the `Project` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "port",
ADD COLUMN     "port" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Project_port_key" ON "Project"("port");
