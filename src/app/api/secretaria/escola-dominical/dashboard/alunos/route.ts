//src/app/api/secretaria/escola-dominical/dashboard/alunos/route.ts

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

    const vinculos = await prisma.escolaDominicalTurmaAluno.findMany({
      where: {
        turma: {
          igrejaId,
        },
      },
      select: {
        membro: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            telefone: true,
            numeroSequencial: true,
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
        numeroSequencial?: number | null;
        dataNascimento?: string | Date | null;
      }
    >();

    for (const item of vinculos) {
      if (!item.membro?.id) continue;

      mapa.set(item.membro.id, {
        id: item.membro.id,
        nome: item.membro.nome,
        cargo: item.membro.cargo,
        telefone: item.membro.telefone,
        numeroSequencial: item.membro.numeroSequencial,
        dataNascimento: item.membro.dataNascimento,
      });
    }

    const alunos = Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );

    return NextResponse.json(alunos);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar alunos da EBD." },
      { status: 500 },
    );
  }
}
