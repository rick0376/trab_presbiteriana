//api/radio/status/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma, ensureRadioRow } from "@/lib/radioDb";

const INFO_URL = "https://stream3.svrdedicado.org/cp/get_info.php?p=8100";
const STREAM_URL = "https://stream3.svrdedicado.org/8100/stream";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toOnline(j: any) {
  const listeners = toNumber(j.listeners ?? j.ulistener ?? 0);
  const bitrate = toNumber(j.bitrate ?? 0);
  const title = String(j.title ?? "").trim();

  return listeners > 0 || bitrate > 0 || title.length > 0;
}

async function getRealRadioStatus() {
  try {
    const r = await fetch(INFO_URL, {
      cache: "no-store",
    });

    if (!r.ok) return false;

    const j = await r.json();
    return toOnline(j);
  } catch {
    return false;
  }
}

export async function GET() {
  await ensureRadioRow();

  const row = await prisma.radioStatus.findUnique({
    where: { id: "main" },
  });

  const realLive = await getRealRadioStatus();

  return NextResponse.json(
    {
      live: realLive,
      title: row?.title ?? "Rádio ao vivo",
      streamUrl: row?.streamUrl ?? STREAM_URL,
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
