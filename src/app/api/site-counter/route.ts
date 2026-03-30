//src/app/api/site-counter/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const item = await prisma.siteCounter.findUnique({
    where: { key: "site-total" },
  });

  return NextResponse.json({
    total: item?.total ?? 0,
  });
}

export async function POST() {
  const item = await prisma.siteCounter.upsert({
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
  });

  return NextResponse.json({
    ok: true,
    total: item.total,
  });
}
