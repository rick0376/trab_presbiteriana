//src/app/api/secretaria/escola-dominical/turmas/route.ts

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
      include: {
        professor: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
        _count: {
          select: {
            alunos: true,
            registros: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(turmas);
  } catch {
    return NextResponse.json(
      { error: "Erro ao listar turmas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
      },
      select: {
        id: true,
      },
    });

    if (turmaExistente) {
      return NextResponse.json(
        { error: "Já existe uma turma com esse nome." },
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

    const turma = await prisma.escolaDominicalTurma.create({
      data: {
        igrejaId,
        nome,
        departamento: departamento || null,
        professorId,
      },
    });

    return NextResponse.json(turma, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar turma." },
      { status: 500 },
    );
  }
}
