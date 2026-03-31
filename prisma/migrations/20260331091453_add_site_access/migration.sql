-- CreateTable
CREATE TABLE "SiteAccess" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "visitorId" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "SiteAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteAccess_createdAt_idx" ON "SiteAccess"("createdAt");

-- CreateIndex
CREATE INDEX "SiteAccess_deviceType_idx" ON "SiteAccess"("deviceType");

-- CreateIndex
CREATE INDEX "SiteAccess_path_idx" ON "SiteAccess"("path");

-- CreateIndex
CREATE INDEX "SiteAccess_visitorId_idx" ON "SiteAccess"("visitorId");
