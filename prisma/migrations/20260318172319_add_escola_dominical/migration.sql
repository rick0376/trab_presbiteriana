-- CreateEnum
CREATE TYPE "EbdStatus" AS ENUM ('PRESENTE', 'FALTA');

-- CreateTable
CREATE TABLE "ebd_turmas" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "departamento" TEXT,
    "professorId" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebd_turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebd_turma_alunos" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ebd_turma_alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebd_registros_mensais" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebd_registros_mensais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebd_domingos" (
    "id" TEXT NOT NULL,
    "registroMensalId" TEXT NOT NULL,
    "domingoNumero" INTEGER NOT NULL,
    "visitantes" INTEGER NOT NULL DEFAULT 0,
    "oferta" DECIMAL(10,2),
    "revistasLivros" INTEGER NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebd_domingos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebd_frequencias" (
    "id" TEXT NOT NULL,
    "registroMensalId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "domingoNumero" INTEGER NOT NULL,
    "status" "EbdStatus" NOT NULL DEFAULT 'FALTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebd_frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ebd_turmas_igrejaId_idx" ON "ebd_turmas"("igrejaId");

-- CreateIndex
CREATE INDEX "ebd_turmas_professorId_idx" ON "ebd_turmas"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "ebd_turmas_igrejaId_nome_key" ON "ebd_turmas"("igrejaId", "nome");

-- CreateIndex
CREATE INDEX "ebd_turma_alunos_membroId_idx" ON "ebd_turma_alunos"("membroId");

-- CreateIndex
CREATE UNIQUE INDEX "ebd_turma_alunos_turmaId_membroId_key" ON "ebd_turma_alunos"("turmaId", "membroId");

-- CreateIndex
CREATE INDEX "ebd_registros_mensais_mes_ano_idx" ON "ebd_registros_mensais"("mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "ebd_registros_mensais_turmaId_mes_ano_key" ON "ebd_registros_mensais"("turmaId", "mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "ebd_domingos_registroMensalId_domingoNumero_key" ON "ebd_domingos"("registroMensalId", "domingoNumero");

-- CreateIndex
CREATE INDEX "ebd_frequencias_membroId_idx" ON "ebd_frequencias"("membroId");

-- CreateIndex
CREATE INDEX "ebd_frequencias_domingoNumero_idx" ON "ebd_frequencias"("domingoNumero");

-- CreateIndex
CREATE UNIQUE INDEX "ebd_frequencias_registroMensalId_membroId_domingoNumero_key" ON "ebd_frequencias"("registroMensalId", "membroId", "domingoNumero");

-- AddForeignKey
ALTER TABLE "ebd_turmas" ADD CONSTRAINT "ebd_turmas_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_turmas" ADD CONSTRAINT "ebd_turmas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "membros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_turma_alunos" ADD CONSTRAINT "ebd_turma_alunos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "ebd_turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_turma_alunos" ADD CONSTRAINT "ebd_turma_alunos_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "membros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_registros_mensais" ADD CONSTRAINT "ebd_registros_mensais_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "ebd_turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_domingos" ADD CONSTRAINT "ebd_domingos_registroMensalId_fkey" FOREIGN KEY ("registroMensalId") REFERENCES "ebd_registros_mensais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_frequencias" ADD CONSTRAINT "ebd_frequencias_registroMensalId_fkey" FOREIGN KEY ("registroMensalId") REFERENCES "ebd_registros_mensais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebd_frequencias" ADD CONSTRAINT "ebd_frequencias_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "membros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
