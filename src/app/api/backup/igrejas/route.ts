//api/backup/igrejas/route.ts

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const igrejas = await prisma.igreja.findMany({
    select: {
      id: true,
      nome: true,
      slug: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return NextResponse.json({ igrejas });
}
