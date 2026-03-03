//api/backup/automatico-global/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_INTERVALOS = new Set(["diario", "semanal", "mensal"]);
const ALLOWED_MODOS = new Set(["todas", "igreja"]);
const GLOBAL_CONFIG_ID = "backup-global-default";

function isHoraValida(hora: unknown) {
  return typeof hora === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const config = await prisma.backupGlobalConfig.findUnique({
    where: { id: GLOBAL_CONFIG_ID },
  });

  return NextResponse.json({
    ativo: config?.ativo ?? false,
    intervalo: config?.intervalo ?? "diario",
    hora: config?.hora ?? "02:00",
    modo: config?.modo ?? "todas",
    igrejaId: config?.igrejaId ?? "",
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const intervalo = ALLOWED_INTERVALOS.has(body?.intervalo)
    ? body.intervalo
    : "diario";

  const hora = isHoraValida(body?.hora) ? body.hora : "02:00";

  const modo = ALLOWED_MODOS.has(body?.modo) ? body.modo : "todas";

  let igrejaId: string | null = null;

  if (modo === "igreja") {
    igrejaId = typeof body?.igrejaId === "string" ? body.igrejaId : null;

    if (!igrejaId) {
      return NextResponse.json(
        { error: "igrejaId é obrigatório no modo igreja" },
        { status: 400 },
      );
    }

    const igreja = await prisma.igreja.findUnique({
      where: { id: igrejaId },
      select: { id: true },
    });

    if (!igreja) {
      return NextResponse.json(
        { error: "Igreja não encontrada" },
        { status: 404 },
      );
    }
  }

  await prisma.backupGlobalConfig.upsert({
    where: { id: GLOBAL_CONFIG_ID },
    create: {
      id: GLOBAL_CONFIG_ID,
      ativo: !!body?.ativo,
      intervalo,
      hora,
      modo,
      igrejaId,
    },
    update: {
      ativo: !!body?.ativo,
      intervalo,
      hora,
      modo,
      igrejaId,
    },
  });

  return NextResponse.json({ message: "Configuração global salva" });
}
