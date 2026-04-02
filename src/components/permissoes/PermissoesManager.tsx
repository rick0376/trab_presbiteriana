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

type RoleSistema = "SUPERADMIN" | "ADMIN" | "PASTOR" | "USER";

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
    value: "acessos_site",
    label: "📊 Acessos do Site",
    description:
      "Visualizar o dashboard de acessos, compartilhar relatórios e excluir acessos",
    tipos: ["ler", "deletar", "compartilhar"],
    labels: {
      ler: "Visualizar card/página",
      deletar: "Excluir/Zerar acessos",
      compartilhar: "PDF/WHATS",
    },
  },

  {
    value: "escola_dominical",
    label: "📘 Escola Dominical",
    description: "Gerenciar turmas, frequência e compartilhamento da EBD",
    tipos: ["ler", "criar", "editar", "deletar", "compartilhar"],
    labels: {
      ler: "Visualizar",
      criar: "Nova turma",
      editar: "Editar / Salvar frequência",
      deletar: "Excluir",
      compartilhar: "PDF / WHATS",
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

const ROLE_LEVEL: Record<RoleSistema, number> = {
  SUPERADMIN: 4,
  ADMIN: 3,
  PASTOR: 2,
  USER: 1,
};

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

  const [minhasPermissoes, setMinhasPermissoes] = useState<
    Record<string, PermissaoAPI>
  >({});
  const [loadingMyPerms, setLoadingMyPerms] = useState(true);

  const disabledSelf = usuarioSelecionado === currentUserId;

  // ✅ regra: SUPERADMIN sempre pode salvar; outros só se tiver permissoes.editar
  const canViewPage = useMemo(() => {
    if (currentUserRole === "SUPERADMIN") return true;
    const p = minhasPermissoes["permissoes"];
    return !!p?.ler;
  }, [currentUserRole, minhasPermissoes]);

  const canSave = useMemo(() => {
    if (currentUserRole === "SUPERADMIN") return true;
    const p = minhasPermissoes["permissoes"];
    return !!p?.editar;
  }, [currentUserRole, minhasPermissoes]);

  const minhaPermissaoPorRecurso = (recurso: string) => {
    if (currentUserRole === "SUPERADMIN") {
      return {
        ler: true,
        criar: true,
        editar: true,
        deletar: true,
        compartilhar: true,
      };
    }

    return minhasPermissoes[recurso] ?? emptyPerm(recurso);
  };

  const canGrantTipo = (recurso: string, tipo: TipoPermissao) => {
    if (currentUserRole === "SUPERADMIN") return true;
    const p = minhaPermissaoPorRecurso(recurso);
    return !!p[tipo];
  };

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

  useEffect(() => {
    const fetchMinhasPermissoes = async () => {
      if (currentUserRole === "SUPERADMIN") {
        setLoadingMyPerms(false);
        return;
      }

      setLoadingMyPerms(true);

      const res = await fetch(`/api/permissoes?userId=${currentUserId}`);

      if (!res.ok) {
        setMinhasPermissoes({});
        setLoadingMyPerms(false);
        return;
      }

      const data: PermissaoAPI[] = await res.json();

      const map: Record<string, PermissaoAPI> = {};
      data.forEach((p) => {
        map[p.recurso] = p;
      });

      setMinhasPermissoes(map);
      setLoadingMyPerms(false);
    };

    fetchMinhasPermissoes();
  }, [currentUserId, currentUserRole]);

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
    if (!canGrantTipo(recurso, tipo)) return;

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

    const tiposPermitidos = tipos.filter((t) => canGrantTipo(recurso, t));
    if (tiposPermitidos.length === 0) return;

    setPermissoes((prev) => {
      const atual = prev[recurso] ?? emptyPerm(recurso);

      const allOn = tiposPermitidos.every((t) => !!atual[t]);
      const next = { ...atual };

      tiposPermitidos.forEach((t) => {
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

  const usuariosDisponiveis = useMemo(() => {
    if (currentUserRole === "SUPERADMIN") return usuarios;

    const meuNivel = ROLE_LEVEL[currentUserRole as RoleSistema] ?? 0;

    return usuarios.filter((u) => {
      const nivelAlvo = ROLE_LEVEL[u.role as RoleSistema] ?? 0;
      return nivelAlvo < meuNivel;
    });
  }, [usuarios, currentUserRole]);

  if (loadingMyPerms) {
    return <div className={styles.container}>Carregando permissões...</div>;
  }

  if (!canViewPage) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          ⛔ Você não tem permissão para visualizar a página de permissões.
        </div>
      </div>
    );
  }

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
          {usuariosDisponiveis.map((u) => (
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
                        disabled={
                          !canSave ||
                          disabledSelf ||
                          r.tipos.filter((t) => canGrantTipo(r.value, t))
                            .length === 0
                        }
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
                          disabled={
                            !canSave ||
                            disabledSelf ||
                            !canGrantTipo(r.value, tipo)
                          }
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
