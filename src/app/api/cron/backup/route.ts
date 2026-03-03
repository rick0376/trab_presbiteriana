import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

const BACKUP_DIR = path.join(process.cwd(), "backups");
const GLOBAL_CONFIG_ID = "backup-global-default";
const TIME_ZONE = "America/Sao_Paulo";

const ALL_TABLES = [
  "igrejas",
  "users",
  "cargos",
  "permissoes",
  "membros",
  "eventos",
  "igrejaPublico",
  "horarioPublico",
  "cronogramaItem",
  "cronogramaAnual",
  "accounts",
] as const;

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getZonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: WEEKDAY_MAP[map.weekday] ?? 0,
  };
}

function toMinutes(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function sameLocalDate(
  a: ReturnType<typeof getZonedParts>,
  b: ReturnType<typeof getZonedParts>,
) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function daysBetweenLocal(
  a: ReturnType<typeof getZonedParts>,
  b: ReturnType<typeof getZonedParts>,
) {
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.floor((da - db) / 86400000);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isDue(config: {
  ativo: boolean;
  intervalo: string;
  hora: string;
  ultimoBackupEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  if (!config.ativo) return false;

  const now = new Date();
  const nowParts = getZonedParts(now);
  const nowMinutes = nowParts.hour * 60 + nowParts.minute;
  const targetMinutes = toMinutes(config.hora || "02:00");

  if (nowMinutes < targetMinutes) {
    return false;
  }

  const anchorDate = config.updatedAt ?? config.createdAt ?? now;
  const anchorParts = getZonedParts(anchorDate);
  const lastRunParts = config.ultimoBackupEm
    ? getZonedParts(config.ultimoBackupEm)
    : null;

  if (config.intervalo === "diario") {
    return !lastRunParts || !sameLocalDate(lastRunParts, nowParts);
  }

  if (config.intervalo === "semanal") {
    if (nowParts.weekday !== anchorParts.weekday) {
      return false;
    }

    return !lastRunParts || daysBetweenLocal(nowParts, lastRunParts) >= 7;
  }

  if (config.intervalo === "mensal") {
    const anchorDay = Math.min(
      anchorParts.day,
      getDaysInMonth(nowParts.year, nowParts.month),
    );

    if (nowParts.day !== anchorDay) {
      return false;
    }

    return (
      !lastRunParts ||
      lastRunParts.year !== nowParts.year ||
      lastRunParts.month !== nowParts.month
    );
  }

  return false;
}

async function createTenantBackupFile(igrejaId: string) {
  ensureDir();

  const igreja = await prisma.igreja.findUnique({
    where: { id: igrejaId },
  });

  if (!igreja) {
    throw new Error("Igreja não encontrada");
  }

  const users = await prisma.user.findMany({
    where: {
      igrejaId,
      role: { not: "SUPERADMIN" },
    },
  });

  const userIds = users.map((u) => u.id);

  const igrejaPublico = await prisma.igrejaPublico.findUnique({
    where: { igrejaId },
  });

  const payload = {
    meta: {
      version: 1,
      scope: "tenant",
      igrejaId: igreja.id,
      igrejaNome: igreja.nome,
      igrejaSlug: igreja.slug,
      createdAt: new Date().toISOString(),
      createdByUserId: null,
      createdByRole: "CRON",
      tables: [...ALL_TABLES],
    },
    data: {
      igrejas: [igreja],
      users,
      cargos: await prisma.cargo.findMany({
        where: { igrejaId },
      }),
      permissoes: userIds.length
        ? await prisma.permissao.findMany({
            where: { userId: { in: userIds } },
          })
        : [],
      membros: await prisma.membro.findMany({
        where: { igrejaId },
      }),
      eventos: await prisma.evento.findMany({
        where: { igrejaId },
      }),
      igrejaPublico: igrejaPublico ? [igrejaPublico] : [],
      horarioPublico: igrejaPublico
        ? await prisma.horarioPublico.findMany({
            where: { igrejaPublicoId: igrejaPublico.id },
          })
        : [],
      cronogramaItem: igrejaPublico
        ? await prisma.cronogramaItem.findMany({
            where: { igrejaPublicoId: igrejaPublico.id },
          })
        : [],
      cronogramaAnual: await prisma.cronogramaAnual.findMany({
        where: { igrejaId },
      }),
      accounts: userIds.length
        ? await prisma.account.findMany({
            where: { userId: { in: userIds } },
          })
        : [],
    },
  };

  const filename = `backup-auto-${slugify(igreja.slug || igreja.nome || igreja.id)}-${Date.now()}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), "utf8");

  return filename;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  const agora = new Date();
  const arquivos: string[] = [];
  const erros: Array<{ origem: string; igrejaId?: string; erro: string }> = [];
  const igrejasExecutadas = new Set<string>();

  try {
    const globalConfig = await prisma.backupGlobalConfig.findUnique({
      where: { id: GLOBAL_CONFIG_ID },
    });

    if (globalConfig && isDue(globalConfig)) {
      const igrejaIds =
        globalConfig.modo === "igreja" && globalConfig.igrejaId
          ? [globalConfig.igrejaId]
          : (
              await prisma.igreja.findMany({
                select: { id: true },
              })
            ).map((i) => i.id);

      const globalSucesso: string[] = [];

      for (const igrejaId of igrejaIds) {
        try {
          const filename = await createTenantBackupFile(igrejaId);
          arquivos.push(filename);
          igrejasExecutadas.add(igrejaId);
          globalSucesso.push(igrejaId);
        } catch (error: any) {
          erros.push({
            origem: "global",
            igrejaId,
            erro: error?.message || "Erro ao gerar backup global",
          });
        }
      }

      if (globalSucesso.length > 0) {
        await prisma.backupGlobalConfig.update({
          where: { id: GLOBAL_CONFIG_ID },
          data: { ultimoBackupEm: agora },
        });

        await prisma.backupConfig.updateMany({
          where: {
            igrejaId: { in: globalSucesso },
          },
          data: { ultimoBackupEm: agora },
        });
      }
    }

    const configsIgreja = await prisma.backupConfig.findMany({
      where: { ativo: true },
    });

    for (const config of configsIgreja) {
      if (igrejasExecutadas.has(config.igrejaId)) continue;
      if (!isDue(config)) continue;

      try {
        const filename = await createTenantBackupFile(config.igrejaId);
        arquivos.push(filename);
        igrejasExecutadas.add(config.igrejaId);

        await prisma.backupConfig.update({
          where: { igrejaId: config.igrejaId },
          data: { ultimoBackupEm: agora },
        });
      } catch (error: any) {
        erros.push({
          origem: "igreja",
          igrejaId: config.igrejaId,
          erro: error?.message || "Erro ao gerar backup automático",
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: arquivos.length,
      arquivos,
      erros,
    });
  } catch (error: any) {
    console.error("Erro no cron de backup:", error);

    return NextResponse.json(
      { error: error?.message || "Erro no cron de backup" },
      { status: 500 },
    );
  }
}
