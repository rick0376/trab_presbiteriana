//src/app/api/igreja-publico/[slug]/historia/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const igreja = await prisma.igreja.findUnique({
    where: { slug },
    include: {
      historia: {
        include: {
          marcos: {
            orderBy: { ordem: "asc" },
          },
        },
      },
    },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada." },
      { status: 404 },
    );
  }

  if (!igreja.historia) {
    return NextResponse.json({
      igreja: {
        nome: igreja.nome,
        slug: igreja.slug,
      },
      historia: null,
    });
  }

  return NextResponse.json({
    igreja: {
      nome: igreja.nome,
      slug: igreja.slug,
    },
    historia: igreja.historia,
  });
}
