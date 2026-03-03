-- DropForeignKey
ALTER TABLE "public"."igrejas" DROP CONSTRAINT "igrejas_adminId_fkey";

-- AlterTable
ALTER TABLE "igrejas" ALTER COLUMN "adminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "igrejas" ADD CONSTRAINT "igrejas_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
