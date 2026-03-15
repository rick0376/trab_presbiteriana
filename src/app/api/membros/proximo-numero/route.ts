//src/app/api/membros/proximo-numero/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function resolveIgrejaId(
  user: { id: string; role: string; igrejaId?: string | null },
  igrejaIdParam: string | null,
) {
  if (user.role === "SUPERADMIN") return igrejaIdParam || null;

  if (user.igrejaId) return user.igrejaId;

  const igreja = await prisma.igreja.findFirst({
    where: { adminId: user.id },
    select: { id: true },
  });

  return igreja?.id || null;
}

export async function GET(req: Request) {
  const user = await requireUser();
  await requirePermission("membros", "criar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada para este usuário.");
  }

  const ultimo = await prisma.membro.findFirst({
    where: { igrejaId },
    orderBy: { numeroSequencial: "desc" },
    select: { numeroSequencial: true },
  });

  const proximoNumero = ultimo ? ultimo.numeroSequencial + 1 : 1;

  return NextResponse.json({
    numeroSequencial: proximoNumero,
    codigoFormatado: `IPR-${String(proximoNumero).padStart(4, "0")}`,
  });
}
