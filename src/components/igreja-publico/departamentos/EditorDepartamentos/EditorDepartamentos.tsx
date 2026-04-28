//src/components/igreja-publico/departamentos/EditorDepartamentos.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import ListaDepartamentos from "@/components/igreja-publico/departamentos/ListaDepartamentos/ListaDepartamentos";
import { ImagePlus, Trash2, X } from "lucide-react";

type Props = {
  igrejaId: string;
  canEdit: boolean;
};

type MembroOption = {
  id: string;
  nome: string;
  cargo: string;
  numeroSequencial: number;
  codigo: string;
};

type ResponsavelForm = {
  id?: string;
  membroId: string;
  cargoTitulo: string;
  bio: string;
  ordem: number;
  ativo: boolean;
  fotoUrl?: string | null;
  fotoPublicId?: string | null;
  fotoFile?: File | null;
  previewUrl?: string | null;
  removeFoto?: boolean;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

function revokeIfBlob(url?: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function cleanWhatsappDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatWhatsappInput(value: string) {
  const digits = cleanWhatsappDigits(value);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function whatsappDigitsToUrl(value: string) {
  const digits = cleanWhatsappDigits(value);
  if (digits.length < 10) return "";
  return `https://wa.me/55${digits}`;
}

function extractWhatsappDigits(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.slice(2, 13);
  }

  return digits.slice(0, 11);
}

export default function EditorDepartamentos({ igrejaId, canEdit }: Props) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [membros, setMembros] = useState<MembroOption[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [diasFuncionamento, setDiasFuncionamento] = useState("");
  const [horarioFuncionamento, setHorarioFuncionamento] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [ativo, setAtivo] = useState(true);

  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const [removeCapa, setRemoveCapa] = useState(false);

  const [responsaveis, setResponsaveis] = useState<ResponsavelForm[]>([]);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  async function load() {
    setLoading(true);
    try {
      const [rDepartamentos, rMembros] = await Promise.all([
        fetch(`/api/departamentos?igrejaId=${igrejaId}`, {
          cache: "no-store",
        }),
        fetch(`/api/departamentos/membros?igrejaId=${igrejaId}`, {
          cache: "no-store",
        }),
      ]);

      const jDepartamentos = await rDepartamentos.json().catch(() => ({}));
      const jMembros = await rMembros.json().catch(() => ({}));

      setItems(
        Array.isArray(jDepartamentos?.items) ? jDepartamentos.items : [],
      );
      setMembros(Array.isArray(jMembros?.items) ? jMembros.items : []);
    } catch {
      setItems([]);
      setMembros([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [igrejaId]);

  useEffect(() => {
    return () => {
      revokeIfBlob(capaPreview);
      responsaveis.forEach((r) => revokeIfBlob(r.previewUrl));
    };
  }, [capaPreview, responsaveis]);

  const membrosDisponiveis = useMemo(() => membros, [membros]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function resetForm() {
    revokeIfBlob(capaPreview);
    responsaveis.forEach((r) => revokeIfBlob(r.previewUrl));

    setEditingId(null);
    setNome("");
    setDescricao("");
    setWhatsappNumero("");
    setDiasFuncionamento("");
    setHorarioFuncionamento("");
    setOrdem("0");
    setAtivo(true);
    setCapaFile(null);
    setCapaPreview(null);
    setRemoveCapa(false);
    setResponsaveis([]);
  }

  function addResponsavel() {
    setResponsaveis((prev) => [
      ...prev,
      {
        membroId: "",
        cargoTitulo: "Responsável",
        bio: "",
        ordem: prev.length + 1,
        ativo: true,
        fotoFile: null,
        previewUrl: null,
        removeFoto: false,
      },
    ]);
  }

  function removeResponsavel(index: number) {
    askConfirm(
      "Excluir responsável?",
      "Esse responsável será removido da lista ao salvar.",
      () => {
        setResponsaveis((prev) => {
          const target = prev[index];
          revokeIfBlob(target?.previewUrl);

          return prev
            .filter((_, i) => i !== index)
            .map((item, idx) => ({
              ...item,
              ordem: idx + 1,
            }));
        });

        setConfirm({ open: false });
      },
    );
  }

  function updateResponsavel(
    index: number,
    field: keyof ResponsavelForm,
    value: any,
  ) {
    setResponsaveis((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function selectResponsavelFoto(index: number, file: File | null) {
    if (!file) return;

    setResponsaveis((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        revokeIfBlob(item.previewUrl);

        return {
          ...item,
          fotoFile: file,
          previewUrl: URL.createObjectURL(file),
          removeFoto: false,
        };
      }),
    );
  }

  function removeResponsavelFoto(index: number) {
    setResponsaveis((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        revokeIfBlob(item.previewUrl);

        return {
          ...item,
          fotoFile: null,
          previewUrl: null,
          fotoUrl: null,
          fotoPublicId: null,
          removeFoto: true,
        };
      }),
    );
  }

  function selectCapa(file: File | null) {
    if (!file) return;

    revokeIfBlob(capaPreview);

    setCapaFile(file);
    setCapaPreview(URL.createObjectURL(file));
    setRemoveCapa(false);
  }

  function removeCapaAtual() {
    revokeIfBlob(capaPreview);
    setCapaFile(null);
    setCapaPreview(null);
    setRemoveCapa(true);
  }

  function fillForm(item: any) {
    resetForm();

    setEditingId(item.id);
    setNome(item.nome ?? "");
    setDescricao(item.descricao ?? "");
    setWhatsappNumero(
      formatWhatsappInput(extractWhatsappDigits(item.whatsappUrl ?? "")),
    );
    setDiasFuncionamento(item.diasFuncionamento ?? "");
    setHorarioFuncionamento(item.horarioFuncionamento ?? "");
    setOrdem(String(item.ordem ?? 0));
    setAtivo(item.ativo !== false);
    setCapaPreview(item.capaUrl ?? null);
    setRemoveCapa(false);

    setResponsaveis(
      Array.isArray(item.responsaveis)
        ? [...item.responsaveis]
            .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
            .map((resp: any, index: number) => ({
              id: resp.id,
              membroId: resp.membroId,
              cargoTitulo: resp.cargoTitulo ?? "Responsável",
              bio: resp.bio ?? "",
              ordem: resp.ordem ?? index + 1,
              ativo: resp.ativo !== false,
              fotoUrl: resp.fotoUrl ?? null,
              fotoPublicId: resp.fotoPublicId ?? null,
              fotoFile: null,
              previewUrl: resp.fotoUrl ?? null,
              removeFoto: false,
            }))
        : [],
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit || saving) return;

    if (!nome.trim()) {
      toast.error("Informe o nome do departamento.");
      return;
    }

    const whatsappDigits = cleanWhatsappDigits(whatsappNumero);

    if (whatsappNumero.trim() && whatsappDigits.length < 10) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }

    const membroIds = responsaveis.map((r) => r.membroId).filter(Boolean);

    const uniqueIds = new Set(membroIds);

    if (membroIds.length !== uniqueIds.size) {
      toast.error("Não repita o mesmo membro nos responsáveis.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("nome", nome.trim());
      fd.append("descricao", descricao.trim());
      fd.append("whatsappUrl", whatsappDigitsToUrl(whatsappNumero));
      fd.append("diasFuncionamento", diasFuncionamento.trim());
      fd.append("horarioFuncionamento", horarioFuncionamento.trim());
      fd.append("ordem", String(Number(ordem || 0)));
      fd.append("ativo", ativo ? "true" : "false");
      fd.append("removeCapa", removeCapa ? "true" : "false");

      if (capaFile) {
        fd.append("capa", capaFile);
      }

      const responsaveisPayload = responsaveis.map((r, index) => ({
        id: r.id ?? null,
        membroId: r.membroId,
        cargoTitulo: r.cargoTitulo.trim(),
        bio: r.bio.trim(),
        ordem: Number(r.ordem || index + 1),
        ativo: r.ativo,
        removeFoto: !!r.removeFoto,
      }));

      fd.append("responsaveis", JSON.stringify(responsaveisPayload));

      responsaveis.forEach((r, index) => {
        if (r.fotoFile) {
          fd.append(`responsavelFoto_${index}`, r.fotoFile);
        }
      });

      const url = editingId
        ? `/api/departamentos/${editingId}?igrejaId=${igrejaId}`
        : `/api/departamentos?igrejaId=${igrejaId}`;

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(j?.error || "Erro ao salvar departamento.");
        return;
      }

      toast.success(
        editingId ? "Departamento atualizado ✅" : "Departamento criado ✅",
      );
      resetForm();
      await load();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: any) {
    askConfirm(
      "Excluir departamento?",
      `Deseja realmente excluir "${item.nome}"?`,
      async () => {
        try {
          const res = await fetch(
            `/api/departamentos/${item.id}?igrejaId=${igrejaId}`,
            {
              method: "DELETE",
            },
          );

          const j = await res.json().catch(() => ({}));

          if (!res.ok) {
            toast.error(j?.error || "Erro ao excluir departamento.");
            return;
          }

          toast.success("Departamento excluído ✅");
          setConfirm({ open: false });

          if (editingId === item.id) {
            resetForm();
          }

          await load();
        } catch {
          toast.error("Erro de conexão.");
        }
      },
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Departamentos</h1>
        <p className={styles.subtitle}>
          Cadastre os departamentos da igreja e vincule os responsáveis usando
          apenas membros já cadastrados.
        </p>

        {!canEdit && (
          <div className={styles.msg}>🔒 Você está em modo visualização.</div>
        )}

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>
              {editingId ? "Editar departamento" : "Novo departamento"}
            </div>

            <div className={styles.grid2}>
              <div>
                <label className={styles.label}>Nome do departamento</label>
                <input
                  className={styles.input}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="Ex: Jovens"
                />
              </div>

              <div>
                <label className={styles.label}>Ordem de exibição</label>
                <input
                  className={styles.input}
                  type="number"
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  disabled={!canEdit || saving}
                />
              </div>
            </div>

            <label className={styles.label}>Descrição</label>
            <textarea
              className={styles.textarea}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Descrição do departamento"
            />

            <label className={styles.label}>WhatsApp do departamento</label>
            <input
              className={styles.input}
              value={whatsappNumero}
              onChange={(e) =>
                setWhatsappNumero(formatWhatsappInput(e.target.value))
              }
              disabled={!canEdit || saving}
              placeholder="Ex: (12) 99189-0682"
              inputMode="numeric"
              maxLength={15}
            />

            <div className={styles.grid2}>
              <div>
                <label className={styles.label}>Dias de funcionamento</label>
                <input
                  className={styles.input}
                  value={diasFuncionamento}
                  onChange={(e) => setDiasFuncionamento(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="Ex: Sextas e domingos"
                />
              </div>

              <div>
                <label className={styles.label}>Horário</label>
                <input
                  className={styles.input}
                  value={horarioFuncionamento}
                  onChange={(e) => setHorarioFuncionamento(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="Ex: 19:30"
                />
              </div>
            </div>

            <div className={styles.switchRow}>
              <label className={styles.switchLabel}>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  disabled={!canEdit || saving}
                />
                <span>Departamento ativo</span>
              </label>
            </div>

            <div className={styles.uploadCard}>
              <label className={styles.label}>Capa do departamento</label>

              {capaPreview ? (
                <div className={styles.previewHeroBox}>
                  <img
                    src={capaPreview}
                    alt="Preview capa"
                    className={styles.previewHeroImage}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.removePreviewBtn}
                      onClick={removeCapaAtual}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.emptyPreview}>Sem capa</div>
              )}

              <div className={styles.fileRow}>
                <input
                  id="departamentoCapa"
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || saving}
                  onChange={(e) => selectCapa(e.target.files?.[0] ?? null)}
                />

                <label
                  htmlFor="departamentoCapa"
                  className={`${styles.fileBtn} ${capaFile ? styles.fileBtnSelected : ""}`}
                >
                  <ImagePlus size={16} />
                  <span>
                    {capaFile ? "Novo arquivo selecionado" : "Escolher capa"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.block}>
            <div className={styles.blockTitle}>
              Responsáveis do departamento
            </div>

            {responsaveis.map((resp, index) => (
              <div key={index} className={styles.responsavelCard}>
                <div className={styles.row}>
                  <div className={styles.flexGrow}>
                    <label className={styles.label}>Membro</label>
                    <select
                      className={styles.input}
                      value={resp.membroId}
                      onChange={(e) =>
                        updateResponsavel(index, "membroId", e.target.value)
                      }
                      disabled={!canEdit || saving}
                    >
                      <option value="">Selecione um membro</option>
                      {membrosDisponiveis.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} — {m.codigo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => removeResponsavel(index)}
                    disabled={!canEdit || saving}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className={styles.grid2}>
                  <div>
                    <label className={styles.label}>
                      Cargo no departamento
                    </label>
                    <input
                      className={styles.input}
                      value={resp.cargoTitulo}
                      onChange={(e) =>
                        updateResponsavel(index, "cargoTitulo", e.target.value)
                      }
                      disabled={!canEdit || saving}
                      placeholder="Ex: Líder"
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Ordem</label>
                    <input
                      className={styles.input}
                      type="number"
                      value={resp.ordem}
                      onChange={(e) =>
                        updateResponsavel(
                          index,
                          "ordem",
                          Number(e.target.value),
                        )
                      }
                      disabled={!canEdit || saving}
                    />
                  </div>
                </div>

                <label className={styles.label}>Bio / descrição</label>
                <textarea
                  className={styles.textarea}
                  value={resp.bio}
                  onChange={(e) =>
                    updateResponsavel(index, "bio", e.target.value)
                  }
                  disabled={!canEdit || saving}
                  placeholder="Breve descrição do responsável"
                />

                <div className={styles.switchRow}>
                  <label className={styles.switchLabel}>
                    <input
                      type="checkbox"
                      checked={resp.ativo}
                      onChange={(e) =>
                        updateResponsavel(index, "ativo", e.target.checked)
                      }
                      disabled={!canEdit || saving}
                    />
                    <span>Responsável ativo</span>
                  </label>
                </div>

                <div className={styles.uploadCard}>
                  <label className={styles.label}>Foto do responsável</label>

                  {resp.previewUrl ? (
                    <div className={styles.previewBox}>
                      <img
                        src={resp.previewUrl}
                        alt="Preview responsável"
                        className={styles.previewImage}
                      />
                      {canEdit && (
                        <button
                          type="button"
                          className={styles.removePreviewBtn}
                          onClick={() => removeResponsavelFoto(index)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyPreview}>Sem foto</div>
                  )}

                  <div className={styles.fileRow}>
                    <input
                      id={`responsavelFoto_${index}`}
                      className={styles.fileInput}
                      type="file"
                      accept="image/*"
                      disabled={!canEdit || saving}
                      onChange={(e) =>
                        selectResponsavelFoto(
                          index,
                          e.target.files?.[0] ?? null,
                        )
                      }
                    />

                    <label
                      htmlFor={`responsavelFoto_${index}`}
                      className={`${styles.fileBtn} ${resp.fotoFile ? styles.fileBtnSelected : ""}`}
                    >
                      <ImagePlus size={16} />
                      <span>
                        {resp.fotoFile
                          ? "Novo arquivo selecionado"
                          : "Escolher foto"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {canEdit && (
              <button
                className={styles.btn}
                type="button"
                onClick={addResponsavel}
              >
                + Adicionar responsável
              </button>
            )}
          </div>

          {canEdit && (
            <div className={styles.actionRow}>
              <button
                className={styles.btnGreen}
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Cadastrar departamento"}
              </button>

              <button
                className={styles.btnSecondary}
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Limpar formulário
              </button>
            </div>
          )}
        </form>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Departamentos cadastrados</div>

          {loading ? (
            <div className={styles.empty}>Carregando departamentos...</div>
          ) : (
            <ListaDepartamentos
              items={items}
              canEdit={canEdit}
              onEdit={fillForm}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.open ? confirm.title : ""}
        message={confirm.open ? confirm.message : ""}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (!confirm.open) return;
          confirm.onConfirm();
        }}
      />
    </main>
  );
}
