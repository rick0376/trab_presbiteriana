// /api/igreja-publico/[slug]/route.ts

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
      publico: {
        include: {
          horarios: {
            orderBy: { ordem: "asc" },
          },
          cronograma: {
            orderBy: [{ dia: "asc" }, { ordem: "asc" }],
          },
        },
      },
    },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada" },
      { status: 404 },
    );
  }

  if (!igreja.publico) {
    return NextResponse.json({
      bannerSubtitle: null,
      whatsappUrl: null,
      instagramUrl: null,
      facebookUrl: null,
      endereco: null,
      horarios: [],
      cronograma: [],
    });
  }

  return NextResponse.json({
    bannerSubtitle: igreja.publico.bannerSubtitle,
    whatsappUrl: igreja.publico.whatsappUrl,
    instagramUrl: igreja.publico.instagramUrl,
    facebookUrl: igreja.publico.facebookUrl,
    endereco: igreja.publico.endereco,
    horarios: igreja.publico.horarios,
    cronograma: igreja.publico.cronograma,
  });
}
