//api/backup/manual/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

const BACKUP_DIR = path.join(process.cwd(), "backups");

type BackupTable =
  | "igrejas"
  | "users"
  | "cargos"
  | "permissoes"
  | "membros"
  | "eventos"
  | "igrejaPublico"
  | "horarioPublico"
  | "cronogramaItem"
  | "cronogramaAnual"
  | "accounts";

const ALL_TABLES: BackupTable[] = [
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
];

const TABLE_ALIASES: Record<string, BackupTable | null> = {
  igrejas: "igrejas",
  users: "users",
  cargos: "cargos",
  permissoes: "permissoes",
  membros: "membros",
  eventos: "eventos",
  igrejaPublico: "igrejaPublico",
  igrejasPublico: "igrejaPublico",
  horarioPublico: "horarioPublico",
  horariosPublico: "horarioPublico",
  cronogramaItem: "cronogramaItem",
  cronogramaAnual: "cronogramaAnual",
  account: "accounts",
  accounts: "accounts",

  // bloqueados
  session: null,
  sessions: null,
  radioStatus: null,
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

function normalizeTables(input: unknown): BackupTable[] {
  if (!Array.isArray(input)) return [];

  const normalized = input
    .map((item) => String(item))
    .map((item) => TABLE_ALIASES[item])
    .filter((item): item is BackupTable => !!item);

  return Array.from(new Set(normalized));
}

async function buildTenantBackup(params: {
  igrejaId: string;
  tables: BackupTable[];
  actor: { id: string; role: Role | string };
}) {
  const { igrejaId, tables, actor } = params;

  const igreja = await prisma.igreja.findUnique({
    where: { id: igrejaId },
  });

  if (!igreja) {
    throw new Error(`Igreja não encontrada: ${igrejaId}`);
  }

  const needUsers =
    tables.includes("users") ||
    tables.includes("permissoes") ||
    tables.includes("accounts");

  const users = needUsers
    ? await prisma.user.findMany({
        where: {
          igrejaId,
          role: { not: "SUPERADMIN" },
        },
      })
    : [];

  const userIds = users.map((u) => u.id);

  const needIgrejaPublico =
    tables.includes("igrejaPublico") ||
    tables.includes("horarioPublico") ||
    tables.includes("cronogramaItem");

  const igrejaPublico = needIgrejaPublico
    ? await prisma.igrejaPublico.findUnique({
        where: { igrejaId },
      })
    : null;

  const data: Record<string, any> = {};

  if (tables.includes("igrejas")) {
    data.igrejas = [igreja];
  }

  if (tables.includes("users")) {
    data.users = users;
  }

  if (tables.includes("cargos")) {
    data.cargos = await prisma.cargo.findMany({
      where: { igrejaId },
    });
  }

  if (tables.includes("permissoes")) {
    data.permissoes = userIds.length
      ? await prisma.permissao.findMany({
          where: { userId: { in: userIds } },
        })
      : [];
  }

  if (tables.includes("membros")) {
    data.membros = await prisma.membro.findMany({
      where: { igrejaId },
    });
  }

  if (tables.includes("eventos")) {
    data.eventos = await prisma.evento.findMany({
      where: { igrejaId },
    });
  }

  if (tables.includes("cronogramaAnual")) {
    data.cronogramaAnual = await prisma.cronogramaAnual.findMany({
      where: { igrejaId },
    });
  }

  if (tables.includes("igrejaPublico")) {
    data.igrejaPublico = igrejaPublico ? [igrejaPublico] : [];
  }

  if (tables.includes("horarioPublico")) {
    data.horarioPublico = igrejaPublico
      ? await prisma.horarioPublico.findMany({
          where: { igrejaPublicoId: igrejaPublico.id },
        })
      : [];
  }

  if (tables.includes("cronogramaItem")) {
    data.cronogramaItem = igrejaPublico
      ? await prisma.cronogramaItem.findMany({
          where: { igrejaPublicoId: igrejaPublico.id },
        })
      : [];
  }

  if (tables.includes("accounts")) {
    data.accounts = userIds.length
      ? await prisma.account.findMany({
          where: { userId: { in: userIds } },
        })
      : [];
  }

  return {
    meta: {
      version: 1,
      scope: "tenant",
      igrejaId: igreja.id,
      igrejaNome: igreja.nome,
      igrejaSlug: igreja.slug,
      createdAt: new Date().toISOString(),
      createdByUserId: actor.id,
      createdByRole: actor.role,
      tables,
    },
    data,
  };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    const perm = await prisma.permissao.findUnique({
      where: {
        userId_recurso: {
          userId: user.id,
          recurso: "backup",
        },
      },
    });

    if (!perm?.criar) {
      return NextResponse.json(
        { error: "Sem permissão para criar backup" },
        { status: 403 },
      );
    }
  }

  try {
    ensureDir();

    const body = await req.json().catch(() => ({}));
    const tipo = body?.tipo === "seletivo" ? "seletivo" : "completo";

    const tables =
      tipo === "seletivo" ? normalizeTables(body?.tabelas) : ALL_TABLES;

    if (tipo === "seletivo" && tables.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos uma tabela válida" },
        { status: 400 },
      );
    }

    // usuário comum: backup só da própria igreja
    if (user.role !== "SUPERADMIN") {
      if (!user.igrejaId) {
        return NextResponse.json(
          { error: "Usuário sem igreja vinculada" },
          { status: 400 },
        );
      }

      const backup = await buildTenantBackup({
        igrejaId: user.igrejaId,
        tables,
        actor: user,
      });

      const ts = Date.now();
      const slug = slugify(backup.meta.igrejaSlug || backup.meta.igrejaNome);
      const filename = `backup-${slug}-${ts}.json`;
      const filepath = path.join(BACKUP_DIR, filename);

      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf8");

      return NextResponse.json({
        message: "Backup criado com sucesso",
        files: [filename],
      });
    }

    // superadmin: gera separado por igreja
    const igrejaIdBody =
      typeof body?.igrejaId === "string" ? body.igrejaId : undefined;

    const igrejas = igrejaIdBody
      ? await prisma.igreja.findMany({
          where: { id: igrejaIdBody },
          select: { id: true },
        })
      : await prisma.igreja.findMany({
          select: { id: true },
        });

    if (igrejas.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma igreja encontrada para backup" },
        { status: 404 },
      );
    }

    const files: string[] = [];

    for (const igreja of igrejas) {
      const backup = await buildTenantBackup({
        igrejaId: igreja.id,
        tables,
        actor: user,
      });

      const ts = Date.now();
      const slug = slugify(backup.meta.igrejaSlug || backup.meta.igrejaNome);
      const filename = `backup-${slug}-${ts}.json`;
      const filepath = path.join(BACKUP_DIR, filename);

      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf8");
      files.push(filename);
    }

    return NextResponse.json({
      message: "Backups criados com sucesso",
      files,
      total: files.length,
    });
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    return NextResponse.json(
      { error: "Erro ao criar backup" },
      { status: 500 },
    );
  }
}
