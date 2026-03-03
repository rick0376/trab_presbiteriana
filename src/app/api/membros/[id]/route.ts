//src/app/api/membros/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
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

function getIdFromUrl(req: NextRequest) {
  const parts = req.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

async function resolveIgrejaId(user: {
  id: string;
  role: string;
  igrejaId?: string | null;
}) {
  if (user.igrejaId) return user.igrejaId;

  const igreja = await prisma.igreja.findFirst({
    where: { adminId: user.id },
    select: { id: true },
  });

  return igreja?.id ?? null;
}

/* ================== GET (DETALHAR) ================== */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("membros", "ler");

  const id = getIdFromUrl(req);
  const igrejaId = await resolveIgrejaId(user);
  if (!igrejaId) return jsonError("Igreja não encontrada.");

  const membro = await prisma.membro.findFirst({
    where: { id, igrejaId },
    include: { igreja: { select: { nome: true } } },
  });

  if (!membro) return jsonError("Membro não encontrado.", 404);

  return NextResponse.json({
    ...membro,
    igrejaNome: membro.igreja?.nome ?? null,
  });
}

/* ================== PUT (EDITAR) ================== */
export async function PUT(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("membros", "editar");

  const id = getIdFromUrl(req);
  const igrejaId = await resolveIgrejaId(user);
  if (!igrejaId) return jsonError("Igreja não encontrada.");

  const body = await req.json().catch(() => ({}));

  const membro = await prisma.membro.findFirst({
    where: { id, igrejaId },
  });
  if (!membro) return jsonError("Membro não encontrado.", 404);

  /* ================== CPF ================== */
  const cpfLimpo = cleanCPF(body.cpf);

  if (body.cpf && !cpfLimpo) return jsonError("CPF inválido.");

  if (cpfLimpo && !isValidCPF(cpfLimpo)) return jsonError("CPF inválido.");

  if (cpfLimpo) {
    const existe = await prisma.membro.findFirst({
      where: {
        igrejaId,
        cpf: cpfLimpo,
        NOT: { id },
      },
      select: { id: true },
    });

    if (existe) {
      return jsonError("Já existe um membro com este CPF.");
    }
  }
  /* ================== CPF ================== */

  const atualizado = await prisma.membro.update({
    where: { id },
    data: {
      nome: String(body.nome || "").trim(),
      cargo: String(body.cargo || "").trim(),
      ativo: typeof body.ativo === "boolean" ? body.ativo : undefined,

      rg: parseText(body.rg),
      cpf: cpfLimpo,
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

  return NextResponse.json(atualizado);
}

/* ================== DELETE ================== */
export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  await requirePermission("membros", "deletar");

  const id = getIdFromUrl(req);
  const igrejaId = await resolveIgrejaId(user);
  if (!igrejaId) return jsonError("Igreja não encontrada.");

  const membro = await prisma.membro.findFirst({
    where: { id, igrejaId },
  });
  if (!membro) return jsonError("Membro não encontrado.", 404);

  await prisma.membro.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
