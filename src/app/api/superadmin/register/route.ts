import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Usuário já existe" }, { status: 400 });
  }

  const hash = await bcrypt.hash(senha, 10);

  await prisma.user.create({
    data: {
      email,
      senha: hash,
      role: "SUPERADMIN",
    },
  });

  return NextResponse.json({ ok: true });
}
