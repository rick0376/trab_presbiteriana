//src/components/secretaria/escola-dominical/sorteio/SorteioEbd.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FiltrosSorteio from "./filtros/FiltrosSorteio";
import ListaAptosSorteio from "./lista-aptos/ListaAptosSorteio";
import ResultadoSorteio from "./resultado/ResultadoSorteio";
import styles from "./styles.module.scss";
import type {
  AlunoAptoSorteio,
  ResumoSorteio,
  SorteioAptosResponse,
  SorteioTurmasResponse,
  TurmaSorteioOption,
} from "./types";

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
  name?: string | null;
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

function toDateInputValue(date: Date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function getPeriodoInicialPadrao() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  return {
    dataInicio: toDateInputValue(inicio),
    dataFim: toDateInputValue(fim),
  };
}

export default function SorteioEbd() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const turmaIdQuery = searchParams.get("turmaId") || "";

  const periodoPadrao = useMemo(() => getPeriodoInicialPadrao(), []);

  const [turmas, setTurmas] = useState<TurmaSorteioOption[]>([]);
  const [turmaId, setTurmaId] = useState(turmaIdQuery);

  const [dataInicio, setDataInicio] = useState(periodoPadrao.dataInicio);
  const [dataFim, setDataFim] = useState(periodoPadrao.dataFim);
  const [maxFaltas, setMaxFaltas] = useState(2);

  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [buscandoAptos, setBuscandoAptos] = useState(false);

  const [aptos, setAptos] = useState<AlunoAptoSorteio[]>([]);
  const [resumo, setResumo] = useState<ResumoSorteio | null>(null);

  const [erro, setErro] = useState("");
  const [sorteando, setSorteando] = useState(false);
  const [nomeRodando, setNomeRodando] = useState("");
  const [vencedor, setVencedor] = useState<AlunoAptoSorteio | null>(null);

  const intervaloRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const canView = !!permissaoEbd?.ler;
  const canEdit = !!permissaoEbd?.editar;

  const turmaSelecionada = useMemo(() => {
    return turmas.find((item) => item.id === turmaId) || null;
  }, [turmas, turmaId]);

  const carregarContexto = useCallback(async () => {
    try {
      setLoadingPerms(true);
      setErro("");

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
    } catch (error) {
      setPermissaoEbd(PERM_DEFAULT_EBD);
      setErro(getErrorMessage(error, "Erro ao carregar permissões."));
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const carregarTurmas = useCallback(async () => {
    if (!canView) return;

    try {
      setLoadingTurmas(true);
      setErro("");

      const data = await getJsonOrThrow<SorteioTurmasResponse>(
        `/api/secretaria/escola-dominical/sorteio`,
        { cache: "no-store" },
      );

      const listaTurmas = data.turmas || [];
      setTurmas(listaTurmas);

      if (!listaTurmas.length) {
        setTurmaId("");
        return;
      }

      const turmaExiste = listaTurmas.some((item) => item.id === turmaIdQuery);

      if (turmaIdQuery && turmaExiste) {
        setTurmaId(turmaIdQuery);
        return;
      }

      setTurmaId((estadoAtual) => {
        if (
          estadoAtual &&
          listaTurmas.some((item) => item.id === estadoAtual)
        ) {
          return estadoAtual;
        }
        return listaTurmas[0].id;
      });
    } catch (error) {
      setErro(getErrorMessage(error, "Erro ao carregar turmas."));
    } finally {
      setLoadingTurmas(false);
    }
  }, [canView, turmaIdQuery]);

  const buscarAptos = useCallback(async () => {
    if (!turmaId) {
      setErro("Selecione uma turma.");
      return;
    }

    if (!dataInicio || !dataFim) {
      setErro("Informe a data inicial e a data final.");
      return;
    }

    if (dataInicio > dataFim) {
      setErro("A data inicial não pode ser maior que a data final.");
      return;
    }

    try {
      setBuscandoAptos(true);
      setErro("");
      setAptos([]);
      setResumo(null);
      setVencedor(null);
      setNomeRodando("");

      const params = new URLSearchParams({
        turmaId,
        dataInicio,
        dataFim,
        maxFaltas: String(maxFaltas),
      });

      const data = await getJsonOrThrow<SorteioAptosResponse>(
        `/api/secretaria/escola-dominical/sorteio?${params.toString()}`,
        { cache: "no-store" },
      );

      setAptos(data.aptos || []);
      setResumo(data.resumo);
    } catch (error) {
      setErro(getErrorMessage(error, "Erro ao buscar alunos aptos."));
    } finally {
      setBuscandoAptos(false);
    }
  }, [turmaId, dataInicio, dataFim, maxFaltas]);

  function limparTimers() {
    if (intervaloRef.current) {
      window.clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function iniciarSorteio() {
    if (!canEdit) return;
    if (!aptos.length) return;
    if (sorteando) return;

    limparTimers();
    setSorteando(true);
    setVencedor(null);

    let rodadas = 0;
    const totalRodadas = 40;

    intervaloRef.current = window.setInterval(() => {
      const alunoAleatorio =
        aptos[Math.floor(Math.random() * Math.max(aptos.length, 1))];

      if (alunoAleatorio) {
        setNomeRodando(alunoAleatorio.nome);
      }

      rodadas += 1;

      if (rodadas >= totalRodadas) {
        limparTimers();

        const vencedorFinal =
          aptos[Math.floor(Math.random() * Math.max(aptos.length, 1))];

        timeoutRef.current = window.setTimeout(() => {
          setNomeRodando(vencedorFinal?.nome || "");
          setVencedor(vencedorFinal || null);
          setSorteando(false);
        }, 500);
      }
    }, 120);
  }

  useEffect(() => {
    carregarContexto();
  }, [carregarContexto]);

  useEffect(() => {
    if (!permissaoEbd || !canView) return;
    carregarTurmas();
  }, [permissaoEbd, canView, carregarTurmas]);

  useEffect(() => {
    return () => {
      limparTimers();
    };
  }, []);

  if (loadingPerms) {
    return (
      <div className={styles.container}>
        <div className={styles.cardVazio}>Carregando permissões...</div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className={styles.container}>
        <div className={styles.cardVazio}>
          ⛔ Você não tem permissão para visualizar o sorteio da EBD.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.header}>
        <div>
          <span className={styles.tag}>Sorteio da EBD</span>
          <h1>Controle de sorteio por frequência</h1>
          <p>
            Defina o período, escolha a turma, informe o máximo de faltas
            permitidas e o sistema mostrará apenas os alunos aptos.
          </p>
        </div>

        <button
          type="button"
          className={styles.voltarBotao}
          onClick={() => router.push("/secretaria/escola-dominical/gestaoEbd")}
        >
          Voltar
        </button>
      </section>

      {!!erro && <div className={styles.erro}>{erro}</div>}

      <FiltrosSorteio
        turmas={turmas}
        turmaId={turmaId}
        setTurmaId={setTurmaId}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        maxFaltas={maxFaltas}
        setMaxFaltas={setMaxFaltas}
        onBuscar={buscarAptos}
        carregando={loadingTurmas || buscandoAptos}
      />

      {turmaSelecionada && (
        <section className={styles.infoTurma}>
          <div className={styles.infoCard}>
            <strong>Turma</strong>
            <span>{turmaSelecionada.nome}</span>
          </div>

          <div className={styles.infoCard}>
            <strong>Departamento</strong>
            <span>{turmaSelecionada.departamento || "-"}</span>
          </div>

          <div className={styles.infoCard}>
            <strong>Professor</strong>
            <span>{turmaSelecionada.professorNome || "-"}</span>
          </div>
        </section>
      )}

      <div className={styles.grid}>
        <ListaAptosSorteio
          aptos={aptos}
          resumo={resumo}
          carregando={buscandoAptos}
        />

        <ResultadoSorteio
          vencedor={vencedor}
          nomeRodando={nomeRodando}
          sorteando={sorteando}
          podeSortear={canEdit && aptos.length > 0 && !buscandoAptos}
          onSortear={iniciarSorteio}
        />
      </div>
    </div>
  );
}
