//src/app/api/admin/acessos/limpar/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

type BodyShape = {
  mode?: "all" | "period";
  de?: string;
  ate?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseYmd(value?: string | null) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function getRangeFromYmd(startYmd: string, endYmd: string) {
  const start = new Date(`${startYmd}T00:00:00-03:00`);
  const endExclusive = new Date(
    new Date(`${endYmd}T00:00:00-03:00`).getTime() + DAY_MS,
  );

  return { start, endExclusive };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const isSuperAdmin = user.role === "SUPERADMIN";

    const permissaoAcessos = isSuperAdmin
      ? { deletar: true }
      : await prisma.permissao.findUnique({
          where: {
            userId_recurso: {
              userId: user.id,
              recurso: "acessos_site",
            },
          },
          select: {
            deletar: true,
          },
        });

    const canDeleteAcessos = isSuperAdmin || !!permissaoAcessos?.deletar;

    if (!canDeleteAcessos) {
      return NextResponse.json(
        { ok: false, message: "Sem permissão para excluir acessos." },
        { status: 403 },
      );
    }

    let body: BodyShape = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const mode = body.mode;

    if (mode === "all") {
      await prisma.$transaction([
        prisma.siteAccess.deleteMany({}),
        prisma.siteCounter.upsert({
          where: { key: "site-total" },
          update: { total: 0 },
          create: { key: "site-total", total: 0 },
        }),
      ]);

      return NextResponse.json({
        ok: true,
        deleted: "all",
        totalAtual: 0,
      });
    }

    if (mode === "period") {
      const de = parseYmd(body.de);
      const ate = parseYmd(body.ate);

      if (!de || !ate) {
        return NextResponse.json(
          { ok: false, message: "Período inválido." },
          { status: 400 },
        );
      }

      const [startYmd, endYmd] = de <= ate ? [de, ate] : [ate, de];
      const { start, endExclusive } = getRangeFromYmd(startYmd, endYmd);

      const totalNoPeriodo = await prisma.siteAccess.count({
        where: {
          createdAt: {
            gte: start,
            lt: endExclusive,
          },
        },
      });

      const currentCounter = await prisma.siteCounter.findUnique({
        where: { key: "site-total" },
        select: { total: true },
      });

      const novoTotal = Math.max(
        (currentCounter?.total ?? 0) - totalNoPeriodo,
        0,
      );

      await prisma.$transaction([
        prisma.siteAccess.deleteMany({
          where: {
            createdAt: {
              gte: start,
              lt: endExclusive,
            },
          },
        }),
        prisma.siteCounter.upsert({
          where: { key: "site-total" },
          update: { total: novoTotal },
          create: { key: "site-total", total: novoTotal },
        }),
      ]);

      return NextResponse.json({
        ok: true,
        deleted: totalNoPeriodo,
        totalAtual: novoTotal,
      });
    }

    return NextResponse.json(
      { ok: false, message: "Modo de exclusão inválido." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Erro ao limpar acessos:", error);

    return NextResponse.json(
      { ok: false, message: "Erro ao limpar acessos." },
      { status: 500 },
    );
  }
}
