-- CreateTable
CREATE TABLE "WhitelistPrompt" (
    "whitelistId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistPrompt_whitelistId_promptId_key" ON "WhitelistPrompt"("whitelistId", "promptId");

-- AddForeignKey
ALTER TABLE "WhitelistPrompt" ADD CONSTRAINT "WhitelistPrompt_whitelistId_fkey" FOREIGN KEY ("whitelistId") REFERENCES "Whitelist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhitelistPrompt" ADD CONSTRAINT "WhitelistPrompt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
