//api/backup/restaurar/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

export const maxDuration = 60;

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

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function firstItem<T = any>(value: unknown): T | null {
  return Array.isArray(value) && value.length > 0 ? (value[0] as T) : null;
}

async function restoreTenantBackup(
  parsed: any,
  actor: { role: string; igrejaId?: string | null },
) {
  const meta = parsed?.meta;
  const data = parsed?.data;

  if (!meta || meta.scope !== "tenant" || !meta.igrejaId || !data) {
    throw new Error("Formato de backup inválido");
  }

  const igrejaId = String(meta.igrejaId);

  if (actor.role !== "SUPERADMIN" && actor.igrejaId !== igrejaId) {
    throw new Error("Você só pode restaurar backups da sua igreja");
  }

  const tables = new Set<string>(
    Array.isArray(meta.tables) ? meta.tables.map(String) : Object.keys(data),
  );

  await prisma.$transaction(
    async (tx) => {
      const existingUsers = await tx.user.findMany({
        where: {
          igrejaId,
          role: { not: "SUPERADMIN" },
        },
        select: { id: true },
      });

      const existingUserIds = existingUsers.map((u) => u.id);

      const existingPublico = await tx.igrejaPublico.findUnique({
        where: { igrejaId },
        select: { id: true },
      });

      if (tables.has("igrejas") || tables.has("users")) {
        await tx.igreja.updateMany({
          where: { id: igrejaId },
          data: { adminId: null },
        });
      }

      if (tables.has("igrejaPublico")) {
        if (existingPublico?.id) {
          await tx.cronogramaItem.deleteMany({
            where: { igrejaPublicoId: existingPublico.id },
          });

          await tx.horarioPublico.deleteMany({
            where: { igrejaPublicoId: existingPublico.id },
          });

          await tx.igrejaPublico.deleteMany({
            where: { igrejaId },
          });
        }
      } else {
        if (tables.has("cronogramaItem") && existingPublico?.id) {
          await tx.cronogramaItem.deleteMany({
            where: { igrejaPublicoId: existingPublico.id },
          });
        }

        if (tables.has("horarioPublico") && existingPublico?.id) {
          await tx.horarioPublico.deleteMany({
            where: { igrejaPublicoId: existingPublico.id },
          });
        }
      }

      if (tables.has("cronogramaAnual")) {
        await tx.cronogramaAnual.deleteMany({ where: { igrejaId } });
      }

      if (tables.has("eventos")) {
        await tx.evento.deleteMany({ where: { igrejaId } });
      }

      if (tables.has("membros")) {
        await tx.membro.deleteMany({ where: { igrejaId } });
      }

      if (tables.has("accounts") || tables.has("users")) {
        if (existingUserIds.length > 0) {
          await tx.account.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
        }
      }

      if (tables.has("permissoes") || tables.has("users")) {
        if (existingUserIds.length > 0) {
          await tx.permissao.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
        }
      }

      if (tables.has("users")) {
        if (existingUserIds.length > 0) {
          await tx.session.deleteMany({
            where: { userId: { in: existingUserIds } },
          });
        }

        await tx.user.deleteMany({
          where: {
            igrejaId,
            role: { not: "SUPERADMIN" },
          },
        });
      }

      if (tables.has("cargos")) {
        const oldCargos = await tx.cargo.findMany({
          where: { igrejaId },
          select: { id: true },
        });

        const oldCargoIds = oldCargos.map((c) => c.id);

        if (oldCargoIds.length > 0) {
          await tx.user.updateMany({
            where: {
              igrejaId,
              cargoId: { in: oldCargoIds },
            },
            data: { cargoId: null },
          });
        }

        await tx.cargo.deleteMany({ where: { igrejaId } });
      }

      if (tables.has("igrejas")) {
        const igrejaBackup = firstItem<any>(data.igrejas);

        if (!igrejaBackup) {
          throw new Error("Backup sem dados da igreja");
        }

        if (igrejaBackup.id && igrejaBackup.id !== igrejaId) {
          throw new Error("Backup inconsistente: igreja inválida");
        }

        const { adminId, id: _id, ...igrejaSemId } = igrejaBackup;

        await tx.igreja.upsert({
          where: { id: igrejaId },
          create: {
            ...igrejaSemId,
            id: igrejaId,
            adminId: null,
          },
          update: {
            ...igrejaSemId,
            adminId: null,
          },
        });
      }

      if (tables.has("cargos")) {
        const cargos = asArray<any>(data.cargos).map((c) => ({
          ...c,
          igrejaId,
        }));

        if (cargos.length > 0) {
          await tx.cargo.createMany({ data: cargos });
        }
      }

      if (tables.has("users")) {
        const users = asArray<any>(data.users)
          .filter((u) => u.role !== "SUPERADMIN")
          .map((u) => ({
            ...u,
            igrejaId,
          }));

        const cargoIds = Array.from(
          new Set(users.map((u) => u.cargoId).filter(Boolean)),
        );

        if (cargoIds.length > 0) {
          const cargoCount = await tx.cargo.count({
            where: {
              id: { in: cargoIds as string[] },
              igrejaId,
            },
          });

          if (cargoCount !== cargoIds.length) {
            throw new Error(
              "Este backup de usuários depende dos cargos da igreja",
            );
          }
        }

        if (users.length > 0) {
          await tx.user.createMany({ data: users });
        }
      }

      if (tables.has("igrejas")) {
        const igrejaBackup = firstItem<any>(data.igrejas);

        if (igrejaBackup?.adminId) {
          const adminExists = await tx.user.findUnique({
            where: { id: igrejaBackup.adminId },
            select: { id: true },
          });

          if (adminExists) {
            await tx.igreja.update({
              where: { id: igrejaId },
              data: { adminId: igrejaBackup.adminId },
            });
          }
        }
      }

      const tenantUsers = await tx.user.findMany({
        where: {
          igrejaId,
          role: { not: "SUPERADMIN" },
        },
        select: { id: true },
      });

      const tenantUserIds = tenantUsers.map((u) => u.id);
      const tenantUserIdSet = new Set(tenantUserIds);

      if (tables.has("permissoes")) {
        const permissoes = asArray<any>(data.permissoes).filter((p) =>
          tenantUserIdSet.has(p.userId),
        );

        if (permissoes.length > 0) {
          await tx.permissao.createMany({ data: permissoes });
        }
      }

      if (tables.has("accounts")) {
        const accounts = asArray<any>(data.accounts).filter((a) =>
          tenantUserIdSet.has(a.userId),
        );

        if (accounts.length > 0) {
          await tx.account.createMany({ data: accounts });
        }
      }

      let targetIgrejaPublicoId: string | null = existingPublico?.id ?? null;

      if (tables.has("igrejaPublico")) {
        const igrejaPublicoBackup = firstItem<any>(data.igrejaPublico);

        if (igrejaPublicoBackup) {
          const created = await tx.igrejaPublico.create({
            data: {
              ...igrejaPublicoBackup,
              igrejaId,
            },
          });

          targetIgrejaPublicoId = created.id;
        } else {
          targetIgrejaPublicoId = null;
        }
      }

      if (tables.has("horarioPublico")) {
        if (!targetIgrejaPublicoId) {
          throw new Error("Backup depende de igrejaPublico");
        }

        const horarios = asArray<any>(data.horarioPublico).map((h) => ({
          ...h,
          igrejaPublicoId: targetIgrejaPublicoId,
        }));

        if (horarios.length > 0) {
          await tx.horarioPublico.createMany({ data: horarios });
        }
      }

      if (tables.has("cronogramaItem")) {
        if (!targetIgrejaPublicoId) {
          throw new Error("Backup depende de igrejaPublico");
        }

        const itens = asArray<any>(data.cronogramaItem).map((i) => ({
          ...i,
          igrejaPublicoId: targetIgrejaPublicoId,
        }));

        if (itens.length > 0) {
          await tx.cronogramaItem.createMany({ data: itens });
        }
      }

      if (tables.has("cronogramaAnual")) {
        const cronogramaAnual = asArray<any>(data.cronogramaAnual).map((c) => ({
          ...c,
          igrejaId,
        }));

        if (cronogramaAnual.length > 0) {
          await tx.cronogramaAnual.createMany({ data: cronogramaAnual });
        }
      }

      if (tables.has("membros")) {
        const membros = asArray<any>(data.membros).map((m) => ({
          ...m,
          igrejaId,
        }));

        if (membros.length > 0) {
          await tx.membro.createMany({ data: membros });
        }
      }

      if (tables.has("eventos")) {
        const eventos = asArray<any>(data.eventos).map((e) => ({
          ...e,
          igrejaId,
        }));

        if (eventos.length > 0) {
          await tx.evento.createMany({ data: eventos });
        }
      }
    },
    {
      maxWait: 30000,
      timeout: 60000,
    },
  );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    const perm = await prisma.permissao.findUnique({
      where: { userId_recurso: { userId: user.id, recurso: "backup" } },
    });

    if (!perm?.editar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const filename = body?.filename;

    if (!filename || !isSafeBackupFileName(filename)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const filepath = resolveBackupPath(filename);

    if (!filepath || !fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: "Backup não encontrado" },
        { status: 404 },
      );
    }

    const parsed = JSON.parse(fs.readFileSync(filepath, "utf8"));

    await restoreTenantBackup(parsed, {
      role: user.role,
      igrejaId: user.igrejaId,
    });

    return NextResponse.json({
      success: true,
      message: "Restauração concluída com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao restaurar backup:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao restaurar backup" },
      { status: 500 },
    );
  }
}
