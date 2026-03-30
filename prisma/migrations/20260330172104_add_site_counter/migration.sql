-- CreateTable
CREATE TABLE "SiteCounter" (
    "key" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCounter_pkey" PRIMARY KEY ("key")
);
