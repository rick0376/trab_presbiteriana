//api/radio/status/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma, ensureRadioRow } from "@/lib/radioDb";

export async function GET() {
  await ensureRadioRow();

  const row = await prisma.radioStatus.findUnique({
    where: { id: "main" },
  });

  return NextResponse.json(
    {
      live: !!row?.live,
      title: row?.title ?? "Oração ao vivo",
      streamUrl: row?.streamUrl ?? null, // 🔴 ISSO ESTAVA FALTANDO
      updatedAt: row?.updatedAt?.toISOString() ?? new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}
