//src/app/(private)/dashboard/acessos/page.tsx

import Link from "next/link";
import styles from "./styles.module.scss";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

type SearchParamsShape = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
};

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

function formatDateTimeBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
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

function getOrigemLabel(item: {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  displayMode?: string | null;
}) {
  if (item.utmSource || item.utmMedium || item.utmCampaign) {
    const source = item.utmSource || "utm";
    const medium = item.utmMedium ? ` / ${item.utmMedium}` : "";
    const campaign = item.utmCampaign ? ` / ${item.utmCampaign}` : "";
    return `${source}${medium}${campaign}`;
  }

  if (item.referrer) {
    return item.referrer;
  }

  if (
    item.displayMode === "standalone" ||
    item.displayMode === "ios-standalone"
  ) {
    return "PWA / não informado";
  }

  return "Direto / não informado";
}

function getModoLabel(displayMode?: string | null) {
  if (!displayMode) return "-";

  if (displayMode === "standalone") return "PWA";
  if (displayMode === "ios-standalone") return "PWA iOS";
  if (displayMode === "browser") return "Navegador";
  if (displayMode === "fullscreen") return "Fullscreen";
  if (displayMode === "minimal-ui") return "Minimal UI";

  return displayMode;
}

export default async function DashboardAcessosPage({
  searchParams,
}: PageProps) {
  const user = await requireUser();

  const resolvedSearchParams = (await searchParams) as
    | SearchParamsShape
    | undefined;

  const isSuperAdmin = user.role === "SUPERADMIN";
  const igrejaId = user.igrejaId ?? null;

  if (!isSuperAdmin && !igrejaId) {
    return (
      <div className={styles.container}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.h1}>Acessos do site</h1>
            <p className={styles.sub}>Nenhuma igreja vinculada.</p>
          </div>

          <Link href="/dashboard" className={styles.backLink}>
            Voltar
          </Link>
        </div>

        <div className={styles.card}>
          <p className={styles.empty}>
            Seu usuário não possui uma igreja associada.
          </p>
        </div>
      </div>
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

  const [siteCounter, filteredAccessesRaw] = await Promise.all([
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
        ipHash: true,
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

  const maxChartValue = Math.max(...chartData.map((item) => item.total), 1);

  const topPaths = Array.from(pathMap.entries())
    .map(([path, total]) => ({ path, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const recentAccesses = filteredAccessesRaw.slice(0, 50);

  const hojeHref = `/dashboard/acessos?de=${todayYmd}&ate=${todayYmd}`;
  const seteDiasHref = `/dashboard/acessos?de=${formatDateInput(new Date(now.getTime() - 6 * DAY_MS))}&ate=${todayYmd}`;
  const trintaDiasHref = `/dashboard/acessos?de=${defaultDe}&ate=${defaultAte}`;

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Acessos do site</h1>
          <p className={styles.sub}>
            Resumo geral de acessos públicos • Horário exibido em São Paulo
          </p>
        </div>

        <Link href="/dashboard" className={styles.backLink}>
          Voltar
        </Link>
      </div>

      <section className={`${styles.card} ${styles.filterCard}`}>
        <div className={styles.cardHeader}>
          <h2>Filtro por período</h2>
        </div>

        <form method="GET" className={styles.filterForm}>
          <div className={styles.fieldGroup}>
            <label htmlFor="de" className={styles.fieldLabel}>
              De
            </label>
            <input
              id="de"
              name="de"
              type="date"
              defaultValue={selectedDe}
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="ate" className={styles.fieldLabel}>
              Até
            </label>
            <input
              id="ate"
              name="ate"
              type="date"
              defaultValue={selectedAte}
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.filterButton}>
              Filtrar
            </button>

            <Link href="/dashboard/acessos" className={styles.clearButton}>
              Limpar
            </Link>
          </div>
        </form>

        <div className={styles.quickFilters}>
          <Link href={hojeHref} className={styles.quickLink}>
            Hoje
          </Link>
          <Link href={seteDiasHref} className={styles.quickLink}>
            7 dias
          </Link>
          <Link href={trintaDiasHref} className={styles.quickLink}>
            30 dias
          </Link>
        </div>

        <div className={styles.periodBadge}>
          Período selecionado: {formatYmdToPtBr(selectedDe)} até{" "}
          {formatYmdToPtBr(selectedAte)} • {periodDays} dia(s)
        </div>
      </section>

      <section className={styles.gridStats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total geral</div>
          <div className={styles.statValue}>{totalAcessosGeral}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total no período</div>
          <div className={styles.statValue}>{totalPeriodo}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Visitantes aprox.</div>
          <div className={styles.statValue}>{uniquePeriodo}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Média por dia</div>
          <div className={styles.statValue}>{mediaPorDia}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Mobile no período</div>
          <div className={styles.statValue}>{deviceTotals.mobile}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>UTM no período</div>
          <div className={styles.statValue}>{sourceTotals.utm}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>PWA no período</div>
          <div className={styles.statValue}>{sourceTotals.pwa}</div>
        </div>
      </section>

      <section className={styles.grid2}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.cardHeader}>
            <h2>Acessos por dia</h2>
          </div>

          <div className={styles.barChartScroll}>
            <div
              className={styles.barChart}
              style={{
                gridTemplateColumns: `repeat(${chartData.length}, minmax(42px, 1fr))`,
              }}
            >
              {chartData.map((item) => {
                const heightPercent = (item.total / maxChartValue) * 100;

                return (
                  <div key={item.key} className={styles.barItem}>
                    <div className={styles.barValue}>{item.total}</div>

                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <div className={styles.barLabel}>{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Dispositivos</h2>
          </div>

          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span>Desktop</span>
              <strong>{deviceTotals.desktop}</strong>
            </li>
            <li className={styles.listItem}>
              <span>Mobile</span>
              <strong>{deviceTotals.mobile}</strong>
            </li>
            <li className={styles.listItem}>
              <span>Tablet</span>
              <strong>{deviceTotals.tablet}</strong>
            </li>
            <li className={styles.listItem}>
              <span>Bot</span>
              <strong>{deviceTotals.bot}</strong>
            </li>
            <li className={styles.listItem}>
              <span>Outros</span>
              <strong>{deviceTotals.other}</strong>
            </li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Origem dos acessos</h2>
          </div>

          <ul className={styles.list}>
            <li className={styles.listItem}>
              <span>UTM</span>
              <strong>{sourceTotals.utm}</strong>
            </li>
            <li className={styles.listItem}>
              <span>PWA</span>
              <strong>{sourceTotals.pwa}</strong>
            </li>
            <li className={styles.listItem}>
              <span>Referrer</span>
              <strong>{sourceTotals.referrer}</strong>
            </li>
            <li className={styles.listItem}>
              <span>Direto</span>
              <strong>{sourceTotals.direto}</strong>
            </li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Páginas mais acessadas</h2>
          </div>

          {topPaths.length === 0 ? (
            <p className={styles.empty}>Nenhum acesso encontrado.</p>
          ) : (
            <ul className={styles.list}>
              {topPaths.map((item) => (
                <li key={item.path} className={styles.listItemCol}>
                  <div className={styles.pathTitle}>{item.path}</div>
                  <div className={styles.pathCount}>{item.total} acessos</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Última atualização do total</h2>
          </div>

          <div className={styles.infoBlock}>
            <div className={styles.infoLabel}>Atualizado em</div>
            <div className={styles.infoValue}>
              {siteCounter?.updatedAt
                ? formatDateTimeBR(new Date(siteCounter.updatedAt))
                : "Sem atualização"}
            </div>
          </div>

          <div className={styles.infoBlock}>
            <div className={styles.infoLabel}>Observação</div>
            <div className={styles.infoText}>
              O banco grava em UTC e esta tela converte para horário de São
              Paulo.
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.card} ${styles.cardFull}`}>
        <div className={styles.cardHeader}>
          <h2>Últimos acessos do período</h2>
        </div>

        {recentAccesses.length === 0 ? (
          <p className={styles.empty}>Nenhum acesso encontrado.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Página</th>
                  <th>Dispositivo</th>
                  <th>Modo</th>
                  <th>Origem</th>
                  <th>Visitante</th>
                </tr>
              </thead>

              <tbody>
                {recentAccesses.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTimeBR(new Date(item.createdAt))}</td>
                    <td>{item.path || "-"}</td>
                    <td>{item.deviceType || "-"}</td>
                    <td>{getModoLabel(item.displayMode)}</td>
                    <td>{getOrigemLabel(item)}</td>
                    <td>
                      {item.visitorId || item.ipHash?.slice(0, 12) || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
