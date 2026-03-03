//src/components/secretaria/membros/SecretariaPageClient.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import AlertModal from "@/components/ui/AlertModal/AlertModal";
import styles from "./styles.module.scss";
import { Share2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle, PencilLine, Trash2 } from "lucide-react";

type Membro = {
  id: string;
  numeroSequencial: number;
  nome: string;
  cargo: string;
  telefone: string | null;
  numeroCarteirinha: string | null;
  dataVencCarteirinha: string | null;
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

const PERM_DEFAULT_MEMBROS: Permissao = {
  recurso: "membros",
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

export default function SecretariaPageClient() {
  const router = useRouter();

  const [items, setItems] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [permissaoMembros, setPermissaoMembros] = useState<Permissao | null>(
    null,
  );

  const [numeroSequencial, setNumeroSequencial] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const [nome, setNome] = useState("");
  const [debouncedNome, setDebouncedNome] = useState("");

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
    if (diff <= 30) return { label: "A vencer", type: "warn" as const };
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

  // =========================
  // PDF (PADRÃO EXERCÍCIOS / CARGOS)
  // =========================
  const gerarPdf = async () => {
    if (!canShare) return;

    if (items.length === 0) {
      showAlert("Atenção", "Nenhum membro para gerar PDF.");
      return;
    }

    const nomeCliente = "Sistema Igreja";

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

    items.forEach((m) => {
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
  // WhatsApp (PADRÃO)
  // =========================
  const enviarWhats = () => {
    if (!canShare) return;

    if (items.length === 0) {
      showAlert("Atenção", "Nenhum membro para enviar no WhatsApp.");
      return;
    }

    const dt = new Date();
    const dataBR = dt.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const horaBR = dt.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });

    let texto = `👥 *RELATÓRIO DE MEMBROS*\n`;
    texto += `Gerado em: ${dataBR} ${horaBR}\n\n`;

    items.forEach((m) => {
      texto += `*${m.nome}*\n`;
      texto += `Cargo: ${m.cargo || "-"}\n`;
      texto += `Venc.: ${formatDateBR(m.dataVencCarteirinha)}\n`;
      texto += `------------------------------\n`;
    });

    texto += `📌 *Sistema Igreja*`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
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

        <h1 className={styles.title}>Membros</h1>
      </div>

      <div className={styles.filters}>
        <input
          placeholder="Buscar por nome..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={styles.input}
        />

        {canShare && (
          <>
            <button onClick={gerarPdf} className={styles.btnPDF} type="button">
              <FileText size={16} /> PDF
            </button>

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

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <div className={styles.cards}>
          {items.map((m) => {
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

          {items.length === 0 && (
            <div className={styles.emptyCard}>Nenhum membro encontrado.</div>
          )}
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

          //router.refresh();
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
