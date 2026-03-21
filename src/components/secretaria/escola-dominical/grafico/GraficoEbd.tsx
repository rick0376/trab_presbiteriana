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

export default function GraficoEbd({ data = [] }: Props) {
  const maiorValor = Math.max(
    1,
    ...data.flatMap((item) => [item.presencas, item.faltas, item.visitantes]),
  );

  if (!data.length) {
    return <div className={styles.vazio}>Nenhum dado para o gráfico.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.legenda}>
        <div className={styles.legendaItem}>
          <span className={`${styles.cor} ${styles.presencas}`} />
          <small>Presenças</small>
        </div>

        <div className={styles.legendaItem}>
          <span className={`${styles.cor} ${styles.faltas}`} />
          <small>Faltas</small>
        </div>

        <div className={styles.legendaItem}>
          <span className={`${styles.cor} ${styles.visitantes}`} />
          <small>Visitantes</small>
        </div>
      </div>

      <div className={styles.lista}>
        {data.map((item) => (
          <div key={item.mes} className={styles.linhaMes}>
            <div className={styles.mesCol}>{item.label}</div>

            <div className={styles.metricasCol}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Presenças</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles.presencas}`}
                    style={{
                      width: `${(item.presencas / maiorValor) * 100}%`,
                    }}
                  />
                </div>
                <span className={styles.metricValor}>{item.presencas}</span>
              </div>

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Faltas</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles.faltas}`}
                    style={{
                      width: `${(item.faltas / maiorValor) * 100}%`,
                    }}
                  />
                </div>
                <span className={styles.metricValor}>{item.faltas}</span>
              </div>

              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Visitantes</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles.visitantes}`}
                    style={{
                      width: `${(item.visitantes / maiorValor) * 100}%`,
                    }}
                  />
                </div>
                <span className={styles.metricValor}>{item.visitantes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
