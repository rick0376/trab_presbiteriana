//src/components/secretaria/escola-dominical/resumo/ResumoEbd.tsx

"use client";

import styles from "./styles.module.scss";

type Props = {
  matriculados?: number;
  presencas?: number;
  faltas?: number;
  percentualPresenca?: number;
};

export default function ResumoEbd({
  matriculados = 0,
  presencas = 0,
  faltas = 0,
  percentualPresenca = 0,
}: Props) {
  return (
    <div className={styles.gridCards}>
      <div className={styles.cardResumo}>
        <strong>Matriculados</strong>
        <span>{matriculados}</span>
      </div>

      <div className={styles.cardResumo}>
        <strong>Presenças</strong>
        <span>{presencas}</span>
      </div>

      <div className={styles.cardResumo}>
        <strong>Faltas</strong>
        <span>{faltas}</span>
      </div>

      <div className={styles.cardResumo}>
        <strong>% presença</strong>
        <span>{percentualPresenca.toFixed(1)}%</span>
      </div>
    </div>
  );
}
