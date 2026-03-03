import { redirect } from "next/navigation";

export function requireSuperAdmin(role: string) {
  if (role !== "SUPERADMIN") {
    redirect("/dashboard");
  }
}
