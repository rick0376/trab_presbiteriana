//src/app/api/secretaria/escola-dominical/alunos/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const igrejaId = searchParams.get("igrejaId");

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    const alunos = await prisma.membro.findMany({
      where: {
        igrejaId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
        telefone: true,
        numeroSequencial: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(alunos);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar alunos." },
      { status: 500 },
    );
  }
}
