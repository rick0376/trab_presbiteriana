//src/app/api/eventos/imagens/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { destroyCloudinaryAssetAndCleanup } from "@/lib/cloudinary-upload";

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

async function safeDestroy(publicId?: string | null) {
  if (!publicId) return;

  try {
    await destroyCloudinaryAssetAndCleanup(publicId);
  } catch {
    console.warn("Não foi possível remover imagem do Cloudinary:", publicId);
  }
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

  const existing = await prisma.eventoImagem.findFirst({
    where: {
      id,
      evento: {
        igrejaId,
      },
    },
  });

  if (!existing) {
    return jsonError("Foto não encontrada.", 404);
  }

  await safeDestroy(existing.publicId);

  await prisma.eventoImagem.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({ ok: true });
}
