//src/app/api/radio/programacao/public/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

const DIA_LABEL: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const DIA_ORDEM: Record<DiaSemana, number> = {
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
  DOMINGO: 7,
};

function getDiaAtualSP(): DiaSemana {
  const nowSP = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );

  const map: DiaSemana[] = [
    "DOMINGO",
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
  ];

  return map[nowSP.getDay()];
}

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.radioProgramacao.findMany({
    where: { ativo: true },
  });

  const sorted = items.sort((a, b) => {
    const diffDia =
      DIA_ORDEM[a.diaSemana as DiaSemana] - DIA_ORDEM[b.diaSemana as DiaSemana];
    if (diffDia !== 0) return diffDia;

    const diffHora = a.horaInicio.localeCompare(b.horaInicio);
    if (diffHora !== 0) return diffHora;

    return a.ordem - b.ordem;
  });

  const hoje = getDiaAtualSP();

  const week = Object.keys(DIA_LABEL).map((dia) => ({
    key: dia,
    label: DIA_LABEL[dia as DiaSemana],
    items: sorted.filter((item) => item.diaSemana === dia),
  }));

  return NextResponse.json({
    todayKey: hoje,
    todayLabel: DIA_LABEL[hoje],
    todayItems: sorted.filter((item) => item.diaSemana === hoje),
    week,
  });
}
