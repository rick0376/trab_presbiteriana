//src/app/api/secretaria/escola-dominical/turmas/[id]

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: Params) {
  try {
    const { id } = await context.params;

    const turma = await prisma.escolaDominicalTurma.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        igrejaId: true,
        nome: true,
        departamento: true,
        professorId: true,
        ativa: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json(turma);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar turma." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const igrejaId = String(body.igrejaId || "").trim();
    const nome = String(body.nome || "").trim();
    const departamento = String(body.departamento || "").trim();
    const professorId = String(body.professorId || "").trim();

    if (!igrejaId || !nome || !professorId) {
      return NextResponse.json(
        { error: "Nome, professor e igreja são obrigatórios." },
        { status: 400 },
      );
    }

    const turmaExistente = await prisma.escolaDominicalTurma.findFirst({
      where: {
        igrejaId,
        nome,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (turmaExistente) {
      return NextResponse.json(
        { error: "Já existe outra turma com esse nome." },
        { status: 400 },
      );
    }

    const professor = await prisma.membro.findFirst({
      where: {
        id: professorId,
        igrejaId,
        ativo: true,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado nesta igreja." },
        { status: 400 },
      );
    }

    const turma = await prisma.escolaDominicalTurma.update({
      where: {
        id,
      },
      data: {
        nome,
        departamento: departamento || null,
        professorId,
      },
    });

    return NextResponse.json(turma);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar turma." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const igrejaId = String(searchParams.get("igrejaId") || "").trim();

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

    await prisma.escolaDominicalTurma.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir turma." },
      { status: 500 },
    );
  }
}
