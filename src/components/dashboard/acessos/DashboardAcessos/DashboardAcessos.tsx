//src/components/dashboard/acessos/DashboardAcessos/DashboardAcessos.tsx

"use client";

import Link from "next/link";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle } from "lucide-react";
import styles from "./styles.module.scss";

const TZ = "America/Sao_Paulo";

type DeviceTotals = {
  desktop: number;
  mobile: number;
  tablet: number;
  bot: number;
  other: number;
};

type SourceTotals = {
  pwa: number;
  direto: number;
  referrer: number;
  utm: number;
};

type ChartPoint = {
  key: string;
  label: string;
  total: number;
};

type TopPath = {
  path: string;
  total: number;
};

type RecentAccess = {
  id: string;
  createdAt: string;
  path: string | null;
  deviceType: string | null;
  displayMode?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  visitorId?: string | null;
  ipHash?: string | null;
};

type EmptyProps = {
  mode: "empty";
  backHref: string;
  backLabel: string;
  title: string;
  subtitle: string;
  message: string;
};

type DefaultProps = {
  mode: "default";
  backHref: string;
  backLabel: string;
  title: string;
  subtitle: string;
  selectedDe: string;
  selectedAte: string;
  periodDays: number;
  periodoLabel: string;
  nomeCliente: string;
  hojeHref: string;
  seteDiasHref: string;
  trintaDiasHref: string;
  totalAcessosGeral: number;
  totalPeriodo: number;
  uniquePeriodo: number;
  mediaPorDia: number;
  updatedAt: string | null;
  chartData: ChartPoint[];
  deviceTotals: DeviceTotals;
  sourceTotals: SourceTotals;
  topPaths: TopPath[];
  recentAccesses: RecentAccess[];
  canShare: boolean;
};

type Props = EmptyProps | DefaultProps;

function formatDateTimeBR(dateString: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(dateString));
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

export default function DashboardAcessos(props: Props) {
  if (props.mode === "empty") {
    return (
      <div className={styles.container}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.h1}>{props.title}</h1>
            <p className={styles.sub}>{props.subtitle}</p>
          </div>

          <Link href={props.backHref} className={styles.backLink}>
            {props.backLabel}
          </Link>
        </div>

        <div className={styles.card}>
          <p className={styles.empty}>{props.message}</p>
        </div>
      </div>
    );
  }

  const {
    backHref,
    backLabel,
    title,
    subtitle,
    selectedDe,
    selectedAte,
    periodDays,
    periodoLabel,
    nomeCliente,
    hojeHref,
    seteDiasHref,
    trintaDiasHref,
    totalAcessosGeral,
    totalPeriodo,
    uniquePeriodo,
    mediaPorDia,
    updatedAt,
    chartData,
    deviceTotals,
    sourceTotals,
    topPaths,
    recentAccesses,
    canShare,
  } = props;

  const maxChartValue = Math.max(...chartData.map((item) => item.total), 1);

  const getLogoBase64 = async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const resp = await fetch(`${origin}/images/logo.png`, {
        cache: "no-store",
      });

      if (!resp.ok) return "";

      const blob = await resp.blob();

      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  const gerarPdf = async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

    const logoDataUri = await getLogoBase64();

    const dt = new Date();
    const dataBR = dt.toLocaleDateString("pt-BR", {
      timeZone: TZ,
    });
    const horaBR = dt.toLocaleTimeString("pt-BR", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
    });

    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");

      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("RELATÓRIO DE ACESSOS", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(nomeCliente, 10, 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataBR} ${horaBR}`, pageWidth / 2, 28, {
        align: "center",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Período: ${periodoLabel}`, pageWidth - 10, 30, {
        align: "right",
      });
    };

    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 10;

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        doc.text(nomeCliente, margin, footerY);

        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 50;
        printHeader();
      }
    };

    const printSectionTitle = (sectionTitle: string) => {
      checkPageBreak(10);

      doc.setFillColor(236, 241, 244);
      doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 8, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(34, 79, 110);
      doc.text(sectionTitle, margin + 4, y);

      y += 10;
    };

    const printRow = (label: string, value: string) => {
      checkPageBreak(8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.text(label, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(value, 70, y);

      y += 6;
    };

    const printTableHeader = (
      cols: Array<{ label: string; x: number }>,
      startY: number,
    ) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      cols.forEach((col) => {
        doc.text(col.label, col.x, startY);
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, startY + 2, pageWidth - margin, startY + 2);
    };

    printHeader();

    printSectionTitle("Resumo");
    printRow("Total geral", String(totalAcessosGeral));
    printRow("Total no período", String(totalPeriodo));
    printRow("Visitantes aprox.", String(uniquePeriodo));
    printRow("Média por dia", String(mediaPorDia));

    printSectionTitle("Dispositivos");
    printRow("Desktop", String(deviceTotals.desktop));
    printRow("Mobile", String(deviceTotals.mobile));
    printRow("Tablet", String(deviceTotals.tablet));
    printRow("Bot", String(deviceTotals.bot));
    printRow("Outros", String(deviceTotals.other));

    printSectionTitle("Origem dos acessos");
    printRow("UTM", String(sourceTotals.utm));
    printRow("PWA", String(sourceTotals.pwa));
    printRow("Referrer", String(sourceTotals.referrer));
    printRow("Direto", String(sourceTotals.direto));

    printSectionTitle("Páginas mais acessadas");
    if (topPaths.length === 0) {
      printRow("Nenhuma página", "-");
    } else {
      topPaths.forEach((item) => {
        printRow(item.path || "-", `${item.total} acesso(s)`);
      });
    }

    printSectionTitle("Últimos acessos");

    const tableCols = [
      { label: "Data/Hora", x: margin },
      { label: "Página", x: 52 },
      { label: "Disp.", x: 98 },
      { label: "Modo", x: 122 },
      { label: "Origem", x: 150 },
    ];

    checkPageBreak(14);
    printTableHeader(tableCols, y);
    y += 8;

    const ultimos = recentAccesses.slice(0, 12);

    if (ultimos.length === 0) {
      printRow("Nenhum acesso", "-");
    } else {
      ultimos.forEach((item) => {
        checkPageBreak(10);

        const origem = getOrigemLabel(item);
        const origemCurta =
          origem.length > 26 ? `${origem.slice(0, 26)}...` : origem;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);

        doc.text(formatDateTimeBR(item.createdAt), margin, y);
        doc.text(item.path || "-", 52, y);
        doc.text(item.deviceType || "-", 98, y);
        doc.text(getModoLabel(item.displayMode), 122, y);
        doc.text(origemCurta, 150, y);

        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);

        y += 6;
      });
    }

    printFooter();
    doc.save("relatorio-acessos.pdf");
  };

  const enviarWhats = () => {
    const dt = new Date();
    const dataBR = dt.toLocaleDateString("pt-BR", {
      timeZone: TZ,
    });
    const horaBR = dt.toLocaleTimeString("pt-BR", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
    });

    let texto = `📊 *RELATÓRIO DE ACESSOS*\n`;
    texto += `Período: *${periodoLabel}*\n`;
    texto += `Gerado em: ${dataBR} ${horaBR}\n\n`;

    texto += `*Resumo*\n`;
    texto += `• Total geral: ${totalAcessosGeral}\n`;
    texto += `• Total no período: ${totalPeriodo}\n`;
    texto += `• Visitantes aprox.: ${uniquePeriodo}\n`;
    texto += `• Média por dia: ${mediaPorDia}\n\n`;

    texto += `*Dispositivos*\n`;
    texto += `• Desktop: ${deviceTotals.desktop}\n`;
    texto += `• Mobile: ${deviceTotals.mobile}\n`;
    texto += `• Tablet: ${deviceTotals.tablet}\n`;
    texto += `• Bot: ${deviceTotals.bot}\n`;
    texto += `• Outros: ${deviceTotals.other}\n\n`;

    texto += `*Origem dos acessos*\n`;
    texto += `• UTM: ${sourceTotals.utm}\n`;
    texto += `• PWA: ${sourceTotals.pwa}\n`;
    texto += `• Referrer: ${sourceTotals.referrer}\n`;
    texto += `• Direto: ${sourceTotals.direto}\n\n`;

    texto += `*Páginas mais acessadas*\n`;
    if (topPaths.length === 0) {
      texto += `• Nenhuma\n`;
    } else {
      topPaths.slice(0, 5).forEach((item) => {
        texto += `• ${item.path}: ${item.total}\n`;
      });
    }

    texto += `\n*Últimos acessos*\n`;
    if (recentAccesses.length === 0) {
      texto += `• Nenhum acesso\n`;
    } else {
      recentAccesses.slice(0, 5).forEach((item) => {
        texto += `• ${formatDateTimeBR(item.createdAt)} | ${item.path || "-"} | ${item.deviceType || "-"} | ${getModoLabel(item.displayMode)}\n`;
      });
    }

    texto += `\n📌 *Sistema Igreja*`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>{title}</h1>
          <p className={styles.sub}>{subtitle}</p>
        </div>

        <Link href={backHref} className={styles.backLink}>
          {backLabel}
        </Link>
      </div>

      <section className={`${styles.card} ${styles.filterCard}`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.h2}>Filtro por período</h2>
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

            <Link
              href={backHref.replace("/dashboard", "/dashboard/acessos")}
              className={styles.clearButton}
            >
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
          Período selecionado: {periodoLabel} • {periodDays} dia(s)
        </div>
      </section>

      {canShare && (
        <div className={styles.actionsRow}>
          <button type="button" className={styles.btnPDF} onClick={gerarPdf}>
            <FileText size={16} /> PDF
          </button>

          <button
            type="button"
            className={styles.btnWhats}
            onClick={enviarWhats}
          >
            <MessageCircle size={16} /> Whats
          </button>
        </div>
      )}

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
              {updatedAt ? formatDateTimeBR(updatedAt) : "Sem atualização"}
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
                    <td>{formatDateTimeBR(item.createdAt)}</td>
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
