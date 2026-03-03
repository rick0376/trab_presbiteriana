-- CreateTable
CREATE TABLE "backup_configs" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "intervalo" TEXT NOT NULL DEFAULT 'diario',
    "hora" TEXT NOT NULL DEFAULT '02:00',
    "ultimoBackupEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_global_configs" (
    "id" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "intervalo" TEXT NOT NULL DEFAULT 'diario',
    "hora" TEXT NOT NULL DEFAULT '02:00',
    "modo" TEXT NOT NULL DEFAULT 'todas',
    "igrejaId" TEXT,
    "ultimoBackupEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_global_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backup_configs_igrejaId_key" ON "backup_configs"("igrejaId");

-- AddForeignKey
ALTER TABLE "backup_configs" ADD CONSTRAINT "backup_configs_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_global_configs" ADD CONSTRAINT "backup_global_configs_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "igrejas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
