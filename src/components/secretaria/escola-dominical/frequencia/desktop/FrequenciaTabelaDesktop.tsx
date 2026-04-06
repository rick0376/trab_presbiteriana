//src/components/secretaria/escola-dominical/frequencia/desktop/FrequenciaTabelaDesktop.tsx

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
  frequencias: Record<string, EbdStatus>;
  alterarStatus: (
    membroId: string,
    domingoNumero: number,
    status: EbdStatus,
  ) => void;
  canEdit: boolean;
  isDomingoLiberado: (domingoNumero: number) => boolean;
};

export default function FrequenciaTabelaDesktop({
  alunos,
  domingosDoMes,
  frequencias,
  alterarStatus,
  canEdit,
  isDomingoLiberado,
}: Props) {
  return (
    <div className={styles.bloco}>
      <div className={styles.blocoHeader}>
        <h2>Frequência mensal</h2>
      </div>

      <div className={styles.tabelaWrapper}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Aluno</th>
              {domingosDoMes.map((domingo) => (
                <th key={domingo.domingoNumero}>
                  <div className={styles.thDomingo}>
                    <strong>{domingo.domingoNumero}º Domingo</strong>
                    <span>{domingo.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {alunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>
                  <div className={styles.alunoCell}>
                    {aluno.cargo ? ` • ${aluno.cargo}` : ""}
                    <strong>{aluno.nome}</strong>
                    {/*
                    <span>
                      Nº {aluno.numeroSequencial || "-"}
                      {aluno.cargo ? ` • ${aluno.cargo}` : ""}
                    </span>
                    */}
                  </div>
                </td>

                {domingosDoMes.map((domingo) => (
                  <td key={`${aluno.id}-${domingo.domingoNumero}`}>
                    <select
                      disabled={
                        !canEdit || !isDomingoLiberado(domingo.domingoNumero)
                      }
                      value={
                        frequencias[`${aluno.id}-${domingo.domingoNumero}`] ||
                        "FALTA"
                      }
                      onChange={(e) =>
                        alterarStatus(
                          aluno.id,
                          domingo.domingoNumero,
                          e.target.value as EbdStatus,
                        )
                      }
                    >
                      <option value="PRESENTE">P</option>
                      <option value="FALTA">F</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
