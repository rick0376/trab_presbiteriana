//src/components/secretaria/escola-dominical/relatorio-periodo/RelatorioPeriodoEbd.tsx

"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle } from "lucide-react";
import styles from "./styles.module.scss";
type Props = { igrejaId: string };
type Turma = {
  id: string;
  nome: string;
  departamento?: string | null;
  ativa: boolean;
};
type RelatorioAluno = {
  membroId: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
  totalAulas: number;
  presencas: number;
  faltas: number;
  percentualPresenca: number;
};
type RelatorioResponse = {
  turma: {
    id: string;
    nome: string;
    departamento?: string | null;
    professor: { nome: string; cargo?: string | null } | null;
  };
  periodo: { inicio: string; fim: string; label: string };
  cards: {
    totalAulas: number;
    totalAlunos: number;
    presencas: number;
    faltas: number;
    percentualPresenca: number;
  };
  alunos: RelatorioAluno[];
};
type Permissao = {
  id?: string;
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
  compartilhar: boolean;
};
type MeResponse = {
  id: string;
  role: "SUPERADMIN" | "ADMIN" | "PASTOR" | "USER";
};
const RECURSO_EBD = "escola_dominical";
const PERM_DEFAULT_EBD: Permissao = {
  recurso: RECURSO_EBD,
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};
function getMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}
function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}
function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
async function getJsonOrThrow<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Ocorreu um erro na requisição.");
  }
  return data as T;
}
function getPermissaoTotal(): Permissao {
  return {
    recurso: RECURSO_EBD,
    ler: true,
    criar: true,
    editar: true,
    deletar: true,
    compartilhar: true,
  };
}
export default function RelatorioPeriodoEbd({ igrejaId }: Props) {
  const mesAtual = getMesAtual();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [inicio, setInicio] = useState(mesAtual);
  const [fim, setFim] = useState(mesAtual);
  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [erro, setErro] = useState("");
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
  const canView = !!permissaoEbd?.ler;
  const canShare = !!permissaoEbd?.compartilhar;
  const turmaSelecionada = useMemo(() => {
    return turmas.find((item) => item.id === turmaId) || null;
  }, [turmas, turmaId]);
  const cardsResumo = useMemo(() => {
    if (!relatorio) return [];
    return [
      {
        titulo: "Total de aulas",
        valor: formatarNumero(relatorio.cards.totalAulas),
        classe: styles.card01,
      },
      {
        titulo: "Total de alunos",
        valor: formatarNumero(relatorio.cards.totalAlunos),
        classe: styles.card02,
      },
      {
        titulo: "Presenças",
        valor: formatarNumero(relatorio.cards.presencas),
        classe: styles.card03,
      },
      {
        titulo: "Faltas",
        valor: formatarNumero(relatorio.cards.faltas),
        classe: styles.card04,
      },
      {
        titulo: "% presença",
        valor: `${relatorio.cards.percentualPresenca.toFixed(1)}%`,
        classe: styles.card05,
      },
    ];
  }, [relatorio]);
  const carregarPermissoes = useCallback(async () => {
    try {
      setLoadingPerms(true);
      const meData = await getJsonOrThrow<MeResponse>("/api/me", {
        cache: "no-store",
      }).catch(() => null);
      if (!meData) {
        setPermissaoEbd(PERM_DEFAULT_EBD);
        return;
      }
      if (meData.role === "SUPERADMIN") {
        setPermissaoEbd(getPermissaoTotal());
        return;
      }
      const permissoes = await getJsonOrThrow<Permissao[]>(
        `/api/permissoes?userId=${meData.id}`,
        { cache: "no-store" },
      ).catch(() => []);
      const permissaoEncontrada = permissoes.find(
        (item) => item.recurso === RECURSO_EBD,
      );
      setPermissaoEbd(permissaoEncontrada ?? PERM_DEFAULT_EBD);
    } catch {
      setPermissaoEbd(PERM_DEFAULT_EBD);
    } finally {
      setLoadingPerms(false);
    }
  }, []);
  const carregarTurmas = useCallback(async () => {
    if (!igrejaId || !canView) return;
    try {
      setLoadingTurmas(true);
      setErro("");
      const data = await getJsonOrThrow<Turma[]>(
        `/api/secretaria/escola-dominical/turmas?igrejaId=${igrejaId}`,
        { cache: "no-store" },
      );
      const lista = Array.isArray(data) ? data : [];
      setTurmas(lista);
      if (lista.length > 0) {
        setTurmaId((current) => current || lista[0].id);
      }
    } catch (error) {
      setErro(getErrorMessage(error, "Erro ao carregar turmas."));
    } finally {
      setLoadingTurmas(false);
    }
  }, [igrejaId, canView]);
  const carregarRelatorio = useCallback(async () => {
    if (!igrejaId || !turmaId || !inicio || !fim || !canView) return;
    try {
      if (inicio > fim) {
        setErro("O período inicial não pode ser maior que o final.");
        setRelatorio(null);
        return;
      }
      setLoadingRelatorio(true);
      setErro("");
      const qs = new URLSearchParams();
      qs.set("igrejaId", igrejaId);
      qs.set("turmaId", turmaId);
      qs.set("inicio", inicio);
      qs.set("fim", fim);
      const data = await getJsonOrThrow<RelatorioResponse>(
        `/api/secretaria/escola-dominical/relatorio-periodo?${qs.toString()}`,
        { cache: "no-store" },
      );
      setRelatorio(data);
    } catch (error) {
      setErro(getErrorMessage(error, "Erro ao carregar relatório."));
      setRelatorio(null);
    } finally {
      setLoadingRelatorio(false);
    }
  }, [igrejaId, turmaId, inicio, fim, canView]);
  useEffect(() => {
    carregarPermissoes();
  }, [carregarPermissoes]);
  useEffect(() => {
    if (!igrejaId) return;
    if (!permissaoEbd) return;
    if (!canView) {
      setTurmas([]);
      setRelatorio(null);
      setLoadingTurmas(false);
      return;
    }
    carregarTurmas();
  }, [igrejaId, permissaoEbd, canView, carregarTurmas]);
  useEffect(() => {
    if (!igrejaId || !turmaId || !inicio || !fim) return;
    if (!permissaoEbd || !canView) return;
    carregarRelatorio();
  }, [
    igrejaId,
    turmaId,
    inicio,
    fim,
    permissaoEbd,
    canView,
    carregarRelatorio,
  ]);
  function gerarTextoWhats() {
    if (!relatorio) return "";
    const dt = new Date();
    const dataBR = dt.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const horaBR = dt.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });
    let texto = `📘 *RELATÓRIO POR PERÍODO - EBD*\n`;
    texto += `⛪ Turma: ${relatorio.turma.nome}\n`;
    texto += `🏷 Departamento: ${relatorio.turma.departamento || "-"}\n`;
    texto += `👩‍🏫 Professor: ${relatorio.turma.professor?.nome || "-"}\n`;
    texto += `🗓 Período: ${relatorio.periodo.label}\n`;
    texto += `📅 Gerado em: ${dataBR} ${horaBR}\n\n`;
    texto += `📊 *RESUMO GERAL*\n`;
    texto += `• Total de aulas: ${relatorio.cards.totalAulas}\n`;
    texto += `• Total de alunos: ${relatorio.cards.totalAlunos}\n`;
    texto += `• Presenças: ${relatorio.cards.presencas}\n`;
    texto += `• Faltas: ${relatorio.cards.faltas}\n`;
    texto += `• % Presença: ${relatorio.cards.percentualPresenca.toFixed(1)}%\n\n`;
    texto += `👥 *ALUNOS DA TURMA*\n`;
    if (relatorio.alunos.length === 0) {
      texto += `• Nenhum aluno encontrado.\n`;
    } else {
      relatorio.alunos.forEach((aluno) => {
        texto += `• ${aluno.nome}`;
        texto += ` | Nº ${aluno.numeroSequencial || "-"}`;
        texto += ` | P: ${aluno.presencas}`;
        texto += ` | F: ${aluno.faltas}`;
        texto += ` | ${aluno.percentualPresenca.toFixed(1)}%\n`;
      });
    }
    return texto;
  }
  function compartilharWhats() {
    if (!relatorio || !canShare) return;
    const texto = gerarTextoWhats();
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  }
  async function gerarPDF() {
    if (!relatorio || !canShare) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 8;
    let y = 48;
    const nomeCliente = relatorio.turma.nome || "Escola Dominical";
    const getLogoBase64 = async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const resp = await fetch(`${origin}/images/logo.png`, {
          cache: "no-store",
        });
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };
    const logoDataUri = await getLogoBase64();
    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");
      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("RELATÓRIO POR PERÍODO - EBD", pageWidth / 2, 18, {
        align: "center",
      });
      const dt = new Date();
      const dataBR = dt.toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      const horaBR = dt.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataBR} ${horaBR}`, pageWidth / 2, 28, {
        align: "center",
      });
    };
    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 10;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(nomeCliente, margin, footerY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };
    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 48;
        printHeader();
      }
    };
    const labelX = margin;
    const valueX = 60;
    const valueMaxWidth = pageWidth - margin - valueX;
    const addSection = (titulo: string) => {
      checkPageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(25, 35, 55);
      doc.text(titulo, labelX, y);
      y += 6;
    };
    const addField = (label: string, value: string) => {
      const safeValue = value && value.trim() ? value.trim() : "-";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(safeValue, valueMaxWidth);
      const height = Math.max(lines.length * 4, 4);
      checkPageBreak(height + 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.text(label, labelX, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, valueX, y);
      y += height + 3;
    };
    printHeader();
    addSection("Dados da turma");
    addField("TURMA", relatorio.turma.nome || "-");
    addField("DEPARTAMENTO", relatorio.turma.departamento || "-");
    addField("PROFESSOR", relatorio.turma.professor?.nome || "-");
    addField("PERÍODO", relatorio.periodo.label || "-");
    addSection("Resumo geral");
    addField("TOTAL DE AULAS", String(relatorio.cards.totalAulas));
    addField("TOTAL DE ALUNOS", String(relatorio.cards.totalAlunos));
    addField("PRESENÇAS", String(relatorio.cards.presencas));
    addField("FALTAS", String(relatorio.cards.faltas));
    addField("% PRESENÇA", `${relatorio.cards.percentualPresenca.toFixed(1)}%`);
    addSection("Alunos da turma");
    if (relatorio.alunos.length === 0) {
      addField("ALUNOS", "Nenhum aluno encontrado nesta turma.");
    } else {
      relatorio.alunos.forEach((aluno, index) => {
        addField(
          `ALUNO ${index + 1}`,
          `${aluno.nome} | Nº ${aluno.numeroSequencial || "-"}${aluno.cargo ? ` | ${aluno.cargo}` : ""} | Total aulas: ${aluno.totalAulas} | Presenças: ${aluno.presencas} | Faltas: ${aluno.faltas} | % Presença: ${aluno.percentualPresenca.toFixed(1)}%`,
        );
      });
    }
    printFooter();
    doc.save(
      `relatorio-periodo-ebd-${(relatorio.turma.nome || "turma").replace(/\s+/g, "-").toLowerCase()}-${relatorio.periodo.inicio}-${relatorio.periodo.fim}.pdf`,
    );
  }
  if (loadingPerms) {
    return (
      <div className={styles.container}>
        {" "}
        <div className={styles.placeholder}>Carregando permissões...</div>{" "}
      </div>
    );
  }
  if (!canView) {
    return (
      <div className={styles.container}>
        {" "}
        <div className={styles.errorBox}>
          {" "}
          ⛔ Você não tem permissão para visualizar o relatório por período da
          Escola Dominical.{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <div className={styles.container}>
      {" "}
      <section className={styles.header}>
        {" "}
        <div className={styles.headerContent}>
          {" "}
          <span className={styles.headerTag}>Relatório Analítico</span>{" "}
          <h1>Relatório por período da EBD</h1>{" "}
          <p>
            {" "}
            Selecione uma turma e um intervalo de meses para ver presenças,
            faltas e percentual por aluno.{" "}
          </p>{" "}
        </div>{" "}
        <div className={styles.headerActions}>
          {" "}
          {canShare && (
            <button
              type="button"
              className={styles.btnPDF}
              onClick={gerarPDF}
              disabled={!relatorio || loadingRelatorio}
            >
              {" "}
              <FileText size={16} /> PDF{" "}
            </button>
          )}{" "}
          {canShare && (
            <button
              type="button"
              className={styles.btnWhats}
              onClick={compartilharWhats}
              disabled={!relatorio || loadingRelatorio}
            >
              {" "}
              <MessageCircle size={16} /> Whats{" "}
            </button>
          )}{" "}
          <Link
            href="/secretaria/escola-dominical"
            className={styles.secondaryButton}
          >
            {" "}
            Dashboard EBD{" "}
          </Link>{" "}
          <Link
            href="/secretaria/escola-dominical/gestaoEbd"
            className={styles.primaryButton}
          >
            {" "}
            Gestão da EBD{" "}
          </Link>{" "}
        </div>{" "}
      </section>{" "}
      <section className={styles.filtersBox}>
        {" "}
        <div className={styles.filterItem}>
          {" "}
          <label>Turma</label>{" "}
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            disabled={loadingTurmas || turmas.length === 0}
          >
            {" "}
            <option value="">
              {" "}
              {loadingTurmas ? "Carregando turmas..." : "Selecione"}{" "}
            </option>{" "}
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {" "}
                {turma.nome}{" "}
                {turma.departamento ? ` • ${turma.departamento}` : ""}{" "}
              </option>
            ))}{" "}
          </select>{" "}
        </div>{" "}
        <div className={styles.filterItem}>
          {" "}
          <label>Mês inicial</label>{" "}
          <input
            type="month"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />{" "}
        </div>{" "}
        <div className={styles.filterItem}>
          {" "}
          <label>Mês final</label>{" "}
          <input
            type="month"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />{" "}
        </div>{" "}
        <div className={styles.filterInfo}>
          {" "}
          <strong>Turma atual:</strong> {turmaSelecionada?.nome || "-"}{" "}
        </div>{" "}
      </section>{" "}
      {!!erro && <div className={styles.errorBox}>{erro}</div>}{" "}
      {loadingRelatorio ? (
        <div className={styles.placeholder}>Carregando relatório...</div>
      ) : !relatorio ? (
        <div className={styles.placeholder}>
          {" "}
          Selecione o período e a turma para visualizar.{" "}
        </div>
      ) : (
        <>
          {" "}
          <section className={styles.summaryBox}>
            {" "}
            <div className={styles.summaryTop}>
              {" "}
              <div>
                {" "}
                <h2>{relatorio.turma.nome}</h2>{" "}
                <p>
                  {" "}
                  {relatorio.turma.departamento || "-"} • Professor:{" "}
                  {relatorio.turma.professor?.nome || "-"}{" "}
                </p>{" "}
              </div>{" "}
              <div className={styles.periodBadge}>
                {relatorio.periodo.label}
              </div>{" "}
            </div>{" "}
            <div className={styles.cardsGrid}>
              {" "}
              {cardsResumo.map((card) => (
                <article
                  key={card.titulo}
                  className={`${styles.card} ${card.classe}`}
                >
                  {" "}
                  <span>{card.titulo}</span> <strong>{card.valor}</strong>{" "}
                </article>
              ))}{" "}
            </div>{" "}
          </section>{" "}
          <section className={styles.tableBox}>
            {" "}
            <div className={styles.tableHeader}>
              {" "}
              <div>
                {" "}
                <h2>Equipe da turma no período</h2>{" "}
                <p>Resumo individual de frequência</p>{" "}
              </div>{" "}
            </div>{" "}
            {relatorio.alunos.length === 0 ? (
              <div className={styles.placeholder}>
                {" "}
                Nenhum aluno encontrado nesta turma.{" "}
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                {" "}
                <table className={styles.table}>
                  {" "}
                  <thead>
                    {" "}
                    <tr>
                      {" "}
                      <th>Nº</th> <th>Aluno</th> <th>Cargo</th>{" "}
                      <th>Total aulas</th> <th>Presenças</th> <th>Faltas</th>{" "}
                      <th>% presença</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {relatorio.alunos.map((aluno) => (
                      <tr key={aluno.membroId}>
                        {" "}
                        <td>{aluno.numeroSequencial || "-"}</td>{" "}
                        <td>{aluno.nome}</td> <td>{aluno.cargo || "-"}</td>{" "}
                        <td>{aluno.totalAulas}</td> <td>{aluno.presencas}</td>{" "}
                        <td>{aluno.faltas}</td>{" "}
                        <td>{aluno.percentualPresenca.toFixed(1)}%</td>{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
          </section>{" "}
        </>
      )}{" "}
    </div>
  );
}
