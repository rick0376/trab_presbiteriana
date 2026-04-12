//components/igreja-publico/EditorPublico/EditorPublico.tsx

"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { useToast } from "@/components/ui/Toast/useToast";
import { ImagePlus, Trash2, X } from "lucide-react";

type Props = {
  initialData: any;
  canEdit: boolean;
};

type HorarioItem = {
  texto: string;
  diaLabel: string;
  hora: string;
  tituloCard: string;
  descricaoCard: string;
};

type ConfirmState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
      onConfirm: () => void;
    };

function revokeIfBlob(url?: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export default function EditorPublico({ initialData, canEdit }: Props) {
  const toast = useToast();

  const [igrejaNome, setIgrejaNome] = useState(initialData?.igreja?.nome ?? "");
  const [bannerSubtitle, setBannerSubtitle] = useState(
    initialData?.bannerSubtitle ?? "",
  );
  const [heroSlogan, setHeroSlogan] = useState(initialData?.heroSlogan ?? "");
  const [boasVindasTexto, setBoasVindasTexto] = useState(
    initialData?.boasVindasTexto ?? "",
  );
  const [pastorNome, setPastorNome] = useState(initialData?.pastorNome ?? "");
  const [pastorCargo, setPastorCargo] = useState(
    initialData?.pastorCargo ?? "",
  );
  const [pastorSubtitle, setPastorSubtitle] = useState(
    initialData?.pastorSubtitle ?? "",
  );
  const [pastorMensagem, setPastorMensagem] = useState(
    initialData?.pastorMensagem ?? "",
  );
  const [endereco, setEndereco] = useState(initialData?.endereco ?? "");
  const [instagramUrl, setInstagramUrl] = useState(
    initialData?.instagramUrl ?? "",
  );
  const [facebookUrl, setFacebookUrl] = useState(
    initialData?.facebookUrl ?? "",
  );
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [pastorImageFile, setPastorImageFile] = useState<File | null>(null);
  const [pastorPreview, setPastorPreview] = useState<string | null>(
    initialData?.pastorImageUrl ?? null,
  );
  const [removePastorImage, setRemovePastorImage] = useState(false);

  const [heroBackgroundImageFile, setHeroBackgroundImageFile] =
    useState<File | null>(null);
  const [heroBackgroundPreview, setHeroBackgroundPreview] = useState<
    string | null
  >(initialData?.heroBackgroundImageUrl ?? null);
  const [removeHeroBackgroundImage, setRemoveHeroBackgroundImage] =
    useState(false);

  const [horarios, setHorarios] = useState<HorarioItem[]>(
    initialData?.horarios?.map((h: any) => ({
      texto: h.texto ?? "",
      diaLabel: h.diaLabel ?? "",
      hora: h.hora ?? "",
      tituloCard: h.tituloCard ?? "",
      descricaoCard: h.descricaoCard ?? "",
    })) ?? [],
  );

  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });

  const [telefonePublico, setTelefonePublico] = useState(
    initialData?.telefonePublico ?? "",
  );
  const [emailPublico, setEmailPublico] = useState(
    initialData?.emailPublico ?? "",
  );
  const [footerDescricao, setFooterDescricao] = useState(
    initialData?.footerDescricao ?? "",
  );

  useEffect(() => {
    if (initialData?.whatsappUrl) {
      const onlyNumbers = initialData.whatsappUrl.replace(/\D/g, "");
      const withoutCountry = onlyNumbers.startsWith("55")
        ? onlyNumbers.slice(2)
        : onlyNumbers;

      setWhatsappNumber(withoutCountry);
    }
  }, [initialData]);

  useEffect(() => {
    return () => {
      revokeIfBlob(pastorPreview);
      revokeIfBlob(heroBackgroundPreview);
    };
  }, [pastorPreview, heroBackgroundPreview]);

  function askConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirm({ open: true, title, message, onConfirm });
  }

  function addHorario() {
    if (!canEdit) return;

    setHorarios((prev) => [
      ...prev,
      {
        texto: "",
        diaLabel: "",
        hora: "",
        tituloCard: "",
        descricaoCard: "",
      },
    ]);

    toast.success("Culto adicionado ✅");
  }

  function removeHorario(idx: number) {
    if (!canEdit) return;

    askConfirm(
      "Excluir culto?",
      "Isso remove o item da lista. Só vai para o banco quando você clicar em Salvar.",
      () => {
        setHorarios((prev) => prev.filter((_, i) => i !== idx));
        setConfirm({ open: false });
        toast.success("Culto removido ✅");
      },
    );
  }

  function updateHorario(idx: number, field: keyof HorarioItem, value: string) {
    setHorarios((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  }

  function onSelectPastorImage(file: File | null) {
    if (!file) return;

    revokeIfBlob(pastorPreview);

    const preview = URL.createObjectURL(file);
    setPastorImageFile(file);
    setPastorPreview(preview);
    setRemovePastorImage(false);
  }

  function onRemovePastorImage() {
    revokeIfBlob(pastorPreview);
    setPastorImageFile(null);
    setPastorPreview(null);
    setRemovePastorImage(true);
  }

  function onSelectHeroBackground(file: File | null) {
    if (!file) return;

    revokeIfBlob(heroBackgroundPreview);

    const preview = URL.createObjectURL(file);
    setHeroBackgroundImageFile(file);
    setHeroBackgroundPreview(preview);
    setRemoveHeroBackgroundImage(false);
  }

  function onRemoveHeroBackground() {
    revokeIfBlob(heroBackgroundPreview);
    setHeroBackgroundImageFile(null);
    setHeroBackgroundPreview(null);
    setRemoveHeroBackgroundImage(true);
  }

  async function salvar() {
    if (!canEdit || saving) return;

    if (!igrejaNome.trim()) {
      toast.error("Informe o nome da igreja.");
      return;
    }

    if (whatsappNumber && whatsappNumber.length < 10) {
      toast.error("Digite um número válido com DDD.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("igrejaNome", igrejaNome.trim());
      fd.append("bannerSubtitle", bannerSubtitle.trim());
      fd.append("heroSlogan", heroSlogan.trim());
      fd.append("boasVindasTexto", boasVindasTexto.trim());
      fd.append("pastorNome", pastorNome.trim());
      fd.append("pastorCargo", pastorCargo.trim());
      fd.append("pastorSubtitle", pastorSubtitle.trim());
      fd.append("pastorMensagem", pastorMensagem.trim());
      fd.append("endereco", endereco.trim());
      fd.append("instagramUrl", instagramUrl.trim());
      fd.append("facebookUrl", facebookUrl.trim());
      fd.append("telefonePublico", telefonePublico.trim());
      fd.append("emailPublico", emailPublico.trim());
      fd.append("footerDescricao", footerDescricao.trim());
      fd.append(
        "whatsappUrl",
        whatsappNumber ? `https://wa.me/55${whatsappNumber}` : "",
      );

      fd.append("removePastorImage", removePastorImage ? "true" : "false");
      fd.append(
        "removeHeroBackgroundImage",
        removeHeroBackgroundImage ? "true" : "false",
      );

      if (pastorImageFile) {
        fd.append("pastorImage", pastorImageFile);
      }

      if (heroBackgroundImageFile) {
        fd.append("heroBackgroundImage", heroBackgroundImageFile);
      }

      fd.append(
        "horarios",
        JSON.stringify(
          horarios.map((h, i) => ({
            texto:
              h.texto.trim() || `${h.diaLabel.trim()}: ${h.hora.trim()}`.trim(),
            diaLabel: h.diaLabel.trim(),
            hora: h.hora.trim(),
            tituloCard: h.tituloCard.trim(),
            descricaoCard: h.descricaoCard.trim(),
            ordem: i + 1,
          })),
        ),
      );

      const r = await fetch(
        `/api/admin/publico?igrejaId=${initialData.igrejaId}`,
        {
          method: "PUT",
          body: fd,
        },
      );

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        toast.error(j?.error || "Erro ao salvar");
        return;
      }

      if (j?.pastorImageUrl) {
        setPastorPreview(j.pastorImageUrl);
        setRemovePastorImage(false);
        setPastorImageFile(null);
      }

      if (j?.heroBackgroundImageUrl) {
        setHeroBackgroundPreview(j.heroBackgroundImageUrl);
        setRemoveHeroBackgroundImage(false);
        setHeroBackgroundImageFile(null);
      }

      toast.success("Salvo com sucesso ✅");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  function formatPhone(value: string) {
    const v = value.replace(/\D/g, "");

    if (v.length <= 2) return `(${v}`;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 11)
      return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;

    return v;
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Conteúdo público</h1>

        {!canEdit && (
          <div className={styles.msg}>
            🔒 Você está em modo visualização (sem permissão de editar).
          </div>
        )}

        <div className={styles.block}>
          <div className={styles.blockTitle}>Informações institucionais</div>

          <label className={styles.label}>Nome da igreja</label>
          <input
            className={styles.input}
            value={igrejaNome}
            onChange={(e) => setIgrejaNome(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Igreja Presbiteriana Renovada - MC"
          />

          <label className={styles.label}>Slogan principal do hero</label>
          <input
            className={styles.input}
            value={heroSlogan}
            onChange={(e) => setHeroSlogan(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Transformando vidas pelo amor de Cristo"
          />

          <label className={styles.label}>Texto abaixo do título</label>
          <input
            className={styles.input}
            value={bannerSubtitle}
            onChange={(e) => setBannerSubtitle(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Cultos às quartas, sextas e domingos"
          />

          <div className={styles.uploadGrid}>
            <div className={styles.uploadCard}>
              <label className={styles.label}>Imagem de fundo do hero</label>

              {heroBackgroundPreview ? (
                <div className={styles.previewHeroBox}>
                  <img
                    src={heroBackgroundPreview}
                    alt="Preview fundo hero"
                    className={styles.previewHeroImage}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.removePreviewBtn}
                      onClick={onRemoveHeroBackground}
                      title="Remover imagem"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.emptyPreview}>Sem imagem</div>
              )}

              <div className={styles.fileRow}>
                <input
                  id="heroBackgroundImage"
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || saving}
                  onChange={(e) =>
                    onSelectHeroBackground(e.target.files?.[0] ?? null)
                  }
                />

                <label
                  htmlFor="heroBackgroundImage"
                  className={`${styles.fileBtn} ${
                    heroBackgroundImageFile ? styles.fileBtnSelected : ""
                  }`}
                >
                  <ImagePlus size={16} />
                  <span>
                    {heroBackgroundImageFile
                      ? "Novo arquivo selecionado"
                      : "Escolher arquivo"}
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.uploadCard}>
              <label className={styles.label}>Foto do pastor principal</label>

              {pastorPreview ? (
                <div className={styles.previewBox}>
                  <img
                    src={pastorPreview}
                    alt="Preview pastor"
                    className={styles.previewImage}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      className={styles.removePreviewBtn}
                      onClick={onRemovePastorImage}
                      title="Remover imagem"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.emptyPreview}>Sem imagem</div>
              )}

              <div className={styles.fileRow}>
                <input
                  id="pastorImage"
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || saving}
                  onChange={(e) =>
                    onSelectPastorImage(e.target.files?.[0] ?? null)
                  }
                />

                <label
                  htmlFor="pastorImage"
                  className={`${styles.fileBtn} ${
                    pastorImageFile ? styles.fileBtnSelected : ""
                  }`}
                >
                  <ImagePlus size={16} />
                  <span>
                    {pastorImageFile
                      ? "Novo arquivo selecionado"
                      : "Escolher arquivo"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <label className={styles.label}>Texto de boas-vindas</label>
          <textarea
            className={styles.textarea}
            value={boasVindasTexto}
            onChange={(e) => setBoasVindasTexto(e.target.value)}
            disabled={!canEdit}
            placeholder="Texto institucional da seção de boas-vindas"
          />

          <label className={styles.label}>Nome do pastor principal</label>
          <input
            className={styles.input}
            value={pastorNome}
            onChange={(e) => setPastorNome(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Pr. Rafael Popovski"
          />

          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Cargo do pastor</label>
              <input
                className={styles.input}
                value={pastorCargo}
                onChange={(e) => setPastorCargo(e.target.value)}
                disabled={!canEdit}
                placeholder="Ex: Pastor Presidente"
              />
            </div>

            <div>
              <label className={styles.label}>Subtítulo do pastor</label>
              <input
                className={styles.input}
                value={pastorSubtitle}
                onChange={(e) => setPastorSubtitle(e.target.value)}
                disabled={!canEdit}
                placeholder="Ex: Servindo com amor e compromisso com a Palavra"
              />
            </div>
          </div>

          <label className={styles.label}>Mensagem do pastor</label>
          <textarea
            className={styles.textarea}
            value={pastorMensagem}
            onChange={(e) => setPastorMensagem(e.target.value)}
            disabled={!canEdit}
            placeholder="Mensagem principal da seção do pastor"
          />

          <label className={styles.label}>Endereço</label>
          <input
            className={styles.input}
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Rua Rafael Popoaski, 130 - Ipê I"
          />

          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>WhatsApp</label>
              <input
                className={styles.input}
                placeholder="(11) 99999-9999"
                value={formatPhone(whatsappNumber)}
                disabled={!canEdit}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setWhatsappNumber(digits);
                }}
              />
            </div>

            <div>
              <label className={styles.label}>Instagram</label>
              <input
                className={styles.input}
                placeholder="https://instagram.com/..."
                value={instagramUrl}
                disabled={!canEdit}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>
          </div>

          <label className={styles.label}>Facebook</label>
          <input
            className={styles.input}
            placeholder="https://facebook.com/..."
            value={facebookUrl}
            disabled={!canEdit}
            onChange={(e) => setFacebookUrl(e.target.value)}
          />

          <label className={styles.label}>Telefone público</label>
          <input
            className={styles.input}
            value={telefonePublico}
            onChange={(e) => setTelefonePublico(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: (12) 99189-0682"
          />

          <label className={styles.label}>E-mail institucional</label>
          <input
            className={styles.input}
            value={emailPublico}
            onChange={(e) => setEmailPublico(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: contato@suaigreja.com.br"
          />

          <label className={styles.label}>Texto institucional do rodapé</label>
          <textarea
            className={styles.textarea}
            value={footerDescricao}
            onChange={(e) => setFooterDescricao(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo."
          />
        </div>

        <div className={styles.block}>
          <div className={styles.blockTitle}>Cultos / Cards da home</div>

          {horarios.map((item, i) => (
            <div key={i} className={styles.cultoCard}>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  placeholder="Dia (ex: Quarta)"
                  value={item.diaLabel}
                  disabled={!canEdit}
                  onChange={(e) => updateHorario(i, "diaLabel", e.target.value)}
                />

                <input
                  className={styles.input}
                  placeholder="Hora (ex: 19:30)"
                  value={item.hora}
                  disabled={!canEdit}
                  onChange={(e) => updateHorario(i, "hora", e.target.value)}
                />

                {canEdit && (
                  <button
                    className={styles.deleteButton}
                    type="button"
                    title="Excluir"
                    onClick={() => removeHorario(i)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <input
                className={styles.input}
                placeholder="Título do card (ex: Culto de Ensino)"
                value={item.tituloCard}
                disabled={!canEdit}
                onChange={(e) => updateHorario(i, "tituloCard", e.target.value)}
              />

              <input
                className={styles.input}
                placeholder="Descrição do card (ex: Palavra, comunhão e edificação)"
                value={item.descricaoCard}
                disabled={!canEdit}
                onChange={(e) =>
                  updateHorario(i, "descricaoCard", e.target.value)
                }
              />

              <input
                className={styles.input}
                placeholder="Texto legado / apoio (ex: Quartas: 19:30)"
                value={item.texto}
                disabled={!canEdit}
                onChange={(e) => updateHorario(i, "texto", e.target.value)}
              />
            </div>
          ))}

          {canEdit && (
            <button className={styles.btn} type="button" onClick={addHorario}>
              + Adicionar culto
            </button>
          )}

          {canEdit && (
            <button
              className={styles.btnGreen}
              type="button"
              onClick={salvar}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.open ? confirm.title : ""}
        message={confirm.open ? confirm.message : ""}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (!confirm.open) return;
          confirm.onConfirm();
        }}
      />
    </main>
  );
}
