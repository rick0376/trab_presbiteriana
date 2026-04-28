//src/app/api/radio/banners/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { uploadBufferToCloudinary } from "@/lib/cloudinary-upload";

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

export async function GET() {
  const banners = await prisma.radioBanner.findMany({
    where: { ativo: true },
    orderBy: [{ posicao: "asc" }, { ordem: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  await requirePermission("publico", "editar");

  const formData = await req.formData();

  const titulo = getText(formData, "titulo");
  const posicao = getText(formData, "posicao");
  const linkUrl = getText(formData, "linkUrl");
  const ordem = getNumber(formData, "ordem", 0);
  const ativo = getText(formData, "ativo") !== "false";
  const file = formData.get("imagem");

  if (!titulo) return jsonError("Informe o título do banner.");
  if (!posicao) return jsonError("Informe a posição do banner.");

  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return jsonError("Selecione uma imagem para o banner.");
  }

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

  const banner = await prisma.radioBanner.create({
    data: {
      titulo,
      posicao,
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
      linkUrl: linkUrl || null,
      ordem,
      ativo,
    },
  });

  return NextResponse.json({ ok: true, banner });
}
