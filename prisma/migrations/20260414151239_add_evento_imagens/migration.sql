-- CreateTable
CREATE TABLE "evento_imagens" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "titulo" TEXT,
    "altText" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evento_imagens_eventoId_ordem_idx" ON "evento_imagens"("eventoId", "ordem");

-- AddForeignKey
ALTER TABLE "evento_imagens" ADD CONSTRAINT "evento_imagens_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
