//components/dashboard/usuarios/UsuariosPageClient.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import AlertModal from "@/components/ui/AlertModal/AlertModal";
import { useToast } from "@/components/ui/Toast/useToast";
import {
  PencilLine,
  Trash2,
  Plus,
  X,
  KeyRound,
  Eye,
  EyeOff,
  FileText,
  MessageCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  igrejaId: string | null;
  createdAt?: string;
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
  role: string;
};

const PERM_DEFAULT: Permissao = {
  recurso: "",
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

export default function UsuariosPageClient({
  userRole,
  igrejaId,
}: {
  userRole: string;
  igrejaId: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const isSuperAdmin = userRole === "SUPERADMIN";

  const [permUsuarios, setPermUsuarios] = useState<Permissao | null>(null);
  const [permSenha, setPermSenha] = useState<Permissao | null>(null);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [selectedIgreja, setSelectedIgreja] = useState(igrejaId ?? "");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSenha, setNewSenha] = useState("");
  const [showNewSenha, setShowNewSenha] = useState(false);
  const [newRole, setNewRole] = useState("USER");
  const [savingCreate, setSavingCreate] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("USER");
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const [passwordId, setPasswordId] = useState<string | null>(null);
  const [newPass1, setNewPass1] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMsg(message);
    setAlertOpen(true);
  }

  // =========================
  // Permissões
  // =========================
  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (!r.ok) {
          setPermUsuarios(PERM_DEFAULT);
          setPermSenha(PERM_DEFAULT);
          return;
        }

        const me: MeResponse = await r.json();

        if (me.role === "SUPERADMIN") {
          const full = {
            recurso: "",
            ler: true,
            criar: true,
            editar: true,
            deletar: true,
            compartilhar: true,
          };

          setPermUsuarios({ ...full, recurso: "usuarios" });
          setPermSenha({ ...full, recurso: "usuarios_senha" });
          return;
        }

        const p = await fetch(`/api/permissoes?userId=${me.id}`, {
          cache: "no-store",
        });

        if (!p.ok) {
          setPermUsuarios(PERM_DEFAULT);
          setPermSenha(PERM_DEFAULT);
          return;
        }

        const list: Permissao[] = await p.json();

        setPermUsuarios(
          list.find((x) => x.recurso === "usuarios") ?? PERM_DEFAULT,
        );

        setPermSenha(
          list.find((x) => x.recurso === "usuarios_senha") ?? PERM_DEFAULT,
        );
      } catch {
        setPermUsuarios(PERM_DEFAULT);
        setPermSenha(PERM_DEFAULT);
      }
    };

    fetchPerms();
  }, []);

  const permsLoaded = useMemo(
    () => !!permUsuarios && !!permSenha,
    [permUsuarios, permSenha],
  );

  const canView = !!permUsuarios?.ler;
  const canCreate = !!permUsuarios?.criar;
  const canEdit = !!permUsuarios?.editar;
  const canDelete = !!permUsuarios?.deletar;
  const canShare = !!permUsuarios?.compartilhar; // ✅ PDF/WHATS
  const canChangePassword = !!permSenha?.editar;

  // ✅ redirect bonito (client)
  useEffect(() => {
    if (permsLoaded && !canView) router.replace("/sem-permissao");
  }, [permsLoaded, canView, router]);

  // =========================
  // Load users / igrejas
  // =========================
  async function loadUsers(igreja?: string) {
    setLoading(true);
    const qs = new URLSearchParams();
    if (igreja) qs.set("igrejaId", igreja);

    try {
      const res = await fetch(`/api/users?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => []);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
      showAlert("Erro", "Falha ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  async function loadIgrejas() {
    const r = await fetch("/api/igrejas", { cache: "no-store" });
    const j = await r.json().catch(() => []);
    if (!Array.isArray(j)) return;

    setIgrejas(j);
    const first = j[0]?.id ?? "";
    setSelectedIgreja(first);
    await loadUsers(first);
  }

  useEffect(() => {
    (async () => {
      if (!permsLoaded || !canView) return;
      if (isSuperAdmin) await loadIgrejas();
      else await loadUsers(igrejaId ?? undefined);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permsLoaded, canView]);

  // =========================
  // Helpers (PDF/Whats)
  // =========================
  const nomeCliente = useMemo(() => {
    if (!isSuperAdmin) return "Sistema Igreja";
    const found = igrejas.find((i) => i.id === selectedIgreja);
    return found?.nome || "Sistema Igreja";
  }, [isSuperAdmin, igrejas, selectedIgreja]);

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

  const gerarPdfUsuarios = async () => {
    if (!canShare && !isSuperAdmin) return;

    if (users.length === 0) {
      toast.info("Nenhum usuário para gerar PDF.", "Atenção");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    let y = 50;

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
      doc.text("RELATÓRIO DE USUÁRIOS", pageWidth / 2, 18, { align: "center" });

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

    const printTableHeader = () => {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");

      doc.text("Nome", margin, y);
      doc.text("Email", 80, y);
      doc.text("Perfil de Acesso", 165, y);

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

    users.forEach((u) => {
      checkPageBreak(10);

      const nome = (u.name ?? "-").trim() || "-";
      const email = (u.email ?? "-").trim() || "-";
      const role = (u.role ?? "-").trim() || "-";

      const nomeLines = doc.splitTextToSize(nome, 65);
      const emailLines = doc.splitTextToSize(email, 80);

      doc.text(nomeLines, margin, y);
      doc.text(emailLines, 80, y);
      doc.text(role, 165, y);

      const height = Math.max(nomeLines.length * 5, emailLines.length * 5, 6);

      doc.setDrawColor(245, 245, 245);
      doc.line(margin, y + height, pageWidth - margin, y + height);

      y += height + 4;
    });

    printFooter();
    doc.save("usuarios.pdf");
  };

  const enviarWhatsUsuarios = () => {
    if (!canShare && !isSuperAdmin) return;

    if (users.length === 0) {
      toast.info("Nenhum usuário para enviar no WhatsApp.", "Atenção");
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

    let texto = `👤 *RELATÓRIO DE USUÁRIOS*\n`;
    texto += `Gerado em: ${dataBR} ${horaBR}\n`;
    texto += `Sistema: *${nomeCliente}*\n\n`;

    users.forEach((u) => {
      texto += `*${u.name ?? "-"}*\n`;
      texto += `Email: ${u.email}\n`;
      texto += `Perfil de Acesso: ${u.role}\n`;
      texto += `------------------------------\n`;
    });

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  };

  // =========================
  // Password
  // =========================
  function openPassword(id: string) {
    setPasswordId(id);
    setNewPass1("");
    setNewPass2("");
  }

  function cancelPassword() {
    setPasswordId(null);
    setNewPass1("");
    setNewPass2("");
  }

  async function savePassword(id: string) {
    if (!canChangePassword) return;
    if (savingPass) return;

    if (!newPass1.trim() || newPass1.trim().length < 6) {
      toast.info("Senha mínima: 6 caracteres.", "Atenção");
      return;
    }

    if (newPass1 !== newPass2) {
      toast.info("As senhas não conferem.", "Atenção");
      return;
    }

    setSavingPass(true);

    try {
      const res = await fetch(`/api/users/${id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: newPass1 }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error || "Erro ao trocar senha.", "Erro");
        return;
      }

      toast.success("Senha atualizada!", "Sucesso");
      cancelPassword();
    } catch {
      toast.error("Falha de conexão.", "Erro");
    } finally {
      setSavingPass(false);
    }
  }

  // =========================
  // CREATE
  // =========================
  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    if (savingCreate) return;

    if (!newEmail.trim()) {
      toast.info("Informe o email.", "Atenção");
      return;
    }
    if (!newSenha.trim() || newSenha.trim().length < 6) {
      toast.info("Senha mínima: 6 caracteres.", "Atenção");
      return;
    }

    setSavingCreate(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          senha: newSenha,
          role: isSuperAdmin ? newRole : "USER",
          igrejaId: isSuperAdmin ? selectedIgreja : igrejaId,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error || "Erro ao criar usuário.", "Erro");
        return;
      }

      toast.success("Usuário criado com sucesso!", "Sucesso");
      setNewName("");
      setNewEmail("");
      setNewSenha("");
      setNewRole("USER");
      setCreateOpen(false);

      await loadUsers(isSuperAdmin ? selectedIgreja : (igrejaId ?? undefined));
    } catch {
      toast.error("Falha de conexão.", "Erro");
    } finally {
      setSavingCreate(false);
    }
  }

  // =========================
  // EDIT
  // =========================
  function startEdit(u: UserItem) {
    if (!canEdit) return;
    setEditingId(u.id);
    setEditName(u.name ?? "");
    setEditRole(u.role);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditRole("USER");
  }

  async function saveEdit(id: string) {
    if (!canEdit) return;
    if (savingEdit) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          role: isSuperAdmin ? editRole : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error || "Erro ao salvar.", "Erro");
        return;
      }

      toast.success("Usuário atualizado!", "Sucesso");
      cancelEdit();
      await loadUsers(isSuperAdmin ? selectedIgreja : (igrejaId ?? undefined));
    } catch {
      toast.error("Falha de conexão.", "Erro");
    } finally {
      setSavingEdit(false);
    }
  }

  // =========================
  // DELETE
  // =========================
  async function confirmDelete() {
    if (!canDelete) return;

    try {
      const res = await fetch(`/api/users/${confirmId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error || "Erro ao excluir.", "Erro");
        return;
      }

      toast.success("Usuário excluído!", "Sucesso");
      setConfirmOpen(false);
      await loadUsers(isSuperAdmin ? selectedIgreja : (igrejaId ?? undefined));
    } catch {
      toast.error("Falha de conexão.", "Erro");
    }
  }

  // =========================
  // Render
  // =========================
  if (!permsLoaded) {
    return <div className={styles.container}>Carregando permissões...</div>;
  }

  if (!canView) {
    return null; // vai redirecionar pro /sem-permissao
  }

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h1 className={styles.title}>Usuários</h1>

        {isSuperAdmin && (
          <div className={styles.filters}>
            <select
              className={styles.select}
              value={selectedIgreja}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedIgreja(id);
                loadUsers(id);
              }}
            >
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome} ({i.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.topRight}>
          {(canShare || isSuperAdmin) && (
            <>
              <button
                onClick={gerarPdfUsuarios}
                className={styles.btnPDF}
                type="button"
                disabled={loading || users.length === 0}
              >
                <FileText size={16} /> PDF
              </button>

              <button
                onClick={enviarWhatsUsuarios}
                className={styles.btnWhats}
                type="button"
                disabled={loading || users.length === 0}
              >
                <MessageCircle size={16} /> Whats
              </button>
            </>
          )}

          {canCreate && (
            <button
              type="button"
              className={styles.btn}
              onClick={() => setCreateOpen((v) => !v)}
            >
              {createOpen ? <X size={18} /> : <Plus size={18} />}
              {createOpen ? "Fechar" : "Novo"}
            </button>
          )}
        </div>
      </div>

      {createOpen && canCreate && (
        <form className={styles.createForm} onSubmit={createUser}>
          <div className={styles.blockTitle}>Novo usuário</div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Nome</label>
              <input
                className={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome (opcional)"
                disabled={savingCreate}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email *</label>
              <input
                className={styles.input}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={savingCreate}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Senha *</label>

              <div className={styles.passwordInput}>
                <input
                  className={styles.input}
                  type={showNewSenha ? "text" : "password"}
                  value={newSenha}
                  onChange={(e) => setNewSenha(e.target.value)}
                  placeholder="mín. 6 caracteres"
                  disabled={savingCreate}
                />

                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNewSenha((v) => !v)}
                  disabled={savingCreate}
                  title={showNewSenha ? "Ocultar" : "Mostrar"}
                >
                  {showNewSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isSuperAdmin && (
              <div className={styles.field}>
                <label className={styles.label}>Perfil de Acesso</label>
                <select
                  className={styles.input}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={savingCreate}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}
          </div>

          <button className={styles.btnGreen} disabled={savingCreate}>
            {savingCreate ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <div className={styles.cards}>
          {users.map((u) => (
            <div key={u.id} className={styles.card}>
              {editingId === u.id ? (
                <>
                  <div className={styles.cardInfo}>
                    <div className={styles.field}>
                      <label className={styles.labelRole}>Nome</label>
                      <input
                        className={styles.input}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={savingEdit}
                      />
                    </div>

                    {isSuperAdmin && (
                      <div className={styles.field}>
                        <label className={styles.labelRole}>
                          Perfil de Acesso
                        </label>
                        <select
                          className={styles.input}
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          disabled={savingEdit}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.btnSmall}
                      onClick={() => saveEdit(u.id)}
                      disabled={savingEdit}
                    >
                      {savingEdit ? "..." : "Salvar"}
                    </button>

                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={cancelEdit}
                      disabled={savingEdit}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.cardInfo}>
                    <div className={styles.name}>{u.name ?? "-"}</div>
                    <div className={styles.email}>{u.email}</div>
                    <div className={styles.role}>{u.role}</div>
                  </div>

                  {passwordId !== u.id && editingId !== u.id && (
                    <div className={styles.actions}>
                      {canEdit && (
                        <button
                          type="button"
                          className={styles.iconBtnEdit}
                          onClick={() => startEdit(u)}
                          title="Editar"
                        >
                          <PencilLine size={18} />
                        </button>
                      )}

                      {canChangePassword && (
                        <button
                          type="button"
                          className={styles.iconBtnKey}
                          onClick={() => openPassword(u.id)}
                          title="Trocar senha"
                        >
                          <KeyRound size={18} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className={styles.iconBtnDelete}
                          onClick={() => {
                            setConfirmId(u.id);
                            setConfirmOpen(true);
                          }}
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  )}

                  {passwordId === u.id && (
                    <div className={styles.passwordBox}>
                      <div className={styles.gridPassword}>
                        <div className={styles.passwordInput}>
                          <input
                            className={styles.input}
                            type={showPass1 ? "text" : "password"}
                            placeholder="Nova senha (mín. 6)"
                            value={newPass1}
                            onChange={(e) => setNewPass1(e.target.value)}
                            disabled={savingPass}
                          />

                          <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowPass1((v) => !v)}
                          >
                            {showPass1 ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>

                        <div className={styles.passwordInput}>
                          <input
                            className={styles.input}
                            type={showPass2 ? "text" : "password"}
                            placeholder="Confirmar senha"
                            value={newPass2}
                            onChange={(e) => setNewPass2(e.target.value)}
                            disabled={savingPass}
                          />

                          <button
                            type="button"
                            className={styles.eyeBtn}
                            onClick={() => setShowPass2((v) => !v)}
                          >
                            {showPass2 ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.btnSmall}
                          onClick={() => savePassword(u.id)}
                          disabled={savingPass}
                        >
                          {savingPass ? "..." : "Salvar senha"}
                        </button>

                        <button
                          type="button"
                          className={styles.btnGhost}
                          onClick={cancelPassword}
                          disabled={savingPass}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {users.length === 0 && (
            <div className={styles.emptyCard}>Nenhum usuário cadastrado.</div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Excluir usuário?"
        message="Esta ação não pode ser desfeita."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
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
