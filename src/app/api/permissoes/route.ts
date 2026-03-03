// src/app/api/permissoes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();

    const userId = req.nextUrl.searchParams.get("userId") ?? me.id;

    // SUPERADMIN pode consultar qualquer um
    if (me.role !== "SUPERADMIN" && userId !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const permissoes = await prisma.permissao.findMany({
      where: { userId },
      select: {
        id: true,
        recurso: true,
        ler: true,
        criar: true,
        editar: true,
        deletar: true,
        compartilhar: true,
      },
    });

    return NextResponse.json(permissoes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar permissões" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();

    if (me.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    const { userId, recurso, ler, criar, editar, deletar, compartilhar } = body;

    if (!userId || !recurso) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const permissao = await prisma.permissao.upsert({
      where: {
        userId_recurso: { userId, recurso },
      },
      update: {
        ler: !!ler,
        criar: !!criar,
        editar: !!editar,
        deletar: !!deletar,
        compartilhar: !!compartilhar,
      },
      create: {
        userId,
        recurso,
        ler: !!ler,
        criar: !!criar,
        editar: !!editar,
        deletar: !!deletar,
        compartilhar: !!compartilhar,
      },
    });

    return NextResponse.json(permissao);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar permissão" },
      { status: 500 },
    );
  }
}
