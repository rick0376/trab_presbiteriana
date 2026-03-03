import { NextRequest, NextResponse } from "next/server";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const user = await requireUser();
  const { searchParams } = new URL(request.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const cargo = await prisma.cargo.findFirst({
    where: { id, igrejaId },
  });

  if (!cargo) return jsonError("Cargo não encontrado.", 404);

  return NextResponse.json(cargo);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const user = await requireUser();
  const body = await request.json().catch(() => ({}));

  const { searchParams } = new URL(request.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const nome = String(body.nome || "").trim();
  if (!nome) return jsonError("Nome do cargo é obrigatório.");

  const cargo = await prisma.cargo.findFirst({
    where: { id, igrejaId },
  });

  if (!cargo) return jsonError("Cargo não encontrado.", 404);

  try {
    const updated = await prisma.cargo.update({
      where: { id },
      data: { nome },
    });

    return NextResponse.json(updated);
  } catch {
    return jsonError("Já existe um cargo com esse nome nesta igreja.", 409);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const user = await requireUser();
  const { searchParams } = new URL(request.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const cargo = await prisma.cargo.findFirst({
    where: { id, igrejaId },
  });

  if (!cargo) return jsonError("Cargo não encontrado.", 404);

  const usersCount = await prisma.user.count({
    where: { cargoId: cargo.id },
  });

  if (usersCount > 0) {
    return jsonError(
      "Não é possível excluir. Este cargo está em uso por usuários.",
      409,
    );
  }

  const membrosCount = await prisma.membro.count({
    where: { igrejaId, cargo: cargo.nome },
  });

  if (membrosCount > 0) {
    return jsonError(
      "Não é possível excluir. Existem membros cadastrados com este cargo.",
      409,
    );
  }

  await prisma.cargo.delete({
    where: { id: cargo.id },
  });

  return NextResponse.json({ ok: true });
}
