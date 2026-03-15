//src/app/api/membros/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";

type VencimentoFilter = "vencidos" | "30dias";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  const s = String(value).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00-03:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function cleanCPF(value: unknown): string | null {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 11 ? digits : null;
}

function isValidCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++)
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);

  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++)
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);

  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

async function resolveIgrejaId(
  user: { id: string; role: string; igrejaId?: string | null },
  igrejaIdParam: string | null,
) {
  if (user.role === "SUPERADMIN") return igrejaIdParam || null;

  if (user.igrejaId) return user.igrejaId;

  const igreja = await prisma.igreja.findFirst({
    where: { adminId: user.id },
    select: { id: true },
  });

  return igreja?.id || null;
}

/* ================== GET (LISTAR) ================== */
export async function GET(req: Request) {
  const user = await requireUser();
  await requirePermission("membros", "ler");

  const { searchParams } = new URL(req.url);

  const nome = (searchParams.get("nome") || "").trim();
  const cargo = searchParams.get("cargo")?.trim() || "";
  const vencimento =
    (searchParams.get("vencimento") as VencimentoFilter | null) ?? null;

  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const where: any = { igrejaId };

  if (nome) where.nome = { contains: nome, mode: "insensitive" };
  if (cargo) where.cargo = cargo;

  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const inicioHojeBR = new Date(`${ymd}T00:00:00-03:00`);

  if (vencimento === "vencidos") {
    where.dataVencCarteirinha = { lt: inicioHojeBR };
  }

  if (vencimento === "30dias") {
    const limite = new Date(inicioHojeBR);
    limite.setDate(limite.getDate() + 30);
    limite.setHours(23, 59, 59, 999);

    where.dataVencCarteirinha = { gte: inicioHojeBR, lte: limite };
  }

  const membros = await prisma.membro.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(membros);
}

/* ================== POST (CRIAR) ================== */
export async function POST(req: Request) {
  const user = await requireUser();
  await requirePermission("membros", "criar");

  const body = await req.json().catch(() => ({}));

  const { searchParams } = new URL(req.url);
  const igrejaId = await resolveIgrejaId(user, searchParams.get("igrejaId"));
  if (!igrejaId) return jsonError("Igreja não encontrada para este usuário.");

  const nome = String(body.nome || "").trim();
  const cargo = String(body.cargo || "").trim();

  if (!nome) return jsonError("Nome é obrigatório.");
  if (!cargo) return jsonError("Cargo é obrigatório.");

  /* ================== CPF ================== */
  const cpfLimpo = cleanCPF(body.cpf);

  if (body.cpf && !cpfLimpo) return jsonError("CPF inválido.");

  if (cpfLimpo && !isValidCPF(cpfLimpo)) return jsonError("CPF inválido.");

  if (cpfLimpo) {
    const existe = await prisma.membro.findFirst({
      where: {
        igrejaId,
        cpf: cpfLimpo,
      },
      select: { id: true },
    });

    if (existe) {
      return jsonError("Já existe um membro com este CPF.");
    }
  }
  /* ================== CPF ================== */

  let membro = null;

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const ultimo = await prisma.membro.findFirst({
      where: { igrejaId },
      orderBy: { numeroSequencial: "desc" },
      select: { numeroSequencial: true },
    });

    const proximoNumero = ultimo ? ultimo.numeroSequencial + 1 : 1;

    try {
      membro = await prisma.membro.create({
        data: {
          igrejaId,
          nome,
          numeroSequencial: proximoNumero,
          cargo,
          cpf: cpfLimpo,
          ativo: typeof body.ativo === "boolean" ? body.ativo : true,

          rg: parseText(body.rg),
          estadoCivil: parseText(body.estadoCivil),
          nomeMae: parseText(body.nomeMae),
          nomePai: parseText(body.nomePai),

          endereco: parseText(body.endereco),
          numeroEndereco: parseText(body.numeroEndereco),
          bairro: parseText(body.bairro),
          cidade: parseText(body.cidade),
          estado: parseText(body.estado),

          telefone: parseText(body.telefone),
          numeroCarteirinha: parseText(body.numeroCarteirinha),
          dataNascimento: parseDate(body.dataNascimento),
          dataBatismo: parseDate(body.dataBatismo),
          dataCriacaoCarteirinha: parseDate(body.dataCriacaoCarteirinha),
          dataVencCarteirinha: parseDate(body.dataVencCarteirinha),
          observacoes: parseText(body.observacoes),
        },
      });

      break;
    } catch (error: any) {
      if (error?.code === "P2002") {
        continue;
      }

      throw error;
    }
  }

  if (!membro) {
    return jsonError(
      "Não foi possível gerar um novo código para o membro. Tente novamente.",
      409,
    );
  }

  return NextResponse.json(membro, { status: 201 });
}
