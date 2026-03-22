"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FrequenciaChamadaMobile from "../mobile/FrequenciaChamadaMobile";
import styles from "./styles.module.scss";

type Props = {
  turmaId: string;
  igrejaId: string;
  igrejaNome: string;
  mesInicial?: number;
  anoInicial?: number;
};

type EbdStatus = "PRESENTE" | "FALTA";

type TurmaInfo = {
  id: string;
  nome: string;
  departamento?: string | null;
  professor: {
    id: string;
    nome: string;
    cargo?: string | null;
  };
};

type Aluno = {
  id: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
};

type RegistroDomingo = {
  id: string;
  domingoNumero: number;
  visitantes: number;
  oferta: string | number | null;
  revistasLivros: number;
  observacao?: string | null;
};

type RegistroFrequencia = {
  id: string;
  membroId: string;
  domingoNumero: number;
  status: EbdStatus;
};

type RegistroMensal = {
  id: string;
  mes: number;
  ano: number;
  observacoes?: string | null;
  domingos: RegistroDomingo[];
  frequencias: RegistroFrequencia[];
};

type ApiResponse = {
  turma: TurmaInfo;
  alunos: Aluno[];
  registro?: RegistroMensal | null;
};

type DomingoDoMes = {
  domingoNumero: number;
  dataISO: string;
  label: string;
  labelCurta: string;
};

type DomingoForm = {
  domingoNumero: number;
  visitantes: number;
  oferta: string;
  revistasLivros: number;
  observacao: string;
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

const MESES = [
  { valor: 1, label: "Janeiro" },
  { valor: 2, label: "Fevereiro" },
  { valor: 3, label: "Março" },
  { valor: 4, label: "Abril" },
  { valor: 5, label: "Maio" },
  { valor: 6, label: "Junho" },
  { valor: 7, label: "Julho" },
  { valor: 8, label: "Agosto" },
  { valor: 9, label: "Setembro" },
  { valor: 10, label: "Outubro" },
  { valor: 11, label: "Novembro" },
  { valor: 12, label: "Dezembro" },
];

function getDomingosDoMes(mes: number, ano: number): DomingoDoMes[] {
  const domingos: DomingoDoMes[] = [];
  const ultimoDia = new Date(ano, mes, 0).getDate();
  let contador = 0;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia, 12, 0, 0);

    if (data.getDay() === 0) {
      contador += 1;

      const dd = String(dia).padStart(2, "0");
      const mm = String(mes).padStart(2, "0");

      domingos.push({
        domingoNumero: contador,
        dataISO: `${ano}-${mm}-${dd}`,
        label: `${dd}/${mm}/${ano}`,
        labelCurta: `${dd}/${mm}`,
      });
    }
  }

  return domingos;
}

function criarDomingosPadrao(domingosDoMes: DomingoDoMes[]): DomingoForm[] {
  return domingosDoMes.map((item) => ({
    domingoNumero: item.domingoNumero,
    visitantes: 0,
    oferta: "",
    revistasLivros: 0,
    observacao: "",
  }));
}

function criarMapaInicial(alunos: Aluno[], domingosDoMes: DomingoDoMes[]) {
  const mapa: Record<string, EbdStatus> = {};

  alunos.forEach((aluno) => {
    domingosDoMes.forEach((domingo) => {
      mapa[`${aluno.id}-${domingo.domingoNumero}`] = "FALTA";
    });
  });

  return mapa;
}

export default function ChamadaRapidaEbd({
  turmaId,
  igrejaId,
  igrejaNome,
  mesInicial,
  anoInicial,
}: Props) {
  const router = useRouter();

  const hoje = new Date();
  const [mes, setMes] = useState(mesInicial || hoje.getMonth() + 1);
  const [ano, setAno] = useState(anoInicial || hoje.getFullYear());

  const [turma, setTurma] = useState<TurmaInfo | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [frequencias, setFrequencias] = useState<Record<string, EbdStatus>>({});
  const [domingos, setDomingos] = useState<DomingoForm[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [domingoSelecionadoNumero, setDomingoSelecionadoNumero] = useState("");

  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const domingosDoMes = useMemo(() => getDomingosDoMes(mes, ano), [mes, ano]);

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
  const canEdit = !!permissaoEbd?.editar;

  useEffect(() => {
    if (!domingoSelecionadoNumero && domingosDoMes.length > 0) {
      setDomingoSelecionadoNumero(String(domingosDoMes[0].domingoNumero));
      return;
    }

    const existe = domingosDoMes.some(
      (item) => String(item.domingoNumero) === domingoSelecionadoNumero,
    );

    if (!existe && domingosDoMes.length > 0) {
      setDomingoSelecionadoNumero(String(domingosDoMes[0].domingoNumero));
    }
  }, [domingosDoMes, domingoSelecionadoNumero]);

  useEffect(() => {
    if (!igrejaId || !turmaId) return;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        setSucesso("");

        const response = await fetch(
          `/api/secretaria/escola-dominical/turmas/${turmaId}/frequencia?igrejaId=${igrejaId}&mes=${mes}&ano=${ano}`,
        );

        const data = (await response.json()) as ApiResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao carregar frequência.");
        }

        setTurma(data.turma);
        setAlunos(data.alunos);

        const mapaBase = criarMapaInicial(data.alunos, domingosDoMes);

        if (data.registro?.frequencias?.length) {
          data.registro.frequencias.forEach((item) => {
            const chave = `${item.membroId}-${item.domingoNumero}`;
            if (chave in mapaBase) {
              mapaBase[chave] = item.status;
            }
          });
        }

        setFrequencias(mapaBase);
        setObservacoes(data.registro?.observacoes || "");

        const domingosBase = criarDomingosPadrao(domingosDoMes);

        if (data.registro?.domingos?.length) {
          data.registro.domingos.forEach((domingo) => {
            const index = domingosBase.findIndex(
              (item) => item.domingoNumero === domingo.domingoNumero,
            );

            if (index >= 0) {
              domingosBase[index] = {
                domingoNumero: domingo.domingoNumero,
                visitantes: domingo.visitantes || 0,
                oferta:
                  domingo.oferta !== null && domingo.oferta !== undefined
                    ? String(domingo.oferta)
                    : "",
                revistasLivros: domingo.revistasLivros || 0,
                observacao: domingo.observacao || "",
              };
            }
          });
        }

        setDomingos(domingosBase);
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar frequência.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [igrejaId, turmaId, mes, ano, domingosDoMes]);

  function getDomingoMeta(domingoNumero: number) {
    return (
      domingosDoMes.find((item) => item.domingoNumero === domingoNumero) || null
    );
  }

  function isDomingoLiberado(domingoNumero: number) {
    const meta = getDomingoMeta(domingoNumero);
    if (!meta) return false;

    const dataDomingo = new Date(`${meta.dataISO}T12:00:00`);
    const hojeLimite = new Date();
    hojeLimite.setHours(23, 59, 59, 999);

    return dataDomingo.getTime() <= hojeLimite.getTime();
  }

  function alterarStatus(
    membroId: string,
    domingoNumero: number,
    status: EbdStatus,
  ) {
    if (!isDomingoLiberado(domingoNumero)) return;

    setFrequencias((estadoAtual) => ({
      ...estadoAtual,
      [`${membroId}-${domingoNumero}`]: status,
    }));
  }

  async function salvarFrequencia() {
    if (!canEdit) return;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const listaFrequencias = alunos.flatMap((aluno) =>
        domingosDoMes.map((domingo) => ({
          membroId: aluno.id,
          domingoNumero: domingo.domingoNumero,
          status:
            frequencias[`${aluno.id}-${domingo.domingoNumero}`] ||
            ("FALTA" as EbdStatus),
        })),
      );

      const response = await fetch(
        `/api/secretaria/escola-dominical/turmas/${turmaId}/frequencia`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            igrejaId,
            mes,
            ano,
            observacoes,
            frequencias: listaFrequencias,
            domingos,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao salvar frequência.");
      }

      setSucesso("Frequência salva com sucesso.");
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar frequência.");
    } finally {
      setSalvando(false);
    }
  }

  if (loadingPerms) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>Carregando permissões...</div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>
          ⛔ Você não tem permissão para visualizar a chamada rápida.
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className={styles.container}>
        <div className={styles.vazio}>Carregando chamada rápida...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topo}>
        <div>
          <h1>Chamada rápida</h1>
          <p>
            {igrejaNome || "-"} • {turma?.nome || "-"} • Professor:{" "}
            {turma?.professor?.nome || "-"}
          </p>
        </div>

        <button
          type="button"
          className={styles.voltarBotao}
          onClick={() => router.back()}
        >
          Voltar
        </button>
      </div>

      <div className={styles.filtros}>
        <div className={styles.filtroItem}>
          <label>Mês</label>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filtroItem}>
          <label>Ano</label>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          />
        </div>
      </div>

      <FrequenciaChamadaMobile
        alunos={alunos}
        domingosDoMes={domingosDoMes}
        domingoSelecionadoNumero={domingoSelecionadoNumero}
        setDomingoSelecionadoNumero={setDomingoSelecionadoNumero}
        frequencias={frequencias}
        alterarStatus={alterarStatus}
        canEdit={canEdit}
        salvando={salvando}
        salvarFrequencia={salvarFrequencia}
        erro={erro}
        sucesso={sucesso}
        isDomingoLiberado={isDomingoLiberado}
      />
    </div>
  );
}
