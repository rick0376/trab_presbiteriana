/*
  Warnings:

  - A unique constraint covering the columns `[igrejaId,numeroSequencial]` on the table `membros` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "membros_igrejaId_numeroSequencial_key" ON "membros"("igrejaId", "numeroSequencial");
