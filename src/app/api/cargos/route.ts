//src/app/api/cargos/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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
  const { searchParams } = new URL(req.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const cargos = await prisma.cargo.findMany({
    where: { igrejaId },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(cargos);
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));

  const { searchParams } = new URL(req.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const nome = String(body.nome || "").trim();
  if (!nome) return jsonError("Nome do cargo é obrigatório.");

  try {
    const cargo = await prisma.cargo.create({
      data: { igrejaId, nome },
    });

    return NextResponse.json(cargo, { status: 201 });
  } catch {
    return jsonError("Este cargo já existe para esta igreja.", 409);
  }
}
