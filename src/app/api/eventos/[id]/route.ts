// api/eventos/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import {
  destroyCloudinaryAssetAndCleanup,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
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

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

async function safeDestroy(publicId?: string | null) {
  if (!publicId) return;

  try {
    await destroyCloudinaryAssetAndCleanup(publicId);
  } catch {
    console.warn("Não foi possível remover imagem do Cloudinary:", publicId);
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("publico", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const id = getIdFromUrl(req);

  const existing = await prisma.evento.findFirst({
    where: {
      id,
      igrejaId,
    },
  });

  if (!existing) {
    return jsonError("Evento não encontrado.", 404);
  }

  const formData = await req.formData();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = parseDate(formData.get("data"));
  const tipo = String(formData.get("tipo") ?? "").trim();
  const responsavel = String(formData.get("responsavel") ?? "").trim();
  const local = String(formData.get("local") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!titulo) {
    return jsonError("Título do evento é obrigatório.");
  }

  if (!data) {
    return jsonError("Data do evento é obrigatória.");
  }

  let imagemUrl = existing.imagemUrl;
  let imagemPublicId = existing.imagemPublicId;

  const imagem = formData.get("imagem");

  if (
    imagem &&
    typeof imagem === "object" &&
    "arrayBuffer" in imagem &&
    imagem.size > 0
  ) {
    const arrayBuffer = await imagem.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/eventos/${igrejaId}`,
      transformation: [
        { width: 1600, height: 1600, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    await safeDestroy(imagemPublicId);

    imagemUrl = uploaded.url;
    imagemPublicId = uploaded.publicId;
  }

  const updated = await prisma.evento.update({
    where: {
      id: existing.id,
    },
    data: {
      titulo,
      data,
      tipo: tipo || null,
      responsavel: responsavel || null,
      local: local || null,
      descricao: descricao || null,
      imagemUrl,
      imagemPublicId,
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("publico", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const id = getIdFromUrl(req);

  const existing = await prisma.evento.findFirst({
    where: {
      id,
      igrejaId,
    },
    include: {
      imagens: true,
    },
  });

  if (!existing) {
    return jsonError("Evento não encontrado.", 404);
  }

  await safeDestroy(existing.imagemPublicId);

  for (const img of existing.imagens ?? []) {
    await safeDestroy(img.publicId);
  }

  await prisma.eventoImagem.deleteMany({
    where: {
      eventoId: existing.id,
    },
  });

  await prisma.evento.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({ ok: true });
}
