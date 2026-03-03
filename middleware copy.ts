//middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // =========================
  // 1) PROTEÇÃO DO DASHBOARD
  // =========================
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  // =========================
  // 2) PROTEÇÃO DO ADMIN DA RÁDIO
  // =========================
  const isRadioAdminArea =
    path === "/radio/admin" ||
    path.startsWith("/radio/admin/") ||
    path === "/radio/admin-radio" ||
    path.startsWith("/radio/admin-radio/");

  // liberar sempre o login do admin rádio
  if (path === "/radio/admin/login" || path.startsWith("/radio/admin/login/")) {
    return NextResponse.next();
  }

  if (isRadioAdminArea) {
    const isLogged = req.cookies.get("radio_admin")?.value === "1";

    if (!isLogged) {
      const url = req.nextUrl.clone();
      url.pathname = "/radio/admin/login";
      return NextResponse.redirect(url);
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
    "/dashboard",
    "/dashboard/:path*",
    "/radio/admin/:path*",
    "/radio/admin-radio/:path*",
  ],
};
