const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function run() {
  const backup = JSON.parse(
    fs.readFileSync("./backups/backup-1772224213159.json", "utf8"),
  );

  console.log("Limpando banco...");

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
    "accounts",
    "sessions",
    "permissoes",
    "membros",
    "eventos",
    "cargos",
    "cronograma_itens",
    "cronograma_anual",
    "horarios_publico",
    "igrejas_publico",
    "users",
    "igrejas",
    "RadioStatus"
    RESTART IDENTITY CASCADE;
  `);

  console.log("Banco limpo.");
  console.log("Restaurando dados...");

  // 1️⃣ Restaurar igrejas SEM adminId (para evitar FK)
  if (backup.igrejas) {
    const igrejasSemAdmin = backup.igrejas.map((i) => ({
      ...i,
      adminId: null, // Remover adminId temporariamente
    }));

    await prisma.igreja.createMany({ data: igrejasSemAdmin });
  }

  // 2️⃣ Restaurar usuários (agora com o `igrejaId`)
  if (backup.users) {
    await prisma.user.createMany({ data: backup.users });
  }

  // 3️⃣ Atualizar adminId nas igrejas após restaurar os usuários
  if (backup.igrejas) {
    for (const igreja of backup.igrejas) {
      if (igreja.adminId) {
        await prisma.igreja.update({
          where: { id: igreja.id },
          data: { adminId: igreja.adminId },
        });
      }
    }
  }

  // 4️⃣ Restaurar cargos
  if (backup.cargos) await prisma.cargo.createMany({ data: backup.cargos });

  // 5️⃣ Restaurar permissões
  if (backup.permissoes)
    await prisma.permissao.createMany({ data: backup.permissoes });

  // 6️⃣ Restaurar membros
  if (backup.membros) await prisma.membro.createMany({ data: backup.membros });

  // 7️⃣ Restaurar eventos
  if (backup.eventos) await prisma.evento.createMany({ data: backup.eventos });

  // 8️⃣ Restaurar igrejas públicas
  if (backup.igrejaPublico)
    await prisma.igrejaPublico.createMany({
      data: backup.igrejaPublico,
    });

  // 9️⃣ Restaurar horários públicos
  if (backup.horarioPublico)
    await prisma.horarioPublico.createMany({
      data: backup.horarioPublico,
    });

  // 🔟 Restaurar cronograma itens
  if (backup.cronogramaItem)
    await prisma.cronogramaItem.createMany({
      data: backup.cronogramaItem,
    });

  // 1️⃣1️⃣ Restaurar cronograma anual
  if (backup.cronogramaAnual)
    await prisma.cronogramaAnual.createMany({
      data: backup.cronogramaAnual,
    });

  // 1️⃣2️⃣ Restaurar contas de usuário
  if (backup.account) await prisma.account.createMany({ data: backup.account });

  // 1️⃣3️⃣ Restaurar sessões de usuário
  if (backup.session) await prisma.session.createMany({ data: backup.session });

  // 1️⃣4️⃣ Restaurar status da rádio
  if (backup.radioStatus)
    await prisma.radioStatus.createMany({ data: backup.radioStatus });

  console.log("Restauração finalizada com sucesso.");
  process.exit(0);
}

run().catch((e) => {
  console.error("Erro ao restaurar:", e);
  process.exit(1);
});
