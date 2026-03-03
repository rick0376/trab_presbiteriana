/*
  Warnings:

  - You are about to alter the column `cpf` on the `membros` table. The data in that column could be lost. The data in that column will be cast from `VarChar(14)` to `VarChar(11)`.

*/
-- AlterTable
ALTER TABLE "membros" ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(11);
