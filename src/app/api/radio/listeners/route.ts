// src/app/api/radio/listeners/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000); // 4s

  try {
    const r = await fetch("http://usa16.fastcast4u.com:22843/stats?json=1", {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!r.ok) {
      return NextResponse.json(
        { current: 0, peak: 0, max: 0, uptime: 0, online: false },
        {
          status: 200,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        },
      );
    }

    const j = await r.json();

    return NextResponse.json(
      {
        current: Number(j.currentlisteners ?? 0),
        peak: Number(j.peaklisteners ?? 0),
        max: Number(j.maxlisteners ?? 0),
        uptime: Number(j.streamuptime ?? 0),
        online: Number(j.streamstatus ?? 0) === 1,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch {
    // Retorna 200 com zeros para não "quebrar" a UI quando stats falhar momentaneamente
    return NextResponse.json(
      { current: 0, peak: 0, max: 0, uptime: 0, online: false },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
