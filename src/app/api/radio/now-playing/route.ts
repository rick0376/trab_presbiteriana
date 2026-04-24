//src/app/api/radio/now-playing/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const INFO_URL = "https://stream3.svrdedicado.org/cp/get_info.php?p=8100";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const r = await fetch(INFO_URL, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!r.ok) {
      return NextResponse.json(
        {
          title: "",
          art: "",
          djusername: "",
          history: [],
        },
        {
          status: 200,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        },
      );
    }

    const j = await r.json();

    return NextResponse.json(
      {
        title: String(j.title ?? "").trim(),
        art: String(j.art ?? "").trim(),
        djusername: String(j.djusername ?? "").trim(),
        history: Array.isArray(j.history) ? j.history : [],
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        title: "",
        art: "",
        djusername: "",
        history: [],
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}
