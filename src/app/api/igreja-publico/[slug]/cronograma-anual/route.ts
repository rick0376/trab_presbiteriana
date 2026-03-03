import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const igreja = await prisma.igreja.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!igreja) {
    return NextResponse.json(
      { error: "Igreja não encontrada" },
      { status: 404 },
    );
  }

  const items = await prisma.cronogramaAnual.findMany({
    where: { igrejaId: igreja.id },
    orderBy: [{ data: "asc" }, { ordem: "asc" }],
    select: { id: true, titulo: true, data: true },
  });

  return NextResponse.json({ items });
}
