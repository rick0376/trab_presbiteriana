//src/app/api/hinarios/musica/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

export async function PATCH(req: NextRequest) {
  await requirePermission("hinarios", "editar");

  const id = getIdFromUrl(req);
  const body = await req.json().catch(() => ({}));

  const titulo = String(body?.titulo ?? "").trim();
  const letra = String(body?.letra ?? "").trim();
  const ordem = Number(body?.ordem ?? 0);
  const ativo = body?.ativo !== false;

  if (!titulo) return jsonError("Informe o título da música.");
  if (!letra) return jsonError("Informe a letra da música.");

  const exists = await prisma.departamentoMusica.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return jsonError("Música não encontrada.", 404);
  }

  const musica = await prisma.departamentoMusica.update({
    where: { id },
    data: {
      titulo,
      letra,
      ordem: Number.isFinite(ordem) ? ordem : 0,
      ativo,
    },
  });

  return NextResponse.json({ ok: true, item: musica });
}

export async function DELETE(req: NextRequest) {
  await requirePermission("hinarios", "deletar");

  const id = getIdFromUrl(req);

  const exists = await prisma.departamentoMusica.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!exists) {
    return jsonError("Música não encontrada.", 404);
  }

  await prisma.departamentoMusica.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
