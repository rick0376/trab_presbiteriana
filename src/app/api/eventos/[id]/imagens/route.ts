//src/app/api/eventos/[id]/imagens/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { uploadBufferToCloudinary } from "@/lib/cloudinary-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function resolveIgrejaId(
  user: { id: string; role: string; igrejaId?: string | null },
  igrejaIdParam: string | null,
) {
  if (user.role === "SUPERADMIN") return igrejaIdParam || null;

  if (user.igrejaId) return user.igrejaId;

  const igreja = await prisma.igreja.findFirst({
    where: { adminId: user.id },
    select: { id: true },
  });

  return igreja?.id || null;
}

function parseNumber(value: FormDataEntryValue | null, fallback = 1) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  await requirePermission("publico", "ler");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: {
      id,
      igrejaId,
    },
    select: {
      id: true,
    },
  });

  if (!evento) {
    return jsonError("Evento não encontrado.", 404);
  }

  const items = await prisma.eventoImagem.findMany({
    where: { eventoId: evento.id },
    orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  await requirePermission("publico", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: {
      id,
      igrejaId,
    },
    select: {
      id: true,
      titulo: true,
    },
  });

  if (!evento) {
    return jsonError("Evento não encontrado.", 404);
  }

  const formData = await req.formData();
  const ordemInicial = parseNumber(formData.get("ordemInicial"), 1);
  const arquivos = formData.getAll("imagens");

  if (!arquivos.length) {
    return jsonError("Nenhuma imagem enviada.");
  }

  const existente = await prisma.eventoImagem.findMany({
    where: { eventoId: evento.id },
    select: { ordem: true },
    orderBy: { ordem: "desc" },
    take: 1,
  });

  const maiorOrdemExistente = existente[0]?.ordem ?? 0;
  const ordemBase = ordemInicial > 0 ? ordemInicial : maiorOrdemExistente + 1;

  const createData = [];

  for (let i = 0; i < arquivos.length; i++) {
    const file = arquivos[i];

    if (
      !file ||
      typeof file !== "object" ||
      !("arrayBuffer" in file) ||
      file.size <= 0
    ) {
      continue;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/eventos/${evento.id}/galeria`,
      transformation: [
        { width: 1800, height: 1800, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    createData.push({
      eventoId: evento.id,
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
      ordem: ordemBase + i,
    });
  }

  if (!createData.length) {
    return jsonError("Nenhuma imagem válida foi enviada.");
  }

  await prisma.eventoImagem.createMany({
    data: createData,
  });

  return NextResponse.json({ ok: true });
}
