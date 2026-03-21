//src/components/secretaria/escola-dominical/relatorio-periodo/RelatorioPeriodoEbd.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle } from "lucide-react";
import styles from "./styles.module.scss";

type Props = {
  igrejaId: string;
};

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
    professor: {
      nome: string;
      cargo?: string | null;
    } | null;
  };
  periodo: {
    inicio: string;
    fim: string;
    label: string;
  };
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

const PERM_DEFAULT_EBD: Permissao = {
  recurso: "escola_dominical",
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

  useEffect(() => {
    const fetchMeAndPerms = async () => {
      try {
        setLoadingPerms(true);

        const r = await fetch("/api/me", { cache: "no-store" });

        if (!r.ok) {
          setPermissaoEbd(PERM_DEFAULT_EBD);
          return;
        }

        const meData: MeResponse = await r.json();

        if (meData.role === "SUPERADMIN") {
          setPermissaoEbd({
            recurso: "escola_dominical",
            ler: true,
            criar: true,
            editar: true,
            deletar: true,
            compartilhar: true,
          });
          return;
        }

        const p = await fetch(`/api/permissoes?userId=${meData.id}`, {
          cache: "no-store",
        });

        if (!p.ok) {
          setPermissaoEbd(PERM_DEFAULT_EBD);
          return;
        }

        const list: Permissao[] = await p.json();
        const perm = list.find((x) => x.recurso === "escola_dominical");

        setPermissaoEbd(perm ?? PERM_DEFAULT_EBD);
      } catch {
        setPermissaoEbd(PERM_DEFAULT_EBD);
      } finally {
        setLoadingPerms(false);
      }
    };

    fetchMeAndPerms();
  }, []);

  const canView = !!permissaoEbd?.ler;
  const canShare = !!permissaoEbd?.compartilhar;

  useEffect(() => {
    if (!igrejaId) return;
    if (!permissaoEbd) return;

    if (!canView) {
      setTurmas([]);
      setLoadingTurmas(false);
      return;
    }

    async function carregarTurmas() {
      try {
        setLoadingTurmas(true);
        setErro("");

        const response = await fetch(
          `/api/secretaria/escola-dominical/turmas?igrejaId=${igrejaId}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao carregar turmas.");
        }

        const lista = Array.isArray(data) ? data : [];

        setTurmas(lista);

        if (lista.length > 0) {
          setTurmaId((current) => current || lista[0].id);
        }
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar turmas.");
      } finally {
        setLoadingTurmas(false);
      }
    }

    carregarTurmas();
  }, [igrejaId, permissaoEbd, canView]);

  useEffect(() => {
    if (!igrejaId || !turmaId || !inicio || !fim) return;
    if (!permissaoEbd || !canView) return;

    async function carregarRelatorio() {
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

        const response = await fetch(
          `/api/secretaria/escola-dominical/relatorio-periodo?${qs.toString()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao carregar relatório.");
        }

        setRelatorio(data);
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar relatório.");
        setRelatorio(null);
      } finally {
        setLoadingRelatorio(false);
      }
    }

    carregarRelatorio();
  }, [igrejaId, turmaId, inicio, fim, permissaoEbd, canView]);

  const turmaSelecionada = useMemo(() => {
    return turmas.find((item) => item.id === turmaId) || null;
  }, [turmas, turmaId]);

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
          `${aluno.nome} | Nº ${aluno.numeroSequencial || "-"}${
            aluno.cargo ? ` | ${aluno.cargo}` : ""
          } | Total aulas: ${aluno.totalAulas} | Presenças: ${
            aluno.presencas
          } | Faltas: ${aluno.faltas} | % Presença: ${aluno.percentualPresenca.toFixed(
            1,
          )}%`,
        );
      });
    }

    printFooter();

    doc.save(
      `relatorio-periodo-ebd-${(relatorio.turma.nome || "turma")
        .replace(/\s+/g, "-")
        .toLowerCase()}-${relatorio.periodo.inicio}-${relatorio.periodo.fim}.pdf`,
    );
  }

  if (loadingPerms) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>Carregando permissões...</div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          ⛔ Você não tem permissão para visualizar o relatório por período da
          Escola Dominical.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Relatório por período da EBD</h1>
          <p>
            Selecione uma turma e um intervalo de meses para ver presenças,
            faltas e percentual por aluno.
          </p>
        </div>

        <div className={styles.headerActions}>
          {canShare && (
            <button
              type="button"
              className={styles.btnPDF}
              onClick={gerarPDF}
              disabled={!relatorio || loadingRelatorio}
            >
              <FileText size={16} />
              PDF
            </button>
          )}

          {canShare && (
            <button
              type="button"
              className={styles.btnWhats}
              onClick={compartilharWhats}
              disabled={!relatorio || loadingRelatorio}
            >
              <MessageCircle size={16} />
              Whats
            </button>
          )}

          <Link
            href="/secretaria/escola-dominical"
            className={styles.secondaryButton}
          >
            Dashboard EBD
          </Link>

          <Link
            href="/secretaria/escola-dominical/gestaoEbd"
            className={styles.primaryButton}
          >
            Gestão da EBD
          </Link>
        </div>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.filterItem}>
          <label>Turma</label>
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            disabled={loadingTurmas || turmas.length === 0}
          >
            <option value="">
              {loadingTurmas ? "Carregando turmas..." : "Selecione"}
            </option>

            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
                {turma.departamento ? ` • ${turma.departamento}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterItem}>
          <label>Mês inicial</label>
          <input
            type="month"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>

        <div className={styles.filterItem}>
          <label>Mês final</label>
          <input
            type="month"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>

        <div className={styles.filterInfo}>
          <strong>Turma atual:</strong> {turmaSelecionada?.nome || "-"}
        </div>
      </div>

      {!!erro && <div className={styles.errorBox}>{erro}</div>}

      {loadingRelatorio ? (
        <div className={styles.placeholder}>Carregando relatório...</div>
      ) : !relatorio ? (
        <div className={styles.placeholder}>
          Selecione o período e a turma para visualizar.
        </div>
      ) : (
        <>
          <div className={styles.summaryBox}>
            <div className={styles.summaryTop}>
              <div>
                <h2>{relatorio.turma.nome}</h2>
                <p>
                  {relatorio.turma.departamento || "-"} • Professor:{" "}
                  {relatorio.turma.professor?.nome || "-"}
                </p>
              </div>

              <div className={styles.periodBadge}>
                {relatorio.periodo.label}
              </div>
            </div>

            <div className={styles.cardsGrid}>
              <div className={styles.card}>
                <span>Total de aulas</span>
                <strong>{relatorio.cards.totalAulas}</strong>
              </div>

              <div className={styles.card}>
                <span>Total de alunos</span>
                <strong>{relatorio.cards.totalAlunos}</strong>
              </div>

              <div className={styles.card}>
                <span>Presenças</span>
                <strong>{relatorio.cards.presencas}</strong>
              </div>

              <div className={styles.card}>
                <span>Faltas</span>
                <strong>{relatorio.cards.faltas}</strong>
              </div>

              <div className={styles.card}>
                <span>% presença</span>
                <strong>
                  {relatorio.cards.percentualPresenca.toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.tableBox}>
            <div className={styles.tableHeader}>
              <h2>Equipe da turma no período</h2>
            </div>

            {relatorio.alunos.length === 0 ? (
              <div className={styles.placeholder}>
                Nenhum aluno encontrado nesta turma.
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nº</th>
                      <th>Aluno</th>
                      <th>Cargo</th>
                      <th>Total aulas</th>
                      <th>Presenças</th>
                      <th>Faltas</th>
                      <th>% presença</th>
                    </tr>
                  </thead>

                  <tbody>
                    {relatorio.alunos.map((aluno) => (
                      <tr key={aluno.membroId}>
                        <td>{aluno.numeroSequencial || "-"}</td>
                        <td>{aluno.nome}</td>
                        <td>{aluno.cargo || "-"}</td>
                        <td>{aluno.totalAulas}</td>
                        <td>{aluno.presencas}</td>
                        <td>{aluno.faltas}</td>
                        <td>{aluno.percentualPresenca.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
