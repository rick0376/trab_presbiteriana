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
  "igrejas",
  "users",
  "cargos",
  "permissoes",
  "membros",
  "eventos",
  "igrejaPublico",
  "horarioPublico",
  "cronogramaItem",
  "cronogramaAnual",
  "accounts",
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

  const [canManageAutomatic, setCanManageAutomatic] = useState(true);
  const [tipoBackup, setTipoBackup] = useState<"completo" | "seletivo">(
    "completo",
  );
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState<string[]>([]);

  const [agendamentoAtivo, setAgendamentoAtivo] = useState(false);
  const [intervalo, setIntervalo] = useState("diario");

  const [hora, setHora] = useState("02:00");

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [igrejasAutomatico, setIgrejasAutomatico] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [igrejaConfigId, setIgrejaConfigId] = useState("");

  const [globalAgendamentoAtivo, setGlobalAgendamentoAtivo] = useState(false);
  const [globalIntervalo, setGlobalIntervalo] = useState("diario");
  const [globalHora, setGlobalHora] = useState("02:00");
  const [globalModo, setGlobalModo] = useState<"todas" | "igreja">("todas");
  const [globalIgrejaId, setGlobalIgrejaId] = useState("");

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
    carregarConfigAutomatico();
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

  /*
  async function carregarConfig() {
    try {
      const res = await fetch("/api/backup/automatico", { cache: "no-store" });

      if (res.status === 403) {
        setCanManageAutomatic(false);
        return;
      }

      const data = await safeJson(res);

      if (!res.ok) return;

      setCanManageAutomatic(true);
      setAgendamentoAtivo(!!data.ativo);
      setIntervalo(data.intervalo || "diario");
      setHora(data.hora || "02:00");
    } catch (e) {
      console.error(e);
    }
  }
  */
  async function carregarConfigAutomatico(targetIgrejaId?: string) {
    try {
      const query = targetIgrejaId
        ? `?igrejaId=${encodeURIComponent(targetIgrejaId)}`
        : "";

      const res = await fetch(`/api/backup/automatico${query}`, {
        cache: "no-store",
      });

      const data = await safeJson(res);
      if (!res.ok) return;

      setIsSuperadmin(!!data.isSuperadmin);
      setIgrejasAutomatico(data.igrejas || []);

      setAgendamentoAtivo(!!data.igreja?.ativo);
      setIntervalo(data.igreja?.intervalo || "diario");
      setHora(data.igreja?.hora || "02:00");
      setIgrejaConfigId(data.igreja?.igrejaId || data.igrejas?.[0]?.id || "");

      if (data.isSuperadmin && data.global) {
        setGlobalAgendamentoAtivo(!!data.global.ativo);
        setGlobalIntervalo(data.global.intervalo || "diario");
        setGlobalHora(data.global.hora || "02:00");
        setGlobalModo(data.global.modo === "igreja" ? "igreja" : "todas");
        setGlobalIgrejaId(data.global.igrejaId || "");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function salvarConfigIgreja() {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/backup/automatico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "igreja",
          igrejaId: isSuperadmin ? igrejaConfigId : undefined,
          ativo: agendamentoAtivo,
          intervalo,
          hora,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar configuração da igreja");
      }

      showToast("Configuração da igreja salva com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast(
        e instanceof Error
          ? e.message
          : "Erro ao salvar configuração da igreja",
        "error",
      );
    } finally {
      setLoadingAction(false);
    }
  }

  async function salvarConfigGlobal() {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/backup/automatico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "global",
          ativo: globalAgendamentoAtivo,
          intervalo: globalIntervalo,
          hora: globalHora,
          modo: globalModo,
          igrejaId: globalModo === "igreja" ? globalIgrejaId : null,
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar configuração global");
      }

      showToast("Configuração global salva com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast(
        e instanceof Error ? e.message : "Erro ao salvar configuração global",
        "error",
      );
    } finally {
      setLoadingAction(false);
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

  /*
  async function salvarConfig() {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/backup/automatico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ativo: agendamentoAtivo,
          intervalo,
          hora,
        }),
      });

      const data = await safeJson(res);

      if (res.status === 403) {
        setCanManageAutomatic(false);
        throw new Error("Sem permissão para configurar backup automático");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar configuração");
      }

      showToast("Configuração salva com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : "Erro ao salvar", "error");
    } finally {
      setLoadingAction(false);
    }
  }
*/
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
      {canManageAutomatic && (
        <>
          <div className={styles.divider} />

          <div className={styles.section}>
            <h3>Backup Automático da Igreja</h3>
            <p className={styles.description}>
              Configure o backup automático da igreja.
            </p>

            {isSuperadmin && igrejasAutomatico.length > 0 && (
              <div className={styles.field}>
                <label>Igreja</label>
                <select
                  value={igrejaConfigId}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setIgrejaConfigId(value);
                    await carregarConfigAutomatico(value);
                  }}
                  className={styles.select}
                >
                  {igrejasAutomatico.map((igreja) => (
                    <option key={igreja.id} value={igreja.id}>
                      {igreja.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={agendamentoAtivo}
                onChange={(e) => setAgendamentoAtivo(e.target.checked)}
              />
              Ativar backup automático da igreja
            </label>

            {agendamentoAtivo && (
              <>
                <select
                  value={intervalo}
                  onChange={(e) => setIntervalo(e.target.value)}
                  className={styles.select}
                >
                  <option value="diario">Diário</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </select>

                <div className={styles.field}>
                  <label>Horário</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className={styles.select}
                  />
                </div>
              </>
            )}

            <button
              onClick={salvarConfigIgreja}
              className={styles.secondaryButton}
              disabled={loadingAction}
            >
              {loadingAction
                ? "Salvando..."
                : "💾 Salvar Configuração da Igreja"}
            </button>
          </div>

          {isSuperadmin && (
            <>
              <div className={styles.divider} />

              <div className={styles.section}>
                <h3>Backup Automático Global</h3>
                <p className={styles.description}>
                  O SUPERADMIN pode rodar automático para todas as igrejas ou
                  uma igreja específica.
                </p>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={globalAgendamentoAtivo}
                    onChange={(e) =>
                      setGlobalAgendamentoAtivo(e.target.checked)
                    }
                  />
                  Ativar backup automático global
                </label>

                {globalAgendamentoAtivo && (
                  <>
                    <select
                      value={globalIntervalo}
                      onChange={(e) => setGlobalIntervalo(e.target.value)}
                      className={styles.select}
                    >
                      <option value="diario">Diário</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                    </select>

                    <div className={styles.field}>
                      <label>Horário</label>
                      <input
                        type="time"
                        value={globalHora}
                        onChange={(e) => setGlobalHora(e.target.value)}
                        className={styles.select}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Modo</label>
                      <select
                        value={globalModo}
                        onChange={(e) =>
                          setGlobalModo(e.target.value as "todas" | "igreja")
                        }
                        className={styles.select}
                      >
                        <option value="todas">Todas as igrejas</option>
                        <option value="igreja">Uma igreja específica</option>
                      </select>
                    </div>

                    {globalModo === "igreja" && (
                      <div className={styles.field}>
                        <label>Igreja alvo</label>
                        <select
                          value={globalIgrejaId}
                          onChange={(e) => setGlobalIgrejaId(e.target.value)}
                          className={styles.select}
                        >
                          <option value="">Selecione</option>
                          {igrejasAutomatico.map((igreja) => (
                            <option key={igreja.id} value={igreja.id}>
                              {igreja.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={salvarConfigGlobal}
                  className={styles.secondaryButton}
                  disabled={loadingAction}
                >
                  {loadingAction
                    ? "Salvando..."
                    : "💾 Salvar Configuração Global"}
                </button>
              </div>
            </>
          )}
        </>
      )}

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
