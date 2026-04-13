-- CreateTable
CREATE TABLE "departamento_albuns" (
    "id" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataEvento" TIMESTAMP(3),
    "capaUrl" TEXT,
    "capaPublicId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamento_albuns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamento_album_imagens" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "titulo" TEXT,
    "altText" TEXT,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamento_album_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departamento_albuns_departamentoId_ativo_idx" ON "departamento_albuns"("departamentoId", "ativo");

-- CreateIndex
CREATE INDEX "departamento_albuns_departamentoId_ordem_idx" ON "departamento_albuns"("departamentoId", "ordem");

-- CreateIndex
CREATE INDEX "departamento_album_imagens_albumId_ordem_idx" ON "departamento_album_imagens"("albumId", "ordem");

-- AddForeignKey
ALTER TABLE "departamento_albuns" ADD CONSTRAINT "departamento_albuns_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamento_album_imagens" ADD CONSTRAINT "departamento_album_imagens_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "departamento_albuns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
