//src/components/secretaria/escola-dominical/form/FormEscolaDominical.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

type Props = {
  modo: "novo" | "editar";
  turmaId?: string;
  igrejaId: string;
};

type Professor = {
  id: string;
  nome: string;
  cargo?: string | null;
  telefone?: string | null;
};

type Aluno = {
  id: string;
  nome: string;
  cargo?: string | null;
  telefone?: string | null;
  numeroSequencial?: number | null;
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

export default function FormEscolaDominical({
  modo,
  turmaId,
  igrejaId,
}: Props) {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");

  const [permissaoEbd, setPermissaoEbd] = useState<Permissao | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  const canCreate = !!permissaoEbd?.criar;
  const canEdit = !!permissaoEbd?.editar;
  const podeUsarFormulario = modo === "novo" ? canCreate : canEdit;

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoIdsSelecionados, setAlunoIdsSelecionados] = useState<string[]>(
    [],
  );

  const [carregandoProfessores, setCarregandoProfessores] = useState(false);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [carregandoTurma, setCarregandoTurma] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

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

  useEffect(() => {
    if (!igrejaId) return;

    async function carregarProfessores() {
      try {
        setCarregandoProfessores(true);
        setErro("");

        const response = await fetch(
          `/api/secretaria/escola-dominical/professores?igrejaId=${igrejaId}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao buscar professores.");
        }

        setProfessores(data);
      } catch (error: any) {
        setErro(error.message || "Erro ao buscar professores.");
      } finally {
        setCarregandoProfessores(false);
      }
    }

    async function carregarAlunos() {
      try {
        setCarregandoAlunos(true);
        setErro("");

        const response = await fetch(
          `/api/secretaria/escola-dominical/alunos?igrejaId=${igrejaId}`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Erro ao buscar alunos.");
        }

        setAlunos(data);
      } catch (error: any) {
        setErro(error.message || "Erro ao buscar alunos.");
      } finally {
        setCarregandoAlunos(false);
      }
    }

    carregarProfessores();
    carregarAlunos();
  }, [igrejaId]);

  useEffect(() => {
    if (modo !== "editar" || !turmaId || !igrejaId) return;

    async function carregarTurma() {
      try {
        setCarregandoTurma(true);
        setErro("");

        const [turmaResponse, alunosTurmaResponse] = await Promise.all([
          fetch(`/api/secretaria/escola-dominical/turmas/${turmaId}`),
          fetch(
            `/api/secretaria/escola-dominical/turmas/${turmaId}/alunos?igrejaId=${igrejaId}`,
          ),
        ]);

        const turmaData = await turmaResponse.json();
        const alunosTurmaData = await alunosTurmaResponse.json();

        if (!turmaResponse.ok) {
          throw new Error(turmaData?.error || "Erro ao buscar turma.");
        }

        if (!alunosTurmaResponse.ok) {
          throw new Error(
            alunosTurmaData?.error || "Erro ao buscar alunos da turma.",
          );
        }

        setNome(turmaData.nome || "");
        setDepartamento(turmaData.departamento || "");
        setProfessorId(turmaData.professorId || "");
        setAlunoIdsSelecionados(alunosTurmaData.alunoIds || []);
      } catch (error: any) {
        setErro(error.message || "Erro ao buscar dados da turma.");
      } finally {
        setCarregandoTurma(false);
      }
    }

    carregarTurma();
  }, [modo, turmaId, igrejaId]);

  function toggleAluno(alunoId: string) {
    setAlunoIdsSelecionados((estadoAtual) => {
      if (estadoAtual.includes(alunoId)) {
        return estadoAtual.filter((id) => id !== alunoId);
      }

      return [...estadoAtual, alunoId];
    });
  }

  const alunosFiltrados = useMemo(() => {
    const termo = buscaAluno.trim().toLowerCase();

    if (!termo) return alunos;

    return alunos.filter((aluno) => {
      const nomeAluno = aluno.nome?.toLowerCase() || "";
      const cargoAluno = aluno.cargo?.toLowerCase() || "";
      const numeroAluno = String(aluno.numeroSequencial || "");

      return (
        nomeAluno.includes(termo) ||
        cargoAluno.includes(termo) ||
        numeroAluno.includes(termo)
      );
    });
  }, [alunos, buscaAluno]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setErro("");
      setSucesso("");

      if (!igrejaId) {
        setErro("Não foi possível identificar a igreja.");
        return;
      }

      if (!nome.trim()) {
        setErro("Informe o nome da turma.");
        return;
      }

      if (!professorId) {
        setErro("Selecione o professor.");
        return;
      }

      setSalvando(true);

      const endpoint =
        modo === "novo"
          ? "/api/secretaria/escola-dominical/turmas"
          : `/api/secretaria/escola-dominical/turmas/${turmaId}`;

      const method = modo === "novo" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igrejaId,
          nome,
          departamento,
          professorId,
        }),
      });

      const turmaData = await response.json();

      if (!response.ok) {
        throw new Error(turmaData?.error || "Erro ao salvar turma.");
      }

      const turmaSalvaId = turmaData.id || turmaId;

      const alunosResponse = await fetch(
        `/api/secretaria/escola-dominical/turmas/${turmaSalvaId}/alunos`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            igrejaId,
            alunoIds: alunoIdsSelecionados,
          }),
        },
      );

      const alunosData = await alunosResponse.json();

      if (!alunosResponse.ok) {
        throw new Error(alunosData?.error || "Erro ao salvar alunos.");
      }

      setSucesso(
        modo === "novo"
          ? "Turma cadastrada com sucesso."
          : "Turma atualizada com sucesso.",
      );

      setTimeout(() => {
        router.push("/secretaria/escola-dominical/gestaoEbd");
        router.refresh();
      }, 700);
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar turma.");
    } finally {
      setSalvando(false);
    }
  }

  const desabilitado =
    salvando ||
    carregandoProfessores ||
    carregandoAlunos ||
    carregandoTurma ||
    !igrejaId ||
    !podeUsarFormulario;

  if (loadingPerms) {
    return (
      <div className={styles.container}>
        <div className={styles.form}>Carregando permissões...</div>
      </div>
    );
  }

  if (!podeUsarFormulario) {
    return (
      <div className={styles.container}>
        <div className={styles.form}>
          ⛔ Você não tem permissão para {modo === "novo" ? "criar" : "editar"}{" "}
          turma da Escola Dominical.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>
            {modo === "novo" ? "Nova turma da EBD" : "Editar turma da EBD"}
          </h1>
          <p>Cadastre a classe, professor e selecione os alunos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Nome da classe</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Adultos"
              disabled={desabilitado}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Departamento</label>
            <input
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="Ex: Escola Bíblica"
              disabled={desabilitado}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Professor</label>
            <select
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              disabled={desabilitado}
            >
              <option value="">
                {carregandoProfessores
                  ? "Carregando professores..."
                  : "Selecione"}
              </option>

              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                  {professor.cargo ? ` - ${professor.cargo}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.alunosBox}>
          <div className={styles.alunosHeader}>
            <div>
              <h2>Alunos da turma</h2>
              <p>Selecione os membros que participarão da Escola Dominical.</p>
            </div>

            <div className={styles.contadorSelecionados}>
              Selecionados: {alunoIdsSelecionados.length}
            </div>
          </div>

          <div className={styles.buscaBox}>
            <input
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              placeholder="Buscar aluno por nome, cargo ou número"
              disabled={desabilitado}
            />
          </div>

          <div className={styles.listaAlunos}>
            {alunosFiltrados.length === 0 ? (
              <div className={styles.vazioLista}>Nenhum aluno encontrado.</div>
            ) : (
              alunosFiltrados.map((aluno) => {
                const selecionado = alunoIdsSelecionados.includes(aluno.id);

                return (
                  <label key={aluno.id} className={styles.alunoItem}>
                    <div className={styles.alunoCheck}>
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => toggleAluno(aluno.id)}
                        disabled={desabilitado}
                      />
                    </div>

                    <div className={styles.alunoInfo}>
                      <strong>{aluno.nome}</strong>
                      <span>
                        Nº {aluno.numeroSequencial || "-"}
                        {aluno.cargo ? ` • ${aluno.cargo}` : ""}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {!!erro && <div className={styles.erro}>{erro}</div>}
        {!!sucesso && <div className={styles.sucesso}>{sucesso}</div>}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelarBotao}
            onClick={() =>
              router.push("/secretaria/escola-dominical/gestaoEbd")
            }
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className={styles.salvarBotao}
            disabled={desabilitado}
          >
            {salvando
              ? "Salvando..."
              : modo === "novo"
                ? "Salvar turma"
                : "Atualizar turma"}
          </button>
        </div>
      </form>
    </div>
  );
}
