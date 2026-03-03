//src/components/permissoes/PermissoesManager.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import Button from "../ui/Button/Button";
import { useToast } from "@/components/ui/Toast/useToast";

interface Usuario {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface PermissaoAPI {
  id: string;
  recurso: string;
  ler: boolean;
  criar: boolean;
  editar: boolean;
  deletar: boolean;
  compartilhar: boolean;
}

type TipoPermissao = "ler" | "criar" | "editar" | "deletar" | "compartilhar";

interface RecursoConfig {
  value: string;
  label: string;
  description: string;
  tipos: TipoPermissao[];
  labels?: Partial<Record<TipoPermissao, string>>;
}

const RECURSOS: RecursoConfig[] = [
  // ✅ Permissão para gerenciar permissões (controla botão salvar)
  {
    value: "permissoes",
    label: "🛡️ Permissões",
    description: "Gerenciar permissões de usuários",
    tipos: ["ler", "editar"],
    labels: {
      ler: "Visualizar",
      editar: "Salvar/Alterar",
    },
  },

  {
    value: "usuarios",
    label: "👤 Usuários",
    description: "Gerenciar usuários do sistema",
    tipos: ["ler", "criar", "editar", "deletar", "compartilhar"],
    labels: {
      ler: "Visualizar",
      criar: "Criar",
      editar: "Editar",
      deletar: "Excluir",
      compartilhar: "PDF/WHATS",
    },
  },
  {
    value: "usuarios_senha",
    label: "🔐 Usuários - Senha",
    description: "Trocar senha de outros usuários",
    tipos: ["editar"],
    labels: {
      editar: "Trocar senha",
    },
  },
  {
    value: "membros",
    label: "👥 Membros",
    description: "Gerenciar membros da igreja",
    tipos: ["ler", "criar", "editar", "deletar", "compartilhar"],
    labels: {
      ler: "Visualizar",
      criar: "Novo",
      editar: "Editar",
      deletar: "Deletar",
      compartilhar: "PDF/WHATS",
    },
  },
  {
    value: "cargos",
    label: "🏷️ Cargos",
    description: "Gerenciar cargos/funções",
    tipos: ["ler", "criar", "editar", "deletar", "compartilhar"],
    labels: {
      ler: "Visualizar",
      criar: "Novo",
      editar: "Editar",
      deletar: "Deletar",
      compartilhar: "PDF/WHATS",
    },
  },
  {
    value: "eventos",
    label: "📅 Eventos",
    description: "Gerenciar eventos da igreja",
    tipos: ["ler", "criar", "editar", "deletar", "compartilhar"],
    labels: {
      ler: "Visualizar",
      criar: "Novo",
      editar: "Editar",
      deletar: "Deletar",
      compartilhar: "PDF/WHATS",
    },
  },
  {
    value: "publico",
    label: "🌐 Conteúdo Público",
    description: "Banner/WhatsApp/horários e dados do site público",
    tipos: ["ler", "editar"],
    labels: {
      ler: "Visualizar",
      editar: "Editar/Salvar",
    },
  },
  {
    value: "cronograma_publico",
    label: "📝 Cronograma Público",
    description: "Cronograma semanal exibido no site",
    tipos: ["ler", "editar"],
    labels: { ler: "Visualizar", editar: "Editar/Salvar" },
  },
  {
    value: "cronograma_anual",
    label: "📆 Cronograma Anual",
    description: "Gerenciar cronograma anual público",
    tipos: ["ler", "editar"],
    labels: { ler: "Visualizar", editar: "Editar" },
  },
  {
    value: "eventos_publico",
    label: "📅 Eventos Públicos",
    description: "Eventos exibidos no site público",
    tipos: ["ler", "editar"],
    labels: { ler: "Visualizar", editar: "Editar/Salvar" },
  },
  {
    value: "radio_live",
    label: "📻 Rádio - Transmissão",
    description: "Ligar e desligar a rádio",
    tipos: ["ler", "editar"],
    labels: {
      ler: "Visualizar status",
      editar: "Ligar/Desligar",
    },
  },
  {
    value: "radio_url",
    label: "⚙️ Rádio - URL",
    description: "Alterar URL do stream",
    tipos: ["ler", "editar"],
    labels: {
      ler: "Visualizar URL",
      editar: "Editar URL",
    },
  },
  {
    value: "backup",
    label: "💾 Backup do Banco",
    description: "Gerenciar backups do banco de dados",
    tipos: ["ler", "criar", "editar", "deletar", "compartilhar"],
    labels: {
      ler: "Acessar",
      criar: "Backup manual",
      editar: "Agendar automático",
      deletar: "Excluir backup",
      compartilhar: "Download",
    },
  },
];

function emptyPerm(recurso: string): PermissaoAPI {
  return {
    id: "",
    recurso,
    ler: false,
    criar: false,
    editar: false,
    deletar: false,
    compartilhar: false,
  };
}

export default function PermissionsManager({
  currentUserId,
  currentUserRole,
}: {
  currentUserId: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoAPI>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const disabledSelf = usuarioSelecionado === currentUserId;

  // ✅ regra: SUPERADMIN sempre pode salvar; outros só se tiver permissoes.editar
  const canSave = useMemo(() => {
    if (currentUserRole === "SUPERADMIN") return true;
    const p = permissoes["permissoes"];
    return !!p?.editar;
  }, [currentUserRole, permissoes]);

  // =============================
  // Buscar usuários
  // =============================
  useEffect(() => {
    const fetchUsuarios = async () => {
      const res = await fetch("/api/usuarios");
      if (!res.ok) return;
      const data = await res.json();
      setUsuarios(data);
    };

    fetchUsuarios();
  }, []);

  // =============================
  // Buscar permissões do usuário selecionado
  // =============================
  useEffect(() => {
    if (!usuarioSelecionado) return;

    const fetchPermissoes = async () => {
      setLoading(true);

      const res = await fetch(`/api/permissoes?userId=${usuarioSelecionado}`);

      if (!res.ok) {
        setPermissoes({});
        setLoading(false);
        return;
      }

      const data: PermissaoAPI[] = await res.json();

      const map: Record<string, PermissaoAPI> = {};
      data.forEach((p) => {
        map[p.recurso] = p;
      });

      setPermissoes(map);
      setLoading(false);
    };

    fetchPermissoes();
  }, [usuarioSelecionado]);

  // =============================
  // Toggle individual
  // =============================
  const togglePermissao = (recurso: string, tipo: TipoPermissao) => {
    if (!canSave || disabledSelf) return;

    setPermissoes((prev) => {
      const atual = prev[recurso] ?? emptyPerm(recurso);
      return {
        ...prev,
        [recurso]: {
          ...atual,
          [tipo]: !atual[tipo],
        },
      };
    });
  };

  // =============================
  // Toggle TODOS (marca/desmarca todos do recurso)
  // =============================
  const toggleTodos = (recurso: string, tipos: TipoPermissao[]) => {
    if (!canSave || disabledSelf) return;

    setPermissoes((prev) => {
      const atual = prev[recurso] ?? emptyPerm(recurso);

      const allOn = tipos.every((t) => !!atual[t]);
      const next = { ...atual };

      tipos.forEach((t) => {
        (next as any)[t] = !allOn;
      });

      return { ...prev, [recurso]: next };
    });
  };

  // =============================
  // Salvar permissões
  // =============================
  const handleSalvar = async () => {
    if (!usuarioSelecionado) return;
    if (!canSave || disabledSelf) return;

    setLoadingSave(true);

    try {
      await Promise.all(
        RECURSOS.map(async (r) => {
          const p = permissoes[r.value] ?? emptyPerm(r.value);

          const res = await fetch("/api/permissoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: usuarioSelecionado,
              recurso: r.value,
              ler: p.ler,
              criar: p.criar,
              editar: p.editar,
              deletar: p.deletar,
              compartilhar: p.compartilhar,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(
              err?.error || `Falha ao salvar permissões: ${r.value}`,
            );
          }
        }),
      );

      toast.success("Permissões salvas com sucesso!");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erro ao salvar permissões");
    } finally {
      setLoadingSave(false);
    }
  };

  const usuarioInfo = usuarios.find((u) => u.id === usuarioSelecionado);

  // =============================
  // Render
  // =============================
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gerenciamento de Permissões</h1>
        <p>Configure o que cada usuário pode fazer no sistema</p>
      </div>

      <div className={styles.selectCard}>
        <label>Selecione o Usuário</label>
        <select
          value={usuarioSelecionado}
          onChange={(e) => setUsuarioSelecionado(e.target.value)}
        >
          <option value="">Escolha um usuário...</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email}) - {u.role}
            </option>
          ))}
        </select>
      </div>

      {usuarioInfo && (
        <div className={styles.userCard}>
          <h3>{usuarioInfo.name}</h3>
          <span>{usuarioInfo.email}</span>
          <div className={styles.role}>{usuarioInfo.role}</div>
        </div>
      )}

      {loading && <p>Carregando permissões...</p>}

      {usuarioSelecionado && !loading && (
        <>
          <div className={styles.grid}>
            {RECURSOS.map((r) => {
              const p = permissoes[r.value] ?? emptyPerm(r.value);
              const allChecked =
                r.tipos.length > 0 && r.tipos.every((t) => !!p[t]);

              return (
                <div key={r.value} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h4>{r.label}</h4>
                    <p>{r.description}</p>
                  </div>

                  <div className={styles.checkboxRow}>
                    {/* ✅ TODOS */}
                    <label>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleTodos(r.value, r.tipos)}
                        disabled={!canSave || disabledSelf}
                      />
                      <span>Todos</span>
                    </label>

                    {/* Individuais */}
                    {r.tipos.map((tipo) => (
                      <label key={tipo}>
                        <input
                          type="checkbox"
                          checked={p[tipo]}
                          onChange={() => togglePermissao(r.value, tipo)}
                          disabled={!canSave || disabledSelf}
                        />
                        <span>{r.labels?.[tipo] ?? tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ botão salvar só aparece quando pode */}
          {canSave && !disabledSelf && (
            <div className={styles.save}>
              <Button onClick={handleSalvar} disabled={loadingSave} fullWidth>
                {loadingSave ? "Salvando..." : "💾 Salvar Permissões"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
