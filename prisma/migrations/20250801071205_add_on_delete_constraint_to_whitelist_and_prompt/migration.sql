-- DropForeignKey
ALTER TABLE "WhitelistPrompt" DROP CONSTRAINT "WhitelistPrompt_promptId_fkey";

-- DropForeignKey
ALTER TABLE "WhitelistPrompt" DROP CONSTRAINT "WhitelistPrompt_whitelistId_fkey";

-- AddForeignKey
ALTER TABLE "WhitelistPrompt" ADD CONSTRAINT "WhitelistPrompt_whitelistId_fkey" FOREIGN KEY ("whitelistId") REFERENCES "Whitelist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhitelistPrompt" ADD CONSTRAINT "WhitelistPrompt_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
