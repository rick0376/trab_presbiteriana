//src/components/secretaria/membros/SecretariaPageClient.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import AlertModal from "@/components/ui/AlertModal/AlertModal";
import styles from "./styles.module.scss";
import { Share2 } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  ChevronDown,
  FileText,
  MessageCircle,
  PencilLine,
  Trash2,
} from "lucide-react";

type Membro = {
  id: string;
  numeroSequencial: number;
  nome: string;
  cargo: string;
  telefone: string | null;
  numeroCarteirinha: string | null;
  dataVencCarteirinha: string | null;
  ativo?: boolean | null;
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

type MembroDetalhado = {
  id: string;
  igrejaId?: string | null;
  igrejaNome?: string | null;
  numeroSequencial?: number | null;
  nome?: string | null;
  rg?: string | null;
  cpf?: string | null;
  estadoCivil?: string | null;
  nomeMae?: string | null;
  nomePai?: string | null;
  cargo?: string | null;
  ativo?: boolean | null;
  telefone?: string | null;
  numeroCarteirinha?: string | number | null;
  dataNascimento?: string | null;
  dataBatismo?: string | null;
  dataCriacaoCarteirinha?: string | null;
  dataVencCarteirinha?: string | null;
  observacoes?: string | null;
  endereco?: string | null;
  numeroEndereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

function formatCPF(value?: string | null) {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!digits) return "-";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function formatCarteirinha(
  numeroCarteirinha?: string | number | null,
  numeroSequencial?: number | null,
) {
  if (typeof numeroCarteirinha === "number") {
    return `IPR-${String(numeroCarteirinha).padStart(4, "0")}`;
  }

  const raw = String(numeroCarteirinha ?? "").trim();

  if (raw) {
    if (/^\d+$/.test(raw)) return `IPR-${raw.padStart(4, "0")}`;
    return raw;
  }

  if (numeroSequencial) {
    return `IPR-${String(numeroSequencial).padStart(4, "0")}`;
  }

  return "-";
}

const PERM_DEFAULT_MEMBROS: Permissao = {
  recurso: "membros",
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

//type StatusFiltro = "all" | "danger" | "warn" | "ok";

type StatusFiltro = "all" | "danger" | "warn" | "ok" | "ativo" | "inativo";

export default function SecretariaPageClient() {
  const router = useRouter();

  const [items, setItems] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [permissaoMembros, setPermissaoMembros] = useState<Permissao | null>(
    null,
  );

  const [gerandoPdfCompleto, setGerandoPdfCompleto] = useState(false);
  const [pdfCompletoAtual, setPdfCompletoAtual] = useState(0);
  const [pdfCompletoTotal, setPdfCompletoTotal] = useState(0);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement | null>(null);

  const [numeroSequencial, setNumeroSequencial] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const [nome, setNome] = useState("");
  const [debouncedNome, setDebouncedNome] = useState("");

  // ✅ filtro por status
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("all");

  // =========================
  // Debounce
  // =========================
  useEffect(() => {
    const t = setTimeout(() => setDebouncedNome(nome), 350);
    return () => clearTimeout(t);
  }, [nome]);

  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMsg(message);
    setAlertOpen(true);
  }

  function formatDateBR(dateString?: string | null) {
    if (!dateString) return "-";
    const ymd = String(dateString).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "-";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  }

  function getStatus(venc?: string | null) {
    if (!venc) return { label: "—", type: "neutro" as const };

    const hoje = new Date();
    const d = new Date(venc);
    const diff = Math.ceil((+d - +hoje) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { label: "Vencida", type: "danger" as const };
    if (diff <= 30) return { label: "Vencer", type: "warn" as const };
    return { label: "OK", type: "ok" as const };
  }

  // =========================
  // Buscar /api/me + permissões
  // =========================
  useEffect(() => {
    const fetchMeAndPerms = async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) {
          setMe(null);
          setPermissaoMembros(PERM_DEFAULT_MEMBROS);
          return;
        }

        const meData: MeResponse = await r.json();
        setMe(meData);

        if (meData.role === "SUPERADMIN") {
          setPermissaoMembros({
            recurso: "membros",
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
          setPermissaoMembros(PERM_DEFAULT_MEMBROS);
          return;
        }

        const list: Permissao[] = await p.json();
        const perm = list.find((x) => x.recurso === "membros");
        setPermissaoMembros(perm ?? PERM_DEFAULT_MEMBROS);
      } catch (e) {
        console.error(e);
        setPermissaoMembros(PERM_DEFAULT_MEMBROS);
      }
    };

    fetchMeAndPerms();
  }, []);

  const canView = !!permissaoMembros?.ler;
  const canCreate = !!permissaoMembros?.criar;
  const canEdit = !!permissaoMembros?.editar;
  const canDelete = !!permissaoMembros?.deletar;
  const canShare = !!permissaoMembros?.compartilhar;

  // =========================
  // Buscar membros
  // =========================
  useEffect(() => {
    const load = async () => {
      if (!permissaoMembros) return;

      if (!canView) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const qs = new URLSearchParams();
      if (debouncedNome) qs.set("nome", debouncedNome);

      try {
        const res = await fetch(`/api/membros?${qs.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setItems([]);
          setLoading(false);
          showAlert("Erro", "Não foi possível carregar os membros.");
          return;
        }

        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch {
        setItems([]);
        setLoading(false);
        showAlert("Erro", "Falha de conexão ao carregar os membros.");
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNome, permissaoMembros]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pdfMenuRef.current &&
        !pdfMenuRef.current.contains(event.target as Node)
      ) {
        setPdfMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPdfMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // ✅ aplica filtro por status (vencida / a vencer(<=30) / ok)
  const itensFiltrados = useMemo(() => {
    if (statusFiltro === "all") return items;

    if (statusFiltro === "ativo") {
      return items.filter((m: any) => m.ativo === true);
    }

    if (statusFiltro === "inativo") {
      return items.filter((m: any) => m.ativo === false);
    }

    return items.filter((m) => {
      const s = getStatus(m.dataVencCarteirinha);
      return s.type === statusFiltro;
    });
  }, [items, statusFiltro]);

  const contadores = useMemo(() => {
    return {
      all: items.length,
      ok: items.filter((m) => getStatus(m.dataVencCarteirinha).type === "ok")
        .length,
      danger: items.filter(
        (m) => getStatus(m.dataVencCarteirinha).type === "danger",
      ).length,
      warn: items.filter(
        (m) => getStatus(m.dataVencCarteirinha).type === "warn",
      ).length,
      ativo: items.filter((m: any) => m.ativo === true).length,
      inativo: items.filter((m: any) => m.ativo === false).length,
    };
  }, [items]);

  const getNomeClientePdf = async () => {
    const membroBase = itensFiltrados[0] ?? items[0];

    if (!membroBase?.id) {
      return "Sistema Igreja";
    }

    try {
      const res = await fetch(`/api/membros/${membroBase.id}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        return "Sistema Igreja";
      }

      const data = (await res.json()) as MembroDetalhado;

      return data.igrejaNome?.trim() || "Sistema Igreja";
    } catch {
      return "Sistema Igreja";
    }
  };

  const desenharCarteirinhaNoDoc = async (
    doc: jsPDF,
    dadosMembro: MembroDetalhado,
    originX: number,
    originY: number,
    fundoFrente: string,
    fundoVerso: string,
  ) => {
    const cardW = 85;
    const cardH = 54;
    const gap = 2;

    const FRONT_X = originX;
    const BACK_X = originX + cardW + gap;

    const safe = (v?: string | null) => String(v ?? "").trim() || "-";

    const inicio = formatDateBR(dadosMembro.dataCriacaoCarteirinha);
    const fim = formatDateBR(dadosMembro.dataVencCarteirinha);

    const numeroCarteirinha = formatCarteirinha(
      dadosMembro.numeroCarteirinha,
      dadosMembro.numeroSequencial,
    );

    // =========================
    // FUNDOS
    // =========================

    if (fundoFrente) {
      doc.addImage(fundoFrente, "PNG", FRONT_X, originY, cardW, cardH);
    }

    if (fundoVerso) {
      doc.addImage(fundoVerso, "PNG", BACK_X, originY, cardW, cardH);
    }

    // =========================
    // CABEÇALHO
    // =========================

    const logoArea = 22;

    const headerX = FRONT_X + logoArea + 4;
    const headerW = cardW - logoArea - 6;
    const centerHeader = headerX + headerW / 2;

    doc.setTextColor(160, 120, 20);

    doc.setFont("times", "bold");
    doc.setFontSize(8);

    doc.text("IGREJA PRESBITERIANA RENOVADA-MC", headerX, originY + 8, {
      maxWidth: headerW,
    });

    doc.setFont("times", "normal");
    doc.setFontSize(6.5);

    doc.text(
      "R. Rafael Popoaski, 130 | Ipê I - Moreira César",
      headerX,
      originY + 11.2,
      { maxWidth: headerW },
    );

    doc.text("Pindamonhangaba - SP", headerX, originY + 13.8, {
      maxWidth: headerW,
    });

    doc.setFont("times", "bold");
    doc.setFontSize(7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    const cargoCarteirinha = safe(dadosMembro.cargo);

    doc.text(
      `Carteirinha de ${cargoCarteirinha}        Nº: ${numeroCarteirinha}`,
      centerHeader,
      originY + 20,
      { align: "center" },
    );

    doc.setTextColor(0, 0, 0);

    // =========================
    // DADOS MEMBRO
    // =========================

    const labelX = FRONT_X + 6;
    let y = originY + 29;
    const line = 4.6;

    const writeRow = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);

      doc.text(label, labelX, y);

      const labelWidth = doc.getTextWidth(label);

      doc.setFont("helvetica", "normal");

      doc.text(value, labelX + labelWidth + 3, y);

      y += line;
    };

    writeRow("Nome:", safe(dadosMembro.nome));

    writeRow("Data nasc.:", formatDateBR(dadosMembro.dataNascimento));

    writeRow("Data batismo:", formatDateBR(dadosMembro.dataBatismo));

    doc.setFont("helvetica", "bold");
    doc.text("RG:", labelX, y);

    doc.setFont("helvetica", "normal");
    doc.text(safe(dadosMembro.rg), labelX + 12, y);

    doc.setFont("helvetica", "bold");
    doc.text("Estado civil:", FRONT_X + 40, y);

    doc.setFont("helvetica", "normal");
    doc.text(safe(dadosMembro.estadoCivil), FRONT_X + 65, y);

    y += line;

    writeRow("Mãe:", safe(dadosMembro.nomeMae));

    writeRow("Pai:", safe(dadosMembro.nomePai));

    // =========================
    // VERSO
    // =========================

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Constituição Federal:", BACK_X + 6, originY + 12);

    doc.text("Constituição Federal:", BACK_X + 6, originY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);

    const largura = 72;
    const startX = BACK_X + (cardW - largura) / 2;

    let posY = originY + 17;

    const texto1 =
      "Art. 5º VI: É inviolável a liberdade de consciência e de crença, sendo assegurado o livre exercício dos cultos religiosos.";

    const texto2 =
      "Art. 5º VII: É assegurada a prestação de assistência religiosa nas entidades civis e militares de internação coletiva.";

    const texto3 = "Para validade obrigatório apresentar RG.";

    const linhas1 = doc.splitTextToSize(texto1, largura);
    const linhas2 = doc.splitTextToSize(texto2, largura);

    doc.text(linhas1, startX, posY);
    posY += linhas1.length * 3.2 + 1;

    doc.text(linhas2, startX, posY);
    posY += linhas2.length * 3.2 + 2;

    doc.text(texto3, startX, posY);

    posY += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Data", startX, posY);

    doc.setFont("helvetica", "normal");
    doc.text(`${inicio} a ${fim}`, startX + 10, posY);
  };

  const gerarCarteirinhasA4DoFiltro = async () => {
    if (!canShare) return;

    if (itensFiltrados.length === 0) {
      showAlert(
        "Atenção",
        "Nenhum membro encontrado para gerar a carteirinha.",
      );
      return;
    }

    setGerandoPdfCompleto(true);
    setPdfCompletoAtual(0);
    setPdfCompletoTotal(itensFiltrados.length);

    try {
      // 1) carregar fundos 1 vez
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const getImageBase64 = async (path: string) => {
        const resp = await fetch(`${origin}${path}`, { cache: "no-store" });
        if (!resp.ok) return "";
        const blob = await resp.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      };

      const fundoFrente = await getImageBase64(
        "/images/carteirinha-frente.png",
      );
      const fundoVerso = await getImageBase64("/images/carteirinha-verso.png");

      // 2) doc A4 retrato (4 carteirinhas por folha)
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.width; // 210
      const pageH = doc.internal.pageSize.height; // 297

      const gapFV = 2; // mesmo valor do gapFV de cima
      const blocoW = 170 + gapFV;

      const blocoH = 54;

      const marginX = 20; // sobra pro corte
      const marginY = 12;
      const gapY = 8;

      const slotsPorPagina = 4;

      // 3) loop dos membros
      for (let i = 0; i < itensFiltrados.length; i++) {
        setPdfCompletoAtual(i + 1);

        const item = itensFiltrados[i];
        const res = await fetch(`/api/membros/${item.id}`, {
          cache: "no-store",
        });
        if (!res.ok) continue;

        const detalhado = (await res.json()) as MembroDetalhado;
        if (!detalhado?.id) continue;

        // paginação
        const slot = i % slotsPorPagina;
        if (i > 0 && slot === 0) doc.addPage();

        const y = marginY + slot * (blocoH + gapY);
        const x = (pageW - blocoW) / 2; // centraliza na folha

        // se estourar altura (proteção)
        if (y + blocoH > pageH - marginY) {
          doc.addPage();
        }

        await desenharCarteirinhaNoDoc(
          doc,
          detalhado,
          x,
          y,
          fundoFrente,
          fundoVerso,
        );
      }

      doc.save("carteirinhas-a4.pdf");
    } catch (err) {
      console.error(err);
      showAlert("Erro", "Falha ao gerar as carteirinhas em A4.");
    } finally {
      setGerandoPdfCompleto(false);
      setPdfCompletoAtual(0);
      setPdfCompletoTotal(0);
    }
  };

  // =========================
  // PDF LISTA
  // =========================
  const gerarPdfLista = async () => {
    if (!canShare) return;

    if (itensFiltrados.length === 0) {
      showAlert("Atenção", "Nenhum membro para gerar PDF.");
      return;
    }

    const nomeCliente = await getNomeClientePdf();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

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
      doc.text("RELATÓRIO DE MEMBROS", pageWidth / 2, 18, {
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

      // ✅ mostra filtro no header
      const filtroLabel =
        statusFiltro === "all"
          ? "Todos"
          : statusFiltro === "danger"
            ? "Somente Vencidas"
            : statusFiltro === "warn"
              ? "Somente A vencer (<= 30 dias)"
              : "Somente OK";

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Filtro: ${filtroLabel}`, pageWidth / 2, 34, {
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

    const printTableHeader = () => {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");

      doc.text("NOME", margin, y);
      doc.text("CARGO", 100, y);
      doc.text("VENC.", 160, y);

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 8;
    };

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 50;
        printHeader();
        printTableHeader();
      }
    };

    printHeader();
    printTableHeader();

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    itensFiltrados.forEach((m) => {
      checkPageBreak(10);

      const nomeLines = doc.splitTextToSize(m.nome, 85);
      const cargo = m.cargo || "-";
      const venc = formatDateBR(m.dataVencCarteirinha);

      doc.text(nomeLines, margin, y);
      doc.text(cargo, 100, y);
      doc.text(venc, 160, y);

      const height = Math.max(nomeLines.length * 5, 6);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);

      y += height + 4;
    });

    printFooter();
    doc.save("membros.pdf");
  };

  // =========================
  // PDF COMPLETO
  // =========================
  const gerarPdfCompleto = async () => {
    if (!canShare || gerandoPdfCompleto) return;

    if (itensFiltrados.length === 0) {
      showAlert("Atenção", "Nenhum membro para gerar PDF.");
      return;
    }

    setGerandoPdfCompleto(true);
    setPdfCompletoAtual(0);
    setPdfCompletoTotal(itensFiltrados.length);

    try {
      const membros: MembroDetalhado[] = [];
      let falhas = 0;

      for (let i = 0; i < itensFiltrados.length; i++) {
        const item = itensFiltrados[i];
        setPdfCompletoAtual(i + 1);

        try {
          const res = await fetch(`/api/membros/${item.id}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            console.error("Erro ao buscar membro:", item.id, res.status);
            falhas++;
            continue;
          }

          const data = (await res.json()) as MembroDetalhado;

          if (data?.id) {
            membros.push(data);
          } else {
            falhas++;
          }
        } catch (err) {
          console.error("Erro ao buscar detalhe do membro:", item.id, err);
          falhas++;
        }
      }

      if (membros.length === 0) {
        showAlert("Erro", "Não foi possível carregar os detalhes dos membros.");
        return;
      }

      const filtroLabel =
        statusFiltro === "all"
          ? "Todos"
          : statusFiltro === "danger"
            ? "Somente Vencidas"
            : statusFiltro === "warn"
              ? "Somente A vencer (<= 30 dias)"
              : "Somente OK";

      const nomeCliente =
        membros.find((m) => m.igrejaNome?.trim())?.igrejaNome?.trim() ||
        "Sistema Igreja";

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const margin = 8;
      const labelX = margin;
      const valueX = 52;
      const valueMaxWidth = pageWidth - margin - valueX;
      const labelSize = 9;
      const valueSize = 9;
      const lineH = 4;
      const gap = 3;

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
        } catch (err) {
          console.error("Erro ao carregar logo:", err);
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
          } catch (err) {
            console.error("Erro ao inserir logo no PDF:", err);
          }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text("FICHA DE MEMBROS", pageWidth / 2, 18, {
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

        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`Filtro: ${filtroLabel}`, pageWidth - 10, 30, {
          align: "right",
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

          doc.text(
            `Página ${i} de ${totalPages}`,
            pageWidth - margin,
            footerY,
            {
              align: "right",
            },
          );
        }
      };

      const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - 20) {
          doc.addPage();
          y = 48;
          printHeader();
        }
      };

      const addField = (label: string, value?: string | null) => {
        const safeValue = String(value ?? "").trim() || "-";

        doc.setFont("helvetica", "normal");
        doc.setFontSize(valueSize);

        const lines = doc.splitTextToSize(safeValue, valueMaxWidth);
        const height = Math.max(lines.length * lineH, lineH);

        checkPageBreak(height + gap);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(labelSize);
        doc.setTextColor(70, 70, 70);
        doc.text(label, labelX, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(valueSize);
        doc.setTextColor(0, 0, 0);
        doc.text(lines, valueX, y);

        y += height + gap;
      };

      membros.forEach((membro, index) => {
        if (index > 0) {
          doc.addPage();
        }

        y = 48;
        printHeader();

        const codigo = membro.numeroSequencial
          ? `IPR-${String(membro.numeroSequencial).padStart(4, "0")}`
          : "IPR-0000";

        const enderecoCompleto = [
          membro.endereco ?? "",
          membro.numeroEndereco ?? "",
        ]
          .join(" ")
          .trim();

        addField("CADASTRO", codigo);
        addField("NOME", membro.nome ?? "-");
        addField("TELEFONE", membro.telefone ?? "-");
        addField("ENDEREÇO", enderecoCompleto || "-");
        addField("BAIRRO", membro.bairro ?? "-");
        addField("CIDADE", membro.cidade ?? "-");
        addField("ESTADO (UF)", membro.estado ?? "-");
        addField("ESTADO CIVIL", membro.estadoCivil ?? "-");
        addField("NOME DA MÃE", membro.nomeMae ?? "-");
        addField("NOME DO PAI", membro.nomePai ?? "-");
        addField("RG", membro.rg ?? "-");
        addField("CPF", formatCPF(membro.cpf));
        addField("CARGO", membro.cargo ?? "-");
        addField("STATUS", membro.ativo === false ? "Inativo" : "Ativo");
        addField("DATA NASC.", formatDateBR(membro.dataNascimento));
        addField("DATA BATISMO", formatDateBR(membro.dataBatismo));
        addField(
          "Nº CARTEIRINHA",
          formatCarteirinha(membro.numeroCarteirinha, membro.numeroSequencial),
        );
        addField(
          "CRIAÇÃO CARTEIR.",
          formatDateBR(membro.dataCriacaoCarteirinha),
        );
        addField("VENC. CARTEIR.", formatDateBR(membro.dataVencCarteirinha));
        addField("OBSERVAÇÕES", membro.observacoes ?? "-");
      });

      printFooter();
      doc.save("membros-ficha-completa.pdf");

      if (falhas > 0) {
        showAlert(
          "Atenção",
          `PDF gerado com ${membros.length} membro(s). ${falhas} não puderam ser carregados.`,
        );
      }
    } catch (error) {
      console.error("Erro ao gerar PDF completo:", error);
      showAlert("Erro", "Falha ao gerar o PDF completo dos membros.");
    } finally {
      setGerandoPdfCompleto(false);
      setPdfCompletoAtual(0);
      setPdfCompletoTotal(0);
    }
  };

  // =========================
  // PDF EM BRANCO
  // =========================
  const gerarPdfFichaEmBranco = async () => {
    if (!canShare) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const margin = 8;
      const gap = 5;
      const usableWidth = pageWidth - margin * 2;
      const innerPad = 6;
      const colGap = 6;
      const contentWidth = usableWidth - innerPad * 2;
      const colW = (contentWidth - colGap) / 2;

      const leftX = margin + innerPad;
      const rightX = leftX + colW + colGap;

      let y = margin;

      const nomeCliente = await getNomeClientePdf();

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
        doc.setFillColor(11, 77, 112);
        doc.roundedRect(margin, y, usableWidth, 18, 3, 3, "F");

        if (logoDataUri) {
          try {
            doc.addImage(logoDataUri, "PNG", margin + 4, y + 3, 10, 10);
          } catch {}
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text("Novo Membro", margin + 18, y + 7);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Ficha para preenchimento manual", margin + 18, y + 12);

        y += 22;
      };

      const printFooter = () => {
        const totalPages = doc.getNumberOfPages();
        const footerY = pageHeight - 8;

        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);

          doc.setDrawColor(210, 210, 210);
          doc.setLineWidth(0.4);
          doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(nomeCliente, margin, footerY);
          doc.text(
            `Página ${i} de ${totalPages}`,
            pageWidth - margin,
            footerY,
            {
              align: "right",
            },
          );
        }
      };

      const drawSection = (
        title: string,
        height: number,
        render: (startY: number) => void,
      ) => {
        doc.setFillColor(236, 241, 244);
        doc.setDrawColor(220, 226, 231);
        doc.roundedRect(margin, y, usableWidth, height, 3, 3, "FD");

        doc.setFillColor(34, 163, 255);
        doc.circle(margin + 5, y + 5, 1, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(45, 65, 85);
        doc.text(title, margin + 8, y + 6);

        render(y + 11);

        y += height + gap;
      };

      const drawField = (
        x: number,
        topY: number,
        w: number,
        label: string,
        placeholder = "",
        opts?: { select?: boolean; date?: boolean },
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(70, 85, 95);
        doc.text(label, x, topY);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(x, topY + 2, w, 8, 2, 2, "FD");

        if (placeholder) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(165, 165, 165);
          doc.text(placeholder, x + 3, topY + 7);
        }

        if (opts?.select) {
          const cx = x + w - 4;
          const cy = topY + 6.3;
          doc.setDrawColor(70, 70, 70);
          doc.setLineWidth(0.5);
          doc.line(cx - 1.8, cy - 0.8, cx, cy + 0.8);
          doc.line(cx, cy + 0.8, cx + 1.8, cy - 0.8);
        }

        if (opts?.date) {
          doc.setDrawColor(120, 120, 120);
          doc.setLineWidth(0.4);
          doc.rect(x + w - 5.2, topY + 4, 3.2, 3.2);
          doc.line(x + w - 5.2, topY + 4.9, x + w - 2, topY + 4.9);
        }
      };

      const drawTextarea = (
        x: number,
        topY: number,
        w: number,
        h: number,
        label: string,
        placeholder = "",
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(70, 85, 95);
        doc.text(label, x, topY);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(x, topY + 2, w, h, 2, 2, "FD");

        if (placeholder) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(165, 165, 165);
          doc.text(placeholder, x + 3, topY + 8);
        }
      };

      const drawStatusField = (x: number, topY: number, w: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(70, 85, 95);
        doc.text("Status do Membro", x, topY);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(x, topY + 2, w, 8, 2, 2, "FD");

        doc.setDrawColor(120, 120, 120);
        doc.rect(x + 3, topY + 4.2, 3, 3);
        doc.rect(x + 28, topY + 4.2, 3, 3);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text("Ativo", x + 8, topY + 6.8);
        doc.text("Inativo", x + 33, topY + 6.8);
      };

      printHeader();

      drawSection("Dados principais", 112, (startY) => {
        const row = 15;

        drawField(leftX, startY, colW, "Nome");
        drawField(rightX, startY, colW, "Telefone");

        drawField(leftX, startY + row, colW, "Endereço");
        drawField(rightX, startY + row, colW, "Número");

        drawField(leftX, startY + row * 2, colW, "Bairro");
        drawField(rightX, startY + row * 2, colW, "Cidade / Distrito");

        drawField(leftX, startY + row * 3, colW, "Estado (UF)");
        drawField(rightX, startY + row * 3, colW, "Estado Civil");

        drawField(leftX, startY + row * 4, colW, "Nome da Mãe");
        drawField(rightX, startY + row * 4, colW, "Nome do Pai");

        drawField(leftX, startY + row * 5, colW, "RG");
        drawField(rightX, startY + row * 5, colW, "CPF");

        drawField(leftX, startY + row * 6, contentWidth, "Cargo");
      });

      drawSection("Datas importantes", 26, (startY) => {
        drawField(leftX, startY, colW, "Data de Nascimento");
        drawField(rightX, startY, colW, "Data de Batismo");
      });

      drawSection("Carteirinha", 41, (startY) => {
        const row = 15;

        drawField(leftX, startY, colW, "Nº Carteirinha");
        drawField(rightX, startY, colW, "Criação da Carteirinha");

        drawField(leftX, startY + row, colW, "Vencimento da Carteirinha");
        drawStatusField(rightX, startY + row, colW);
      });

      drawSection("Observações", 38, (startY) => {
        drawTextarea(leftX, startY, contentWidth, 22, "Observações");
      });

      printFooter();

      doc.save("ficha-membro-em-branco.pdf");
    } catch (error) {
      console.error(error);
      showAlert("Erro", "Não foi possível gerar a ficha em branco.");
    }
  };

  // =========================
  // WhatsApp
  // =========================

  const enviarWhats = async () => {
    if (!canShare) return;

    if (itensFiltrados.length === 0) {
      showAlert("Atenção", "Nenhum membro para enviar no WhatsApp.");
      return;
    }

    const popup = window.open("", "_blank");

    const nomeCliente = await getNomeClientePdf();

    const dt = new Date();
    const dataBR = dt.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const horaBR = dt.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });

    const filtroLabel =
      statusFiltro === "all"
        ? "Todos"
        : statusFiltro === "danger"
          ? "Somente Vencidas"
          : statusFiltro === "warn"
            ? "Somente A vencer (<= 30 dias)"
            : "Somente OK";

    let texto = `👥 *RELATÓRIO DE MEMBROS*\n`;
    texto += `Igreja: *${nomeCliente}*\n`;
    texto += `Filtro: *${filtroLabel}*\n`;
    texto += `Gerado em: ${dataBR} ${horaBR}\n\n`;

    itensFiltrados.forEach((m) => {
      texto += `*${m.nome}*\n`;
      texto += `Cargo: ${m.cargo || "-"}\n`;
      texto += `Venc.: ${formatDateBR(m.dataVencCarteirinha)}\n`;
      texto += `------------------------------\n`;
    });

    texto += `📌 *${nomeCliente}*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;

    if (popup) {
      popup.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  };
  // =========================
  // Estado: ainda carregando permissões
  // =========================
  if (!permissaoMembros) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando permissões...</div>
      </div>
    );
  }

  // =========================
  // Sem permissão de visualizar
  // =========================
  if (!loading && !canView) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          ⛔ Você não tem permissão para visualizar membros.
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button onClick={() => router.back()} className={styles.back}>
          ← Voltar
        </button>

        <div className={styles.titleRow}>
          <h1 className={styles.title}>Membros</h1>

          <div className={styles.summaryInline}>
            <span className={styles.summaryInlineLabel}>
              {statusFiltro === "all" && "Total"}
              {statusFiltro === "ok" && "Em dia"}
              {statusFiltro === "danger" && "Vencidos"}
              {statusFiltro === "warn" && "A vencer"}
              {statusFiltro === "ativo" && "Ativos"}
              {statusFiltro === "inativo" && "Inativos"}
            </span>

            <strong className={styles.summaryInlineValue}>
              {statusFiltro === "all" && contadores.all}
              {statusFiltro === "ok" && contadores.ok}
              {statusFiltro === "danger" && contadores.danger}
              {statusFiltro === "warn" && contadores.warn}
              {statusFiltro === "ativo" && contadores.ativo}
              {statusFiltro === "inativo" && contadores.inativo}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filtersRow}>
          <input
            placeholder="Buscar por nome..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={styles.input}
          />

          <select
            className={styles.select}
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
          >
            <option value="all">Todos</option>
            <option value="ok">Em Dia</option>
            <option value="danger">Vencidas</option>
            <option value="warn">Á Vencer</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        <div className={styles.actionsRow}>
          {canShare && (
            <>
              <div className={styles.pdfMenuWrap} ref={pdfMenuRef}>
                <button
                  type="button"
                  className={styles.btnPDF}
                  onClick={() => setPdfMenuOpen((prev) => !prev)}
                  aria-expanded={pdfMenuOpen}
                  aria-haspopup="menu"
                  disabled={gerandoPdfCompleto}
                >
                  <FileText size={16} />
                  {gerandoPdfCompleto ? " Gerando..." : " PDF"}
                  <ChevronDown
                    size={16}
                    className={`${styles.pdfChevron} ${pdfMenuOpen ? styles.pdfChevronOpen : ""}`}
                  />
                </button>

                {pdfMenuOpen && (
                  <div className={styles.pdfDropdown} role="menu">
                    <button
                      type="button"
                      className={styles.pdfDropdownItem}
                      onClick={() => {
                        setPdfMenuOpen(false);
                        void gerarPdfLista();
                      }}
                    >
                      <FileText size={15} />
                      PDF Lista
                    </button>

                    <button
                      type="button"
                      className={styles.pdfDropdownItem}
                      onClick={() => {
                        setPdfMenuOpen(false);
                        void gerarPdfCompleto();
                      }}
                      disabled={gerandoPdfCompleto}
                    >
                      <FileText size={15} />
                      {gerandoPdfCompleto
                        ? "Gerando PDF Completo..."
                        : "PDF Completo"}
                    </button>

                    <button
                      type="button"
                      className={styles.pdfDropdownItem}
                      onClick={() => {
                        setPdfMenuOpen(false);
                        void gerarPdfFichaEmBranco();
                      }}
                    >
                      <FileText size={15} />
                      Ficha em Branco
                    </button>

                    <button
                      type="button"
                      className={styles.pdfDropdownItem}
                      onClick={() => {
                        setPdfMenuOpen(false);
                        void gerarCarteirinhasA4DoFiltro();
                      }}
                    >
                      <FileText size={15} />
                      Gerar Carteirinha(s)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={enviarWhats}
                className={styles.btnWhats}
                type="button"
              >
                <MessageCircle size={16} /> Whats
              </button>
            </>
          )}

          {canCreate && (
            <a href="/secretaria/membros/novo" className={styles.btnSecondary}>
              + Novo
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <div className={styles.cards}>
          {itensFiltrados.map((m) => {
            const s = getStatus(m.dataVencCarteirinha);

            return (
              <div
                key={m.id}
                className={`${styles.card} ${styles[`card_${s.type}`]}`}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTitle}>{m.nome}</div>
                    <div className={styles.cardNumber}>
                      IPR{String(m.numeroSequencial).padStart(4, "0")}
                    </div>
                  </div>

                  <span className={styles[s.type]}>{s.label}</span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.row}>
                    <span className={styles.k}>Cargo</span>
                    <span className={styles.v}>{m.cargo}</span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.k}>Venc.</span>
                    <span className={styles.v}>
                      {formatDateBR(m.dataVencCarteirinha)}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {canShare && (
                    <a
                      href={`/secretaria/membros/editar/${m.id}?mode=share`}
                      className={styles.shareButton}
                      title="Compartilhar"
                    >
                      <Share2 size={18} />
                    </a>
                  )}

                  {canEdit && (
                    <a
                      href={`/secretaria/membros/editar/${m.id}`}
                      className={styles.editButton}
                      title="Editar"
                    >
                      <PencilLine size={18} />
                    </a>
                  )}

                  {canDelete && (
                    <button
                      className={styles.deleteButton}
                      title="Excluir"
                      type="button"
                      onClick={() => {
                        setConfirmId(m.id);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {itensFiltrados.length === 0 && (
            <div className={styles.emptyCard}>Nenhum membro encontrado.</div>
          )}
        </div>
      )}

      {gerandoPdfCompleto && (
        <div className={styles.progressOverlay}>
          <div className={styles.progressModal}>
            <div className={styles.progressSpinner} />

            <div className={styles.progressTitle}>Gerando PDF completo</div>

            <div className={styles.progressText}>
              Processando membro {pdfCompletoAtual} de {pdfCompletoTotal}
            </div>

            <div className={styles.progressSubtext}>
              Não feche esta tela até a geração terminar.
            </div>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${
                    pdfCompletoTotal
                      ? Math.round((pdfCompletoAtual / pdfCompletoTotal) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className={styles.progressPercent}>
              {pdfCompletoTotal
                ? Math.round((pdfCompletoAtual / pdfCompletoTotal) * 100)
                : 0}
              %
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Excluir membro?"
        message="Esta ação não pode ser desfeita."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);

          const idToDelete = confirmId;

          const res = await fetch(`/api/membros/${idToDelete}`, {
            method: "DELETE",
            cache: "no-store",
          });

          if (!res.ok) {
            showAlert("Erro", "Não foi possível excluir.");
            return;
          }

          setItems((prev) => prev.filter((m) => m.id !== idToDelete));
          setConfirmId("");
        }}
      />

      <AlertModal
        open={alertOpen}
        title={alertTitle}
        message={alertMsg}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
