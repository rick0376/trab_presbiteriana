//src/app/(private)/secretaria/escola-dominical/frequencia/[turmaId]/page.tsx

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

type EbdStatus = "PRESENTE" | "FALTA";

type FrequenciaPayload = {
  membroId: string;
  domingoNumero: number;
  status: EbdStatus;
};

type DomingoPayload = {
  domingoNumero: number;
  visitantes?: number;
  oferta?: number | string | null;
  revistasLivros?: number;
  observacao?: string | null;
  isFolgaGeral?: boolean;
  motivoFolga?: string | null;
};

type BodyPayload = {
  igrejaId?: string;
  mes?: number;
  ano?: number;
  observacoes?: string;
  frequencias?: FrequenciaPayload[];
  domingos?: DomingoPayload[];
};

function getSundayNumbersOfMonth(mes: number, ano: number): number[] {
  const domingos: number[] = [];
  const ultimoDia = new Date(ano, mes, 0).getDate();
  let contador = 0;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia, 12, 0, 0);
    if (data.getDay() === 0) {
      contador += 1;
      if (contador <= 5) domingos.push(contador);
    }
  }

  return domingos;
}

export async function GET(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const igrejaId = String(searchParams.get("igrejaId") || "").trim();
    const mes = Number(searchParams.get("mes"));
    const ano = Number(searchParams.get("ano"));

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    if (!mes || mes < 1 || mes > 12 || !ano) {
      return NextResponse.json(
        { error: "Mês e ano inválidos." },
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
        nome: true,
        departamento: true,
        professor: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
        alunos: {
          select: {
            membroId: true,
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
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 },
      );
    }

    const registro = await prisma.escolaDominicalRegistroMensal.findUnique({
      where: {
        turmaId_mes_ano: {
          turmaId: id,
          mes,
          ano,
        },
      },
      select: {
        id: true,
        mes: true,
        ano: true,
        observacoes: true,
        domingos: {
          select: {
            id: true,
            domingoNumero: true,
            visitantes: true,
            oferta: true,
            revistasLivros: true,
            observacao: true,
            isFolgaGeral: true,
            motivoFolga: true,
          },
          orderBy: {
            domingoNumero: "asc",
          },
        },
        frequencias: {
          select: {
            id: true,
            membroId: true,
            domingoNumero: true,
            status: true,
          },
          orderBy: [{ domingoNumero: "asc" }, { membroId: "asc" }],
        },
      },
    });

    const alunosOrdenados = turma.alunos
      .map((item) => item.membro)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return NextResponse.json({
      turma: {
        id: turma.id,
        nome: turma.nome,
        departamento: turma.departamento,
        professor: turma.professor,
      },
      alunos: alunosOrdenados,
      registro,
      domingosDisponiveis: getSundayNumbersOfMonth(mes, ano),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar frequência." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: Params) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as BodyPayload;

    const igrejaId = String(body.igrejaId || "").trim();
    const mes = Number(body.mes);
    const ano = Number(body.ano);
    const observacoes = String(body.observacoes || "").trim();

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório." },
        { status: 400 },
      );
    }

    if (!mes || mes < 1 || mes > 12 || !ano) {
      return NextResponse.json(
        { error: "Mês e ano inválidos." },
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

    const domingosValidos = getSundayNumbersOfMonth(mes, ano);
    const membroIdsPermitidos = new Set(
      turma.alunos.map((item) => item.membroId),
    );

    const frequenciasRecebidas = Array.isArray(body.frequencias)
      ? body.frequencias
      : [];

    const domingosRecebidos = Array.isArray(body.domingos) ? body.domingos : [];

    const domingos = domingosValidos.map((domingoNumero) => {
      const encontrado = domingosRecebidos.find(
        (item) => Number(item.domingoNumero) === domingoNumero,
      );

      const visitantes = Number(encontrado?.visitantes || 0);
      const revistasLivros = Number(encontrado?.revistasLivros || 0);

      let oferta: number | null = null;

      if (
        encontrado?.oferta !== null &&
        encontrado?.oferta !== undefined &&
        String(encontrado.oferta).trim() !== ""
      ) {
        const valorOferta = Number(encontrado.oferta);
        oferta = Number.isNaN(valorOferta) ? null : valorOferta;
      }

      const isFolgaGeral = Boolean(encontrado?.isFolgaGeral);
      const motivoFolga = String(encontrado?.motivoFolga || "").trim() || null;

      return {
        domingoNumero,
        visitantes: Number.isNaN(visitantes) ? 0 : visitantes,
        oferta,
        revistasLivros: Number.isNaN(revistasLivros) ? 0 : revistasLivros,
        observacao: String(encontrado?.observacao || "").trim() || null,
        isFolgaGeral,
        motivoFolga,
      };
    });

    const domingosFolga = new Set(
      domingos
        .filter((item) => item.isFolgaGeral)
        .map((item) => item.domingoNumero),
    );

    const frequencias = frequenciasRecebidas
      .filter((item) => {
        return (
          membroIdsPermitidos.has(String(item.membroId)) &&
          domingosValidos.includes(Number(item.domingoNumero)) &&
          !domingosFolga.has(Number(item.domingoNumero)) &&
          (item.status === "PRESENTE" || item.status === "FALTA")
        );
      })
      .map((item) => ({
        membroId: String(item.membroId),
        domingoNumero: Number(item.domingoNumero),
        status: item.status,
      }));

    await prisma.$transaction(async (tx) => {
      const registro = await tx.escolaDominicalRegistroMensal.upsert({
        where: {
          turmaId_mes_ano: {
            turmaId: id,
            mes,
            ano,
          },
        },
        update: {
          observacoes: observacoes || null,
        },
        create: {
          turmaId: id,
          mes,
          ano,
          observacoes: observacoes || null,
        },
        select: {
          id: true,
        },
      });

      await tx.escolaDominicalDomingo.deleteMany({
        where: {
          registroMensalId: registro.id,
        },
      });

      await tx.escolaDominicalFrequencia.deleteMany({
        where: {
          registroMensalId: registro.id,
        },
      });

      await tx.escolaDominicalDomingo.createMany({
        data: domingos.map((item) => ({
          registroMensalId: registro.id,
          domingoNumero: item.domingoNumero,
          visitantes: item.visitantes,
          oferta: item.oferta,
          revistasLivros: item.revistasLivros,
          observacao: item.observacao,
          isFolgaGeral: item.isFolgaGeral,
          motivoFolga: item.motivoFolga,
        })),
      });

      if (frequencias.length > 0) {
        await tx.escolaDominicalFrequencia.createMany({
          data: frequencias.map((item) => ({
            registroMensalId: registro.id,
            membroId: item.membroId,
            domingoNumero: item.domingoNumero,
            status: item.status,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar frequência." },
      { status: 500 },
    );
  }
}
