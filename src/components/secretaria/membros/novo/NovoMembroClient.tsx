//src/components/secretaria/membros//novo/NovoMembroClient.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import { useToast } from "@/components/ui/Toast/useToast";

type Props = { userRole: string };
type Igreja = { id: string; nome: string };
type Cargo = { id: string; nome: string };

function formatTelefoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11); // ✅ no máximo 11

  // (11) 99999-9999
  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  // (11) 9999-9999
  if (digits.length >= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  // (11) 9999
  if (digits.length >= 3) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  // (11
  if (digits.length >= 1) {
    return `(${digits}`;
  }

  return "";
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;

  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;

  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9, 11)}`;
}

function isDateReal(value: string) {
  if (!value) return true; // vazio é permitido

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return false;

  // limite de ano realista
  if (year < 1900 || year > 2100) return false;

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function NovoMembroClient({ userRole }: Props) {
  const router = useRouter();
  const toast = useToast();

  const isSuperAdmin = userRole === "SUPERADMIN";

  const [ativo, setAtivo] = useState(true);
  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [igrejaId, setIgrejaId] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  // campos
  const [nome, setNome] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [nomePai, setNomePai] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [numeroCarteirinha, setNumeroCarteirinha] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [dataBatismo, setDataBatismo] = useState("");
  const [dataCriacaoCarteirinha, setDataCriacaoCarteirinha] = useState("");
  const [dataVencCarteirinha, setDataVencCarteirinha] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [endereco, setEndereco] = useState("");
  const [numeroEndereco, setNumeroEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [cargos, setCargos] = useState<Cargo[]>([]);

  const [loading, setLoading] = useState(false);

  const [dataNascimentoErro, setDataNascimentoErro] = useState(false);
  const [dataBatismoErro, setDataBatismoErro] = useState(false);
  const [dataCriacaoErro, setDataCriacaoErro] = useState(false);
  const [dataVencErro, setDataVencErro] = useState(false);

  async function loadCargos(selectedIgrejaId?: string) {
    const qs = new URLSearchParams();

    const finalIgrejaId = selectedIgrejaId ?? igrejaId;

    // SUPERADMIN precisa informar igrejaId
    if (isSuperAdmin) {
      if (!finalIgrejaId) {
        setCargos([]);
        setCargo("");
        return;
      }
      qs.set("igrejaId", finalIgrejaId);
    }

    try {
      const res = await fetch(`/api/cargos?${qs.toString()}`);

      if (!res.ok) {
        setCargos([]);
        setCargo("");
        return;
      }

      const data = await res.json();
      const list: Cargo[] = Array.isArray(data) ? data : [];

      setCargos(list);

      // define cargo padrão específico
      const cargoPadrao = list.find((c) => c.nome === "Membro"); // ← coloque o nome exato aqui

      if (cargoPadrao) {
        setCargo(cargoPadrao.nome);
      } else {
        setCargo(list[0]?.nome ?? "");
      }
    } catch {
      setCargos([]);
      setCargo("");
    }
  }

  function focusNextField(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;

    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();

    // Se estiver no textarea, deixa Enter normal (quebra linha)
    if (tag === "textarea") return;

    // Evita submit ao apertar Enter
    e.preventDefault();

    const form = formRef.current;
    if (!form) return;

    const fields = Array.from(
      form.querySelectorAll<HTMLElement>("input, select, textarea, button"),
    ).filter((el) => {
      const input = el as HTMLInputElement;
      return (
        !input.disabled && input.type !== "hidden" && input.tabIndex !== -1
      );
    });

    const index = fields.indexOf(target);
    if (index >= 0 && index < fields.length - 1) {
      fields[index + 1].focus();
    }
  }

  useEffect(() => {
    // ✅ usuário normal: carrega cargos da igreja dele e sai
    if (!isSuperAdmin) {
      loadCargos();
      return;
    }

    // ✅ superadmin: carrega igrejas e depois carrega cargos da 1ª igreja
    (async () => {
      try {
        const r = await fetch("/api/igrejas");

        if (!r.ok) {
          toast.error("Não foi possível carregar as igrejas.", "Erro");
          return;
        }

        const data = await r.json();

        if (Array.isArray(data)) {
          setIgrejas(data);

          const firstId = data[0]?.id ?? "";
          setIgrejaId(firstId);

          if (firstId) {
            loadCargos(firstId);
          } else {
            setCargos([]);
            setCargo("");
          }

          return;
        }

        toast.error("Resposta inválida ao carregar igrejas.", "Erro");
      } catch {
        toast.error("Falha de conexão ao carregar igrejas.", "Erro");
      }
    })();
  }, [isSuperAdmin, toast]); // (toast ok)

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // limpa erros
    setDataNascimentoErro(false);
    setDataBatismoErro(false);
    setDataCriacaoErro(false);
    setDataVencErro(false);

    // valida datas manualmente
    if (!isDateReal(dataNascimento)) {
      setDataNascimentoErro(true);
      toast.error("Data de nascimento inválida.");
      document.getElementsByName("dataNascimento")[0]?.focus();
      return;
    }

    if (!isDateReal(dataBatismo)) {
      setDataBatismoErro(true);
      toast.error("Data de batismo inválida.");
      document.getElementsByName("dataBatismo")[0]?.focus();
      return;
    }

    if (!isDateReal(dataCriacaoCarteirinha)) {
      setDataCriacaoErro(true);
      toast.error("Data de criação da carteirinha inválida.");
      document.getElementsByName("dataCriacaoCarteirinha")[0]?.focus();
      return;
    }

    if (!isDateReal(dataVencCarteirinha)) {
      setDataVencErro(true);
      toast.error("Data de vencimento da carteirinha inválida.");
      document.getElementsByName("dataVencCarteirinha")[0]?.focus();
      return;
    }

    if (!nome.trim()) {
      toast.info("Informe o nome.", "Atenção");
      return;
    }

    if (!cargo.trim()) {
      toast.info("Informe o cargo.", "Atenção");
      return;
    }

    if (isSuperAdmin && !igrejaId) {
      toast.info("Selecione uma igreja.", "Atenção");
      return;
    }

    setLoading(true);

    const url = isSuperAdmin
      ? `/api/membros?igrejaId=${igrejaId}`
      : "/api/membros";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cargo,
          ativo,
          rg: rg || null,
          cpf: cpf || null,
          estadoCivil: estadoCivil || null,
          nomeMae: nomeMae || null,
          nomePai: nomePai || null,
          endereco: endereco || null,
          numeroEndereco: numeroEndereco || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null,
          telefone: telefone || null,
          numeroCarteirinha: numeroCarteirinha || null,
          dataNascimento: dataNascimento || null,
          dataBatismo: dataBatismo || null,
          dataCriacaoCarteirinha: dataCriacaoCarteirinha || null,
          dataVencCarteirinha: dataVencCarteirinha || null,
          observacoes: observacoes || null,
        }),
      });

      setLoading(false);

      if (!res.ok) {
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        toast.error(json?.error || "Erro ao salvar.", "Erro");
        return;
      }

      toast.success("Membro cadastrado com sucesso!", "Sucesso");

      setTimeout(() => {
        router.replace("/secretaria");
      }, 650);
    } catch {
      setLoading(false);
      toast.error("Falha de conexão ao salvar.", "Erro");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
        >
          ← Voltar
        </button>

        <div className={styles.headerRight}>
          <h1 className={styles.h1Editar}>Novo Membro</h1>
          <div className={styles.sub}>Cadastro de membro</div>
        </div>
      </div>

      <form
        ref={formRef}
        className={styles.form}
        onSubmit={submit}
        onKeyDown={focusNextField}
      >
        {/* =======================
            DADOS PRINCIPAIS
        ======================== */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados principais</div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>
                Nome <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Telefone</label>
              <input
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(formatTelefoneBR(e.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                maxLength={15}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Endereço</label>
              <input
                className={styles.input}
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua / Avenida"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Número</label>
              <input
                className={styles.input}
                value={numeroEndereco}
                onChange={(e) => setNumeroEndereco(e.target.value)}
                placeholder="Número"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Bairro</label>
              <input
                className={styles.input}
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Bairro"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cidade / Distrito</label>
              <input
                className={styles.input}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Estado (UF)</label>
              <select
                className={styles.input}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="AC">AC</option>
                <option value="AL">AL</option>
                <option value="AP">AP</option>
                <option value="AM">AM</option>
                <option value="BA">BA</option>
                <option value="CE">CE</option>
                <option value="DF">DF</option>
                <option value="ES">ES</option>
                <option value="GO">GO</option>
                <option value="MA">MA</option>
                <option value="MT">MT</option>
                <option value="MS">MS</option>
                <option value="MG">MG</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PR">PR</option>
                <option value="PE">PE</option>
                <option value="PI">PI</option>
                <option value="RJ">RJ</option>
                <option value="RN">RN</option>
                <option value="RS">RS</option>
                <option value="RO">RO</option>
                <option value="RR">RR</option>
                <option value="SC">SC</option>
                <option value="SP">SP</option>
                <option value="SE">SE</option>
                <option value="TO">TO</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Estado Civil</label>
              <select
                className={styles.input}
                value={estadoCivil}
                onChange={(e) => setEstadoCivil(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="SOLTEIRO">Solteiro(a)</option>
                <option value="CASADO">Casado(a)</option>
                <option value="DIVORCIADO">Divorciado(a)</option>
                <option value="VIUVO">Viúvo(a)</option>
                <option value="AMASIADO">Amasiado(a)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nome da Mãe</label>
              <input
                className={styles.input}
                value={nomeMae}
                onChange={(e) => setNomeMae(e.target.value)}
                placeholder="Nome da mãe"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nome do Pai</label>
              <input
                className={styles.input}
                value={nomePai}
                onChange={(e) => setNomePai(e.target.value)}
                placeholder="Nome do pai"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>RG</label>
              <input
                className={styles.input}
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                placeholder="RG"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>CPF</label>
              <input
                className={styles.input}
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Cargo <span className={styles.req}>*</span>
              </label>
              <select
                className={styles.input}
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                disabled={cargos.length === 0}
              >
                {cargos.length === 0 ? (
                  <option value="">Nenhum cargo cadastrado</option>
                ) : (
                  cargos.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* =======================
            DATAS IMPORTANTES
        ======================== */}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Datas importantes</div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Data de Nascimento</label>
              <input
                type="date"
                name="dataNascimento"
                className={`${styles.input} ${dataNascimentoErro ? styles.inputError : ""}`}
                value={dataNascimento}
                onChange={(e) => {
                  setDataNascimento(e.target.value);
                  setDataNascimentoErro(false);
                }}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Data de Batismo</label>
              <input
                type="date"
                name="dataBatismo"
                className={`${styles.input} ${dataBatismoErro ? styles.inputError : ""}`}
                value={dataBatismo}
                onChange={(e) => {
                  setDataBatismo(e.target.value);
                  setDataBatismoErro(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* =======================
            CARTEIRINHA
        ======================== */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Carteirinha</div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Nº Carteirinha</label>
              <input
                className={styles.input}
                value={numeroCarteirinha}
                onChange={(e) => setNumeroCarteirinha(e.target.value)}
                placeholder="Número"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Criação da Carteirinha</label>
              <input
                type="date"
                name="dataCriacaoCarteirinha"
                className={`${styles.input} ${dataCriacaoErro ? styles.inputError : ""}`}
                value={dataCriacaoCarteirinha}
                onChange={(e) => {
                  setDataCriacaoCarteirinha(e.target.value);
                  setDataCriacaoErro(false);
                }}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Vencimento da Carteirinha</label>
              <input
                type="date"
                name="dataVencCarteirinha"
                className={`${styles.input} ${dataVencErro ? styles.inputError : ""}`}
                value={dataVencCarteirinha}
                onChange={(e) => {
                  setDataVencCarteirinha(e.target.value);
                  setDataVencErro(false);
                }}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Status do Membro</label>
              <div className={styles.fieldCheck}>
                <label className={styles.checkLine}>
                  <input
                    className={styles.checkStatus}
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  <span>{ativo ? "Ativo" : "Inativo"}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* =======================
            OBSERVAÇÕES
        ======================== */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Observações</div>

          <div className={styles.field}>
            <label className={styles.label}>Observações</label>
            <textarea
              className={styles.textarea}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: informações adicionais, notas..."
            />
          </div>
        </div>

        <button className={styles.btn} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
