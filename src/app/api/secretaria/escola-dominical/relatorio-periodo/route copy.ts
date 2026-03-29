//src/app/api/secretaria/escola-dominical/relatorio-periodo/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function monthKey(valor: string) {
  const [ano, mes] = valor.split("-").map(Number);
  return ano * 100 + mes;
}

function formatarPeriodo(inicio: string, fim: string) {
  const [anoInicio, mesInicio] = inicio.split("-").map(Number);
  const [anoFim, mesFim] = fim.split("-").map(Number);

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return `${meses[mesInicio - 1]}/${anoInicio} até ${meses[mesFim - 1]}/${anoFim}`;
}

function contarDomingosDoMes(ano: number, mes: number) {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  let total = 0;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia, 12, 0, 0);
    if (data.getDay() === 0) total += 1;
  }

  return total;
}

function listarMesesDoPeriodo(inicio: string, fim: string) {
  const [anoInicio, mesInicio] = inicio.split("-").map(Number);
  const [anoFim, mesFim] = fim.split("-").map(Number);

  const meses: { ano: number; mes: number; chave: number }[] = [];

  let ano = anoInicio;
  let mes = mesInicio;

  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    meses.push({
      ano,
      mes,
      chave: ano * 100 + mes,
    });

    mes += 1;

    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }

  return meses;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const igrejaId = searchParams.get("igrejaId");
    const turmaId = searchParams.get("turmaId");
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    if (!turmaId) {
      return NextResponse.json(
        { error: "turmaId é obrigatório." },
        { status: 400 },
      );
    }

    if (!inicio || !/^\d{4}-\d{2}$/.test(inicio)) {
      return NextResponse.json(
        { error: "inicio inválido. Use YYYY-MM." },
        { status: 400 },
      );
    }

    if (!fim || !/^\d{4}-\d{2}$/.test(fim)) {
      return NextResponse.json(
        { error: "fim inválido. Use YYYY-MM." },
        { status: 400 },
      );
    }

    if (monthKey(inicio) > monthKey(fim)) {
      return NextResponse.json(
        { error: "O período inicial não pode ser maior que o final." },
        { status: 400 },
      );
    }

    const mesesDoPeriodo = listarMesesDoPeriodo(inicio, fim);

    const totalAulas = mesesDoPeriodo.reduce((acc, item) => {
      return acc + contarDomingosDoMes(item.ano, item.mes);
    }, 0);

    const [turma, vinculos, registros] = await Promise.all([
      prisma.escolaDominicalTurma.findFirst({
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
              cargo: true,
            },
          },
        },
      }),

      prisma.escolaDominicalTurmaAluno.findMany({
        where: {
          turmaId,
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
              numeroSequencial: true,
            },
          },
        },
      }),

      prisma.escolaDominicalRegistroMensal.findMany({
        where: {
          turmaId,
          turma: {
            igrejaId,
          },
        },
        select: {
          id: true,
          mes: true,
          ano: true,
          frequencias: {
            select: {
              membroId: true,
              status: true,
            },
          },
        },
        orderBy: [{ ano: "asc" }, { mes: "asc" }],
      }),
    ]);

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    const chavesMeses = new Set(mesesDoPeriodo.map((item) => item.chave));

    const registrosFiltrados = registros.filter((registro) => {
      const chave = registro.ano * 100 + registro.mes;
      return chavesMeses.has(chave);
    });

    const mapaAlunos = new Map<
      string,
      {
        membroId: string;
        nome: string;
        cargo?: string | null;
        numeroSequencial?: number | null;
        totalAulas: number;
        presencas: number;
        faltas: number;
        percentualPresenca: number;
      }
    >();

    vinculos.forEach((item) => {
      if (!item.membro?.id) return;

      mapaAlunos.set(item.membro.id, {
        membroId: item.membro.id,
        nome: item.membro.nome,
        cargo: item.membro.cargo,
        numeroSequencial: item.membro.numeroSequencial,
        totalAulas,
        presencas: 0,
        faltas: 0,
        percentualPresenca: 0,
      });
    });

    registrosFiltrados.forEach((registro) => {
      registro.frequencias.forEach((freq) => {
        const aluno = mapaAlunos.get(freq.membroId);
        if (!aluno) return;

        if (freq.status === "PRESENTE") {
          aluno.presencas += 1;
        }
      });
    });

    const alunos = Array.from(mapaAlunos.values())
      .map((item) => {
        const faltas = Math.max(item.totalAulas - item.presencas, 0);
        const percentualPresenca =
          item.totalAulas > 0 ? (item.presencas / item.totalAulas) * 100 : 0;

        return {
          ...item,
          faltas,
          percentualPresenca,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    const totalPresencas = alunos.reduce(
      (acc, item) => acc + item.presencas,
      0,
    );
    const totalFaltas = alunos.reduce((acc, item) => acc + item.faltas, 0);

    const totalLancamentosPossiveis = totalAulas * alunos.length;
    const percentualPresencaGeral =
      totalLancamentosPossiveis > 0
        ? (totalPresencas / totalLancamentosPossiveis) * 100
        : 0;

    return NextResponse.json({
      turma,
      periodo: {
        inicio,
        fim,
        label: formatarPeriodo(inicio, fim),
      },
      cards: {
        totalAulas,
        totalAlunos: alunos.length,
        presencas: totalPresencas,
        faltas: totalFaltas,
        percentualPresenca: percentualPresencaGeral,
      },
      alunos,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao gerar relatório por período da EBD." },
      { status: 500 },
    );
  }
}
