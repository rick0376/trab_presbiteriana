-- AlterTable
ALTER TABLE "SiteAccess" ADD COLUMN     "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "SiteAccess_ipAddress_idx" ON "SiteAccess"("ipAddress");

-- CreateIndex
CREATE INDEX "SiteAccess_ipHash_idx" ON "SiteAccess"("ipHash");
