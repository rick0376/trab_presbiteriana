//api/backup/automatico/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GLOBAL_CONFIG_ID = "backup-global-default";
const ALLOWED_INTERVALOS = new Set(["diario", "semanal", "mensal"]);
const ALLOWED_MODOS = new Set(["todas", "igreja"]);

function isHoraValida(hora: unknown) {
  return typeof hora === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

function igrejaDefault(igrejaId: string | null) {
  return {
    igrejaId,
    ativo: false,
    intervalo: "diario",
    hora: "02:00",
  };
}

function globalDefault() {
  return {
    ativo: false,
    intervalo: "diario",
    hora: "02:00",
    modo: "todas",
    igrejaId: "",
  };
}

export async function GET(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    const perm = await prisma.permissao.findUnique({
      where: {
        userId_recurso: {
          userId: user.id,
          recurso: "backup",
        },
      },
    });

    if (!perm?.editar) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
  }

  const isSuperadmin = user.role === "SUPERADMIN";

  let igrejas: Array<{ id: string; nome: string }> = [];
  let igrejaId: string | null = null;

  if (isSuperadmin) {
    igrejas = await prisma.igreja.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    const url = new URL(req.url);
    igrejaId = url.searchParams.get("igrejaId") || igrejas[0]?.id || null;
  } else {
    igrejaId = user.igrejaId ?? null;
  }

  const igrejaConfig = igrejaId
    ? await prisma.backupConfig.findUnique({
        where: { igrejaId },
      })
    : null;

  const globalConfig = isSuperadmin
    ? await prisma.backupGlobalConfig.findUnique({
        where: { id: GLOBAL_CONFIG_ID },
      })
    : null;

  return NextResponse.json({
    isSuperadmin,
    igrejas,
    igreja: igrejaConfig
      ? {
          igrejaId: igrejaConfig.igrejaId,
          ativo: igrejaConfig.ativo,
          intervalo: igrejaConfig.intervalo,
          hora: igrejaConfig.hora,
        }
      : igrejaDefault(igrejaId),
    global: isSuperadmin
      ? globalConfig
        ? {
            ativo: globalConfig.ativo,
            intervalo: globalConfig.intervalo,
            hora: globalConfig.hora,
            modo: globalConfig.modo,
            igrejaId: globalConfig.igrejaId ?? "",
          }
        : globalDefault()
      : null,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const scope = body?.scope === "global" ? "global" : "igreja";

  if (scope === "global") {
    if (user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

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

  if (user.role !== "SUPERADMIN") {
    const perm = await prisma.permissao.findUnique({
      where: {
        userId_recurso: {
          userId: user.id,
          recurso: "backup",
        },
      },
    });

    if (!perm?.editar) {
      return NextResponse.json(
        { error: "Sem permissão para configurar" },
        { status: 403 },
      );
    }
  }

  const igrejaId =
    user.role === "SUPERADMIN"
      ? typeof body?.igrejaId === "string"
        ? body.igrejaId
        : null
      : user.igrejaId;

  if (!igrejaId) {
    return NextResponse.json(
      { error: "igrejaId não informado" },
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

  const intervalo = ALLOWED_INTERVALOS.has(body?.intervalo)
    ? body.intervalo
    : "diario";

  const hora = isHoraValida(body?.hora) ? body.hora : "02:00";

  await prisma.backupConfig.upsert({
    where: { igrejaId },
    create: {
      igrejaId,
      ativo: !!body?.ativo,
      intervalo,
      hora,
    },
    update: {
      ativo: !!body?.ativo,
      intervalo,
      hora,
    },
  });

  return NextResponse.json({ message: "Configuração da igreja salva" });
}
