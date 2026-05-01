//src/app/api/hinarios/[departamentoId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getDepartamentoIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

export async function GET(req: NextRequest) {
  await requirePermission("hinarios", "ler");

  const departamentoId = getDepartamentoIdFromUrl(req);

  const departamento = await prisma.departamento.findUnique({
    where: { id: departamentoId },
    select: {
      id: true,
      nome: true,
      musicas: {
        orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
      },
    },
  });

  if (!departamento) {
    return jsonError("Departamento não encontrado.", 404);
  }

  return NextResponse.json({
    departamento,
    items: departamento.musicas,
  });
}

export async function POST(req: NextRequest) {
  await requirePermission("hinarios", "criar");

  const departamentoId = getDepartamentoIdFromUrl(req);
  const body = await req.json().catch(() => ({}));

  const titulo = String(body?.titulo ?? "").trim();
  const letra = String(body?.letra ?? "").trim();
  const playbackUrl = String(body?.playbackUrl ?? "").trim();
  const ordem = Number(body?.ordem ?? 0);
  const ativo = body?.ativo !== false;

  if (!titulo) return jsonError("Informe o título da música.");
  if (!letra) return jsonError("Informe a letra da música.");

  const departamento = await prisma.departamento.findUnique({
    where: { id: departamentoId },
    select: { id: true },
  });

  if (!departamento) {
    return jsonError("Departamento não encontrado.", 404);
  }

  const musica = await prisma.departamentoMusica.create({
    data: {
      departamentoId,
      titulo,
      letra,
      playbackUrl: playbackUrl || null,
      ordem: Number.isFinite(ordem) ? ordem : 0,
      ativo,
    },
  });

  return NextResponse.json({ ok: true, item: musica }, { status: 201 });
}
