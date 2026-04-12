//src/app/api/departamentos/membros/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";

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

export async function GET(req: Request) {
  const user = await requireUser();
  await requirePermission("publico", "ler");

  const { searchParams } = new URL(req.url);
  const nome = (searchParams.get("nome") || "").trim();
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));

  if (!igrejaId) {
    return jsonError("Igreja não encontrada.");
  }

  const membros = await prisma.membro.findMany({
    where: {
      igrejaId,
      ativo: true,
      ...(nome
        ? {
            nome: {
              contains: nome,
              mode: "insensitive",
            },
          }
        : {}),
    },
    select: {
      id: true,
      nome: true,
      cargo: true,
      numeroSequencial: true,
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({
    items: membros.map((m) => ({
      id: m.id,
      nome: m.nome,
      cargo: m.cargo,
      numeroSequencial: m.numeroSequencial,
      codigo: `IPR-${String(m.numeroSequencial).padStart(4, "0")}`,
    })),
  });
}
