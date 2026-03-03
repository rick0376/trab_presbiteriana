// /api/users/route.ts

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

/* ===============================
   LISTAR USUÁRIOS
================================ */
export async function GET(req: NextRequest) {
  const me = await requireUser();

  // SUPERADMIN = tudo
  if (me.role !== "SUPERADMIN") {
    const ok = await can(me.id, "usuarios", "ler");
    if (!ok) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId");

  // 🔒 não SUPERADMIN só pode listar da própria igreja
  const igrejaId =
    me.role === "SUPERADMIN"
      ? (igrejaIdParam ?? undefined)
      : (me.igrejaId ?? undefined);

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "USER"] },
      ...(igrejaId ? { igrejaId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      igrejaId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

/* ===============================
   CRIAR USUÁRIO
================================ */
export async function POST(req: NextRequest) {
  const me = await requireUser();

  // SUPERADMIN = tudo
  if (me.role !== "SUPERADMIN") {
    const ok = await can(me.id, "usuarios", "criar");
    if (!ok) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const senha = String(body?.senha ?? "");
  const role = String(body?.role ?? "USER");
  let igrejaId = body?.igrejaId ?? null;

  if (!email || !senha) {
    return NextResponse.json(
      { error: "Email e senha obrigatórios." },
      { status: 400 },
    );
  }

  if (senha.length < 6) {
    return NextResponse.json(
      { error: "Senha mínima 6 caracteres." },
      { status: 400 },
    );
  }

  // 🔒 não SUPERADMIN: força igrejaId e força role USER
  if (me.role !== "SUPERADMIN") {
    if (role !== "USER") {
      return NextResponse.json(
        { error: "Apenas SUPERADMIN pode criar ADMIN." },
        { status: 403 },
      );
    }
    igrejaId = me.igrejaId;
  }

  if (!igrejaId) {
    return NextResponse.json(
      { error: "Usuário precisa ter igreja." },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Email já cadastrado." },
      { status: 409 },
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      senha: senhaHash,
      role: role as any,
      igrejaId,
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

  return NextResponse.json(user, { status: 201 });
}
