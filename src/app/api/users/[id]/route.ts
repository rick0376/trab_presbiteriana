// /api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function can(
  userId: string,
  recurso: string,
  campo: "ler" | "criar" | "editar" | "deletar" | "compartilhar",
) {
  const p = await prisma.permissao.findUnique({
    where: { userId_recurso: { userId, recurso } },
    select: {
      ler: true,
      criar: true,
      editar: true,
      deletar: true,
      compartilhar: true,
    },
  });

  return !!p?.[campo];
}

/* ===============================
   EDITAR USUÁRIO
================================ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await requireUser();
  const { id } = await params;

  // 🔐 permissão editar (exceto SUPERADMIN)
  if (me.role !== "SUPERADMIN") {
    const ok = await can(me.id, "usuarios", "editar");
    if (!ok) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const role = body?.role;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 },
    );
  }

  // 🔒 Regras por igreja/role (mantidas)
  if (me.role !== "SUPERADMIN") {
    // ninguém fora do SUPERADMIN pode mexer em SUPERADMIN
    if (user.role === "SUPERADMIN") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    // só permite mexer na mesma igreja
    if (user.igrejaId !== me.igrejaId) {
      return NextResponse.json(
        { error: "Usuário não pertence à sua igreja." },
        { status: 403 },
      );
    }

    // não-superadmin não altera role
    // (mesmo que mandem no body)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name,
      ...(me.role === "SUPERADMIN" ? { role } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      igrejaId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

/* ===============================
   DELETE USUÁRIO
================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await requireUser();
  const { id } = await params;

  // 🔐 permissão deletar (exceto SUPERADMIN)
  if (me.role !== "SUPERADMIN") {
    const ok = await can(me.id, "usuarios", "deletar");
    if (!ok) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  // 🔒 Regras por igreja/role (mantidas)
  if (me.role !== "SUPERADMIN") {
    // ninguém fora do SUPERADMIN pode deletar SUPERADMIN/ADMIN
    if (user.role !== "USER") {
      return NextResponse.json(
        { error: "Você só pode excluir USER." },
        { status: 403 },
      );
    }

    // só pode deletar da mesma igreja
    if (user.igrejaId !== me.igrejaId) {
      return NextResponse.json(
        { error: "Usuário não pertence à sua igreja." },
        { status: 403 },
      );
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
