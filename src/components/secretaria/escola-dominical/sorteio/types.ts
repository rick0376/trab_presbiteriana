export type TurmaSorteioOption = {
  id: string;
  nome: string;
  departamento?: string | null;
  professorNome?: string | null;
};

export type AlunoAptoSorteio = {
  id: string;
  nome: string;
  cargo?: string | null;
  numeroSequencial?: number | null;
  presencas: number;
  faltas: number;
  totalRegistros: number;
  percentualPresenca: number;
};

export type ResumoSorteio = {
  totalAlunosTurma: number;
  totalAptos: number;
  totalInaptos: number;
  domingosConsiderados: number;
  periodoLabel: string;
};

export type SorteioTurmasResponse = {
  turmas: TurmaSorteioOption[];
};

export type SorteioAptosResponse = {
  turma: TurmaSorteioOption | null;
  aptos: AlunoAptoSorteio[];
  resumo: ResumoSorteio;
};
