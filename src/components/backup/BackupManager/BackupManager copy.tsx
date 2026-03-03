//src/components/backup/BackupManager/BackupManager.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.scss";

interface Backup {
  nome: string;
  tamanho: string;
  data: string;
}

type ToastType = "success" | "error" | "info";

const TABLES = [
  // use os mesmos nomes que você vai mandar no body.tabelas
  "users",
  "igrejas",
  "cargos",
  "permissoes",
  "membros",
  "eventos",
  "igrejaPublico",
  "horarioPublico",
  "cronogramaItem",
  "cronogramaAnual",
  "account",
  "session",
  "radioStatus",
];

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [tipoBackup, setTipoBackup] = useState<"completo" | "seletivo">(
    "completo",
  );
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState<string[]>([]);

  const [agendamentoAtivo, setAgendamentoAtivo] = useState(false);
  const [intervalo, setIntervalo] = useState("diario");

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: "", type: "info" });

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"restore" | "delete">(
    "delete",
  );
  const [selectedBackup, setSelectedBackup] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupExterno, setBackupExterno] = useState<File | null>(null);

  const canCreateSeletivo = useMemo(
    () => tipoBackup === "seletivo",
    [tipoBackup],
  );

  useEffect(() => {
    carregarBackups();
    carregarConfig();
  }, []);

  function showToast(message: string, type: ToastType) {
    setToast({ show: true, message, type });
    window.setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }

  async function carregarBackups() {
    setLoadingList(true);

    try {
      const res = await fetch("/api/backup/listar", { cache: "no-store" });
      const data = await safeJson(res);

      if (!res.ok) {
        showToast(data?.error || "Erro ao listar backups", "error");
        setBackups([]);
        return;
      }

      setBackups(data.backups || []);
    } catch (e) {
      console.error(e);
      showToast("Erro de rede ao listar backups", "error");
      setBackups([]);
    } finally {
      setLoadingList(false);
    }
  }

  async function carregarConfig() {
    try {
      const res = await fetch("/api/backup/automatico", { cache: "no-store" });
      const data = await safeJson(res);

      if (!res.ok) {
        // não trava a tela se não tiver permissão/config
        return;
      }

      setAgendamentoAtivo(!!data.ativo);
      setIntervalo(data.intervalo || "diario");
    } catch (e) {
      console.error(e);
    }
  }

  async function criarBackup() {
    setLoadingAction(true);

    try {
      const body: any = { tipo: tipoBackup };

      if (tipoBackup === "seletivo") {
        if (tabelasSelecionadas.length === 0) {
          showToast(
            "Selecione pelo menos 1 tabela para backup seletivo.",
            "info",
          );
          return;
        }
        body.tabelas = tabelasSelecionadas;
      }

      const res = await fetch("/api/backup/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar backup");
      }

      showToast("Backup criado com sucesso!", "success");
      await carregarBackups();
    } catch (e) {
      console.error(e);
      showToast(
        e instanceof Error ? e.message : "Erro ao criar backup",
        "error",
      );
    } finally {
      setLoadingAction(false);
    }
  }

  async function salvarConfig() {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/backup/automatico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: agendamentoAtivo, intervalo }),
      });

      const data = await safeJson(res);
      if (!res.ok)
        throw new Error(data?.error || "Erro ao salvar configuração");

      showToast("Configuração salva com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : "Erro ao salvar", "error");
    } finally {
      setLoadingAction(false);
    }
  }

  function download(nome: string) {
    window.open(
      `/api/backup/download?file=${encodeURIComponent(nome)}`,
      "_blank",
    );
  }

  function confirmarExcluir(nome: string) {
    setSelectedBackup(nome);
    setConfirmMode("delete");
    setShowConfirm(true);
  }

  function confirmarRestaurar(nome: string) {
    setSelectedBackup(nome);
    setConfirmMode("restore");
    setBackupExterno(null);
    setShowConfirm(true);
  }

  async function excluir(nome: string) {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/backup/excluir", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: nome }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Erro ao excluir");

      showToast("Backup excluído com sucesso!", "success");
      await carregarBackups();
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : "Erro ao excluir", "error");
    } finally {
      setLoadingAction(false);
    }
  }

  async function restaurarDoServidor(nome: string) {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/backup/restaurar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: nome }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Erro ao restaurar");

      showToast("Banco restaurado com sucesso! Recarregando...", "success");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : "Erro ao restaurar", "error");
    } finally {
      setLoadingAction(false);
    }
  }

  function abrirSeletorArquivo() {
    fileInputRef.current?.click();
  }

  function onArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      showToast("Apenas arquivos .json são permitidos", "error");
      return;
    }

    setBackupExterno(file);
    setSelectedBackup("");
    setConfirmMode("restore");
    setShowConfirm(true);
  }

  async function restaurarUpload(file: File) {
    setLoadingAction(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/backup/restaurar-upload", {
        method: "POST",
        body: formData,
      });

      const data = await safeJson(res);
      if (!res.ok)
        throw new Error(data?.error || "Erro ao restaurar via upload");

      showToast("Banco restaurado via upload! Recarregando...", "success");
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : "Erro ao restaurar", "error");
    } finally {
      setLoadingAction(false);
      setBackupExterno(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function confirmarAcaoModal() {
    setShowConfirm(false);

    if (confirmMode === "delete") {
      if (!selectedBackup) return;
      await excluir(selectedBackup);
      setSelectedBackup("");
      return;
    }

    // restore
    if (backupExterno) {
      await restaurarUpload(backupExterno);
      return;
    }

    if (selectedBackup) {
      await restaurarDoServidor(selectedBackup);
      setSelectedBackup("");
      return;
    }

    showToast("Selecione um backup para restaurar.", "info");
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>💾 Backup do Banco de Dados</h2>
        <p className={styles.subtitle}>
          Crie backups, restaure e configure agendamentos.
        </p>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`${styles.toast} ${
            toast.type === "success"
              ? styles.toastSuccess
              : toast.type === "error"
                ? styles.toastError
                : styles.toastInfo
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Modal confirmação */}
      {showConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>
              {confirmMode === "delete"
                ? "🗑️ Excluir Backup"
                : "♻️ Restaurar Backup"}
            </div>
            <div className={styles.modalText}>
              {confirmMode === "delete"
                ? "Tem certeza que deseja excluir este backup? Essa ação não pode ser desfeita."
                : "Tem certeza que deseja restaurar? Isso substituirá os dados atuais."}
            </div>

            <div className={styles.modalActions}>
              <button
                className={
                  confirmMode === "delete"
                    ? styles.btnDanger
                    : styles.btnWarning
                }
                onClick={confirmarAcaoModal}
                disabled={loadingAction}
              >
                {loadingAction ? "Processando..." : "Confirmar"}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setShowConfirm(false);
                  setBackupExterno(null);
                }}
                disabled={loadingAction}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Manual */}
      <div className={styles.section}>
        <h3>Backup Manual</h3>
        <p className={styles.description}>
          Crie um backup completo ou seletivo do banco de dados.
        </p>

        <div className={styles.field}>
          <label>Tipo de Backup</label>
          <select
            value={tipoBackup}
            onChange={(e) => setTipoBackup(e.target.value as any)}
            className={styles.select}
          >
            <option value="completo">Completo (todas as tabelas)</option>
            <option value="seletivo">Seletivo (escolher tabelas)</option>
          </select>
        </div>

        {canCreateSeletivo && (
          <div className={styles.field}>
            <label>Tabelas</label>
            <div className={styles.checkboxGroup}>
              {TABLES.map((t) => (
                <label key={t} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={tabelasSelecionadas.includes(t)}
                    onChange={(e) =>
                      setTabelasSelecionadas((prev) =>
                        e.target.checked
                          ? [...prev, t]
                          : prev.filter((x) => x !== t),
                      )
                    }
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={criarBackup}
          className={styles.primaryButton}
          disabled={loadingAction}
        >
          {loadingAction ? "Criando backup..." : "📦 Criar Backup Agora"}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Restaurar de Arquivo */}
      <div className={styles.section}>
        <h3>Restaurar de Arquivo</h3>
        <p className={styles.description}>
          Importe um backup do seu computador para restaurar o banco.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onArquivoSelecionado}
          style={{ display: "none" }}
        />

        <button
          onClick={abrirSeletorArquivo}
          className={styles.secondaryButton}
          disabled={loadingAction}
        >
          📂 Procurar Arquivo de Backup
        </button>
      </div>

      <div className={styles.divider} />

      {/* Backup Automático */}
      <div className={styles.section}>
        <h3>Backup Automático</h3>
        <p className={styles.description}>Configure backups automáticos.</p>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={agendamentoAtivo}
            onChange={(e) => setAgendamentoAtivo(e.target.checked)}
          />
          Ativar backups automáticos
        </label>

        {agendamentoAtivo && (
          <select
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
            className={styles.select}
          >
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="mensal">Mensal</option>
          </select>
        )}

        <button
          onClick={salvarConfig}
          className={styles.secondaryButton}
          disabled={loadingAction}
        >
          {loadingAction ? "Salvando..." : "💾 Salvar Configuração"}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Lista */}
      <div className={styles.section}>
        <h3>Backups Disponíveis</h3>

        {loadingList ? (
          <p className={styles.muted}>Carregando backups...</p>
        ) : backups.length === 0 ? (
          <p className={styles.muted}>Nenhum backup encontrado.</p>
        ) : (
          <div className={styles.list}>
            {backups.map((b) => (
              <div key={b.nome} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.fileName}>📄 {b.nome}</span>
                  <span className={styles.fileMeta}>
                    {b.tamanho} • {b.data}
                  </span>
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={() => download(b.nome)}
                    className={styles.download}
                    disabled={loadingAction}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => confirmarRestaurar(b.nome)}
                    className={styles.restore}
                    disabled={loadingAction}
                  >
                    🔄 Restaurar
                  </button>
                  <button
                    onClick={() => confirmarExcluir(b.nome)}
                    className={styles.delete}
                    disabled={loadingAction}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={carregarBackups}
          className={styles.linkButton}
          disabled={loadingList}
        >
          ↻ Atualizar lista
        </button>
      </div>
    </div>
  );
}
