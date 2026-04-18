//src/app/api/historia-igreja/route.ts

import { NextResponse } from "next/server";
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

function parseJsonArray(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function PUT(req: Request) {
  const user = await requireUser();
  await requirePermission("historia_igreja", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const formData = await req.formData();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const subtitulo = String(formData.get("subtitulo") ?? "").trim();
  const texto = String(formData.get("texto") ?? "").trim();
  const removeImagem =
    String(formData.get("removeImagem") ?? "false") === "true";
  const marcos = parseJsonArray(formData.get("marcos"));

  if (!titulo) {
    return jsonError("O título da história é obrigatório.");
  }

  const atual = await prisma.historiaIgreja.findUnique({
    where: { igrejaId },
    include: { marcos: true },
  });

  let imagemCapaUrl = atual?.imagemCapaUrl ?? null;
  let imagemCapaPublicId = atual?.imagemCapaPublicId ?? null;

  if (removeImagem && imagemCapaPublicId) {
    await destroyCloudinaryAssetAndCleanup(imagemCapaPublicId);
    imagemCapaUrl = null;
    imagemCapaPublicId = null;
  }

  const imagemFile = formData.get("imagemCapa");
  if (
    imagemFile &&
    typeof imagemFile === "object" &&
    "arrayBuffer" in imagemFile &&
    imagemFile.size > 0
  ) {
    const arrayBuffer = await imagemFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/historia/${igrejaId}/capa`,
      transformation: [
        { width: 1800, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    if (imagemCapaPublicId) {
      await destroyCloudinaryAssetAndCleanup(imagemCapaPublicId);
    }

    imagemCapaUrl = uploaded.url;
    imagemCapaPublicId = uploaded.publicId;
  }

  const saved = await prisma.historiaIgreja.upsert({
    where: { igrejaId },
    create: {
      igrejaId,
      titulo,
      subtitulo: subtitulo || null,
      texto: texto || null,
      imagemCapaUrl,
      imagemCapaPublicId,
      marcos: {
        create: marcos.map((item: any, i: number) => ({
          ano: String(item?.ano ?? "").trim(),
          titulo: String(item?.titulo ?? "").trim(),
          descricao: String(item?.descricao ?? "").trim() || null,
          ordem: Number(item?.ordem ?? i + 1),
        })),
      },
    },
    update: {
      titulo,
      subtitulo: subtitulo || null,
      texto: texto || null,
      imagemCapaUrl,
      imagemCapaPublicId,
      marcos: {
        deleteMany: {},
        create: marcos.map((item: any, i: number) => ({
          ano: String(item?.ano ?? "").trim(),
          titulo: String(item?.titulo ?? "").trim(),
          descricao: String(item?.descricao ?? "").trim() || null,
          ordem: Number(item?.ordem ?? i + 1),
        })),
      },
    },
    include: {
      marcos: {
        orderBy: { ordem: "asc" },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    item: saved,
  });
}
