//src/app/api/contador/acesso/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AccessBody = {
  path?: string;
  referrer?: string | null;
  visitorId?: string | null;
  displayMode?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

function getDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (/bot|crawler|spider|crawling/.test(ua)) return "bot";
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

function normalizeIp(ip: string | null) {
  if (!ip) return null;

  const value = ip.trim();

  if (!value) return null;

  if (value === "::1") return "127.0.0.1";
  if (value === "::ffff:127.0.0.1") return "127.0.0.1";

  if (value.startsWith("::ffff:")) {
    return value.replace("::ffff:", "");
  }

  return value;
}

function getRequestIp(req: NextRequest) {
  const candidates = [
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-client-ip"),
    req.headers.get("x-cluster-client-ip"),
    req.headers.get("forwarded"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.includes(",")) {
      const first = candidate.split(",")[0]?.trim() || null;
      const normalized = normalizeIp(first);
      if (normalized) return normalized;
      continue;
    }

    if (candidate.startsWith("for=")) {
      const forwardedIp = candidate
        .split(";")[0]
        .replace(/^for=/i, "")
        .replace(/^"/, "")
        .replace(/"$/, "")
        .trim();

      const normalized = normalizeIp(forwardedIp);
      if (normalized) return normalized;
      continue;
    }

    const normalized = normalizeIp(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function cleanText(value: unknown, max = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    /*console.log("========== HEADERS ACESSO ==========");
    console.log(Object.fromEntries(req.headers.entries()));
    console.log("x-forwarded-for:", req.headers.get("x-forwarded-for"));
    console.log("x-real-ip:", req.headers.get("x-real-ip"));
    console.log("cf-connecting-ip:", req.headers.get("cf-connecting-ip"));
    console.log("x-client-ip:", req.headers.get("x-client-ip"));
    console.log("x-cluster-client-ip:", req.headers.get("x-cluster-client-ip"));
    console.log("forwarded:", req.headers.get("forwarded"));
    console.log("ip capturado:", getRequestIp(req));
    console.log("====================================");
*/

    let body: AccessBody = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const userAgent = req.headers.get("user-agent") || "";
    const deviceType = getDeviceType(userAgent);
    const ipAddress = getRequestIp(req);
    const ipHash = hashIp(ipAddress);

    const path = cleanText(body.path, 255);
    const referrer = cleanText(body.referrer, 500);
    const visitorId = cleanText(body.visitorId, 120);
    const displayMode = cleanText(body.displayMode, 60);
    const utmSource = cleanText(body.utmSource, 120);
    const utmMedium = cleanText(body.utmMedium, 120);
    const utmCampaign = cleanText(body.utmCampaign, 180);
    const utmContent = cleanText(body.utmContent, 180);
    const utmTerm = cleanText(body.utmTerm, 180);

    const [counter] = await prisma.$transaction([
      prisma.siteCounter.upsert({
        where: { key: "site-total" },
        update: {
          total: {
            increment: 1,
          },
        },
        create: {
          key: "site-total",
          total: 1,
        },
      }),

      prisma.siteAccess.create({
        data: {
          path,
          referrer,
          userAgent: userAgent || null,
          deviceType,
          visitorId,
          ipAddress,
          ipHash,
          displayMode,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      total: counter.total,
    });
  } catch (error) {
    console.error("Erro ao registrar acesso:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao registrar acesso.",
      },
      { status: 500 },
    );
  }
}
