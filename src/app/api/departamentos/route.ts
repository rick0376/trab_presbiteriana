//src/app/api/departamentos/route.ts

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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseBoolean(value: FormDataEntryValue | null, fallback = true) {
  if (value === null) return fallback;
  return String(value) === "true";
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value ?? fallback);
  return Number.isFinite(n) ? n : fallback;
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

export async function GET(req: Request) {
  const user = await requireUser();
  await requirePermission("departamentos", "ler");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const items = await prisma.departamento.findMany({
    where: { igrejaId },
    include: {
      responsaveis: {
        include: {
          membro: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              numeroSequencial: true,
            },
          },
        },
        orderBy: { ordem: "asc" },
      },
    },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  await requirePermission("departamentos", "criar");

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const formData = await req.formData();

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const whatsappUrl = String(formData.get("whatsappUrl") ?? "").trim();
  const diasFuncionamento = String(
    formData.get("diasFuncionamento") ?? "",
  ).trim();
  const horarioFuncionamento = String(
    formData.get("horarioFuncionamento") ?? "",
  ).trim();
  const ordem = parseNumber(formData.get("ordem"), 0);
  const ativo = parseBoolean(formData.get("ativo"), true);

  const responsaveis = parseJsonArray(formData.get("responsaveis"));

  if (!nome) {
    return jsonError("Nome do departamento é obrigatório.");
  }

  const slugBase = slugify(nome);

  let slugFinal = slugBase;
  let count = 1;

  while (
    await prisma.departamento.findFirst({
      where: { igrejaId, slug: slugFinal },
      select: { id: true },
    })
  ) {
    count += 1;
    slugFinal = `${slugBase}-${count}`;
  }

  const membroIds = responsaveis
    .map((r: any) => String(r?.membroId ?? "").trim())
    .filter(Boolean);

  if (membroIds.length > 0) {
    const membrosValidos = await prisma.membro.findMany({
      where: {
        igrejaId,
        ativo: true,
        id: { in: membroIds },
      },
      select: { id: true },
    });

    const validIds = new Set(membrosValidos.map((m) => m.id));

    for (const membroId of membroIds) {
      if (!validIds.has(membroId)) {
        return jsonError(
          "Um ou mais responsáveis não pertencem aos membros cadastrados.",
        );
      }
    }
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
      folder: `saas_igreja/departamentos/${igrejaId}/${slugFinal}/capa`,
      transformation: [
        { width: 1800, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    capaUrl = uploaded.url;
    capaPublicId = uploaded.publicId;
  }

  const responsaveisCreate = [];

  for (let i = 0; i < responsaveis.length; i++) {
    const item = responsaveis[i];

    const membroId = String(item?.membroId ?? "").trim();
    if (!membroId) continue;

    let fotoUrl: string | null = null;
    let fotoPublicId: string | null = null;

    const fotoFile = formData.get(`responsavelFoto_${i}`);
    if (
      fotoFile &&
      typeof fotoFile === "object" &&
      "arrayBuffer" in fotoFile &&
      fotoFile.size > 0
    ) {
      const arrayBuffer = await fotoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await uploadBufferToCloudinary({
        buffer,
        folder: `saas_igreja/departamentos/${igrejaId}/${slugFinal}/responsaveis`,
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
        ],
      });

      fotoUrl = uploaded.url;
      fotoPublicId = uploaded.publicId;
    }

    responsaveisCreate.push({
      membroId,
      cargoTitulo: String(item?.cargoTitulo ?? "").trim() || "Responsável",
      bio: String(item?.bio ?? "").trim() || null,
      fotoUrl,
      fotoPublicId,
      ordem: Number(item?.ordem ?? i + 1),
      ativo: item?.ativo !== false,
    });
  }

  const created = await prisma.departamento.create({
    data: {
      igrejaId,
      nome,
      slug: slugFinal,
      descricao: descricao || null,
      capaUrl,
      capaPublicId,
      whatsappUrl: whatsappUrl || null,
      diasFuncionamento: diasFuncionamento || null,
      horarioFuncionamento: horarioFuncionamento || null,
      ordem,
      ativo,
      responsaveis: {
        create: responsaveisCreate,
      },
    },
    include: {
      responsaveis: {
        include: {
          membro: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              numeroSequencial: true,
            },
          },
        },
        orderBy: { ordem: "asc" },
      },
    },
  });

  return NextResponse.json({ ok: true, item: created }, { status: 201 });
}
