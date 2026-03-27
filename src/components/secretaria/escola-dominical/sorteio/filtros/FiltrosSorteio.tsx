import styles from "./styles.module.scss";
import type { TurmaSorteioOption } from "../types";

type Props = {
  turmas: TurmaSorteioOption[];
  turmaId: string;
  setTurmaId: (value: string) => void;
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  maxFaltas: number;
  setMaxFaltas: (value: number) => void;
  onBuscar: () => void;
  carregando: boolean;
};

export default function FiltrosSorteio({
  turmas,
  turmaId,
  setTurmaId,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  maxFaltas,
  setMaxFaltas,
  onBuscar,
  carregando,
}: Props) {
  return (
    <section className={styles.box}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label>Turma</label>
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            disabled={carregando}
          >
            <option value="">Selecione</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Data inicial</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            disabled={carregando}
          />
        </div>

        <div className={styles.field}>
          <label>Data final</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            disabled={carregando}
          />
        </div>

        <div className={styles.field}>
          <label>Máximo de faltas permitido</label>
          <input
            type="number"
            min={0}
            value={maxFaltas}
            onChange={(e) =>
              setMaxFaltas(e.target.value === "" ? 0 : Number(e.target.value))
            }
            disabled={carregando}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onBuscar} disabled={carregando}>
          {carregando ? "Buscando..." : "Buscar alunos aptos"}
        </button>
      </div>
    </section>
  );
}
