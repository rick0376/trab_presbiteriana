//src/components/secretaria/escola-dominical/resumo/ResumoEbd.tsx

"use client";

import styles from "./styles.module.scss";

type Props = {
  matriculados?: number;
  presencas?: number;
  faltas?: number;
  percentualPresenca?: number;
};

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

export default function ResumoEbd({
  matriculados = 0,
  presencas = 0,
  faltas = 0,
  percentualPresenca = 0,
}: Props) {
  const percentualSeguro = Number.isFinite(percentualPresenca)
    ? Math.max(0, percentualPresenca)
    : 0;

  const cards = [
    {
      titulo: "Matriculados",
      valor: formatarNumero(matriculados),
      descricao: "Total de alunos cadastrados",
      icone: "👥",
    },
    {
      titulo: "Presenças",
      valor: formatarNumero(presencas),
      descricao: "Registros de presença lançados",
      icone: "✅",
    },
    {
      titulo: "Faltas",
      valor: formatarNumero(faltas),
      descricao: "Registros de ausência lançados",
      icone: "⚠️",
    },
    {
      titulo: "% presença",
      valor: `${percentualSeguro.toFixed(1)}%`,
      descricao: "Aproveitamento geral da frequência",
      icone: "📊",
    },
  ];

  return (
    <div className={styles.gridCards}>
      {cards.map((card) => (
        <article key={card.titulo} className={styles.cardResumo}>
          <div className={styles.cardTopo}>
            <span className={styles.cardIcone} aria-hidden="true">
              {card.icone}
            </span>

            <div className={styles.cardTextos}>
              <strong>{card.titulo}</strong>
              <small>{card.descricao}</small>
            </div>
          </div>

          <span className={styles.cardValor}>{card.valor}</span>
        </article>
      ))}
    </div>
  );
}
