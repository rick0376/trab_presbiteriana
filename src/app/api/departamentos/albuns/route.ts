//src/app/api/departamentos/albuns/route.ts

import { NextResponse } from "next/server";
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

export async function GET(req: Request) {
  const user = await requireUser();
  await requirePermission("departamentos_albuns", "ler");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const items = await prisma.departamentoAlbum.findMany({
    where: {
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
      imagens: {
        select: {
          id: true,
          imageUrl: true,
          ordem: true,
          createdAt: true,
        },
        orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
      _count: {
        select: {
          imagens: true,
        },
      },
    },
    orderBy: [
      { departamentoId: "asc" },
      { ordem: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  await requirePermission("departamentos_albuns", "criar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const formData = await req.formData();

  const departamentoId = String(formData.get("departamentoId") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const dataEvento = parseDate(formData.get("dataEvento"));
  const ordem = parseNumber(formData.get("ordem"), 0);
  const ativo = parseBoolean(formData.get("ativo"), true);

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
      slug: true,
      nome: true,
    },
  });

  if (!departamento) {
    return jsonError("Departamento não encontrado.", 404);
  }

  let capaUrl: string | null = null;
  let capaPublicId: string | null = null;

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

    capaUrl = uploaded.url;
    capaPublicId = uploaded.publicId;
  }

  const created = await prisma.departamentoAlbum.create({
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

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
