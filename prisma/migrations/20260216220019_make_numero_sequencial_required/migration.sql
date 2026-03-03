/*
  Warnings:

  - Made the column `numeroSequencial` on table `membros` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "membros" ALTER COLUMN "numeroSequencial" SET NOT NULL;
