-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "lineUserId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_lineUserId_idx" ON "Lead"("lineUserId");
