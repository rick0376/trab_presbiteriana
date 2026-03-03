-- CreateTable
CREATE TABLE "RadioStatus" (
    "id" TEXT NOT NULL,
    "live" BOOLEAN NOT NULL,
    "title" TEXT,
    "streamUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadioStatus_pkey" PRIMARY KEY ("id")
);
