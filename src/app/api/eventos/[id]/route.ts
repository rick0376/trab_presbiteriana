// api/eventos/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, context: any) {
  const user = await requirePermission("publico", "editar");

  // Aguardar os parâmetros da rota
  const { id } = await context.params;

  const { searchParams } = new URL(req.url);
  const igrejaIdQuery = searchParams.get("igrejaId")?.trim() || null;

  const igrejaId =
    user.role === "SUPERADMIN"
      ? (igrejaIdQuery ?? user.igrejaId)
      : user.igrejaId;

  if (!igrejaId) {
    return NextResponse.json(
      { error: "Igreja não definida." },
      { status: 400 },
    );
  }

  const evento = await prisma.evento.findUnique({
    where: { id },
    select: {
      id: true,
      igrejaId: true,
      imagemPublicId: true, // Isso para deletar a imagem anterior, se necessário
      imagemUrl: true, // Para ver a URL da imagem no banco
    },
  });

  if (!evento || evento.igrejaId !== igrejaId) {
    return NextResponse.json(
      { error: "Evento não encontrado." },
      { status: 404 },
    );
  }

  // Recuperar os dados enviados
  const formData = await req.formData();
  const titulo = formData.get("titulo")?.toString().trim() || "";
  const dataStr = formData.get("data")?.toString().trim() || "";
  const tipo = formData.get("tipo")?.toString().trim() || "";
  const responsavel = formData.get("responsavel")?.toString().trim() || "";
  const local = formData.get("local")?.toString().trim() || "";
  const descricao = formData.get("descricao")?.toString().trim() || "";
  const file = formData.get("imagem") as File | null;

  if (!titulo || !dataStr) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  function parseLocalDateTime(value: string) {
    const [date, time] = value.split("T");
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);

    // cria data UTC com mesmos números (sem deslocamento)
    return new Date(Date.UTC(y, m - 1, d, hh, mm));
  }

  const data = parseLocalDateTime(dataStr);

  let imagemUrl = evento.imagemUrl;
  let imagemPublicId = evento.imagemPublicId;

  if (file && file.size > 0) {
    if (imagemPublicId) {
      try {
        await cloudinary.uploader.destroy(imagemPublicId);
      } catch (err) {
        console.error("Erro ao deletar imagem antiga:", err);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `saas_igreja/eventos`,
            resource_type: "auto",
            transformation: [
              { width: 1000, height: 1000, crop: "limit" },
              { quality: "auto:good" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    imagemUrl = result.secure_url;
    imagemPublicId = result.public_id;
  }

  const updated = await prisma.evento.update({
    where: { id },
    data: {
      titulo,
      data,
      tipo,
      responsavel,
      local,
      descricao,
      imagemUrl,
      imagemPublicId,
    },
    select: { id: true, titulo: true, data: true },
  });

  return NextResponse.json({
    id: updated.id,
    titulo: updated.titulo,
    data: updated.data.toJSON(),
  });
}

export async function DELETE(req: Request, context: any) {
  const user = await requirePermission("publico", "editar");

  // Aguardar e obter os parâmetros da rota
  const { id } = await context.params;

  const { searchParams } = new URL(req.url);
  const igrejaIdQuery = searchParams.get("igrejaId")?.trim() || null;

  const igrejaId =
    user.role === "SUPERADMIN"
      ? (igrejaIdQuery ?? user.igrejaId)
      : user.igrejaId;

  if (!igrejaId) {
    return NextResponse.json(
      { error: "Igreja não definida." },
      { status: 400 },
    );
  }

  const evento = await prisma.evento.findUnique({
    where: { id },
    select: {
      id: true,
      igrejaId: true,
      imagemPublicId: true,
    },
  });

  if (!evento || evento.igrejaId !== igrejaId) {
    return NextResponse.json(
      { error: "Evento não encontrado." },
      { status: 404 },
    );
  }

  // 🔥 Deletar imagem do Cloudinary
  if (evento.imagemPublicId) {
    try {
      await cloudinary.uploader.destroy(evento.imagemPublicId);

      // 🔥 Verificar se a pasta ficou vazia
      const folder = evento.imagemPublicId.split("/").slice(0, -1).join("/");

      const resources = await cloudinary.api.resources({
        type: "upload",
        prefix: folder,
        max_results: 1,
      });

      if (resources.resources.length === 0) {
        await cloudinary.api.delete_folder(folder);
      }
    } catch (err) {
      console.error("Erro ao limpar Cloudinary:", err);
    }
  }

  // Deletar evento no banco
  await prisma.evento.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
