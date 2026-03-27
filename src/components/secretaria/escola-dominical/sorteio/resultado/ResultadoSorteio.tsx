//src/components/secretaria/escola-dominical/sorteio/resultado/ResultadoSorteio.tsx

import styles from "./styles.module.scss";
import type { AlunoAptoSorteio } from "../types";

type Props = {
  vencedor: AlunoAptoSorteio | null;
  nomeRodando: string;
  sorteando: boolean;
  podeSortear: boolean;
  onSortear: () => void;
};

export default function ResultadoSorteio({
  vencedor,
  nomeRodando,
  sorteando,
  podeSortear,
  onSortear,
}: Props) {
  const textoTela = sorteando
    ? nomeRodando || "Sorteando..."
    : vencedor?.nome || "Clique no botão para iniciar o sorteio";

  return (
    <section className={styles.box}>
      <div className={styles.header}>
        <h2>Resultado do sorteio</h2>
        <p>O sorteio será feito somente entre os alunos aptos.</p>
      </div>

      <div className={`${styles.display} ${sorteando ? styles.animando : ""}`}>
        {sorteando && (
          <div className={styles.rodandoTopo}>
            <div className={styles.spinner} />
            <span>Sorteando aluno...</span>
          </div>
        )}

        <span className={styles.nomeTela}>{textoTela}</span>

        {sorteando && (
          <div className={styles.rodapeAnimado}>
            <span className={styles.ponto1}>.</span>
            <span className={styles.ponto2}>.</span>
            <span className={styles.ponto3}>.</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.botao}
        onClick={onSortear}
        disabled={!podeSortear || sorteando}
      >
        {sorteando ? "Sorteando..." : "Iniciar sorteio"}
      </button>

      {vencedor && !sorteando && (
        <div className={styles.vencedor}>
          <strong>Aluno sorteado</strong>
          <h3>{vencedor.nome}</h3>
          <p>
            Presenças: {vencedor.presencas} • Faltas: {vencedor.faltas} • %
            Presença: {vencedor.percentualPresenca.toFixed(1)}%
          </p>
        </div>
      )}
    </section>
  );
}
