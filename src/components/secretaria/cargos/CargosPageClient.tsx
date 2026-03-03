"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import AlertModal from "@/components/ui/AlertModal/AlertModal";
import { useToast } from "@/components/ui/Toast/useToast";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle, PencilLine, Trash2 } from "lucide-react";

type Cargo = {
  id: string;
  nome: string;
};

type Igreja = { id: string; nome: string; slug: string };

type Permissao = {
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

const PERM_DEFAULT: Permissao = {
  recurso: "cargos",
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

export default function CargosPageClient({ userRole }: { userRole: string }) {
  const toast = useToast();
  const router = useRouter();
  const isSuperAdmin = userRole === "SUPERADMIN";

  const [items, setItems] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [permissao, setPermissao] = useState<Permissao>(PERM_DEFAULT);

  const [nome, setNome] = useState("");
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [igrejaId, setIgrejaId] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const showAlert = (title: string, msg: string) => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertOpen(true);
  };

  const canView = permissao.ler;
  const canCreate = permissao.criar;
  const canEdit = permissao.editar;
  const canDelete = permissao.deletar;
  const canShare = permissao.compartilhar;

  // ============================
  // Buscar permissões
  // ============================
  useEffect(() => {
    const fetchPermissoes = async () => {
      if (isSuperAdmin) {
        setPermissao({
          recurso: "cargos",
          ler: true,
          criar: true,
          editar: true,
          deletar: true,
          compartilhar: true,
        });
        return;
      }

      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) {
          setPermissao(PERM_DEFAULT);
          return;
        }

        const me: MeResponse = await r.json();

        const p = await fetch(`/api/permissoes?userId=${me.id}`, {
          cache: "no-store",
        });
        if (!p.ok) {
          setPermissao(PERM_DEFAULT);
          return;
        }

        const list: Permissao[] = await p.json();
        const perm = list.find((x) => x.recurso === "cargos");
        setPermissao(perm ?? PERM_DEFAULT);
      } catch {
        setPermissao(PERM_DEFAULT);
      }
    };

    fetchPermissoes();
  }, [isSuperAdmin]);

  // ============================
  // Load cargos
  // ============================
  const load = async (selectedIgrejaId?: string) => {
    if (!canView) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const qs = new URLSearchParams();
    const finalId = selectedIgrejaId ?? igrejaId;

    if (isSuperAdmin && finalId) qs.set("igrejaId", finalId);

    try {
      const res = await fetch(`/api/cargos?${qs.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        showAlert("Erro", "Não foi possível carregar os cargos.");
        setItems([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      showAlert("Erro", "Falha de conexão ao carregar cargos.");
      setItems([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      if (!canView && !isSuperAdmin) {
        setLoading(false);
        return;
      }

      if (isSuperAdmin) {
        try {
          const r = await fetch("/api/igrejas", { cache: "no-store" });
          if (!r.ok) {
            setLoading(false);
            showAlert("Erro", "Não foi possível carregar as igrejas.");
            return;
          }

          const j = await r.json();
          if (Array.isArray(j)) {
            setIgrejas(j);
            const first = j[0]?.id || "";
            setIgrejaId(first);
            await load(first);
            return;
          }

          setLoading(false);
          showAlert("Erro", "Resposta inválida ao carregar igrejas.");
          return;
        } catch {
          setLoading(false);
          showAlert("Erro", "Falha de conexão ao carregar igrejas.");
          return;
        }
      }

      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissao]);

  // ============================
  // Criar
  // ============================
  const createCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    if (!nome.trim()) {
      toast.info("Informe o nome do cargo.");
      return;
    }

    if (isSuperAdmin && !igrejaId) {
      toast.info("Selecione uma igreja.");
      return;
    }

    setSaving(true);

    const qs = new URLSearchParams();
    if (isSuperAdmin && igrejaId) qs.set("igrejaId", igrejaId);

    try {
      const res = await fetch(`/api/cargos?${qs.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      setSaving(false);

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.error || "Erro ao salvar.");
        return;
      }

      toast.success("Cargo cadastrado com sucesso!");
      setNome("");
      load();
    } catch {
      setSaving(false);
      toast.error("Falha de conexão ao salvar.");
    }
  };

  // ============================
  // Excluir
  // ============================
  const deleteCargo = async (id: string) => {
    if (!canDelete) return;

    const qs = new URLSearchParams();
    if (isSuperAdmin && igrejaId) qs.set("igrejaId", igrejaId);

    try {
      const res = await fetch(`/api/cargos/${id}?${qs.toString()}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.error || "Não foi possível excluir.");
        return;
      }

      toast.success("Cargo excluído com sucesso!");
      load();
    } catch {
      toast.error("Falha de conexão ao excluir.");
    }
  };

  // ============================
  // PDF (IGUAL AO MODELO)
  // ============================
  const gerarPdf = async () => {
    if (!canShare) return;

    if (items.length === 0) {
      showAlert("Atenção", "Nenhum cargo para gerar PDF.");
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
      doc.text("LISTA DE CARGOS", pageWidth / 2, 18, { align: "center" });

      // ✅ DATA/HORA (BR) no header
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
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.text("CARGO", margin, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 10;
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

    items.forEach((c) => {
      checkPageBreak(10);

      const nomeLines = doc.splitTextToSize(c.nome, pageWidth - margin * 2);
      doc.text(nomeLines, margin, y);

      const height = Math.max(nomeLines.length * 5, 6);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);

      y += height + 4;
    });

    printFooter();

    doc.save("cargos.pdf");
  };

  // ============================
  // Whats (IGUAL AO MODELO)
  // ============================
  const enviarWhats = () => {
    if (!canShare) return;

    if (items.length === 0) {
      showAlert("Atenção", "Nenhum cargo para enviar no WhatsApp.");
      return;
    }

    const nomeCliente = "Sistema Igreja";

    let texto = `🏷️ *LISTA DE CARGOS*\n\n`;

    items.forEach((c) => {
      texto += `▪️ ${c.nome}\n`;
    });

    texto += `\n------------------------------\n`;
    texto += `📌 *${nomeCliente}*`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  };

  // ============================
  // UI (permissões)
  // ============================
  if (!canView && !isSuperAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCard}>
          ⛔ Você não tem permissão para visualizar cargos.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button onClick={() => router.back()} className={styles.btnSecondary}>
          ← Voltar
        </button>

        <div className={styles.headerRight}>
          <h1 className={styles.title}>Cargos</h1>
          <div className={styles.sub}>
            Cadastre cargos/funções para usar no cadastro de membros.
          </div>
        </div>
      </div>

      <form className={styles.filters} onSubmit={createCargo}>
        {isSuperAdmin && (
          <select
            className={styles.select}
            value={igrejaId}
            onChange={(e) => {
              const id = e.target.value;
              setIgrejaId(id);
              load(id);
            }}
          >
            {igrejas.length === 0 ? (
              <option value="">Carregando igrejas...</option>
            ) : (
              igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome} ({i.slug})
                </option>
              ))
            )}
          </select>
        )}

        <input
          className={styles.input}
          placeholder="Nome do cargo... (Ex: Diácono, Secretário, Membro)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={saving || !canCreate}
        />

        {canShare && (
          <>
            <button
              type="button"
              onClick={gerarPdf}
              className={`${styles.btn} ${styles.btnPDF}`}
            >
              <FileText size={16} /> PDF
            </button>

            <button
              type="button"
              onClick={enviarWhats}
              className={`${styles.btn} ${styles.btnWhats}`}
            >
              <MessageCircle size={16} /> Whats
            </button>
          </>
        )}

        {canCreate && (
          <button className={styles.btn} type="submit" disabled={saving}>
            {saving ? "Salvando..." : "+ Adicionar"}
          </button>
        )}
      </form>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <div className={styles.cards}>
          {items.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>{c.nome}</div>
              </div>

              <div className={styles.cardActions}>
                {canEdit && (
                  <a
                    href={`/secretaria/cargos/editar/${c.id}`}
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
                      setConfirmId(c.id);
                      setConfirmOpen(true);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className={styles.emptyCard}>Nenhum cargo cadastrado.</div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Excluir cargo?"
        message="Esta ação não pode ser desfeita."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await deleteCargo(confirmId);
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
