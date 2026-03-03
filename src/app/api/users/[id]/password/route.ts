// /api/users/[id]/password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await requireUser();
  const { id } = await params;

  // 🔐 permissão para trocar senha (exceto SUPERADMIN)
  if (me.role !== "SUPERADMIN") {
    const ok = await can(me.id, "usuarios_senha", "editar");
    if (!ok) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const senha = String(body?.senha ?? "").trim();

  if (!senha || senha.length < 6) {
    return NextResponse.json(
      { error: "Senha mínima: 6 caracteres." },
      { status: 400 },
    );
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
    // não pode trocar senha de ADMIN/SUPERADMIN
    if (user.role !== "USER") {
      return NextResponse.json(
        { error: "Você só pode trocar senha de USER." },
        { status: 403 },
      );
    }

    // só pode trocar senha dentro da mesma igreja
    if (user.igrejaId !== me.igrejaId) {
      return NextResponse.json(
        { error: "Usuário não pertence à sua igreja." },
        { status: 403 },
      );
    }
  }

  const hash = await bcrypt.hash(senha, 10);

  await prisma.user.update({
    where: { id },
    data: { senha: hash },
  });

  return NextResponse.json({ success: true });
}
