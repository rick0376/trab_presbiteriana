//src/app/api/departamentos/albuns/[albumId]/imagens/route.ts

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

  const album = await prisma.departamentoAlbum.findFirst({
    where: {
      id,
      departamento: {
        igrejaId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!album) {
    return jsonError("Álbum não encontrado.", 404);
  }

  const items = await prisma.departamentoAlbumImagem.findMany({
    where: { albumId: album.id },
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

  const album = await prisma.departamentoAlbum.findFirst({
    where: {
      id,
      departamento: {
        igrejaId,
      },
    },
    include: {
      departamento: {
        select: {
          id: true,
          nome: true,
          slug: true,
        },
      },
    },
  });

  if (!album) {
    return jsonError("Álbum não encontrado.", 404);
  }

  const formData = await req.formData();
  const ordemInicial = parseNumber(formData.get("ordemInicial"), 1);
  const arquivos = formData.getAll("imagens");

  if (!arquivos.length) {
    return jsonError("Nenhuma imagem enviada.");
  }

  const existentes = await prisma.departamentoAlbumImagem.findMany({
    where: { albumId: album.id },
    select: { ordem: true },
    orderBy: { ordem: "desc" },
    take: 1,
  });

  const maiorOrdemExistente = existentes[0]?.ordem ?? 0;
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
      folder: `saas_igreja/departamentos/${album.departamento.id}/albuns/${album.id}/imagens`,
      transformation: [
        { width: 1800, height: 1800, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    createData.push({
      albumId: album.id,
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
      ordem: ordemBase + i,
    });
  }

  if (!createData.length) {
    return jsonError("Nenhuma imagem válida foi enviada.");
  }

  await prisma.departamentoAlbumImagem.createMany({
    data: createData,
  });

  return NextResponse.json({ ok: true });
}
