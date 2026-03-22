//src/components/secretaria/escola-dominical/frequencia/mobile/FrequenciaChamadaMobile.tsx

"use client";

import styles from "./styles.module.scss";

type EbdStatus = "PRESENTE" | "FALTA";

type Aluno = {
  id: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
};

type DomingoDoMes = {
  domingoNumero: number;
  dataISO: string;
  label: string;
  labelCurta: string;
};

type Props = {
  alunos: Aluno[];
  domingosDoMes: DomingoDoMes[];
  domingoSelecionadoNumero: string;
  setDomingoSelecionadoNumero: (value: string) => void;
  frequencias: Record<string, EbdStatus>;
  alterarStatus: (
    membroId: string,
    domingoNumero: number,
    status: EbdStatus,
  ) => void;
  canEdit: boolean;
  salvando: boolean;
  isDomingoLiberado: (domingoNumero: number) => boolean;
  salvarFrequencia: () => void;
  erro?: string;
  sucesso?: string;
};

export default function FrequenciaChamadaMobile({
  alunos,
  domingosDoMes,
  domingoSelecionadoNumero,
  setDomingoSelecionadoNumero,
  frequencias,
  alterarStatus,
  canEdit,
  salvando,
  salvarFrequencia,
  erro,
  sucesso,
  isDomingoLiberado,
}: Props) {
  const domingoNumero = Number(domingoSelecionadoNumero);
  const domingoLiberado = isDomingoLiberado(domingoNumero);

  const presencas = alunos.filter(
    (aluno) => frequencias[`${aluno.id}-${domingoNumero}`] === "PRESENTE",
  ).length;

  const faltas = alunos.length - presencas;

  return (
    <div className={styles.mobileBox}>
      <div className={styles.bloco}>
        <div className={styles.blocoHeader}>
          <h2>Chamada rápida</h2>
        </div>

        <div className={styles.mobileTopBar}>
          <div className={styles.filtroItem}>
            <label>Domingo do mês</label>
            <select
              value={domingoSelecionadoNumero}
              onChange={(e) => setDomingoSelecionadoNumero(e.target.value)}
            >
              {domingosDoMes.map((domingo) => (
                <option
                  key={domingo.domingoNumero}
                  value={domingo.domingoNumero}
                >
                  {domingo.label} • {domingo.domingoNumero}º domingo
                </option>
              ))}
            </select>
          </div>

          <div className={styles.mobileResumoDia}>
            <span>Presentes: {presencas}</span>
            <span>Faltas: {faltas}</span>
          </div>
          {!domingoLiberado && (
            <div className={styles.avisoBloqueio}>
              Este domingo ainda não pode receber presença ou falta.
            </div>
          )}
        </div>

        <div className={styles.mobileCards}>
          {alunos.map((aluno) => {
            const chave = `${aluno.id}-${domingoNumero}`;
            const statusAtual = frequencias[chave] || "FALTA";

            return (
              <div key={aluno.id} className={styles.alunoCardMobile}>
                <div className={styles.alunoCardHeader}>
                  <strong>{aluno.nome}</strong>
                  <span>
                    Nº {aluno.numeroSequencial || "-"}
                    {aluno.cargo ? ` • ${aluno.cargo}` : ""}
                  </span>
                </div>

                <div className={styles.alunoCardActions}>
                  <button
                    type="button"
                    disabled={!canEdit || !domingoLiberado}
                    className={`${styles.btnStatus} ${
                      statusAtual === "PRESENTE" ? styles.btnPresenteAtivo : ""
                    }`}
                    onClick={() =>
                      alterarStatus(aluno.id, domingoNumero, "PRESENTE")
                    }
                  >
                    ✓ Presente
                  </button>

                  <button
                    type="button"
                    disabled={!canEdit || !domingoLiberado}
                    className={`${styles.btnStatus} ${
                      statusAtual === "FALTA" ? styles.btnFaltaAtivo : ""
                    }`}
                    onClick={() =>
                      alterarStatus(aluno.id, domingoNumero, "FALTA")
                    }
                  >
                    ✕ Falta
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!!erro && <div className={styles.erroBox}>{erro}</div>}
        {!!sucesso && <div className={styles.sucessoBox}>{sucesso}</div>}

        {canEdit && (
          <div className={styles.salvarArea}>
            <button
              type="button"
              className={styles.salvarBotaoMobile}
              onClick={salvarFrequencia}
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar frequência"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
