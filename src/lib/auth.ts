// src/lib/auth.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("token")?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) return null;

  const user = session.user;

  // Se o usuário for superAdmin, ele não precisa de igreja vinculada.
  if (user.role === "SUPERADMIN") {
    return user;
  }

  // Se o usuário não tem igreja vinculada e não é superAdmin, redireciona.
  if (!user.igrejaId) {
    redirect("/sem-permissao");
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function requireRole(user: { role: string }, roles: string[]) {
  if (!roles.includes(user.role)) redirect("/sem-permissao");
}
