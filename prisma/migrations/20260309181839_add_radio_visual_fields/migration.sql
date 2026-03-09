-- AlterTable
ALTER TABLE "RadioStatus" ADD COLUMN     "allowPlay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "badgeLabel" TEXT DEFAULT 'Offline',
ADD COLUMN     "nextProgramAt" TEXT DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "subtitle" TEXT DEFAULT '',
ALTER COLUMN "live" SET DEFAULT false,
ALTER COLUMN "title" SET DEFAULT 'Rádio Offline';
