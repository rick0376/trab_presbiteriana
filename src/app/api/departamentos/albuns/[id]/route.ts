//src/app/api/departamentos/albuns/[id]/route.ts

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

function parseBoolean(value: FormDataEntryValue | null, fallback = true) {
  if (value === null) return fallback;
  return String(value) === "true";
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
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

  const existing = await prisma.departamentoAlbum.findFirst({
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

  if (!existing) {
    return jsonError("Álbum não encontrado.", 404);
  }

  const formData = await req.formData();

  const departamentoId = String(formData.get("departamentoId") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const dataEvento = parseDate(formData.get("dataEvento"));
  const ordem = parseNumber(formData.get("ordem"), 0);
  const ativo = parseBoolean(formData.get("ativo"), true);
  const removeCapa = parseBoolean(formData.get("removeCapa"), false);

  if (!departamentoId) {
    return jsonError("Departamento é obrigatório.");
  }

  if (!titulo) {
    return jsonError("Título do álbum é obrigatório.");
  }

  const departamento = await prisma.departamento.findFirst({
    where: {
      id: departamentoId,
      igrejaId,
    },
    select: {
      id: true,
      nome: true,
      slug: true,
    },
  });

  if (!departamento) {
    return jsonError("Departamento não encontrado.", 404);
  }

  let capaUrl = existing.capaUrl;
  let capaPublicId = existing.capaPublicId;

  if (removeCapa && capaPublicId) {
    await destroyCloudinaryAssetAndCleanup(capaPublicId);
    capaUrl = null;
    capaPublicId = null;
  }

  const capaFile = formData.get("capa");
  if (
    capaFile &&
    typeof capaFile === "object" &&
    "arrayBuffer" in capaFile &&
    capaFile.size > 0
  ) {
    const arrayBuffer = await capaFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/departamentos/${departamento.id}/albuns/capas`,
      transformation: [
        { width: 1800, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    if (capaPublicId) {
      await destroyCloudinaryAssetAndCleanup(capaPublicId);
    }

    capaUrl = uploaded.url;
    capaPublicId = uploaded.publicId;
  }

  const updated = await prisma.departamentoAlbum.update({
    where: { id: existing.id },
    data: {
      departamentoId: departamento.id,
      titulo,
      descricao: descricao || null,
      dataEvento,
      capaUrl,
      capaPublicId,
      ordem,
      ativo,
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

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("departamentos_albuns", "deletar");

  const id = getIdFromUrl(req);
  const { searchParams } = new URL(req.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const existing = await prisma.departamentoAlbum.findFirst({
    where: {
      id,
      departamento: {
        igrejaId,
      },
    },
    include: {
      imagens: true,
    },
  });

  if (!existing) {
    return jsonError("Álbum não encontrado.", 404);
  }

  if (existing.capaPublicId) {
    await destroyCloudinaryAssetAndCleanup(existing.capaPublicId);
  }

  for (const img of existing.imagens) {
    if (img.publicId) {
      await destroyCloudinaryAssetAndCleanup(img.publicId);
    }
  }

  await prisma.departamentoAlbum.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ ok: true });
}
