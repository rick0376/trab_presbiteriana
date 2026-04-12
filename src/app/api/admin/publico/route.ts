//src/app/api/igreja-publico/[slug]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import {
  destroyCloudinaryAssetAndCleanup,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseJsonArray(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") return undefined;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function PUT(req: Request) {
  const user = await requirePermission("publico", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId");

  const igrejaId =
    user.role === "SUPERADMIN"
      ? (igrejaIdParam ?? undefined)
      : (user.igrejaId ?? undefined);

  if (!igrejaId) {
    return NextResponse.json({ error: "Igreja não definida" }, { status: 400 });
  }

  const formData = await req.formData();

  const igrejaNome = String(formData.get("igrejaNome") ?? "").trim();
  const bannerSubtitle = String(formData.get("bannerSubtitle") ?? "").trim();
  const heroSlogan = String(formData.get("heroSlogan") ?? "").trim();
  const boasVindasTexto = String(formData.get("boasVindasTexto") ?? "").trim();
  const pastorNome = String(formData.get("pastorNome") ?? "").trim();
  const pastorCargo = String(formData.get("pastorCargo") ?? "").trim();
  const pastorSubtitle = String(formData.get("pastorSubtitle") ?? "").trim();
  const pastorMensagem = String(formData.get("pastorMensagem") ?? "").trim();
  const whatsappUrl = String(formData.get("whatsappUrl") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const telefonePublico = String(formData.get("telefonePublico") ?? "").trim();
  const emailPublico = String(formData.get("emailPublico") ?? "").trim();
  const footerDescricao = String(formData.get("footerDescricao") ?? "").trim();

  const removePastorImage =
    String(formData.get("removePastorImage") ?? "false") === "true";
  const removeHeroBackgroundImage =
    String(formData.get("removeHeroBackgroundImage") ?? "false") === "true";

  const pastorImageFile = formData.get("pastorImage");
  const heroBackgroundImageFile = formData.get("heroBackgroundImage");

  const horarios = parseJsonArray(formData.get("horarios")) ?? [];
  const cronograma = parseJsonArray(formData.get("cronograma"));

  if (!igrejaNome) {
    return NextResponse.json(
      { error: "O nome da igreja é obrigatório." },
      { status: 400 },
    );
  }

  const currentPublico = await prisma.igrejaPublico.findUnique({
    where: { igrejaId },
    select: {
      id: true,
      pastorImageUrl: true,
      pastorImagePublicId: true,
      heroBackgroundImageUrl: true,
      heroBackgroundImagePublicId: true,
    },
  });

  let pastorImageUrl = currentPublico?.pastorImageUrl ?? null;
  let pastorImagePublicId = currentPublico?.pastorImagePublicId ?? null;

  let heroBackgroundImageUrl = currentPublico?.heroBackgroundImageUrl ?? null;
  let heroBackgroundImagePublicId =
    currentPublico?.heroBackgroundImagePublicId ?? null;

  if (removePastorImage && pastorImagePublicId) {
    await destroyCloudinaryAssetAndCleanup(pastorImagePublicId);
    pastorImageUrl = null;
    pastorImagePublicId = null;
  }

  if (
    pastorImageFile &&
    typeof pastorImageFile === "object" &&
    "arrayBuffer" in pastorImageFile &&
    pastorImageFile.size > 0
  ) {
    const arrayBuffer = await pastorImageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/publico/${igrejaId}/pastor_principal`,
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    if (pastorImagePublicId) {
      await destroyCloudinaryAssetAndCleanup(pastorImagePublicId);
    }

    pastorImageUrl = uploaded.url;
    pastorImagePublicId = uploaded.publicId;
  }

  if (removeHeroBackgroundImage && heroBackgroundImagePublicId) {
    await destroyCloudinaryAssetAndCleanup(heroBackgroundImagePublicId);
    heroBackgroundImageUrl = null;
    heroBackgroundImagePublicId = null;
  }

  if (
    heroBackgroundImageFile &&
    typeof heroBackgroundImageFile === "object" &&
    "arrayBuffer" in heroBackgroundImageFile &&
    heroBackgroundImageFile.size > 0
  ) {
    const arrayBuffer = await heroBackgroundImageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadBufferToCloudinary({
      buffer,
      folder: `saas_igreja/publico/${igrejaId}/hero_fundo`,
      transformation: [
        { width: 1800, height: 1200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    if (heroBackgroundImagePublicId) {
      await destroyCloudinaryAssetAndCleanup(heroBackgroundImagePublicId);
    }

    heroBackgroundImageUrl = uploaded.url;
    heroBackgroundImagePublicId = uploaded.publicId;
  }

  await prisma.igreja.update({
    where: { id: igrejaId },
    data: { nome: igrejaNome },
  });

  const result = await prisma.igrejaPublico.upsert({
    where: { igrejaId },
    create: {
      igrejaId,
      bannerSubtitle,
      heroSlogan,
      boasVindasTexto,
      pastorNome,
      pastorCargo,
      pastorSubtitle,
      pastorMensagem,
      pastorImageUrl,
      pastorImagePublicId,
      heroBackgroundImageUrl,
      heroBackgroundImagePublicId,
      whatsappUrl,
      instagramUrl,
      facebookUrl,
      telefonePublico: telefonePublico || null,
      emailPublico: emailPublico || null,
      footerDescricao: footerDescricao || null,
      endereco,
      horarios: {
        create: horarios.map((h: any, i: number) => ({
          texto: String(h.texto ?? "").trim(),
          diaLabel: String(h.diaLabel ?? "").trim() || null,
          hora: String(h.hora ?? "").trim() || null,
          tituloCard: String(h.tituloCard ?? "").trim() || null,
          descricaoCard: String(h.descricaoCard ?? "").trim() || null,
          ordem: Number(h.ordem ?? i + 1),
        })),
      },
      ...(Array.isArray(cronograma)
        ? {
            cronograma: {
              create: cronograma.map((c: any, i: number) => ({
                dia: c.dia,
                hora: String(c.hora ?? "").trim(),
                titulo: String(c.titulo ?? "").trim(),
                ordem: Number(c.ordem ?? i + 1),
              })),
            },
          }
        : {}),
    },
    update: {
      bannerSubtitle,
      heroSlogan,
      boasVindasTexto,
      pastorNome,
      pastorCargo,
      pastorSubtitle,
      pastorMensagem,
      pastorImageUrl,
      pastorImagePublicId,
      heroBackgroundImageUrl,
      heroBackgroundImagePublicId,
      whatsappUrl,
      instagramUrl,
      facebookUrl,
      telefonePublico: telefonePublico || null,
      emailPublico: emailPublico || null,
      footerDescricao: footerDescricao || null,
      endereco,
      horarios: {
        deleteMany: {},
        create: horarios.map((h: any, i: number) => ({
          texto: String(h.texto ?? "").trim(),
          diaLabel: String(h.diaLabel ?? "").trim() || null,
          hora: String(h.hora ?? "").trim() || null,
          tituloCard: String(h.tituloCard ?? "").trim() || null,
          descricaoCard: String(h.descricaoCard ?? "").trim() || null,
          ordem: Number(h.ordem ?? i + 1),
        })),
      },
      ...(Array.isArray(cronograma)
        ? {
            cronograma: {
              deleteMany: {},
              create: cronograma.map((c: any, i: number) => ({
                dia: c.dia,
                hora: String(c.hora ?? "").trim(),
                titulo: String(c.titulo ?? "").trim(),
                ordem: Number(c.ordem ?? i + 1),
              })),
            },
          }
        : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    id: result.id,
    pastorImageUrl,
    heroBackgroundImageUrl,
  });
}
