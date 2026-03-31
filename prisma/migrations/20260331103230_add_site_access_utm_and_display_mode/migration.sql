-- AlterTable
ALTER TABLE "SiteAccess" ADD COLUMN     "displayMode" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- CreateIndex
CREATE INDEX "SiteAccess_displayMode_idx" ON "SiteAccess"("displayMode");

-- CreateIndex
CREATE INDEX "SiteAccess_utmSource_idx" ON "SiteAccess"("utmSource");

-- CreateIndex
CREATE INDEX "SiteAccess_utmMedium_idx" ON "SiteAccess"("utmMedium");

-- CreateIndex
CREATE INDEX "SiteAccess_utmCampaign_idx" ON "SiteAccess"("utmCampaign");
