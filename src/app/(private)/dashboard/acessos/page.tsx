//src/app/(private)/dashboard/acessos/page.tsx

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardAcessos from "@/components/dashboard/acessos/DashboardAcessos/DashboardAcessos";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

type SearchParamsShape = Record<string, string | string[] | undefined>;

function getDatePartsInTimeZone(date: Date, timeZone = TZ) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";

  return { day, month, year };
}

function getDayKey(date: Date, timeZone = TZ) {
  const { day, month, year } = getDatePartsInTimeZone(date, timeZone);
  return `${year}-${month}-${day}`;
}

function formatDateInput(date: Date) {
  return getDayKey(date);
}

function formatYmdToPtBr(ymd: string) {
  const [year, month, day] = ymd.split("-");
  return `${day}/${month}/${year}`;
}

function getParam(
  searchParams: SearchParamsShape | undefined,
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseYmd(value?: string | null) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function getRangeFromYmd(startYmd: string, endYmd: string) {
  const start = new Date(`${startYmd}T00:00:00-03:00`);
  const endExclusive = new Date(
    new Date(`${endYmd}T00:00:00-03:00`).getTime() + DAY_MS,
  );

  return { start, endExclusive };
}

function getDayKeysBetween(startYmd: string, endYmd: string) {
  const keys: string[] = [];
  let cursor = new Date(`${startYmd}T00:00:00-03:00`);
  const end = new Date(`${endYmd}T00:00:00-03:00`);

  while (cursor.getTime() <= end.getTime()) {
    keys.push(getDayKey(cursor));
    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  return keys;
}

function getDayLabelFromKey(key: string) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

export default async function DashboardAcessosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsShape>;
}) {
  const user = await requireUser();

  const resolvedSearchParams = await searchParams;

  const isSuperAdmin = user.role === "SUPERADMIN";
  const igrejaId = user.igrejaId ?? null;

  const permissaoAcessos = isSuperAdmin
    ? { ler: true, compartilhar: true }
    : await prisma.permissao.findUnique({
        where: {
          userId_recurso: {
            userId: user.id,
            recurso: "acessos_site",
          },
        },
        select: {
          ler: true,
          compartilhar: true,
        },
      });

  const canViewAcessos = isSuperAdmin || !!permissaoAcessos?.ler;
  const canShareAcessos = isSuperAdmin || !!permissaoAcessos?.compartilhar;

  if (!canViewAcessos) {
    redirect("/sem-permissao");
  }

  if (!isSuperAdmin && !igrejaId) {
    return (
      <DashboardAcessos
        mode="empty"
        backHref="/dashboard"
        backLabel="Voltar"
        title="Acessos do site"
        subtitle="Nenhuma igreja vinculada."
        message="Seu usuário não possui uma igreja associada."
      />
    );
  }

  const now = new Date();

  const todayYmd = formatDateInput(now);
  const defaultDe = formatDateInput(new Date(now.getTime() - 29 * DAY_MS));
  const defaultAte = todayYmd;

  let selectedDe = parseYmd(getParam(resolvedSearchParams, "de")) ?? defaultDe;
  let selectedAte =
    parseYmd(getParam(resolvedSearchParams, "ate")) ?? defaultAte;

  if (selectedDe > selectedAte) {
    [selectedDe, selectedAte] = [selectedAte, selectedDe];
  }

  const { start, endExclusive } = getRangeFromYmd(selectedDe, selectedAte);

  const [igreja, siteCounter, filteredAccessesRaw] = await Promise.all([
    igrejaId
      ? prisma.igreja.findUnique({
          where: { id: igrejaId },
          select: { nome: true },
        })
      : Promise.resolve(null),

    prisma.siteCounter.findUnique({
      where: { key: "site-total" },
      select: { total: true, updatedAt: true },
    }),

    prisma.siteAccess.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: endExclusive,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        path: true,
        referrer: true,
        userAgent: true,
        deviceType: true,
        visitorId: true,
        ipAddress: true,
        ipHash: true,
        ipCountry: true,
        ipRegion: true,
        ipCity: true,
        displayMode: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmContent: true,
        utmTerm: true,
      },
    }),
  ]);

  const totalAcessosGeral = siteCounter?.total ?? 0;
  const totalPeriodo = filteredAccessesRaw.length;

  const dayKeysInRange = getDayKeysBetween(selectedDe, selectedAte);
  const periodDays = dayKeysInRange.length;

  const dailyMap = new Map<string, number>();
  const pathMap = new Map<string, number>();
  const deviceTotals = {
    desktop: 0,
    mobile: 0,
    tablet: 0,
    bot: 0,
    other: 0,
  };

  const sourceTotals = {
    pwa: 0,
    direto: 0,
    referrer: 0,
    utm: 0,
  };

  const uniquePeriodoSet = new Set<string>();

  for (const access of filteredAccessesRaw) {
    const createdAt = new Date(access.createdAt);
    const dayKey = getDayKey(createdAt);

    dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + 1);

    const path = access.path?.trim() || "(sem rota)";
    pathMap.set(path, (pathMap.get(path) ?? 0) + 1);

    const device = (access.deviceType || "other").toLowerCase();

    if (device === "desktop") deviceTotals.desktop += 1;
    else if (device === "mobile") deviceTotals.mobile += 1;
    else if (device === "tablet") deviceTotals.tablet += 1;
    else if (device === "bot") deviceTotals.bot += 1;
    else deviceTotals.other += 1;

    if (access.utmSource || access.utmMedium || access.utmCampaign) {
      sourceTotals.utm += 1;
    } else if (
      access.displayMode === "standalone" ||
      access.displayMode === "ios-standalone"
    ) {
      sourceTotals.pwa += 1;
    } else if (access.referrer) {
      sourceTotals.referrer += 1;
    } else {
      sourceTotals.direto += 1;
    }

    const uniqueKey =
      access.visitorId?.trim() ||
      access.ipHash?.trim() ||
      access.userAgent?.slice(0, 120) ||
      access.id;

    uniquePeriodoSet.add(uniqueKey);
  }

  const uniquePeriodo = uniquePeriodoSet.size;
  const mediaPorDia =
    periodDays > 0 ? Number((totalPeriodo / periodDays).toFixed(1)) : 0;

  const chartData = dayKeysInRange.map((key) => ({
    key,
    label: getDayLabelFromKey(key),
    total: dailyMap.get(key) ?? 0,
  }));

  const topPaths = Array.from(pathMap.entries())
    .map(([path, total]) => ({ path, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const recentAccesses = filteredAccessesRaw.slice(0, 50).map((item) => ({
    id: item.id,
    createdAt: new Date(item.createdAt).toISOString(),
    path: item.path,
    deviceType: item.deviceType,
    displayMode: item.displayMode,
    utmSource: item.utmSource,
    utmMedium: item.utmMedium,
    utmCampaign: item.utmCampaign,
    referrer: item.referrer,
    visitorId: item.visitorId,
    ipAddress: item.ipAddress,
    ipHash: item.ipHash,
  }));

  const periodoLabel = `${formatYmdToPtBr(selectedDe)} até ${formatYmdToPtBr(selectedAte)}`;

  const nomeCliente =
    igreja?.nome?.trim() ||
    (isSuperAdmin ? "Sistema Igreja" : "Igreja não identificada");

  const hojeHref = `/dashboard/acessos?de=${todayYmd}&ate=${todayYmd}`;
  const seteDiasHref = `/dashboard/acessos?de=${formatDateInput(new Date(now.getTime() - 6 * DAY_MS))}&ate=${todayYmd}`;
  const trintaDiasHref = `/dashboard/acessos?de=${defaultDe}&ate=${defaultAte}`;

  return (
    <DashboardAcessos
      mode="default"
      backHref="/dashboard"
      backLabel="Voltar"
      title="Acessos do site"
      subtitle="Resumo geral de acessos públicos • Horário exibido em São Paulo"
      selectedDe={selectedDe}
      selectedAte={selectedAte}
      periodDays={periodDays}
      periodoLabel={periodoLabel}
      nomeCliente={nomeCliente}
      hojeHref={hojeHref}
      seteDiasHref={seteDiasHref}
      trintaDiasHref={trintaDiasHref}
      totalAcessosGeral={totalAcessosGeral}
      totalPeriodo={totalPeriodo}
      uniquePeriodo={uniquePeriodo}
      mediaPorDia={mediaPorDia}
      updatedAt={
        siteCounter?.updatedAt
          ? new Date(siteCounter.updatedAt).toISOString()
          : null
      }
      chartData={chartData}
      deviceTotals={deviceTotals}
      sourceTotals={sourceTotals}
      topPaths={topPaths}
      recentAccesses={recentAccesses}
      canShare={canShareAcessos}
    />
  );
}
