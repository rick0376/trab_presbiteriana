-- CreateTable
CREATE TABLE "radio_stats_history" (
    "id" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "peak" INTEGER NOT NULL DEFAULT 0,
    "max" INTEGER NOT NULL DEFAULT 0,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "uptime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radio_stats_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "radio_stats_history_createdAt_idx" ON "radio_stats_history"("createdAt");
