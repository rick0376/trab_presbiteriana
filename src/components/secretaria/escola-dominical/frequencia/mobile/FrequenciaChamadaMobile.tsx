//src/components/secretaria/escola-dominical/frequencia/mobile/FrequenciaChamadaMobile.tsx

"use client";
import { useMemo } from "react";
import styles from "./styles.module.scss";
import { Save } from "lucide-react";
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
function formatarNumeroSequencial(valor?: number | null) {
  if (typeof valor !== "number" || Number.isNaN(valor)) return "-";
  return String(valor).padStart(4, "0");
}
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
  const domingoNumero = useMemo(() => {
    const numero = Number(domingoSelecionadoNumero);
    return Number.isFinite(numero) ? numero : 0;
  }, [domingoSelecionadoNumero]);
  const domingoSelecionado = useMemo(() => {
    return (
      domingosDoMes.find((item) => item.domingoNumero === domingoNumero) || null
    );
  }, [domingosDoMes, domingoNumero]);
  const domingoLiberado = useMemo(() => {
    if (!domingoNumero) return false;
    return isDomingoLiberado(domingoNumero);
  }, [domingoNumero, isDomingoLiberado]);
  const alunosComStatus = useMemo(() => {
    return alunos.map((aluno) => {
      const chave = `${aluno.id}-${domingoNumero}`;
      const statusAtual = frequencias[chave] || "FALTA";
      return {
        ...aluno,
        statusAtual,
        numeroSequencialFormatado: formatarNumeroSequencial(
          aluno.numeroSequencial,
        ),
      };
    });
  }, [alunos, frequencias, domingoNumero]);
  const presencas = useMemo(() => {
    return alunosComStatus.filter((aluno) => aluno.statusAtual === "PRESENTE")
      .length;
  }, [alunosComStatus]);
  const faltas = useMemo(() => {
    return alunosComStatus.length - presencas;
  }, [alunosComStatus.length, presencas]);
  return (
    <div className={styles.mobileBox}>
      {" "}
      <section className={styles.bloco}>
        {" "}
        <div className={styles.blocoHeader}>
          {" "}
          <div>
            {" "}
            <h2>Chamada rápida</h2>{" "}
            <p>
              {" "}
              {domingoSelecionado
                ? `${domingoSelecionado.label} • ${domingoSelecionado.domingoNumero}º domingo`
                : "Selecione o domingo do mês"}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className={styles.mobileTopBar}>
          {" "}
          <div className={styles.filtroItem}>
            {" "}
            <label>Domingo do mês</label>{" "}
            <select
              value={domingoSelecionadoNumero}
              onChange={(e) => setDomingoSelecionadoNumero(e.target.value)}
            >
              {" "}
              {domingosDoMes.map((domingo) => (
                <option
                  key={domingo.domingoNumero}
                  value={domingo.domingoNumero}
                >
                  {" "}
                  {domingo.label} • {domingo.domingoNumero}º domingo{" "}
                </option>
              ))}{" "}
            </select>{" "}
          </div>{" "}
          <div className={styles.mobileResumoDia}>
            {" "}
            <div className={styles.resumoChip}>
              {" "}
              <span className={styles.resumoLabel}>Presentes</span>{" "}
              <strong className={styles.resumoValor}>{presencas}</strong>{" "}
            </div>{" "}
            <div className={styles.resumoChip}>
              {" "}
              <span className={styles.resumoLabel}>Faltas</span>{" "}
              <strong className={styles.resumoValor}>{faltas}</strong>{" "}
            </div>{" "}
          </div>{" "}
          {!domingoLiberado && (
            <div className={styles.avisoBloqueio}>
              {" "}
              Este domingo ainda não pode receber presença ou falta.{" "}
            </div>
          )}{" "}
        </div>{" "}
        <div className={styles.mobileCards}>
          {" "}
          {alunosComStatus.map((aluno) => (
            <article key={aluno.id} className={styles.alunoCardMobile}>
              {" "}
              <div className={styles.alunoCardHeader}>
                {" "}
                <strong>{aluno.nome}</strong>{" "}
                <span>
                  {" "}
                  IPR - {aluno.numeroSequencialFormatado}{" "}
                  {aluno.cargo ? ` • ${aluno.cargo}` : ""}{" "}
                </span>{" "}
              </div>{" "}
              <div className={styles.alunoCardActions}>
                {" "}
                <button
                  type="button"
                  disabled={!canEdit || !domingoLiberado}
                  className={`${styles.btnStatus} ${aluno.statusAtual === "PRESENTE" ? styles.btnPresenteAtivo : ""}`}
                  onClick={() =>
                    alterarStatus(aluno.id, domingoNumero, "PRESENTE")
                  }
                >
                  {" "}
                  ✓ Presente{" "}
                </button>{" "}
                <button
                  type="button"
                  disabled={!canEdit || !domingoLiberado}
                  className={`${styles.btnStatus} ${aluno.statusAtual === "FALTA" ? styles.btnFaltaAtivo : ""}`}
                  onClick={() =>
                    alterarStatus(aluno.id, domingoNumero, "FALTA")
                  }
                >
                  {" "}
                  ✕ Falta{" "}
                </button>{" "}
              </div>{" "}
            </article>
          ))}{" "}
        </div>{" "}
        {!!erro && <div className={styles.erroBox}>{erro}</div>}{" "}
        {!!sucesso && <div className={styles.sucessoBox}>{sucesso}</div>}{" "}
        {canEdit && (
          <div className={styles.salvarArea}>
            <button
              type="button"
              className={styles.salvarTopoBotao}
              onClick={salvarFrequencia}
              disabled={salvando}
            >
              <Save size={22} />
              {salvando ? "Salvando..." : "Salvar frequência"}
            </button>
          </div>
        )}{" "}
      </section>{" "}
    </div>
  );
}
