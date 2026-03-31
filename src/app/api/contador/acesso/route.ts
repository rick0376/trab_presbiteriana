//src/app/api/contador/acesso/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AccessBody = {
  path?: string;
  referrer?: string | null;
  visitorId?: string | null;
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

function getRequestIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  if (realIp) {
    return realIp.trim();
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
    let body: AccessBody = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const userAgent = req.headers.get("user-agent") || "";
    const deviceType = getDeviceType(userAgent);
    const ipHash = hashIp(getRequestIp(req));

    const path = cleanText(body.path, 255);
    const referrer = cleanText(body.referrer, 500);
    const visitorId = cleanText(body.visitorId, 120);

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
          ipHash,
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
