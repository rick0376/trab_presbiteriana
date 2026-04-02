//src/app/api/contador/acesso/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { geolocation, ipAddress } from "@vercel/functions";

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

function getGeoFromVercel(req: NextRequest) {
  const ipCountry = cleanText(req.headers.get("x-vercel-ip-country"), 10);
  const ipRegion = cleanText(req.headers.get("x-vercel-ip-country-region"), 20);
  const ipCity = cleanText(req.headers.get("x-vercel-ip-city"), 120);

  return {
    ipCountry,
    ipRegion,
    ipCity,
  };
}

export async function POST(req: NextRequest) {
  try {
    let body: AccessBody = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const userAgent = req.headers.get("user-agent") || "";
    const deviceType = getDeviceType(userAgent);

    const ipFromVercel = ipAddress(req) || getRequestIp(req);
    const ipHash = hashIp(ipFromVercel);

    const geo = geolocation(req);
    console.log("geo", geo);
    console.log("x-vercel-ip-country", req.headers.get("x-vercel-ip-country"));
    console.log(
      "x-vercel-ip-country-region",
      req.headers.get("x-vercel-ip-country-region"),
    );
    console.log("x-vercel-ip-city", req.headers.get("x-vercel-ip-city"));
    console.log("ipFromVercel", ipFromVercel);

    const ipCountry =
      cleanText(geo.country, 10) ||
      cleanText(req.headers.get("x-vercel-ip-country"), 10);

    const ipRegion =
      cleanText(geo.countryRegion, 20) ||
      cleanText(req.headers.get("x-vercel-ip-country-region"), 20);

    const ipCity =
      cleanText(geo.city, 120) ||
      cleanText(req.headers.get("x-vercel-ip-city"), 120);

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
          ipAddress: ipFromVercel,
          ipHash,
          ipCountry,
          ipRegion,
          ipCity,
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
