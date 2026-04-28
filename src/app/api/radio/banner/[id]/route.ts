//src/app/api/radio/banners/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key) ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission("publico", "editar");

  const { id } = await params;
  const formData = await req.formData();

  const atual = await prisma.radioBanner.findUnique({
    where: { id },
  });

  if (!atual) {
    return jsonError("Banner não encontrado.", 404);
  }

  const titulo = getText(formData, "titulo");
  const posicao = getText(formData, "posicao");
  const linkUrl = getText(formData, "linkUrl");
  const ordem = getNumber(formData, "ordem", atual.ordem);
  const ativo = getText(formData, "ativo") !== "false";
  const file = formData.get("imagem");

  if (!titulo) return jsonError("Informe o título do banner.");
  if (!posicao) return jsonError("Informe a posição do banner.");

  let imageUrl = atual.imageUrl;
  let publicId = atual.publicId;

  if (
    file &&
    typeof file === "object" &&
    "arrayBuffer" in file &&
    file.size > 0
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/radio/banners/${posicao}`,
      transformation: [
        { width: 1600, height: 900, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    await destroyCloudinaryAssetAndCleanup(atual.publicId);

    imageUrl = uploaded.url;
    publicId = uploaded.publicId;
  }

  const banner = await prisma.radioBanner.update({
    where: { id },
    data: {
      titulo,
      posicao,
      imageUrl,
      publicId,
      linkUrl: linkUrl || null,
      ordem,
      ativo,
    },
  });

  return NextResponse.json({ ok: true, banner });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission("publico", "editar");

  const { id } = await params;

  const atual = await prisma.radioBanner.findUnique({
    where: { id },
  });

  if (!atual) {
    return jsonError("Banner não encontrado.", 404);
  }

  await prisma.radioBanner.delete({
    where: { id },
  });

  await destroyCloudinaryAssetAndCleanup(atual.publicId);

  return NextResponse.json({ ok: true });
}
