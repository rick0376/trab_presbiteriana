//src/app/api/secretaria/escola-dominical/resumo/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LABELS_MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const igrejaId = String(searchParams.get("igrejaId") || "").trim();
    const turmaId = String(searchParams.get("turmaId") || "").trim();
    const ano = Number(searchParams.get("ano")) || new Date().getFullYear();

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    if (turmaId) {
      const turmaExiste = await prisma.escolaDominicalTurma.findFirst({
        where: {
          id: turmaId,
          igrejaId,
        },
        select: {
          id: true,
        },
      });

      if (!turmaExiste) {
        return NextResponse.json(
          { error: "Turma não encontrada." },
          { status: 404 },
        );
      }
    }

    const whereTurma = turmaId ? { igrejaId, id: turmaId } : { igrejaId };

    const turmas = await prisma.escolaDominicalTurma.findMany({
      where: whereTurma,
      select: {
        id: true,
        nome: true,
        _count: {
          select: {
            alunos: true,
          },
        },
      },
    });

    const frequenciasAgrupadas = await prisma.escolaDominicalFrequencia.groupBy(
      {
        by: ["status"],
        where: {
          registroMensal: {
            turma: turmaId
              ? {
                  igrejaId,
                  id: turmaId,
                }
              : {
                  igrejaId,
                },
          },
        },
        _count: {
          _all: true,
        },
      },
    );

    const registrosAno = await prisma.escolaDominicalRegistroMensal.findMany({
      where: {
        turma: turmaId
          ? {
              igrejaId,
              id: turmaId,
            }
          : {
              igrejaId,
            },
        ano,
      },
      select: {
        mes: true,
        frequencias: {
          select: {
            status: true,
          },
        },
        domingos: {
          select: {
            visitantes: true,
          },
        },
      },
      orderBy: {
        mes: "asc",
      },
    });

    const matriculados = turmas.reduce(
      (acc, turma) => acc + turma._count.alunos,
      0,
    );

    const presencas =
      frequenciasAgrupadas.find((item) => item.status === "PRESENTE")?._count
        ._all || 0;

    const faltas =
      frequenciasAgrupadas.find((item) => item.status === "FALTA")?._count
        ._all || 0;

    const totalLancamentos = presencas + faltas;

    const percentualPresenca =
      totalLancamentos > 0 ? (presencas / totalLancamentos) * 100 : 0;

    const graficoBase = LABELS_MESES.map((label, index) => ({
      mes: index + 1,
      label,
      presencas: 0,
      faltas: 0,
      visitantes: 0,
    }));

    registrosAno.forEach((registro) => {
      const itemMes = graficoBase.find((item) => item.mes === registro.mes);

      if (!itemMes) return;

      registro.frequencias.forEach((freq) => {
        if (freq.status === "PRESENTE") itemMes.presencas += 1;
        if (freq.status === "FALTA") itemMes.faltas += 1;
      });

      registro.domingos.forEach((domingo) => {
        itemMes.visitantes += domingo.visitantes || 0;
      });
    });

    return NextResponse.json({
      cards: {
        matriculados,
        presencas,
        faltas,
        percentualPresenca,
      },
      grafico: graficoBase,
      ano,
      filtroTurmaId: turmaId || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar resumo da EBD." },
      { status: 500 },
    );
  }
}
