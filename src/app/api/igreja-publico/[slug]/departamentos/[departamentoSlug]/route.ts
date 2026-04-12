//src/app/api/igreja-publico/[slug]/departamentos/[departamentoSlug]/route.ts

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
    select: { id: true, nome: true, slug: true },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada." },
      { status: 404 },
    );
  }

  const item = await prisma.departamento.findFirst({
    where: {
      igrejaId: igreja.id,
      slug: departamentoSlug,
      ativo: true,
    },
    include: {
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
      igreja: {
        select: {
          nome: true,
          slug: true,
          publico: {
            select: {
              whatsappUrl: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Departamento não encontrado." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    item,
  });
}
