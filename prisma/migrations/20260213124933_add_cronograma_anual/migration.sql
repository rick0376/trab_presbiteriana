/*
  Warnings:

  - You are about to drop the column `chave` on the `permissoes` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `permissoes` table. All the data in the column will be lost.
  - You are about to drop the `cargo_permissoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissao_users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,recurso]` on the table `permissoes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recurso` to the `permissoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `permissoes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."cargo_permissoes" DROP CONSTRAINT "cargo_permissoes_cargoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."permissao_users" DROP CONSTRAINT "permissao_users_permissaoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."permissao_users" DROP CONSTRAINT "permissao_users_userId_fkey";

-- DropIndex
DROP INDEX "public"."permissoes_chave_key";

-- AlterTable
ALTER TABLE "permissoes" DROP COLUMN "chave",
DROP COLUMN "descricao",
ADD COLUMN     "compartilhar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "criar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurso" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."cargo_permissoes";

-- DropTable
DROP TABLE "public"."permissao_users";

-- CreateTable
CREATE TABLE "cronograma_anual" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronograma_anual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cronograma_anual_igrejaId_idx" ON "cronograma_anual"("igrejaId");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_userId_recurso_key" ON "permissoes"("userId", "recurso");

-- AddForeignKey
ALTER TABLE "permissoes" ADD CONSTRAINT "permissoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_anual" ADD CONSTRAINT "cronograma_anual_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
