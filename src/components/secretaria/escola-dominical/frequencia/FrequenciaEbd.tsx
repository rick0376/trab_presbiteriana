//src/components/secretaria/escola-dominical/frequencia/FrequenciaEbd.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle } from "lucide-react";
import ResumoEbd from "../resumo/ResumoEbd";
import FrequenciaTabelaDesktop from "./desktop/FrequenciaTabelaDesktop";
import FrequenciaChamadaMobile from "./mobile/FrequenciaChamadaMobile";
import styles from "./styles.module.scss";

type Props = {
  turmaId: string;
  igrejaId: string;
  igrejaNome: string;
};

type EbdStatus = "PRESENTE" | "FALTA";
type TipoRelatorio = "mensal" | "domingo";

type TurmaInfo = {
  id: string;
  nome: string;
  departamento?: string | null;
  professor: {
    id: string;
    nome: string;
    cargo?: string | null;
  };
};

type Aluno = {
  id: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
};

type RegistroDomingo = {
  id: string;
  domingoNumero: number;
  visitantes: number;
  oferta: string | number | null;
  revistasLivros: number;
  observacao?: string | null;
};

type RegistroFrequencia = {
  id: string;
  membroId: string;
  domingoNumero: number;
  status: EbdStatus;
};

type RegistroMensal = {
  id: string;
  mes: number;
  ano: number;
  observacoes?: string | null;
  domingos: RegistroDomingo[];
  frequencias: RegistroFrequencia[];
};

type ApiResponse = {
  turma: TurmaInfo;
  alunos: Aluno[];
  registro?: RegistroMensal | null;
  domingosDisponiveis?: number[];
};

type DomingoForm = {
  domingoNumero: number;
  visitantes: number;
  oferta: string;
  revistasLivros: number;
  observacao: string;
};

type DomingoDoMes = {
  domingoNumero: number;
  dataISO: string;
  label: string;
  labelCurta: string;
};

type RelatorioDomingo = {
  domingoNumero: number;
  dataLabel: string;
  visitantes: number;
  oferta: string | number;
  revistasLivros: number;
  observacao: string;
};

type RelatorioErro = {
  erro: string;
};

type RelatorioOk = {
  tituloPeriodo: string;
  subtituloPeriodo: string;
  domingos: RelatorioDomingo[];
  presencas: number;
  faltas: number;
  percentualPresenca: number;
  visitantes: number;
  oferta: number;
  revistas: number;
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

const MESES = [
  { valor: 1, label: "Janeiro" },
  { valor: 2, label: "Fevereiro" },
  { valor: 3, label: "Março" },
  { valor: 4, label: "Abril" },
  { valor: 5, label: "Maio" },
  { valor: 6, label: "Junho" },
  { valor: 7, label: "Julho" },
  { valor: 8, label: "Agosto" },
  { valor: 9, label: "Setembro" },
  { valor: 10, label: "Outubro" },
  { valor: 11, label: "Novembro" },
  { valor: 12, label: "Dezembro" },
];

function getDomingosDoMes(mes: number, ano: number): DomingoDoMes[] {
  const domingos: DomingoDoMes[] = [];
  const ultimoDia = new Date(ano, mes, 0).getDate();
  let contador = 0;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia, 12, 0, 0);

    if (data.getDay() === 0) {
      contador += 1;

      const dd = String(dia).padStart(2, "0");
      const mm = String(mes).padStart(2, "0");

      domingos.push({
        domingoNumero: contador,
        dataISO: `${ano}-${mm}-${dd}`,
        label: `${dd}/${mm}/${ano}`,
        labelCurta: `${dd}/${mm}`,
      });
    }
  }

  return domingos;
}

function criarDomingosPadrao(domingosDoMes: DomingoDoMes[]): DomingoForm[] {
  return domingosDoMes.map((item) => ({
    domingoNumero: item.domingoNumero,
    visitantes: 0,
    oferta: "",
    revistasLivros: 0,
    observacao: "",
  }));
}

function criarMapaInicial(alunos: Aluno[], domingosDoMes: DomingoDoMes[]) {
  const mapa: Record<string, EbdStatus> = {};

  alunos.forEach((aluno) => {
    domingosDoMes.forEach((domingo) => {
      mapa[`${aluno.id}-${domingo.domingoNumero}`] = "FALTA";
    });
  });

  return mapa;
}

export default function FrequenciaEbd({
  turmaId,
  igrejaId,
  igrejaNome,
}: Props) {
  const router = useRouter();

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const [turma, setTurma] = useState<TurmaInfo | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [frequencias, setFrequencias] = useState<Record<string, EbdStatus>>({});
  const [domingos, setDomingos] = useState<DomingoForm[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("mensal");
  const [domingoSelecionadoNumero, setDomingoSelecionadoNumero] = useState("");

  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const domingosDoMes = useMemo(() => getDomingosDoMes(mes, ano), [mes, ano]);

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
  const canEdit = !!permissaoEbd?.editar;
  const canShare = !!permissaoEbd?.compartilhar;

  useEffect(() => {
    if (!domingoSelecionadoNumero && domingosDoMes.length > 0) {
      setDomingoSelecionadoNumero(String(domingosDoMes[0].domingoNumero));
      return;
    }

    const existe = domingosDoMes.some(
      (item) => String(item.domingoNumero) === domingoSelecionadoNumero,
    );

    if (!existe && domingosDoMes.length > 0) {
      setDomingoSelecionadoNumero(String(domingosDoMes[0].domingoNumero));
    }
  }, [domingosDoMes, domingoSelecionadoNumero]);

  useEffect(() => {
    if (!igrejaId || !turmaId) return;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        setSucesso("");

        const response = await fetch(
          `/api/secretaria/escola-dominical/turmas/${turmaId}/frequencia?igrejaId=${igrejaId}&mes=${mes}&ano=${ano}`,
        );

        const data = (await response.json()) as ApiResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao carregar frequência.");
        }

        setTurma(data.turma);
        setAlunos(data.alunos);

        const mapaBase = criarMapaInicial(data.alunos, domingosDoMes);

        if (data.registro?.frequencias?.length) {
          data.registro.frequencias.forEach((item) => {
            const chave = `${item.membroId}-${item.domingoNumero}`;
            if (chave in mapaBase) {
              mapaBase[chave] = item.status;
            }
          });
        }

        setFrequencias(mapaBase);
        setObservacoes(data.registro?.observacoes || "");

        const domingosBase = criarDomingosPadrao(domingosDoMes);

        if (data.registro?.domingos?.length) {
          data.registro.domingos.forEach((domingo) => {
            const index = domingosBase.findIndex(
              (item) => item.domingoNumero === domingo.domingoNumero,
            );

            if (index >= 0) {
              domingosBase[index] = {
                domingoNumero: domingo.domingoNumero,
                visitantes: domingo.visitantes || 0,
                oferta:
                  domingo.oferta !== null && domingo.oferta !== undefined
                    ? String(domingo.oferta)
                    : "",
                revistasLivros: domingo.revistasLivros || 0,
                observacao: domingo.observacao || "",
              };
            }
          });
        }

        setDomingos(domingosBase);
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar frequência.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [igrejaId, turmaId, mes, ano, domingosDoMes]);

  function alterarStatus(
    membroId: string,
    domingoNumero: number,
    status: EbdStatus,
  ) {
    if (!isDomingoLiberado(domingoNumero)) return;

    setFrequencias((estadoAtual) => ({
      ...estadoAtual,
      [`${membroId}-${domingoNumero}`]: status,
    }));
  }

  function alterarDomingo(
    domingoNumero: number,
    campo: keyof Omit<DomingoForm, "domingoNumero">,
    valor: string,
  ) {
    setDomingos((estadoAtual) =>
      estadoAtual.map((item) => {
        if (item.domingoNumero !== domingoNumero) return item;

        if (campo === "observacao" || campo === "oferta") {
          return {
            ...item,
            [campo]: valor,
          };
        }

        return {
          ...item,
          [campo]: Number(valor) || 0,
        };
      }),
    );
  }

  function getDomingoMeta(domingoNumero: number) {
    return (
      domingosDoMes.find((item) => item.domingoNumero === domingoNumero) || null
    );
  }

  function isDomingoLiberado(domingoNumero: number) {
    const meta = getDomingoMeta(domingoNumero);
    if (!meta) return false;

    const dataDomingo = new Date(`${meta.dataISO}T12:00:00`);
    const hojeLimite = new Date();
    hojeLimite.setHours(23, 59, 59, 999);

    return dataDomingo.getTime() <= hojeLimite.getTime();
  }

  const resumo = useMemo(() => {
    const totalLancamentos = alunos.length * domingosDoMes.length;

    const presencas = Object.values(frequencias).filter(
      (item) => item === "PRESENTE",
    ).length;

    const faltas = Object.values(frequencias).filter(
      (item) => item === "FALTA",
    ).length;

    const percentualPresenca =
      totalLancamentos > 0 ? (presencas / totalLancamentos) * 100 : 0;

    return {
      matriculados: alunos.length,
      presencas,
      faltas,
      percentualPresenca,
    };
  }, [alunos, frequencias, domingosDoMes]);

  const mesLabel =
    MESES.find((item) => item.valor === mes)?.label || String(mes);

  function montarRelatorio(): RelatorioOk | RelatorioErro {
    if (tipoRelatorio === "mensal") {
      const totalVisitantes = domingos.reduce(
        (acc, item) => acc + (Number(item.visitantes) || 0),
        0,
      );

      const totalOferta = domingos.reduce(
        (acc, item) => acc + (Number(item.oferta) || 0),
        0,
      );

      const totalRevistas = domingos.reduce(
        (acc, item) => acc + (Number(item.revistasLivros) || 0),
        0,
      );

      return {
        tituloPeriodo: `${mesLabel}/${ano}`,
        subtituloPeriodo: "Mês completo",
        domingos: domingos.map((domingo) => ({
          domingoNumero: domingo.domingoNumero,
          dataLabel: getDomingoMeta(domingo.domingoNumero)?.label || "-",
          visitantes: domingo.visitantes,
          oferta: domingo.oferta,
          revistasLivros: domingo.revistasLivros,
          observacao: domingo.observacao,
        })),
        presencas: resumo.presencas,
        faltas: resumo.faltas,
        percentualPresenca: resumo.percentualPresenca,
        visitantes: totalVisitantes,
        oferta: totalOferta,
        revistas: totalRevistas,
      };
    }

    if (!domingoSelecionadoNumero) {
      return { erro: "Selecione um domingo específico." };
    }

    const domingoNumero = Number(domingoSelecionadoNumero);
    const domingo = domingos.find(
      (item) => item.domingoNumero === domingoNumero,
    );
    const domingoMeta = getDomingoMeta(domingoNumero);

    const presencas = alunos.filter(
      (aluno) => frequencias[`${aluno.id}-${domingoNumero}`] === "PRESENTE",
    ).length;

    const faltas = alunos.filter(
      (aluno) => frequencias[`${aluno.id}-${domingoNumero}`] === "FALTA",
    ).length;

    const percentualPresenca =
      alunos.length > 0 ? (presencas / alunos.length) * 100 : 0;

    return {
      tituloPeriodo: domingoMeta?.label || "-",
      subtituloPeriodo: `${domingoNumero}º domingo de ${mesLabel}/${ano}`,
      domingos: [
        {
          domingoNumero,
          dataLabel: domingoMeta?.label || "-",
          visitantes: domingo?.visitantes || 0,
          oferta: domingo?.oferta || "",
          revistasLivros: domingo?.revistasLivros || 0,
          observacao: domingo?.observacao || "",
        },
      ],
      presencas,
      faltas,
      percentualPresenca,
      visitantes: Number(domingo?.visitantes) || 0,
      oferta: Number(domingo?.oferta) || 0,
      revistas: Number(domingo?.revistasLivros) || 0,
    };
  }

  async function salvarFrequencia() {
    if (!canEdit) return;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const listaFrequencias = alunos.flatMap((aluno) =>
        domingosDoMes.map((domingo) => ({
          membroId: aluno.id,
          domingoNumero: domingo.domingoNumero,
          status:
            frequencias[`${aluno.id}-${domingo.domingoNumero}`] ||
            ("FALTA" as EbdStatus),
        })),
      );

      const response = await fetch(
        `/api/secretaria/escola-dominical/turmas/${turmaId}/frequencia`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            igrejaId,
            mes,
            ano,
            observacoes,
            frequencias: listaFrequencias,
            domingos,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao salvar frequência.");
      }

      setSucesso("Frequência salva com sucesso.");
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar frequência.");
    } finally {
      setSalvando(false);
    }
  }

  function compartilharWhats() {
    if (!canShare) return;

    const relatorio = montarRelatorio();

    if ("erro" in relatorio) {
      setErro(relatorio.erro || "Erro ao gerar relatório.");
      return;
    }

    const texto = `📘 *RELATÓRIO EBD*
⛪ Igreja: ${igrejaNome || "-"}
🏫 Turma: ${turma?.nome || "-"}
👩‍🏫 Professor: ${turma?.professor?.nome || "-"}
🗓 Período: ${relatorio.tituloPeriodo}
📍 Tipo: ${relatorio.subtituloPeriodo}

👥 Matriculados: ${alunos.length}
✅ Presenças: ${relatorio.presencas}
❌ Faltas: ${relatorio.faltas}
📊 % Presença: ${relatorio.percentualPresenca.toFixed(1)}%
🙋 Visitantes: ${relatorio.visitantes}
💰 Oferta Total: R$ ${relatorio.oferta.toFixed(2)}
📚 Revistas/Livros: ${relatorio.revistas}

${relatorio.domingos
  .map(
    (domingo) =>
      `${domingo.dataLabel}: Visitantes ${domingo.visitantes} | Oferta R$ ${(
        Number(domingo.oferta) || 0
      ).toFixed(2)} | Revistas ${domingo.revistasLivros}${
        domingo.observacao ? ` | Obs: ${domingo.observacao}` : ""
      }`,
  )
  .join("\n")}

📝 Observações: ${observacoes || "-"}`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  }

  async function gerarPDF() {
    if (!canShare) return;

    const relatorio = montarRelatorio();

    if ("erro" in relatorio) {
      setErro(relatorio.erro || "Erro ao gerar relatório.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const nomeCliente = igrejaNome || "Sistema LHPSYSTEMS";
    const margin = 8;
    let y = 48;

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
      doc.text("RELATÓRIO EBD", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(nomeCliente, 10, 30);

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
    addField("IGREJA", igrejaNome || "-");
    addField("TURMA", turma?.nome || "-");
    addField("DEPARTAMENTO", turma?.departamento || "-");
    addField("PROFESSOR", turma?.professor?.nome || "-");
    addField("PERÍODO", relatorio.tituloPeriodo);
    addField("TIPO", relatorio.subtituloPeriodo);

    addSection("Resumo");
    addField("MATRICULADOS", String(alunos.length));
    addField("PRESENÇAS", String(relatorio.presencas));
    addField("FALTAS", String(relatorio.faltas));
    addField("% PRESENÇA", `${relatorio.percentualPresenca.toFixed(1)}%`);
    addField("VISITANTES", String(relatorio.visitantes));
    addField("OFERTA TOTAL", `R$ ${relatorio.oferta.toFixed(2)}`);
    addField("REVISTAS/LIVROS", String(relatorio.revistas));

    addSection("Domingos");
    relatorio.domingos.forEach((domingo) => {
      addField(
        domingo.dataLabel,
        `Visitantes: ${domingo.visitantes} | Oferta: R$ ${(
          Number(domingo.oferta) || 0
        ).toFixed(2)} | Revistas/Livros: ${domingo.revistasLivros}${
          domingo.observacao ? ` | Obs: ${domingo.observacao}` : ""
        }`,
      );
    });

    addSection("Observações");
    addField("OBS", observacoes || "-");

    printFooter();

    doc.save(
      `relatorio-ebd-${(turma?.nome || "turma")
        .replace(/\s+/g, "-")
        .toLowerCase()}-${tipoRelatorio}-${mes}-${ano}.pdf`,
    );
  }

  if (loadingPerms) {
    return (
      <div className={styles.container}>
        <div className={styles.bloco}>
          <div className={styles.vazio}>Carregando permissões...</div>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className={styles.container}>
        <div className={styles.bloco}>
          <div className={styles.vazio}>
            ⛔ Você não tem permissão para visualizar a frequência da Escola
            Dominical.
          </div>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>Carregando frequência...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Frequência da EBD</h1>
          <p>
            {turma?.nome || "-"} • Professor: {turma?.professor?.nome || "-"}
          </p>
        </div>

        <div className={styles.headerActions}>
          {canShare && (
            <button type="button" className={styles.btnPDF} onClick={gerarPDF}>
              <FileText size={16} /> PDF
            </button>
          )}

          {canShare && (
            <button
              type="button"
              className={styles.btnWhats}
              onClick={compartilharWhats}
            >
              <MessageCircle size={16} /> Whats
            </button>
          )}

          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() =>
              router.push("/secretaria/escola-dominical/gestaoEbd")
            }
          >
            Voltar
          </button>

          {canEdit && (
            <button
              type="button"
              className={styles.salvarTopoBotao}
              onClick={salvarFrequencia}
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar frequência"}
            </button>
          )}
          <button
            type="button"
            className={styles.btnRapido}
            onClick={() =>
              router.push(
                `/secretaria/escola-dominical/chamada-rapida?turmaId=${turmaId}&igrejaId=${igrejaId}&igrejaNome=${encodeURIComponent(
                  igrejaNome || "",
                )}&mes=${mes}&ano=${ano}`,
              )
            }
          >
            Chamada rápida
          </button>
        </div>
      </div>

      <div className={styles.filtros}>
        <div className={styles.filtroItem}>
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filtroItem}>
          <label>Ano</label>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          />
        </div>

        <div className={styles.filtroInfo}>
          <strong>Departamento:</strong> {turma?.departamento || "-"}
        </div>
      </div>

      <div className={styles.relatorioBox}>
        <div className={styles.relatorioHeader}>
          <h2>Tipo de relatório para PDF / Whats</h2>
        </div>

        <div className={styles.relatorioGrid}>
          <div className={styles.relatorioOpcao}>
            <label>Modo</label>
            <select
              value={tipoRelatorio}
              onChange={(e) =>
                setTipoRelatorio(e.target.value as TipoRelatorio)
              }
            >
              <option value="mensal">Mês inteiro</option>
              <option value="domingo">Domingo específico</option>
            </select>
          </div>

          {tipoRelatorio === "domingo" && (
            <div className={styles.relatorioOpcao}>
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
          )}
        </div>
      </div>

      <ResumoEbd
        matriculados={resumo.matriculados}
        presencas={resumo.presencas}
        faltas={resumo.faltas}
        percentualPresenca={resumo.percentualPresenca}
      />

      <div className={styles.desktopOnly}>
        <FrequenciaTabelaDesktop
          alunos={alunos}
          domingosDoMes={domingosDoMes}
          frequencias={frequencias}
          alterarStatus={alterarStatus}
          canEdit={canEdit}
          isDomingoLiberado={isDomingoLiberado}
        />
      </div>

      <div className={styles.mobileOnly}>
        <FrequenciaChamadaMobile
          alunos={alunos}
          domingosDoMes={domingosDoMes}
          domingoSelecionadoNumero={domingoSelecionadoNumero}
          setDomingoSelecionadoNumero={setDomingoSelecionadoNumero}
          frequencias={frequencias}
          alterarStatus={alterarStatus}
          canEdit={canEdit}
          salvando={salvando}
          salvarFrequencia={salvarFrequencia}
          erro={erro}
          sucesso={sucesso}
          isDomingoLiberado={isDomingoLiberado}
        />
      </div>

      <div className={styles.bloco}>
        <div className={styles.blocoHeader}>
          <h2>Resumo dos domingos</h2>
        </div>

        <div className={styles.domingosGrid}>
          {domingos.map((domingo) => {
            const meta = getDomingoMeta(domingo.domingoNumero);

            return (
              <div key={domingo.domingoNumero} className={styles.domingoCard}>
                <h3>
                  {domingo.domingoNumero}º Domingo • {meta?.label || "-"}
                </h3>

                <div className={styles.domingoFields}>
                  <div className={styles.formGroup}>
                    <label>Visitantes</label>
                    <input
                      disabled={!canEdit}
                      type="number"
                      value={domingo.visitantes}
                      onChange={(e) =>
                        alterarDomingo(
                          domingo.domingoNumero,
                          "visitantes",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Oferta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={domingo.oferta}
                      onChange={(e) =>
                        alterarDomingo(
                          domingo.domingoNumero,
                          "oferta",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Revistas / Livros</label>
                    <input
                      type="number"
                      value={domingo.revistasLivros}
                      onChange={(e) =>
                        alterarDomingo(
                          domingo.domingoNumero,
                          "revistasLivros",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label>Observação</label>
                    <input
                      value={domingo.observacao}
                      onChange={(e) =>
                        alterarDomingo(
                          domingo.domingoNumero,
                          "observacao",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.bloco}>
        <div className={styles.blocoHeader}>
          <h2>Observações do mês</h2>
        </div>

        <textarea
          disabled={!canEdit}
          className={styles.textarea}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Digite observações deste mês"
        />
      </div>

      <div className={styles.desktopOnly}>
        {!!erro && <div className={styles.erro}>{erro}</div>}
        {!!sucesso && <div className={styles.sucesso}>{sucesso}</div>}
      </div>

      <div className={styles.desktopOnly}>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.voltarBotao}
            onClick={() =>
              router.push("/secretaria/escola-dominical/gestaoEbd")
            }
          >
            Voltar
          </button>

          {canEdit && (
            <button
              type="button"
              className={styles.salvarTopoBotao}
              onClick={salvarFrequencia}
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar frequência"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
