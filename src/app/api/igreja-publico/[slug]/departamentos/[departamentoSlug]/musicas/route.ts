//src/app/api/igreja-publico/[slug]/departamentos/[departamentoSlug]/musicas/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string; departamentoSlug: string }>;
  },
) {
  const { slug, departamentoSlug } = await params;

  const igreja = await prisma.igreja.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada." },
      { status: 404 },
    );
  }

  const departamento = await prisma.departamento.findFirst({
    where: {
      igrejaId: igreja.id,
      slug: departamentoSlug,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      slug: true,
      musicas: {
        where: { ativo: true },
        select: {
          id: true,
          titulo: true,
          letra: true,
          ordem: true,
        },
        orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
      },
    },
  });

  if (!departamento) {
    return NextResponse.json(
      { error: "Departamento não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    departamento: {
      id: departamento.id,
      nome: departamento.nome,
      slug: departamento.slug,
    },
    items: departamento.musicas,
  });
}
