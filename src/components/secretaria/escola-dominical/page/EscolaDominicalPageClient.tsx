//src/components/secretaria/escola-dominical/page/EscolaDominicalPageClient.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type ResumoGraficoItem = {
  mes: number;
  label: string;
  presencas: number;
  faltas: number;
  visitantes: number;
};

type ResumoResponse = {
  cards: {
    matriculados: number;
    presencas: number;
    faltas: number;
    percentualPresenca: number;
  };
  grafico: ResumoGraficoItem[];
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

const RECURSO_EBD = "escola_dominical";

const PERM_DEFAULT_EBD: Permissao = {
  recurso: RECURSO_EBD,
  ler: false,
  criar: false,
  editar: false,
  deletar: false,
  compartilhar: false,
};

const criarResumoInicial = (ano: number): ResumoResponse => ({
  cards: {
    matriculados: 0,
    presencas: 0,
    faltas: 0,
    percentualPresenca: 0,
  },
  grafico: [],
  ano,
  filtroTurmaId: null,
});

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function getJsonOrThrow<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Ocorreu um erro na requisição.");
  }

  return data as T;
}

function getPermissaoTotal(): Permissao {
  return {
    recurso: RECURSO_EBD,
    ler: true,
    criar: true,
    editar: true,
    deletar: true,
    compartilhar: true,
  };
}

export default function EscolaDominicalPageClient({ igrejaId }: Props) {
  const anoAtual = new Date().getFullYear();

  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState("");

  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [resumo, setResumo] = useState<ResumoResponse>(
    criarResumoInicial(anoAtual),
  );

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

  const canView = !!permissaoEbd?.ler;
  const canCreate = !!permissaoEbd?.criar;
  const canEdit = !!permissaoEbd?.editar;
  const canDelete = !!permissaoEbd?.deletar;

  const anosDisponiveis = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => anoAtual - 3 + index);
  }, [anoAtual]);

  const turmaSelecionada = useMemo(() => {
    return turmas.find((item) => item.id === turmaSelecionadaId) || null;
  }, [turmas, turmaSelecionadaId]);

  const totalMatriculados = useMemo(() => {
    if (resumo.cards.matriculados > 0) return resumo.cards.matriculados;

    if (!turmaSelecionadaId) {
      return turmas.reduce((acc, turma) => acc + turma._count.alunos, 0);
    }

    const turmaAtual = turmas.find((item) => item.id === turmaSelecionadaId);
    return turmaAtual?._count.alunos || 0;
  }, [turmas, resumo.cards.matriculados, turmaSelecionadaId]);

  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMsg(message);
    setAlertOpen(true);
  }

  function limparConfirmacao() {
    setConfirmOpen(false);
    setConfirmId("");
    setConfirmNome("");
  }

  function abrirConfirmacaoExclusao(turma: Turma) {
    setConfirmId(turma.id);
    setConfirmNome(turma.nome);
    setConfirmOpen(true);
  }

  const carregarTurmas = useCallback(async () => {
    if (!igrejaId) return;

    try {
      setCarregandoTurmas(true);
      setErroTurmas("");

      const data = await getJsonOrThrow<Turma[]>(
        `/api/secretaria/escola-dominical/turmas?igrejaId=${igrejaId}`,
      );

      setTurmas(Array.isArray(data) ? data : []);
    } catch (error) {
      setErroTurmas(getErrorMessage(error, "Erro ao carregar turmas."));
    } finally {
      setCarregandoTurmas(false);
    }
  }, [igrejaId]);

  const carregarResumo = useCallback(
    async (turmaIdOverride?: string | null) => {
      if (!igrejaId) return;

      try {
        setCarregandoResumo(true);
        setErroResumo("");

        const turmaIdFinal =
          turmaIdOverride !== undefined ? turmaIdOverride : turmaSelecionadaId;

        const qs = new URLSearchParams();
        qs.set("igrejaId", igrejaId);
        qs.set("ano", String(anoSelecionado));

        if (turmaIdFinal) {
          qs.set("turmaId", turmaIdFinal);
        }

        const data = await getJsonOrThrow<ResumoResponse>(
          `/api/secretaria/escola-dominical/resumo?${qs.toString()}`,
        );

        setResumo(data);
      } catch (error) {
        setErroResumo(getErrorMessage(error, "Erro ao carregar resumo."));
      } finally {
        setCarregandoResumo(false);
      }
    },
    [igrejaId, anoSelecionado, turmaSelecionadaId],
  );

  const carregarPermissoes = useCallback(async () => {
    try {
      setLoadingPerms(true);

      const meData = await getJsonOrThrow<MeResponse>("/api/me", {
        cache: "no-store",
      }).catch(() => null);

      if (!meData) {
        setPermissaoEbd(PERM_DEFAULT_EBD);
        return;
      }

      if (meData.role === "SUPERADMIN") {
        setPermissaoEbd(getPermissaoTotal());
        return;
      }

      const permissoes = await getJsonOrThrow<Permissao[]>(
        `/api/permissoes?userId=${meData.id}`,
        { cache: "no-store" },
      ).catch(() => []);

      const permissaoEncontrada = permissoes.find(
        (item) => item.recurso === RECURSO_EBD,
      );

      setPermissaoEbd(permissaoEncontrada ?? PERM_DEFAULT_EBD);
    } catch {
      setPermissaoEbd(PERM_DEFAULT_EBD);
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  async function excluirTurma(turmaId: string) {
    try {
      setExcluindoId(turmaId);

      await getJsonOrThrow(
        `/api/secretaria/escola-dominical/turmas/${turmaId}?igrejaId=${igrejaId}`,
        { method: "DELETE" },
      );

      const turmaExcluidaEraSelecionada = turmaSelecionadaId === turmaId;
      const novoFiltro = turmaExcluidaEraSelecionada ? "" : turmaSelecionadaId;

      if (turmaExcluidaEraSelecionada) {
        setTurmaSelecionadaId("");
      }

      await Promise.all([carregarTurmas(), carregarResumo(novoFiltro)]);
    } catch (error) {
      showAlert("Erro", getErrorMessage(error, "Erro ao excluir turma."));
    } finally {
      setExcluindoId("");
    }
  }

  useEffect(() => {
    carregarPermissoes();
  }, [carregarPermissoes]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

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
      <section className={styles.header}>
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
      </section>

      <ResumoEbd
        matriculados={totalMatriculados}
        presencas={resumo.cards.presencas}
        faltas={resumo.cards.faltas}
        percentualPresenca={resumo.cards.percentualPresenca}
      />

      <section className={styles.bloco}>
        <div className={styles.blocoHeader}>
          <div>
            <h2>Turmas cadastradas</h2>
            <p className={styles.subInfo}>
              {turmas.length === 1
                ? "1 turma encontrada"
                : `${turmas.length} turmas encontradas`}
            </p>
          </div>

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
              const estaSelecionada = turmaSelecionadaId === turma.id;
              const estaExcluindo = excluindoId === turma.id;

              return (
                <article
                  key={turma.id}
                  className={`${styles.turmaCard} ${
                    estaSelecionada ? styles.turmaCardAtiva : ""
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

                    {estaSelecionada && (
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
                          abrirConfirmacaoExclusao(turma);
                        }}
                        disabled={estaExcluindo}
                      >
                        {estaExcluindo ? "Excluindo..." : "Excluir"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.bloco}>
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
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="Excluir turma?"
        message={`Tem certeza que deseja excluir a turma "${confirmNome}"? Esta ação não pode ser desfeita.`}
        onCancel={limparConfirmacao}
        onConfirm={async () => {
          const idToDelete = confirmId;

          limparConfirmacao();

          if (!idToDelete) return;

          await excluirTurma(idToDelete);
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
