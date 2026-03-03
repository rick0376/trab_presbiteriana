import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

function resolveIgrejaId(user: any, req: Request) {
  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId");
  return user.role === "SUPERADMIN" ? igrejaIdParam : user.igrejaId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePermission("cronograma_anual", "editar");
  const igrejaId = resolveIgrejaId(user, req);
  const { id } = await params;

  if (!igrejaId) {
    return NextResponse.json({ error: "Igreja não definida" }, { status: 400 });
  }

  const item = await prisma.cronogramaAnual.findUnique({
    where: { id },
    select: { igrejaId: true },
  });

  if (!item || item.igrejaId !== igrejaId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const titulo = String(body?.titulo ?? "").trim();
  const dataStr = String(body?.data ?? "").trim();

  if (!titulo) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
  }
  if (!dataStr) {
    return NextResponse.json({ error: "Data obrigatória" }, { status: 400 });
  }

  const data = new Date(`${dataStr}T00:00:00`);
  if (Number.isNaN(+data)) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  await prisma.cronogramaAnual.update({
    where: { id },
    data: {
      titulo,
      data,
      ordem: Number(body?.ordem ?? 0),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePermission("cronograma_anual", "editar");
  const igrejaId = resolveIgrejaId(user, req);
  const { id } = await params;

  if (!igrejaId) {
    return NextResponse.json({ error: "Igreja não definida" }, { status: 400 });
  }

  const item = await prisma.cronogramaAnual.findUnique({
    where: { id },
    select: { igrejaId: true },
  });

  if (!item || item.igrejaId !== igrejaId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.cronogramaAnual.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
