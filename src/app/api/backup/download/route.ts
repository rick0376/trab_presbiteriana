//api/backup/download/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BACKUP_DIR = path.join(process.cwd(), "backups");

function isSafeBackupFileName(fileName: string) {
  return (
    /^[a-zA-Z0-9._-]+\.json$/.test(fileName) &&
    fileName !== "backup-config.json"
  );
}

function resolveBackupPath(fileName: string) {
  const baseDir = path.resolve(BACKUP_DIR);
  const filePath = path.resolve(baseDir, fileName);

  if (!filePath.startsWith(baseDir + path.sep)) {
    return null;
  }

  return filePath;
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

export async function GET(req: Request) {
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

    if (!perm?.compartilhar) {
      return NextResponse.json(
        { error: "Sem permissão para download" },
        { status: 403 },
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");

  if (!file || !isSafeBackupFileName(file)) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
  }

  const filepath = resolveBackupPath(file);

  if (!filepath || !fs.existsSync(filepath)) {
    return NextResponse.json(
      { error: "Arquivo não encontrado" },
      { status: 404 },
    );
  }

  const meta = readBackupMeta(filepath);

  if (user.role !== "SUPERADMIN") {
    if (meta?.scope !== "tenant" || meta?.igrejaId !== user.igrejaId) {
      return NextResponse.json(
        { error: "Você só pode baixar backups da sua igreja" },
        { status: 403 },
      );
    }
  }

  const buf = fs.readFileSync(filepath);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Content-Length": String(buf.length),
    },
  });
}
