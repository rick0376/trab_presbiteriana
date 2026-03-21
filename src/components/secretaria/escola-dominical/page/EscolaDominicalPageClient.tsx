//src/components/secretaria/escola-dominical/page/EscolaDominicalPageClient.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ResumoEbd from "../resumo/ResumoEbd";
import GraficoEbd from "../grafico/GraficoEbd";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import AlertModal from "@/components/ui/AlertModal/AlertModal";

type Props = {
  igrejaId: string;
};

type Turma = {
  id: string;
  nome: string;
  departamento?: string | null;
  ativa: boolean;
  professor: {
    id: string;
    nome: string;
    cargo?: string | null;
  };
  _count: {
    alunos: number;
    registros: number;
  };
};

type ResumoResponse = {
  cards: {
    matriculados: number;
    presencas: number;
    faltas: number;
    percentualPresenca: number;
  };
  grafico: {
    mes: number;
    label: string;
    presencas: number;
    faltas: number;
    visitantes: number;
  }[];
  ano: number;
  filtroTurmaId?: string | null;
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

export default function EscolaDominicalPageClient({ igrejaId }: Props) {
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");

  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [resumo, setResumo] = useState<ResumoResponse>({
    cards: {
      matriculados: 0,
      presencas: 0,
      faltas: 0,
      percentualPresenca: 0,
    },
    grafico: [],
    ano: anoAtual,
    filtroTurmaId: null,
  });

  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [erroTurmas, setErroTurmas] = useState("");
  const [erroResumo, setErroResumo] = useState("");
  const [excluindoId, setExcluindoId] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState("");
  const [confirmNome, setConfirmNome] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMsg(message);
    setAlertOpen(true);
  }

  async function carregarTurmas() {
    try {
      setCarregandoTurmas(true);
      setErroTurmas("");

      const response = await fetch(
        `/api/secretaria/escola-dominical/turmas?igrejaId=${igrejaId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao carregar turmas.");
      }

      setTurmas(data);
    } catch (error: any) {
      setErroTurmas(error.message || "Erro ao carregar turmas.");
    } finally {
      setCarregandoTurmas(false);
    }
  }

  async function carregarResumo() {
    try {
      setCarregandoResumo(true);
      setErroResumo("");

      const qs = new URLSearchParams();
      qs.set("igrejaId", igrejaId);
      qs.set("ano", String(anoSelecionado));

      if (turmaSelecionadaId) {
        qs.set("turmaId", turmaSelecionadaId);
      }

      const response = await fetch(
        `/api/secretaria/escola-dominical/resumo?${qs.toString()}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao carregar resumo.");
      }

      setResumo(data);
    } catch (error: any) {
      setErroResumo(error.message || "Erro ao carregar resumo.");
    } finally {
      setCarregandoResumo(false);
    }
  }

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
  const canCreate = !!permissaoEbd?.criar;
  const canEdit = !!permissaoEbd?.editar;
  const canDelete = !!permissaoEbd?.deletar;

  useEffect(() => {
    if (!igrejaId) return;
    carregarTurmas();
  }, [igrejaId]);

  useEffect(() => {
    if (!igrejaId) return;
    carregarResumo();
  }, [igrejaId, anoSelecionado, turmaSelecionadaId]);

  const totalMatriculados = useMemo(() => {
    if (resumo.cards.matriculados > 0) return resumo.cards.matriculados;

    if (!turmaSelecionadaId) {
      return turmas.reduce((acc, turma) => acc + turma._count.alunos, 0);
    }

    const turmaAtual = turmas.find((item) => item.id === turmaSelecionadaId);
    return turmaAtual?._count.alunos || 0;
  }, [turmas, resumo.cards.matriculados, turmaSelecionadaId]);

  const anosDisponiveis = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => anoAtual - 3 + index);
  }, [anoAtual]);

  const turmaSelecionada = useMemo(() => {
    return turmas.find((item) => item.id === turmaSelecionadaId) || null;
  }, [turmas, turmaSelecionadaId]);

  async function excluirTurma(turmaId: string, nomeTurma: string) {
    try {
      setExcluindoId(turmaId);

      const response = await fetch(
        `/api/secretaria/escola-dominical/turmas/${turmaId}?igrejaId=${igrejaId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao excluir turma.");
      }

      if (turmaSelecionadaId === turmaId) {
        setTurmaSelecionadaId("");
      }

      await carregarTurmas();
      await carregarResumo();
    } catch (error: any) {
      showAlert("Erro", error.message || "Erro ao excluir turma.");
    } finally {
      setExcluindoId("");
    }
  }

  // =========================
  // Sem permissão de visualizar
  // =========================
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
            ⛔ Você não tem permissão para visualizar a Escola Dominical.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Escola Dominical</h1>
          <p>Gerencie turmas, alunos, frequência e relatórios.</p>
        </div>

        <div className={styles.headerActions}>
          <Link
            href="/secretaria/escola-dominical/relatorio-periodo"
            className={styles.relatorioBotao}
          >
            Relatório por período
          </Link>

          {canCreate && (
            <Link
              href="/secretaria/escola-dominical/novo"
              className={styles.novoBotao}
            >
              Nova turma
            </Link>
          )}
        </div>
      </div>

      <ResumoEbd
        matriculados={totalMatriculados}
        presencas={resumo.cards.presencas}
        faltas={resumo.cards.faltas}
        percentualPresenca={resumo.cards.percentualPresenca}
      />

      <div className={styles.bloco}>
        <div className={styles.blocoHeader}>
          <h2>Turmas cadastradas</h2>

          <div className={styles.filtroTurmas}>
            <button
              type="button"
              className={`${styles.filtroTurmaBotao} ${
                turmaSelecionadaId === "" ? styles.filtroTurmaAtivo : ""
              }`}
              onClick={() => setTurmaSelecionadaId("")}
            >
              Todas
            </button>
          </div>
        </div>

        {carregandoTurmas ? (
          <div className={styles.vazio}>Carregando turmas...</div>
        ) : erroTurmas ? (
          <div className={styles.erro}>{erroTurmas}</div>
        ) : turmas.length === 0 ? (
          <div className={styles.vazio}>Nenhuma turma carregada ainda.</div>
        ) : (
          <div className={styles.listaTurmas}>
            {turmas.map((turma) => {
              const ativa = turmaSelecionadaId === turma.id;

              return (
                <div
                  key={turma.id}
                  className={`${styles.turmaCard} ${
                    ativa ? styles.turmaCardAtiva : ""
                  }`}
                  onClick={() => setTurmaSelecionadaId(turma.id)}
                >
                  <div className={styles.turmaInfo}>
                    <h3>{turma.nome}</h3>
                    <p>
                      <strong>Professor:</strong> {turma.professor?.nome || "-"}
                    </p>
                    <p>
                      <strong>Departamento:</strong> {turma.departamento || "-"}
                    </p>
                    <p>
                      <strong>Alunos:</strong> {turma._count.alunos}
                    </p>
                    <p>
                      <strong>Registros:</strong> {turma._count.registros}
                    </p>

                    {ativa && (
                      <span className={styles.turmaSelecionadaBadge}>
                        Filtrando cards e gráfico
                      </span>
                    )}
                  </div>

                  <div className={styles.turmaActions}>
                    <Link
                      href={`/secretaria/escola-dominical/frequencia/${turma.id}`}
                      className={styles.frequenciaBotao}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Frequência
                    </Link>

                    {canEdit && (
                      <Link
                        href={`/secretaria/escola-dominical/editar/${turma.id}`}
                        className={styles.editarBotao}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Editar
                      </Link>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        className={styles.excluirBotao}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(turma.id);
                          setConfirmNome(turma.nome);
                          setConfirmOpen(true);
                        }}
                        disabled={excluindoId === turma.id}
                      >
                        {excluindoId === turma.id ? "Excluindo..." : "Excluir"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.bloco}>
        <div className={styles.blocoHeader}>
          <div>
            <h2>Gráfico geral</h2>
            <p className={styles.subInfo}>
              Visualizando:{" "}
              {turmaSelecionada ? turmaSelecionada.nome : "Todas as turmas"}
            </p>
          </div>

          <div className={styles.graficoFiltros}>
            <label htmlFor="ano-grafico">Ano</label>
            <select
              id="ano-grafico"
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            >
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>

        {carregandoResumo ? (
          <div className={styles.vazio}>Carregando gráfico...</div>
        ) : erroResumo ? (
          <div className={styles.erro}>{erroResumo}</div>
        ) : (
          <GraficoEbd data={resumo.grafico} />
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Excluir turma?"
        message={`Tem certeza que deseja excluir a turma "${confirmNome}"? Esta ação não pode ser desfeita.`}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmId("");
          setConfirmNome("");
        }}
        onConfirm={async () => {
          setConfirmOpen(false);

          const idToDelete = confirmId;
          const nomeToDelete = confirmNome;

          await excluirTurma(idToDelete, nomeToDelete);

          setConfirmId("");
          setConfirmNome("");
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
