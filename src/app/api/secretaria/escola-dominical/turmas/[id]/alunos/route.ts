//src/app/api/secretaria/escola-dominical/turmas/[id]/alunos/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

type BodyPayload = {
  igrejaId?: string;
  alunoIds?: string[];
};

export async function GET(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const igrejaId = searchParams.get("igrejaId");

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    const turma = await prisma.escolaDominicalTurma.findFirst({
      where: {
        id,
        igrejaId,
      },
      select: {
        id: true,
        alunos: {
          select: {
            membroId: true,
            membro: {
              select: {
                id: true,
                nome: true,
                cargo: true,
                telefone: true,
                numeroSequencial: true,
              },
            },
          },
          orderBy: {
            membro: {
              nome: "asc",
            },
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      alunoIds: turma.alunos.map((item) => item.membroId),
      alunos: turma.alunos.map((item) => item.membro),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar alunos da turma." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as BodyPayload;

    const igrejaId = String(body.igrejaId || "").trim();
    const alunoIdsRecebidos = Array.isArray(body.alunoIds) ? body.alunoIds : [];

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    const turma = await prisma.escolaDominicalTurma.findFirst({
      where: {
        id,
        igrejaId,
      },
      select: {
        id: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    const alunoIds: string[] = [
      ...new Set(alunoIdsRecebidos.map((item: string) => String(item))),
    ];

    if (alunoIds.length > 0) {
      const alunosValidos = await prisma.membro.findMany({
        where: {
          id: {
            in: alunoIds,
          },
          igrejaId,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

      if (alunosValidos.length !== alunoIds.length) {
        return NextResponse.json(
          { error: "Um ou mais alunos são inválidos para esta igreja." },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction([
      prisma.escolaDominicalTurmaAluno.deleteMany({
        where: {
          turmaId: id,
        },
      }),
      ...(alunoIds.length > 0
        ? [
            prisma.escolaDominicalTurmaAluno.createMany({
              data: alunoIds.map((membroId: string) => ({
                turmaId: id,
                membroId,
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar alunos da turma." },
      { status: 500 },
    );
  }
}
