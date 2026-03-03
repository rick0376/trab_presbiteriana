"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles.module.scss";
import { useToast } from "@/components/ui/Toast/useToast";
import { jsPDF } from "jspdf";
import { FileText, MessageCircle } from "lucide-react";

type Cargo = { id: string; nome: string };

type Igreja = { id: string; nome: string };

function formatTelefoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length >= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;

  if (digits.length >= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;

  if (digits.length >= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length >= 1) return `(${digits}`;
  return "";
}

export default function EditarMembroClient({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [igrejaNome, setIgrejaNome] = useState("");

  const isShareMode = searchParams.get("mode") === "share";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  const [numeroSequencial, setNumeroSequencial] = useState("");
  const [nome, setNome] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [nomePai, setNomePai] = useState("");
  const [cargo, setCargo] = useState("");
  const [ativo, setAtivo] = useState(true);
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

  async function loadCargos(igrejaId: string) {
    const qs = new URLSearchParams();
    qs.set("igrejaId", igrejaId);
    const res = await fetch(`/api/cargos?${qs.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setCargos(Array.isArray(data) ? data : []);
  }

  function focusNextField(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === "textarea") return;

    e.preventDefault();

    const form = formRef.current;
    if (!form) return;

    const fields = Array.from(
      form.querySelectorAll<HTMLElement>("input, select, textarea, button"),
    ).filter((el) => {
      const input = el as HTMLInputElement;
      return !input.disabled && input.type !== "hidden";
    });

    const index = fields.indexOf(target);
    if (index >= 0 && index < fields.length - 1) {
      fields[index + 1].focus();
    }
  }

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/membros/${id}`, { cache: "no-store" });

        if (!res.ok) {
          toast.error("Erro ao carregar membro", "Erro");
          setLoading(false);
          return;
        }

        const m = await res.json();

        await loadCargos(m.igrejaId);

        // vem direto da API agora
        setIgrejaNome(m.igrejaNome ?? "");

        setAtivo(!!m.ativo);
        setNumeroSequencial(m.numeroSequencial ?? null);

        setCpf(m.cpf ? formatCPF(m.cpf) : "");

        setNome(m.nome ?? "");
        setTelefone(m.telefone ?? "");
        setEndereco(m.endereco ?? "");
        setNumeroEndereco(m.numeroEndereco ?? "");
        setBairro(m.bairro ?? "");
        setCidade(m.cidade ?? "");
        setEstado(m.estado ?? "");
        setEstadoCivil(m.estadoCivil ?? "");
        setNomeMae(m.nomeMae ?? "");
        setNomePai(m.nomePai ?? "");
        setRg(m.rg ?? "");
        setCargo(m.cargo ?? "");

        setDataNascimento(m.dataNascimento?.slice(0, 10) ?? "");
        setDataBatismo(m.dataBatismo?.slice(0, 10) ?? "");
        setDataCriacaoCarteirinha(m.dataCriacaoCarteirinha?.slice(0, 10) ?? "");
        setDataVencCarteirinha(m.dataVencCarteirinha?.slice(0, 10) ?? "");

        //setNumeroCarteirinha(m.numeroCarteirinha ?? "");
        setNumeroCarteirinha(
          m.numeroSequencial
            ? `IPR-${String(m.numeroSequencial).padStart(4, "0")}`
            : "",
        );

        setObservacoes(m.observacoes ?? "");
      } catch {
        toast.error("Falha de conexão ao carregar membro", "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isShareMode) return;

    if (!nome.trim()) {
      toast.info("Informe o nome.", "Atenção");
      return;
    }

    if (!cargo.trim()) {
      toast.info("Informe o cargo.", "Atenção");
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/membros/${id}`, {
      method: "PUT",
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
        //numeroCarteirinha: numeroCarteirinha || null,
        numeroCarteirinha: numeroSequencial || null,
        dataNascimento: dataNascimento || null,
        dataBatismo: dataBatismo || null,
        dataCriacaoCarteirinha: dataCriacaoCarteirinha || null,
        dataVencCarteirinha: dataVencCarteirinha || null,
        observacoes: observacoes || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      toast.error("Erro ao salvar.", "Erro");
      return;
    }

    toast.success("Membro atualizado com sucesso!", "Sucesso");
    router.replace("/secretaria/membros");
  }

  const codigo = numeroSequencial
    ? `IPR-${String(numeroSequencial).padStart(4, "0")}`
    : "IPR-0000";

  function compartilharWhats() {
    const texto = `🪪 *CADASTRO:* *${codigo}*

👤 *${nome}*
📱 Telefone: ${telefone || "-"}
📍 Endereço: ${endereco || "-"}, ${numeroEndereco || ""} - ${bairro || ""}
🏙 Cidade: ${cidade || "-"} - ${estado || "-"}
💍 Estado Civil: ${estadoCivil || "-"}
👩 Mãe: ${nomeMae || "-"}
👨 Pai: ${nomePai || "-"}
🆔 RG: ${rg || "-"}
🆔 CPF: ${formatCPF(cpf)}
💼 Cargo: ${cargo || "-"}
🎂 Nasc.: ${dataNascimento || "-"}
✝ Batismo: ${dataBatismo || "-"}
📝 Obs: ${observacoes || "-"}`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
    );
  }

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const nomeCliente = igrejaNome || "Sistema LHPSYSTEMS";

    const margin = 8;
    let y = 48;

    const codigo = numeroSequencial
      ? `IPR-${String(numeroSequencial).padStart(4, "0")}`
      : "IPR-0000";

    const getLogoBase64 = async () => {
      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const resp = await fetch(`${origin}/images/logo.png`, {
          cache: "no-store",
        });
        if (!resp.ok) return "";
        const blob = await resp.blob();

        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch {
        return "";
      }
    };

    const logoDataUri = await getLogoBase64();

    const igrejaTitulo = (igrejaNome || "Sistema LHPSYSTEMS").trim();
    const igrejaTituloLines = doc.splitTextToSize(igrejaTitulo, 70);

    const printHeader = () => {
      doc.setFillColor(25, 35, 55);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setFillColor(218, 165, 32);
      doc.rect(0, 35, pageWidth, 5, "F");

      if (logoDataUri) {
        try {
          doc.addImage(logoDataUri, "PNG", 10, 7, 18, 18);
        } catch {}
      }

      // ✅ Nome da igreja embaixo do logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      // doc.text(igrejaTituloLines, 10, 30);

      // Título central
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("FICHA DE MEMBRO", pageWidth / 2, 18, { align: "center" });

      // Nome da Igreja
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(nomeCliente, 10, 30);

      const dt = new Date();
      const dataBR = dt.toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      const horaBR = dt.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataBR} ${horaBR}`, pageWidth / 2, 28, {
        align: "center",
      });
    };

    const printFooter = () => {
      const totalPages = doc.getNumberOfPages();
      const footerY = pageHeight - 10;

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        // ✅ Nome da igreja no rodapé
        doc.text(nomeCliente, margin, footerY);

        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
      }
    };

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - 20) {
        doc.addPage();
        y = 48;
        printHeader();
      }
    };

    const labelX = margin;
    const valueX = 52;
    const valueMaxWidth = pageWidth - margin - valueX;

    const labelSize = 9;
    const valueSize = 9;
    const lineH = 4;
    const gap = 3;

    const addField = (label: string, value: string) => {
      const safeValue = value && value.trim() ? value.trim() : "-";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(valueSize);
      const lines = doc.splitTextToSize(safeValue, valueMaxWidth);

      const height = Math.max(lines.length * lineH, lineH);
      checkPageBreak(height + gap);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(labelSize);
      doc.setTextColor(70, 70, 70);
      doc.text(label, labelX, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(valueSize);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, valueX, y);

      y += height + gap;
    };

    printHeader();

    addField("CADASTRO", codigo);
    addField("NOME", nome);
    addField("TELEFONE", telefone || "-");
    addField("ENDEREÇO", `${endereco || "-"} ${numeroEndereco || ""}`);
    addField("BAIRRO", bairro || "-");
    addField("CIDADE", cidade || "-");
    addField("ESTADO (UF)", estado || "-");
    addField("ESTADO CIVIL", estadoCivil || "-");
    addField("NOME DA MÃE", nomeMae || "-");
    addField("NOME DO PAI", nomePai || "-");
    addField("RG", rg || "-");
    addField("CPF", formatCPF(cpf));
    addField("CARGO", cargo || "-");
    addField("DATA NASC.", dataNascimento || "-");
    addField("DATA BATISMO", dataBatismo || "-");
    addField("Nº CARTEIRINHA", numeroCarteirinha || "-");
    addField("CRIAÇÃO CARTEIR.", dataCriacaoCarteirinha || "-");
    addField("VENC. CARTEIR.", dataVencCarteirinha || "-");
    addField("OBSERVAÇÕES", observacoes || "-");

    printFooter();

    doc.save(
      `membro-${codigo}-${(nome || "sem-nome").replace(/\s+/g, "-").toLowerCase()}.pdf`,
    );
  };
  if (loading) return <div className={styles.loading}>Carregando...</div>;

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
          <h1 className={styles.h1Editar}>
            {isShareMode ? "Compartilhar Membro" : "Editar Membro"}
          </h1>
          <div className={styles.sub}>
            {isShareMode
              ? "Compartilhar informações do membro"
              : "Atualização de cadastro"}
          </div>
        </div>
      </div>

      <form
        ref={formRef}
        className={styles.form}
        onSubmit={submit}
        onKeyDown={focusNextField}
      >
        {/* DADOS PRINCIPAIS */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados principais</div>
          <div className={styles.sectionTitle}>
            Cadastro:{" "}
            {numeroSequencial
              ? `IPR-${String(numeroSequencial).padStart(4, "0")}`
              : "—"}
          </div>

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
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Endereço</label>
              <input
                className={styles.input}
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço"
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
                {[
                  "AC",
                  "AL",
                  "AP",
                  "AM",
                  "BA",
                  "CE",
                  "DF",
                  "ES",
                  "GO",
                  "MA",
                  "MT",
                  "MS",
                  "MG",
                  "PA",
                  "PB",
                  "PR",
                  "PE",
                  "PI",
                  "RJ",
                  "RN",
                  "RS",
                  "RO",
                  "RR",
                  "SC",
                  "SP",
                  "SE",
                  "TO",
                ].map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
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
              >
                {cargos.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
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
                className={styles.input}
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Data de Batismo</label>
              <input
                type="date"
                className={styles.input}
                value={dataBatismo}
                onChange={(e) => setDataBatismo(e.target.value)}
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
                className={styles.input}
                value={dataCriacaoCarteirinha}
                onChange={(e) => setDataCriacaoCarteirinha(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Vencimento da Carteirinha</label>
              <input
                type="date"
                className={styles.input}
                value={dataVencCarteirinha}
                onChange={(e) => setDataVencCarteirinha(e.target.value)}
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
            />
          </div>
        </div>

        {isShareMode ? (
          <div className={styles.shareActions}>
            <button onClick={gerarPDF} className={styles.btnPDF} type="button">
              <FileText size={16} /> PDF
            </button>
            <button
              onClick={compartilharWhats}
              className={styles.btnWhats}
              type="button"
            >
              <MessageCircle size={16} /> Whats
            </button>
          </div>
        ) : (
          <button className={styles.btn} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        )}
      </form>
    </div>
  );
}
