//src/components/secretaria/escola-dominical/dashboard/DashboardEscolaDominical.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle } from "lucide-react";
import styles from "./styles.module.scss";

type Props = {
  igrejaId: string;
  igrejaNome: string;
};

type Turma = {
  id: string;
  nome: string;
  departamento?: string | null;
  ativa: boolean;
};

type Aluno = {
  id: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
  dataNascimento?: string | Date | null;
};

type Professor = {
  id: string;
  nome: string;
  cargo?: string | null;
  dataNascimento?: string | Date | null;
};

type PessoaEbd = {
  id: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
  dataNascimento?: string | Date | null;
  tipoLabel: string;
};

type ResumoResponse = {
  cards: {
    matriculados: number;
    presencas: number;
    faltas: number;
    percentualPresenca: number;
  };
  grafico: {
    mes: number;
    label: string;
    presencas: number;
    faltas: number;
    visitantes: number;
  }[];
  ano: number;
  filtroTurmaId?: string | null;
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

function normalizarData(data?: string | Date | null) {
  if (!data) return null;

  if (data instanceof Date) {
    if (Number.isNaN(data.getTime())) return null;
    return new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate(),
      12,
      0,
      0,
    );
  }

  const texto = String(data).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;

  const [ano, mes, dia] = texto.split("-").map(Number);

  const dt = new Date(ano, mes - 1, dia, 12, 0, 0);

  if (Number.isNaN(dt.getTime())) return null;

  return dt;
}

function formatarDataBR(data?: string | Date | null) {
  const dt = normalizarData(data);
  if (!dt) return "-";

  return dt.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function calcularIdade(data?: string | Date | null) {
  const nascimento = normalizarData(data);
  if (!nascimento) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const aniversarioNesteAno = new Date(
    hoje.getFullYear(),
    nascimento.getMonth(),
    nascimento.getDate(),
    12,
    0,
    0,
  );

  if (hoje < aniversarioNesteAno) {
    idade -= 1;
  }

  return idade;
}

function ehAniversarioHoje(data?: string | Date | null) {
  const nascimento = normalizarData(data);
  if (!nascimento) return false;

  const hoje = new Date();

  return (
    nascimento.getDate() === hoje.getDate() &&
    nascimento.getMonth() === hoje.getMonth()
  );
}

function ehAniversarioNosProximos7Dias(data?: string | Date | null) {
  const nascimento = normalizarData(data);
  if (!nascimento) return false;

  const hoje = new Date();
  const inicio = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
    0,
    0,
    0,
    0,
  );
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  let aniversario = new Date(
    hoje.getFullYear(),
    nascimento.getMonth(),
    nascimento.getDate(),
    12,
    0,
    0,
  );

  if (aniversario < inicio) {
    aniversario = new Date(
      hoje.getFullYear() + 1,
      nascimento.getMonth(),
      nascimento.getDate(),
      12,
      0,
      0,
    );
  }

  return aniversario >= inicio && aniversario <= fim;
}

function ordenarPorProximoAniversario(lista: PessoaEbd[]) {
  const hoje = new Date();

  return [...lista].sort((a, b) => {
    const dataA = normalizarData(a.dataNascimento);
    const dataB = normalizarData(b.dataNascimento);

    if (!dataA && !dataB) return a.nome.localeCompare(b.nome, "pt-BR");
    if (!dataA) return 1;
    if (!dataB) return -1;

    let proxA = new Date(
      hoje.getFullYear(),
      dataA.getMonth(),
      dataA.getDate(),
      12,
      0,
      0,
    );

    let proxB = new Date(
      hoje.getFullYear(),
      dataB.getMonth(),
      dataB.getDate(),
      12,
      0,
      0,
    );

    if (proxA < hoje) proxA.setFullYear(hoje.getFullYear() + 1);
    if (proxB < hoje) proxB.setFullYear(hoje.getFullYear() + 1);

    return proxA.getTime() - proxB.getTime();
  });
}

export default function DashboardEscolaDominical({
  igrejaId,
  igrejaNome,
}: Props) {
  const anoAtual = new Date().getFullYear();

  const [loadingPerms, setLoadingPerms] = useState(true);
  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [resumo, setResumo] = useState<ResumoResponse>({
    cards: {
      matriculados: 0,
      presencas: 0,
      faltas: 0,
      percentualPresenca: 0,
    },
    grafico: [],
    ano: anoAtual,
    filtroTurmaId: null,
  });

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
  const canCreate = !!permissaoEbd?.criar;
  const canShare = !!permissaoEbd?.compartilhar;

  useEffect(() => {
    if (!igrejaId) return;
    if (!permissaoEbd) return;

    if (!canView) {
      setLoading(false);
      setTurmas([]);
      setAlunos([]);
      setProfessores([]);
      return;
    }

    async function carregarDashboard() {
      try {
        setLoading(true);
        setErro("");

        const qsResumo = new URLSearchParams();
        qsResumo.set("igrejaId", igrejaId);
        qsResumo.set("ano", String(anoAtual));

        const [turmasRes, alunosRes, professoresRes, resumoRes] =
          await Promise.all([
            fetch(
              `/api/secretaria/escola-dominical/turmas?igrejaId=${igrejaId}`,
              {
                cache: "no-store",
              },
            ),
            fetch(
              `/api/secretaria/escola-dominical/dashboard/alunos?igrejaId=${igrejaId}`,
              {
                cache: "no-store",
              },
            ),
            fetch(
              `/api/secretaria/escola-dominical/dashboard/professores?igrejaId=${igrejaId}`,
              {
                cache: "no-store",
              },
            ),
            fetch(
              `/api/secretaria/escola-dominical/resumo?${qsResumo.toString()}`,
              {
                cache: "no-store",
              },
            ),
          ]);

        const turmasData = await turmasRes.json();
        const alunosData = await alunosRes.json();
        const professoresData = await professoresRes.json();
        const resumoData = await resumoRes.json();

        if (!turmasRes.ok) {
          throw new Error(turmasData?.error || "Erro ao carregar turmas.");
        }

        if (!alunosRes.ok) {
          throw new Error(alunosData?.error || "Erro ao carregar alunos.");
        }

        if (!professoresRes.ok) {
          throw new Error(
            professoresData?.error || "Erro ao carregar professores.",
          );
        }

        if (!resumoRes.ok) {
          throw new Error(resumoData?.error || "Erro ao carregar resumo.");
        }

        setTurmas(Array.isArray(turmasData) ? turmasData : []);
        setAlunos(Array.isArray(alunosData) ? alunosData : []);
        setProfessores(Array.isArray(professoresData) ? professoresData : []);
        setResumo(resumoData);
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar dashboard da EBD.");
      } finally {
        setLoading(false);
      }
    }

    carregarDashboard();
  }, [igrejaId, anoAtual, permissaoEbd, canView]);

  const turmasAtivas = useMemo(() => {
    return turmas.filter((item) => item.ativa).length;
  }, [turmas]);

  const pessoasEbd = useMemo(() => {
    const mapa = new Map<string, PessoaEbd>();

    professores.forEach((professor) => {
      mapa.set(professor.id, {
        id: professor.id,
        nome: professor.nome,
        cargo: professor.cargo,
        dataNascimento: professor.dataNascimento,
        tipoLabel: "Professor",
      });
    });

    alunos.forEach((aluno) => {
      const existente = mapa.get(aluno.id);

      if (existente) {
        mapa.set(aluno.id, {
          ...existente,
          numeroSequencial: aluno.numeroSequencial,
          dataNascimento: existente.dataNascimento || aluno.dataNascimento,
          tipoLabel: "Professor / Aluno",
        });
        return;
      }

      mapa.set(aluno.id, {
        id: aluno.id,
        nome: aluno.nome,
        cargo: aluno.cargo,
        numeroSequencial: aluno.numeroSequencial,
        dataNascimento: aluno.dataNascimento,
        tipoLabel: "Aluno",
      });
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [alunos, professores]);

  const aniversariantesHoje = useMemo(() => {
    return ordenarPorProximoAniversario(
      pessoasEbd.filter((item) => ehAniversarioHoje(item.dataNascimento)),
    );
  }, [pessoasEbd]);

  const aniversariantesSemana = useMemo(() => {
    return ordenarPorProximoAniversario(
      pessoasEbd.filter((item) =>
        ehAniversarioNosProximos7Dias(item.dataNascimento),
      ),
    );
  }, [pessoasEbd]);

  const turmaChamadaRapida = useMemo(() => {
    return turmas.find((item) => item.ativa) || turmas[0] || null;
  }, [turmas]);

  function gerarTextoWhats() {
    const hojeLabel = new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const linhasHoje =
      aniversariantesHoje.length > 0
        ? aniversariantesHoje
            .map(
              (item) =>
                `• ${item.nome} (${item.tipoLabel}) - ${formatarDataBR(
                  item.dataNascimento,
                )} - ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
            )
            .join("\n")
        : "• Nenhum aniversariante hoje";

    const linhasSemana =
      aniversariantesSemana.length > 0
        ? aniversariantesSemana
            .map(
              (item) =>
                `• ${item.nome} (${item.tipoLabel}) - ${formatarDataBR(
                  item.dataNascimento,
                )} - ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
            )
            .join("\n")
        : "• Nenhum aniversariante na semana";

    const linhasAlunos =
      alunos.length > 0
        ? alunos
            .map(
              (item) =>
                `• ${item.nome} - N° ${item.numeroSequencial || "-"} - Nasc.: ${formatarDataBR(
                  item.dataNascimento,
                )} - ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
            )
            .join("\n")
        : "• Nenhum aluno";

    const linhasProfessores =
      professores.length > 0
        ? professores
            .map(
              (item) =>
                `• ${item.nome} - ${item.cargo || "Professor"} - Nasc.: ${formatarDataBR(
                  item.dataNascimento,
                )} - ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
            )
            .join("\n")
        : "• Nenhum professor";

    return `📘 *DASHBOARD DA ESCOLA DOMINICAL*
📅 Data: ${hojeLabel}

📊 *Resumo Geral*
• Turmas: ${turmas.length}
• Turmas ativas: ${turmasAtivas}
• Alunos: ${alunos.length}
• Professores: ${professores.length}
• Presenças: ${resumo.cards.presencas}
• Faltas: ${resumo.cards.faltas}
• % Presença: ${resumo.cards.percentualPresenca.toFixed(1)}%

🎉 *Aniversariantes do Dia*
${linhasHoje}

🎉 *Aniversariantes da Semana*
${linhasSemana}

👨‍🎓 *Alunos da EBD*
${linhasAlunos}

👩‍🏫 *Professores da EBD*
${linhasProfessores}`;
  }

  function compartilharWhats() {
    if (!canShare) return;

    const texto = gerarTextoWhats();

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  }

  async function gerarPDF() {
    if (!canShare) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 8;
    let y = 48;

    const nomeCliente = "Escola Dominical";

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
      doc.text("DASHBOARD EBD", pageWidth / 2, 18, {
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

    addSection("Resumo Geral");
    addField("TURMAS", String(turmas.length));
    addField("TURMAS ATIVAS", String(turmasAtivas));
    addField("ALUNOS", String(alunos.length));
    addField("PROFESSORES", String(professores.length));
    addField("PRESENÇAS", String(resumo.cards.presencas));
    addField("FALTAS", String(resumo.cards.faltas));
    addField("% PRESENÇA", `${resumo.cards.percentualPresenca.toFixed(1)}%`);

    addSection("Aniversariantes do Dia");
    if (aniversariantesHoje.length === 0) {
      addField("HOJE", "Nenhum aniversariante hoje.");
    } else {
      aniversariantesHoje.forEach((item, index) => {
        addField(
          `PESSOA ${index + 1}`,
          `${item.nome} | ${item.tipoLabel} | Nasc.: ${formatarDataBR(
            item.dataNascimento,
          )} | Idade: ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
        );
      });
    }

    addSection("Aniversariantes da Semana");
    if (aniversariantesSemana.length === 0) {
      addField("SEMANA", "Nenhum aniversariante na semana.");
    } else {
      aniversariantesSemana.forEach((item, index) => {
        addField(
          `PESSOA ${index + 1}`,
          `${item.nome} | ${item.tipoLabel} | Nasc.: ${formatarDataBR(
            item.dataNascimento,
          )} | Idade: ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
        );
      });
    }

    addSection("Alunos da EBD");
    if (alunos.length === 0) {
      addField("ALUNOS", "Nenhum aluno encontrado.");
    } else {
      alunos.forEach((item, index) => {
        addField(
          `ALUNO ${index + 1}`,
          `${item.nome} | Nº ${item.numeroSequencial || "-"}${
            item.cargo ? ` | ${item.cargo}` : ""
          } | Nasc.: ${formatarDataBR(item.dataNascimento)} | Idade: ${
            calcularIdade(item.dataNascimento) ?? "-"
          } anos`,
        );
      });
    }

    addSection("Professores da EBD");
    if (professores.length === 0) {
      addField("PROFESSORES", "Nenhum professor encontrado.");
    } else {
      professores.forEach((item, index) => {
        addField(
          `PROFESSOR ${index + 1}`,
          `${item.nome}${item.cargo ? ` | ${item.cargo}` : ""} | Nasc.: ${formatarDataBR(
            item.dataNascimento,
          )} | Idade: ${calcularIdade(item.dataNascimento) ?? "-"} anos`,
        );
      });
    }

    printFooter();

    doc.save("dashboard-escola-dominical.pdf");
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
          ⛔ Você não tem permissão para visualizar a Escola Dominical.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>Carregando dashboard da EBD...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>{erro}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div>
          <h1>Escola Dominical</h1>
          <p>
            Painel geral da EBD com visão rápida de turmas, alunos, professores,
            frequência e aniversários.
          </p>
        </div>

        <div className={styles.heroActions}>
          {canShare && (
            <button type="button" className={styles.btnPDF} onClick={gerarPDF}>
              <FileText size={16} />
              PDF
            </button>
          )}

          {canShare && (
            <button
              type="button"
              className={styles.btnWhats}
              onClick={compartilharWhats}
            >
              <MessageCircle size={16} />
              Whats
            </button>
          )}

          <Link
            href="/secretaria/escola-dominical/gestaoEbd"
            className={styles.primaryButton}
          >
            Abrir gestão da EBD
          </Link>

          {canCreate && (
            <Link
              href="/secretaria/escola-dominical/novo"
              className={styles.secondaryButton}
            >
              Nova turma
            </Link>
          )}

          {turmaChamadaRapida && (
            <Link
              href={`/secretaria/escola-dominical/chamada-rapida?turmaId=${turmaChamadaRapida.id}&igrejaId=${igrejaId}&igrejaNome=${encodeURIComponent(igrejaNome || "")}`}
              className={styles.btnRapido}
            >
              Chamada rápida
            </Link>
          )}
        </div>
      </div>

      <div className={styles.cardsGrid}>
        <div className={`${styles.card} ${styles.card01}`}>
          <span className={styles.cardLabel}>Turmas</span>
          <strong className={styles.cardValue}>{turmas.length}</strong>
          <small className={styles.cardInfo}>
            {turmasAtivas} turma(s) ativa(s)
          </small>
        </div>

        <div className={`${styles.card} ${styles.card02}`}>
          <span className={styles.cardLabel}>Alunos</span>
          <strong className={styles.cardValue}>{alunos.length}</strong>
          <small className={styles.cardInfo}>Alunos vinculados à EBD</small>
        </div>

        <div className={`${styles.card} ${styles.card03}`}>
          <span className={styles.cardLabel}>Professores</span>
          <strong className={styles.cardValue}>{professores.length}</strong>
          <small className={styles.cardInfo}>Professores das turmas</small>
        </div>

        <div className={`${styles.card} ${styles.card04}`}>
          <span className={styles.cardLabel}>Presenças</span>
          <strong className={styles.cardValue}>{resumo.cards.presencas}</strong>
          <small className={styles.cardInfo}>Total consolidado</small>
        </div>

        <div className={`${styles.card} ${styles.card05}`}>
          <span className={styles.cardLabel}>Faltas</span>
          <strong className={styles.cardValue}>{resumo.cards.faltas}</strong>
          <small className={styles.cardInfo}>Total consolidado</small>
        </div>

        <div className={`${styles.card} ${styles.card06}`}>
          <span className={styles.cardLabel}>% Presença</span>
          <strong className={styles.cardValue}>
            {resumo.cards.percentualPresenca.toFixed(1)}%
          </strong>
          <small className={styles.cardInfo}>Percentual geral</small>
        </div>
      </div>

      <div className={styles.destaquesGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Destaque do dia</h2>
          </div>

          {aniversariantesHoje.length === 0 ? (
            <div className={styles.emptyMini}>Nenhum aniversariante hoje.</div>
          ) : (
            <div className={styles.peopleList}>
              {aniversariantesHoje.map((item) => (
                <div key={`hoje-${item.id}`} className={styles.personRow}>
                  <div>
                    <strong>{item.nome}</strong>
                    <span>
                      {item.tipoLabel}
                      {item.cargo ? ` • ${item.cargo}` : ""}
                    </span>
                  </div>

                  <div className={styles.personMeta}>
                    <b>{formatarDataBR(item.dataNascimento)}</b>
                    <span>
                      {calcularIdade(item.dataNascimento) ?? "-"} anos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Destaque da semana</h2>
          </div>

          {aniversariantesSemana.length === 0 ? (
            <div className={styles.emptyMini}>
              Nenhum aniversariante nos próximos 7 dias.
            </div>
          ) : (
            <div className={styles.peopleList}>
              {aniversariantesSemana.map((item) => (
                <div key={`semana-${item.id}`} className={styles.personRow}>
                  <div>
                    <strong>{item.nome}</strong>
                    <span>
                      {item.tipoLabel}
                      {item.cargo ? ` • ${item.cargo}` : ""}
                    </span>
                  </div>

                  <div className={styles.personMeta}>
                    <b>{formatarDataBR(item.dataNascimento)}</b>
                    <span>
                      {calcularIdade(item.dataNascimento) ?? "-"} anos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.sectionsGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Alunos da EBD</h2>
          </div>

          {alunos.length === 0 ? (
            <div className={styles.emptyMini}>Nenhum aluno encontrado.</div>
          ) : (
            <div className={styles.peopleList}>
              {alunos.map((aluno) => (
                <div key={aluno.id} className={styles.personRow}>
                  <div>
                    <strong>{aluno.nome}</strong>
                    <span>
                      Nº {aluno.numeroSequencial || "-"}
                      {aluno.cargo ? ` • ${aluno.cargo}` : ""}
                    </span>
                  </div>

                  <div className={styles.personMeta}>
                    <b>{formatarDataBR(aluno.dataNascimento)}</b>
                    <span>
                      {calcularIdade(aluno.dataNascimento) ?? "-"} anos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Professores da EBD</h2>
          </div>

          {professores.length === 0 ? (
            <div className={styles.emptyMini}>Nenhum professor encontrado.</div>
          ) : (
            <div className={styles.peopleList}>
              {professores.map((professor) => (
                <div key={professor.id} className={styles.personRow}>
                  <div>
                    <strong>{professor.nome}</strong>
                    <span>{professor.cargo || "Professor"}</span>
                  </div>

                  <div className={styles.personMeta}>
                    <b>{formatarDataBR(professor.dataNascimento)}</b>
                    <span>
                      {calcularIdade(professor.dataNascimento) ?? "-"} anos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.sectionsGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Acesso rápido</h2>
          </div>

          <div className={styles.quickList}>
            <Link
              href="/secretaria/escola-dominical/gestaoEbd"
              className={styles.quickItem}
            >
              Gestão da EBD
            </Link>

            {canCreate && (
              <Link
                href="/secretaria/escola-dominical/novo"
                className={styles.quickItem}
              >
                Cadastrar nova turma
              </Link>
            )}

            <Link
              href="/secretaria/escola-dominical/relatorio-periodo"
              className={styles.quickItem}
            >
              Relatório por período
            </Link>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Resumo do módulo</h2>
          </div>

          <div className={styles.todoList}>
            <div className={styles.todoItem}>
              Visualização geral da Escola Dominical
            </div>
            <div className={styles.todoItem}>
              Aniversários de alunos e professores
            </div>
            <div className={styles.todoItem}>Acesso à gestão e relatórios</div>
          </div>
        </div>
      </div>
    </div>
  );
}
