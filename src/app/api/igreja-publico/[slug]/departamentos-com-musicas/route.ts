//src/app/api/igreja-publico/[slug]/departamentos-com-musicas/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const igreja = await prisma.igreja.findUnique({
    where: { slug },
    select: { id: true, nome: true, slug: true },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada." },
      { status: 404 },
    );
  }

  const items = await prisma.departamento.findMany({
    where: {
      igrejaId: igreja.id,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      slug: true,
      descricao: true,
      capaUrl: true,
      diasFuncionamento: true,
      horarioFuncionamento: true,
      responsaveis: {
        where: { ativo: true },
        include: {
          membro: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              numeroSequencial: true,
            },
          },
        },
        orderBy: { ordem: "asc" },
      },
      musicas: {
        where: { ativo: true },
        select: {
          id: true,
          titulo: true,
          ordem: true,
        },
        orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
      },
    },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json({
    igreja: {
      id: igreja.id,
      nome: igreja.nome,
      slug: igreja.slug,
    },
    items,
  });
}
