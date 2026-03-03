/*
  Warnings:

  - Added the required column `updatedAt` to the `permissoes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."cargo_permissoes" DROP CONSTRAINT "cargo_permissoes_permissaoId_fkey";

-- AlterTable
ALTER TABLE "permissoes" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "permissao_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,

    CONSTRAINT "permissao_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissao_users_userId_permissaoId_key" ON "permissao_users"("userId", "permissaoId");

-- AddForeignKey
ALTER TABLE "permissao_users" ADD CONSTRAINT "permissao_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissao_users" ADD CONSTRAINT "permissao_users_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
