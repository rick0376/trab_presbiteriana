import styles from "./styles.module.scss";
import type { AlunoAptoSorteio, ResumoSorteio } from "../types";

type Props = {
  aptos: AlunoAptoSorteio[];
  resumo: ResumoSorteio | null;
  carregando: boolean;
};

export default function ListaAptosSorteio({
  aptos,
  resumo,
  carregando,
}: Props) {
  return (
    <section className={styles.box}>
      <div className={styles.header}>
        <div>
          <h2>Alunos aptos ao sorteio</h2>
          <p>
            Somente aparecem aqui os alunos que estão dentro da regra definida.
          </p>
        </div>
      </div>

      {resumo && (
        <div className={styles.resumoGrid}>
          <div className={styles.resumoCard}>
            <strong>Período</strong>
            <span>{resumo.periodoLabel}</span>
          </div>

          <div className={styles.resumoCard}>
            <strong>Domingos considerados</strong>
            <span>{resumo.domingosConsiderados}</span>
          </div>

          <div className={styles.resumoCard}>
            <strong>Total da turma</strong>
            <span>{resumo.totalAlunosTurma}</span>
          </div>

          <div className={styles.resumoCard}>
            <strong>Aptos</strong>
            <span>{resumo.totalAptos}</span>
          </div>
        </div>
      )}

      {carregando && (
        <div className={styles.vazio}>Buscando alunos aptos...</div>
      )}

      {!carregando && !aptos.length && (
        <div className={styles.vazio}>
          Nenhum aluno apto encontrado para esse período e essa regra.
        </div>
      )}

      {!carregando && !!aptos.length && (
        <div className={styles.lista}>
          {aptos.map((aluno) => (
            <article key={aluno.id} className={styles.cardAluno}>
              <div className={styles.topo}>
                <div>
                  <h3>{aluno.nome}</h3>
                  <p>
                    Nº {aluno.numeroSequencial ?? "-"} •{" "}
                    {aluno.cargo || "Aluno"}
                  </p>
                </div>

                <span className={styles.badgeOk}>Apto</span>
              </div>

              <div className={styles.metricas}>
                <div>
                  <strong>Presenças</strong>
                  <span>{aluno.presencas}</span>
                </div>

                <div>
                  <strong>Faltas</strong>
                  <span>{aluno.faltas}</span>
                </div>

                <div>
                  <strong>Registros</strong>
                  <span>{aluno.totalRegistros}</span>
                </div>

                <div>
                  <strong>% Presença</strong>
                  <span>{aluno.percentualPresenca.toFixed(1)}%</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
