//api/users

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===============================
   LISTAR USUÁRIOS
================================ */
export async function GET(req: NextRequest) {
  const me = await requireUser();

  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId");

  if (me.role !== "SUPERADMIN" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const igrejaId =
    me.role === "ADMIN" ? me.igrejaId : (igrejaIdParam ?? undefined);

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
  const body = await req.json();

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

  if (me.role === "ADMIN") {
    if (role !== "USER") {
      return NextResponse.json(
        { error: "Admin só pode criar USER." },
        { status: 403 },
      );
    }
    igrejaId = me.igrejaId;
  }

  if (me.role !== "SUPERADMIN" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
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
  });

  return NextResponse.json(user, { status: 201 });
}
