-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');

-- CreateTable
CREATE TABLE "igrejas_publico" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "bannerSubtitle" TEXT,
    "whatsappUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "igrejas_publico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_publico" (
    "id" TEXT NOT NULL,
    "igrejaPublicoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "horarios_publico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronograma_itens" (
    "id" TEXT NOT NULL,
    "igrejaPublicoId" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "hora" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cronograma_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "igrejas_publico_igrejaId_key" ON "igrejas_publico"("igrejaId");

-- CreateIndex
CREATE INDEX "horarios_publico_igrejaPublicoId_idx" ON "horarios_publico"("igrejaPublicoId");

-- CreateIndex
CREATE INDEX "cronograma_itens_igrejaPublicoId_idx" ON "cronograma_itens"("igrejaPublicoId");

-- CreateIndex
CREATE INDEX "cronograma_itens_dia_idx" ON "cronograma_itens"("dia");

-- AddForeignKey
ALTER TABLE "igrejas_publico" ADD CONSTRAINT "igrejas_publico_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_publico" ADD CONSTRAINT "horarios_publico_igrejaPublicoId_fkey" FOREIGN KEY ("igrejaPublicoId") REFERENCES "igrejas_publico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_itens" ADD CONSTRAINT "cronograma_itens_igrejaPublicoId_fkey" FOREIGN KEY ("igrejaPublicoId") REFERENCES "igrejas_publico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
