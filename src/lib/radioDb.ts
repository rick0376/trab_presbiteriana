import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function ensureRadioRow() {
  await prisma.radioStatus.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", live: false, title: "Oração ao vivo" },
  });
}
