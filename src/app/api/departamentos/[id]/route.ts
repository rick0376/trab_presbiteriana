//src/app/api/departamentos/[id]/route.ts

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

function parseJsonArray(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("departamentos", "editar");

  const id = getIdFromUrl(req);
  const { searchParams } = new URL(req.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const existing = await prisma.departamento.findFirst({
    where: { id, igrejaId },
    include: {
      responsaveis: true,
    },
  });

  if (!existing) {
    return jsonError("Departamento não encontrado.", 404);
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
  const removeCapa = parseBoolean(formData.get("removeCapa"), false);

  const responsaveis = parseJsonArray(formData.get("responsaveis"));

  if (!nome) {
    return jsonError("Nome do departamento é obrigatório.");
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
      folder: `saas_igreja/departamentos/${igrejaId}/${existing.slug}/capa`,
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

  const existingMap = new Map(existing.responsaveis.map((r) => [r.id, r]));
  const incomingIds = new Set(
    responsaveis.map((r: any) => String(r?.id ?? "").trim()).filter(Boolean),
  );

  for (const oldResp of existing.responsaveis) {
    if (!incomingIds.has(oldResp.id) && oldResp.fotoPublicId) {
      await destroyCloudinaryAssetAndCleanup(oldResp.fotoPublicId);
    }
  }

  const responsaveisCreate = [];

  for (let i = 0; i < responsaveis.length; i++) {
    const item = responsaveis[i];
    const membroId = String(item?.membroId ?? "").trim();
    if (!membroId) continue;

    const old = item?.id ? existingMap.get(String(item.id)) : null;

    let fotoUrl = old?.fotoUrl ?? null;
    let fotoPublicId = old?.fotoPublicId ?? null;

    if (item?.removeFoto === true && fotoPublicId) {
      await destroyCloudinaryAssetAndCleanup(fotoPublicId);
      fotoUrl = null;
      fotoPublicId = null;
    }

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
        folder: `saas_igreja/departamentos/${igrejaId}/${existing.slug}/responsaveis`,
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
        ],
      });

      if (fotoPublicId) {
        await destroyCloudinaryAssetAndCleanup(fotoPublicId);
      }

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

  const updated = await prisma.departamento.update({
    where: { id },
    data: {
      nome,
      descricao: descricao || null,
      capaUrl,
      capaPublicId,
      whatsappUrl: whatsappUrl || null,
      diasFuncionamento: diasFuncionamento || null,
      horarioFuncionamento: horarioFuncionamento || null,
      ordem,
      ativo,
      responsaveis: {
        deleteMany: {},
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

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("departamentos", "deletar");

  const id = getIdFromUrl(req);
  const { searchParams } = new URL(req.url);

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const existing = await prisma.departamento.findFirst({
    where: { id, igrejaId },
    include: {
      responsaveis: true,
    },
  });

  if (!existing) {
    return jsonError("Departamento não encontrado.", 404);
  }

  if (existing.capaPublicId) {
    await destroyCloudinaryAssetAndCleanup(existing.capaPublicId);
  }

  for (const resp of existing.responsaveis) {
    if (resp.fotoPublicId) {
      await destroyCloudinaryAssetAndCleanup(resp.fotoPublicId);
    }
  }

  await prisma.departamento.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
