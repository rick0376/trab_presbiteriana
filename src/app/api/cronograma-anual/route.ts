import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

function resolveIgrejaId(user: any, req: Request) {
  const { searchParams } = new URL(req.url);
  const igrejaIdParam = searchParams.get("igrejaId");
  return user.role === "SUPERADMIN" ? igrejaIdParam : user.igrejaId;
}

export async function GET(req: Request) {
  const user = await requirePermission("cronograma_anual", "ler");
  const igrejaId = resolveIgrejaId(user, req);

  if (!igrejaId) {
    return NextResponse.json({ error: "Igreja não definida" }, { status: 400 });
  }

  const items = await prisma.cronogramaAnual.findMany({
    where: { igrejaId },
    orderBy: [{ data: "asc" }, { ordem: "asc" }],
    select: { id: true, titulo: true, data: true },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await requirePermission("cronograma_anual", "editar");
  const igrejaId = resolveIgrejaId(user, req);

  if (!igrejaId) {
    return NextResponse.json({ error: "Igreja não definida" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const titulo = String(body?.titulo ?? "").trim();
  const dataStr = String(body?.data ?? "").trim(); // yyyy-mm-dd

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

  const created = await prisma.cronogramaAnual.create({
    data: {
      igrejaId,
      titulo,
      data,
      ordem: Number(body?.ordem ?? 0),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
