//api/backup/listar/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BACKUP_DIR = path.join(process.cwd(), "backups");

function isSafeBackupFileName(fileName: string) {
  return /^[a-zA-Z0-9._-]+\.json$/.test(fileName);
}

function readBackupMeta(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.meta ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
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

    if (!perm?.ler) {
      return NextResponse.json(
        { error: "Sem permissão para listar backups" },
        { status: 403 },
      );
    }
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    return NextResponse.json({ backups: [] });
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => file !== "backup-config.json")
    .filter(isSafeBackupFileName);

  const backups = files
    .map((file) => {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      const meta = readBackupMeta(fullPath);

      return {
        nome: file,
        tamanho: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        data: stats.mtime.toLocaleString(),
        igrejaId: meta?.igrejaId ?? null,
        igrejaNome: meta?.igrejaNome ?? null,
        scope: meta?.scope ?? null,
      };
    })
    .filter((item) => {
      if (user.role === "SUPERADMIN") return true;
      return item.igrejaId === user.igrejaId;
    })
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  return NextResponse.json({ backups });
}
