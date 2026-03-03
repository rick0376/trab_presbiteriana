import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const user = await requireUser();

  if (!id) {
    return jsonError("ID inválido", 400);
  }

  const membro = await prisma.membro.findFirst({
    where: {
      id,
      igrejaId: user.igrejaId ?? undefined,
    },
  });

  if (!membro) {
    return jsonError("Membro não encontrado", 404);
  }

  // aqui depois você gera PDF real
  return NextResponse.json({ ok: true });
}
