-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "capaUrl" TEXT,
    "capaPublicId" TEXT,
    "diasFuncionamento" TEXT,
    "horarioFuncionamento" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamento_responsaveis" (
    "id" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "cargoTitulo" TEXT NOT NULL,
    "bio" TEXT,
    "fotoUrl" TEXT,
    "fotoPublicId" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamento_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departamentos_igrejaId_ativo_idx" ON "departamentos"("igrejaId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_igrejaId_slug_key" ON "departamentos"("igrejaId", "slug");

-- CreateIndex
CREATE INDEX "departamento_responsaveis_membroId_idx" ON "departamento_responsaveis"("membroId");

-- CreateIndex
CREATE UNIQUE INDEX "departamento_responsaveis_departamentoId_membroId_key" ON "departamento_responsaveis"("departamentoId", "membroId");

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamento_responsaveis" ADD CONSTRAINT "departamento_responsaveis_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamento_responsaveis" ADD CONSTRAINT "departamento_responsaveis_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "membros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
