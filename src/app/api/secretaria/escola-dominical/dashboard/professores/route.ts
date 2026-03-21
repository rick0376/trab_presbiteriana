//src/app/api/secretaria/escola-dominical/dashboard/professores/route.ts

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

    const turmas = await prisma.escolaDominicalTurma.findMany({
      where: {
        igrejaId,
      },
      select: {
        professor: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            telefone: true,
            dataNascimento: true,
          },
        },
      },
    });

    const mapa = new Map<
      string,
      {
        id: string;
        nome: string;
        cargo?: string | null;
        telefone?: string | null;
        dataNascimento?: string | Date | null;
      }
    >();

    for (const item of turmas) {
      if (!item.professor?.id) continue;

      mapa.set(item.professor.id, {
        id: item.professor.id,
        nome: item.professor.nome,
        cargo: item.professor.cargo,
        telefone: item.professor.telefone,
        dataNascimento: item.professor.dataNascimento,
      });
    }

    const professores = Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );

    return NextResponse.json(professores);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar professores da EBD." },
      { status: 500 },
    );
  }
}
