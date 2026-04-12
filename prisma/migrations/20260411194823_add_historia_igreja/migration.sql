-- CreateTable
CREATE TABLE "historias_igreja" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "texto" TEXT,
    "imagemCapaUrl" TEXT,
    "imagemCapaPublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_igreja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_igreja_marcos" (
    "id" TEXT NOT NULL,
    "historiaIgrejaId" TEXT NOT NULL,
    "ano" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_igreja_marcos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "historias_igreja_igrejaId_key" ON "historias_igreja"("igrejaId");

-- CreateIndex
CREATE INDEX "historias_igreja_marcos_historiaIgrejaId_idx" ON "historias_igreja_marcos"("historiaIgrejaId");

-- AddForeignKey
ALTER TABLE "historias_igreja" ADD CONSTRAINT "historias_igreja_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias_igreja_marcos" ADD CONSTRAINT "historias_igreja_marcos_historiaIgrejaId_fkey" FOREIGN KEY ("historiaIgrejaId") REFERENCES "historias_igreja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
