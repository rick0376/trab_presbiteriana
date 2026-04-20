//src/app/api/departamentos/albuns/imagens/[id]/route.ts

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

function parseNumber(value: FormDataEntryValue | null, fallback = 1) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("departamentos_albuns", "editar");

  const id = getIdFromUrl(req);
  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const existing = await prisma.departamentoAlbumImagem.findFirst({
    where: {
      id,
      album: {
        departamento: {
          igrejaId,
        },
      },
    },
    include: {
      album: {
        include: {
          departamento: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!existing) {
    return jsonError("Imagem não encontrada.", 404);
  }

  const formData = await req.formData();
  const ordem = parseNumber(formData.get("ordem"), existing.ordem);
  const novaImagem = formData.get("imagem");

  let imageUrl = existing.imageUrl;
  let publicId = existing.publicId;

  if (
    novaImagem &&
    typeof novaImagem === "object" &&
    "arrayBuffer" in novaImagem &&
    novaImagem.size > 0
  ) {
    const arrayBuffer = await novaImagem.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/departamentos/${existing.album.departamento.id}/albuns/${existing.album.id}/imagens`,
      transformation: [
        { width: 1800, height: 1800, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    if (publicId) {
      await destroyCloudinaryAssetAndCleanup(publicId);
    }

    imageUrl = uploaded.url;
    publicId = uploaded.publicId;
  }

  const updated = await prisma.departamentoAlbumImagem.update({
    where: { id: existing.id },
    data: {
      ordem,
      imageUrl,
      publicId,
    },
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("departamentos_albuns", "deletar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const id = getIdFromUrl(req);

  const existing = await prisma.departamentoAlbumImagem.findFirst({
    where: {
      id,
      album: {
        departamento: {
          igrejaId,
        },
      },
    },
  });

  if (!existing) {
    return jsonError("Imagem não encontrada.", 404);
  }

  if (existing.publicId) {
    await destroyCloudinaryAssetAndCleanup(existing.publicId);
  }

  await prisma.departamentoAlbumImagem.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ ok: true });
}
