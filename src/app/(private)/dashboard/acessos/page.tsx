//src/app/(private)/dashboard/acessos/page.tsx

import Link from "next/link";
import styles from "./styles.module.scss";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

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

function getDayLabelFromKey(key: string) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

function formatDateTimeBR(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function getLastNDayKeys(baseDate: Date, days: number) {
  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index;
    const date = new Date(baseDate.getTime() - offset * DAY_MS);
    return getDayKey(date);
  });
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

export default async function DashboardAcessosPage() {
  const user = await requireUser();

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
  const rangeStart = new Date(now.getTime() - 40 * DAY_MS);

  const [siteCounter, recentAccessesRaw] = await Promise.all([
    prisma.siteCounter.findUnique({
      where: { key: "site-total" },
      select: { total: true, updatedAt: true },
    }),

    prisma.siteAccess.findMany({
      where: {
        createdAt: {
          gte: rangeStart,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
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

  const totalAcessos = siteCounter?.total ?? 0;

  const dailyMap = new Map<string, number>();
  const pathMap = new Map<string, number>();
  const deviceTotals = {
    desktop: 0,
    mobile: 0,
    tablet: 0,
    bot: 0,
    other: 0,
  };

  const unique30dSet = new Set<string>();

  for (const access of recentAccessesRaw) {
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

    const uniqueKey =
      access.visitorId?.trim() ||
      access.ipHash?.trim() ||
      access.userAgent?.slice(0, 120) ||
      access.id;

    unique30dSet.add(uniqueKey);
  }

  const todayKey = getDayKey(now);
  const totalHoje = dailyMap.get(todayKey) ?? 0;

  const last7Keys = getLastNDayKeys(now, 7);
  const last30Keys = getLastNDayKeys(now, 30);

  const total7dias = last7Keys.reduce(
    (acc, key) => acc + (dailyMap.get(key) ?? 0),
    0,
  );

  const total30dias = last30Keys.reduce(
    (acc, key) => acc + (dailyMap.get(key) ?? 0),
    0,
  );

  const unique30dias = unique30dSet.size;

  const chartData7dias = last7Keys.map((key) => ({
    key,
    label: getDayLabelFromKey(key),
    total: dailyMap.get(key) ?? 0,
  }));

  const maxChartValue = Math.max(
    ...chartData7dias.map((item) => item.total),
    1,
  );

  const topPaths = Array.from(pathMap.entries())
    .map(([path, total]) => ({ path, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const recentAccesses = recentAccessesRaw.slice(0, 20);

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

      <section className={styles.gridStats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total geral</div>
          <div className={styles.statValue}>{totalAcessos}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Hoje</div>
          <div className={styles.statValue}>{totalHoje}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Últimos 7 dias</div>
          <div className={styles.statValue}>{total7dias}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Últimos 30 dias</div>
          <div className={styles.statValue}>{total30dias}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Visitantes aprox. 30 dias</div>
          <div className={styles.statValue}>{unique30dias}</div>
        </div>
      </section>

      <section className={styles.grid2}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.cardHeader}>
            <h2>Acessos por dia • últimos 7 dias</h2>
          </div>

          <div className={styles.barChart}>
            {chartData7dias.map((item) => {
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
          <h2>Últimos acessos</h2>
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
