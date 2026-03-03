import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { sessionToken: token },
    });
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.delete("token");
  return res;
}
