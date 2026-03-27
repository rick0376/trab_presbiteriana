//src/app/api/secretaria/escola-dominical/sorteio/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function parseDateOnly(value: string | null) {
  if (!value) return null;

  const [ano, mes, dia] = value.split("-").map(Number);
  if (!ano || !mes || !dia) return null;

  return new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
}

function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function getSundayDate(ano: number, mes: number, domingoNumero: number) {
  const ultimoDia = new Date(Date.UTC(ano, mes, 0, 12, 0, 0)).getUTCDate();
  let contador = 0;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));

    if (data.getUTCDay() === 0) {
      contador += 1;

      if (contador === domingoNumero) {
        return data;
      }
    }
  }

  return null;
}

async function getIgrejaIdDoUsuarioLogado() {
  const authUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { igrejaId: true, role: true },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (!user.igrejaId) {
    throw new Error("Usuário logado não possui igreja vinculada.");
  }

  return {
    igrejaId: user.igrejaId,
    role: user.role,
    userId: authUser.id,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { igrejaId } = await getIgrejaIdDoUsuarioLogado();

    const { searchParams } = new URL(request.url);

    const turmaId = searchParams.get("turmaId") || "";
    const dataInicioStr = searchParams.get("dataInicio");
    const dataFimStr = searchParams.get("dataFim");
    const maxFaltas = Math.max(0, Number(searchParams.get("maxFaltas") || 2));

    // LISTAR TURMAS
    if (!turmaId) {
      const turmas = await prisma.escolaDominicalTurma.findMany({
        where: {
          igrejaId,
          ativa: true,
        },
        orderBy: {
          nome: "asc",
        },
        select: {
          id: true,
          nome: true,
          departamento: true,
          professor: {
            select: {
              nome: true,
            },
          },
        },
      });

      return NextResponse.json({
        turmas: turmas.map((turma) => ({
          id: turma.id,
          nome: turma.nome,
          departamento: turma.departamento,
          professorNome: turma.professor?.nome || null,
        })),
      });
    }

    const dataInicio = parseDateOnly(dataInicioStr);
    const dataFim = parseDateOnly(dataFimStr);

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Informe data inicial e data final válidas." },
        { status: 400 },
      );
    }

    if (dataInicio.getTime() > dataFim.getTime()) {
      return NextResponse.json(
        { error: "A data inicial não pode ser maior que a data final." },
        { status: 400 },
      );
    }

    const turma = await prisma.escolaDominicalTurma.findFirst({
      where: {
        id: turmaId,
        igrejaId,
      },
      select: {
        id: true,
        nome: true,
        departamento: true,
        professor: {
          select: {
            nome: true,
          },
        },
        alunos: {
          where: {
            membro: {
              ativo: true,
            },
          },
          select: {
            membro: {
              select: {
                id: true,
                nome: true,
                cargo: true,
                numeroSequencial: true,
              },
            },
          },
        },
        registros: {
          orderBy: [{ ano: "asc" }, { mes: "asc" }],
          select: {
            id: true,
            mes: true,
            ano: true,
            frequencias: {
              select: {
                membroId: true,
                domingoNumero: true,
                status: true,
              },
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

    const alunosTurma = turma.alunos
      .map((item) => item.membro)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    const mapa = new Map<
      string,
      {
        id: string;
        nome: string;
        cargo: string | null;
        numeroSequencial: number | null;
        presencas: number;
        faltas: number;
        totalRegistros: number;
      }
    >();

    alunosTurma.forEach((aluno) => {
      mapa.set(aluno.id, {
        id: aluno.id,
        nome: aluno.nome,
        cargo: aluno.cargo,
        numeroSequencial: aluno.numeroSequencial,
        presencas: 0,
        faltas: 0,
        totalRegistros: 0,
      });
    });

    const domingosConsiderados = new Set<string>();

    for (const registro of turma.registros) {
      for (const freq of registro.frequencias) {
        const dataDomingo = getSundayDate(
          registro.ano,
          registro.mes,
          freq.domingoNumero,
        );

        if (!dataDomingo) continue;

        const timestamp = dataDomingo.getTime();

        if (timestamp < dataInicio.getTime() || timestamp > dataFim.getTime()) {
          continue;
        }

        domingosConsiderados.add(dataDomingo.toISOString().slice(0, 10));

        const alunoStats = mapa.get(freq.membroId);
        if (!alunoStats) continue;

        alunoStats.totalRegistros += 1;

        if (freq.status === "PRESENTE") {
          alunoStats.presencas += 1;
        } else {
          alunoStats.faltas += 1;
        }
      }
    }

    const aptos = Array.from(mapa.values())
      .filter((aluno) => aluno.totalRegistros > 0 && aluno.faltas <= maxFaltas)
      .map((aluno) => ({
        ...aluno,
        percentualPresenca:
          aluno.totalRegistros > 0
            ? (aluno.presencas / aluno.totalRegistros) * 100
            : 0,
      }))
      .sort((a, b) => {
        if (a.faltas !== b.faltas) return a.faltas - b.faltas;
        if (a.presencas !== b.presencas) return b.presencas - a.presencas;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

    return NextResponse.json({
      turma: {
        id: turma.id,
        nome: turma.nome,
        departamento: turma.departamento,
        professorNome: turma.professor?.nome || null,
      },
      aptos,
      resumo: {
        totalAlunosTurma: alunosTurma.length,
        totalAptos: aptos.length,
        totalInaptos: Math.max(alunosTurma.length - aptos.length, 0),
        domingosConsiderados: domingosConsiderados.size,
        periodoLabel: `${formatDateBR(dataInicio)} até ${formatDateBR(dataFim)}`,
      },
    });
  } catch (error) {
    console.error("Erro no sorteio EBD:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao processar o sorteio da EBD.";

    if (message === "Usuário logado não possui igreja vinculada.") {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: message || "Erro interno ao processar o sorteio da EBD." },
      { status: 500 },
    );
  }
}
