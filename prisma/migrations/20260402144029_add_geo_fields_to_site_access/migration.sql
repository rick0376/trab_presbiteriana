-- AlterTable
ALTER TABLE "SiteAccess" ADD COLUMN     "ipCity" TEXT,
ADD COLUMN     "ipCountry" TEXT,
ADD COLUMN     "ipRegion" TEXT;

-- CreateIndex
CREATE INDEX "SiteAccess_ipCountry_idx" ON "SiteAccess"("ipCountry");

-- CreateIndex
CREATE INDEX "SiteAccess_ipRegion_idx" ON "SiteAccess"("ipRegion");

-- CreateIndex
CREATE INDEX "SiteAccess_ipCity_idx" ON "SiteAccess"("ipCity");
