//src/components/secretaria/escola-dominical/grafico/GraficoEbd.tsx

"use client";

import styles from "./styles.module.scss";

type ItemGrafico = {
  mes: number;
  label: string;
  presencas: number;
  faltas: number;
  visitantes: number;
};

type Props = {
  data?: ItemGrafico[];
};

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function normalizarValor(valor: number) {
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

function calcularLargura(valor: number, maiorValor: number) {
  if (maiorValor <= 0) return 0;
  return Math.max(0, Math.min(100, (valor / maiorValor) * 100));
}

export default function GraficoEbd({ data = [] }: Props) {
  const dadosOrdenados = [...data].sort((a, b) => a.mes - b.mes);

  const maiorValor = Math.max(
    1,
    ...dadosOrdenados.flatMap((item) => [
      normalizarValor(item.presencas),
      normalizarValor(item.faltas),
      normalizarValor(item.visitantes),
    ]),
  );

  const legendas = [
    { chave: "presencas", label: "Presenças" },
    { chave: "faltas", label: "Faltas" },
    { chave: "visitantes", label: "Visitantes" },
  ] as const;

  if (!dadosOrdenados.length) {
    return <div className={styles.vazio}>Nenhum dado para o gráfico.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.legenda}>
        {legendas.map((item) => (
          <div key={item.chave} className={styles.legendaItem}>
            <span
              className={`${styles.cor} ${styles[item.chave]}`}
              aria-hidden="true"
            />
            <small>{item.label}</small>
          </div>
        ))}
      </div>

      <div className={styles.lista}>
        {dadosOrdenados.map((item) => {
          const metricas = [
            {
              chave: "presencas" as const,
              label: "Presenças",
              valor: normalizarValor(item.presencas),
            },
            {
              chave: "faltas" as const,
              label: "Faltas",
              valor: normalizarValor(item.faltas),
            },
            {
              chave: "visitantes" as const,
              label: "Visitantes",
              valor: normalizarValor(item.visitantes),
            },
          ];

          return (
            <article key={item.mes} className={styles.linhaMes}>
              <div className={styles.mesCol}>{item.label}</div>

              <div className={styles.metricasCol}>
                {metricas.map((metrica) => {
                  const largura = calcularLargura(metrica.valor, maiorValor);

                  return (
                    <div key={metrica.chave} className={styles.metricRow}>
                      <span className={styles.metricLabel}>
                        {metrica.label}
                      </span>

                      <div
                        className={styles.barTrack}
                        aria-label={`${metrica.label} em ${item.label}: ${formatarNumero(metrica.valor)}`}
                        title={`${metrica.label}: ${formatarNumero(metrica.valor)}`}
                      >
                        <div
                          className={`${styles.barFill} ${styles[metrica.chave]}`}
                          style={{ width: `${largura}%` }}
                        />
                      </div>

                      <span className={styles.metricValor}>
                        {formatarNumero(metrica.valor)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
