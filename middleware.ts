import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const token = req.cookies.get("token")?.value;

  // =========================
  // 1) PROTEGER DASHBOARD
  // =========================
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // =========================
  // 2) PROTEGER ADMIN DA RÁDIO (AGORA USA TOKEN NORMAL)
  // =========================
  const isRadioAdminArea =
    path === "/radio/admin" ||
    path.startsWith("/radio/admin/") ||
    path === "/radio/admin-radio" ||
    path.startsWith("/radio/admin-radio/");

  if (isRadioAdminArea) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // =========================
  // 3) RESTO DO SITE LIBERADO
  // =========================
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/radio/admin/:path*",
    "/radio/admin-radio/:path*",
  ],
};
