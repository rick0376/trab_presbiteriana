// api/eventos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requirePermission("publico", "editar");

  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId")?.trim();

  const igrejaId = user.role === "SUPERADMIN" ? igrejaIdParam : user.igrejaId;

  if (!igrejaId) {
    return NextResponse.json({ eventos: [] });
  }

  const eventos = await prisma.evento.findMany({
    where: { igrejaId },
    select: {
      id: true,
      titulo: true,
      data: true,
      imagemUrl: true,
      tipo: true,
      responsavel: true,
      local: true,
      descricao: true,
    },
    orderBy: { data: "asc" },
  });

  return NextResponse.json({
    eventos: eventos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      data: e.data.toJSON(),
      imagemUrl: e.imagemUrl,
      tipo: e.tipo,
      responsavel: e.responsavel,
      local: e.local,
      descricao: e.descricao,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requirePermission("publico", "editar");

  const formData = await req.formData();

  const igrejaId =
    user.role === "SUPERADMIN"
      ? (formData.get("igrejaId") as string | null)
      : user.igrejaId;

  if (!igrejaId) {
    return NextResponse.json({ error: "Sem igreja" }, { status: 400 });
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataStr = String(formData.get("data") ?? "").trim();
  const file = formData.get("imagem");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const local = String(formData.get("local") ?? "").trim();
  const responsavel = String(formData.get("responsavel") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();

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

  let imagemUrl: string | null = null;
  let imagemPublicId: string | null = null;

  // Se tiver imagem, faz upload
  if (file && typeof file === "object" && "arrayBuffer" in file) {
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

  await prisma.evento.create({
    data: {
      igrejaId,
      titulo,
      data,
      criadoPor: user.id,
      imagemUrl,
      imagemPublicId,
      descricao: descricao || null,
      local: local || null,
      responsavel: responsavel || null,
      tipo: tipo || null,
    },
  });

  return NextResponse.json({ ok: true });
}
