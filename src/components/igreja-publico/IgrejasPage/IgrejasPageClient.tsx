//src/components/igreja-publico/IgrejasPage/IgrejasPageClient.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";
import CronogramaSemanal from "@/components/igreja-publico/CronogramaSemanal/CronogramaSemanal";
import EventosPublicos from "@/components/igreja-publico/eventos/EventosPublicos/EventosPublicos";
import CronogramaAnual from "@/components/igreja-publico/CronogramaAnual/CronogramaAnual";
import { FaWhatsapp } from "react-icons/fa";
import { useRadioPlayer } from "@/components/radio/radioplayer/RadioPlayerProvider";
import HeroPublico from "@/components/igreja-publico/HeroPublico/HeroPublico";
import BoasVindasPublica from "@/components/igreja-publico/BoasVindasPublica/BoasVindasPublica";
import CultosSemana from "@/components/igreja-publico/CultosSemana/CultosSemana";
import PastorDestaque from "@/components/igreja-publico/PastorDestaque/PastorDestaque";
import DepartamentosDestaque from "@/components/igreja-publico/DepartamentosDestaque/DepartamentosDestaque";

type IgrejaDB = {
  id: string;
  nome: string;
  slug: string;
  publico?: {
    endereco: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
  } | null;
};

type IgrejaPublicoData = {
  bannerSubtitle: string | null;
  heroSlogan?: string | null;
  boasVindasTexto?: string | null;
  pastorNome?: string | null;
  pastorCargo?: string | null;
  pastorSubtitle?: string | null;
  pastorMensagem?: string | null;
  pastorImageUrl?: string | null;
  heroBackgroundImageUrl?: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  endereco?: string | null;
  horarios: {
    id: string;
    texto: string;
    diaLabel?: string | null;
    hora?: string | null;
    tituloCard?: string | null;
    descricaoCard?: string | null;
    ordem: number;
  }[];
  cronograma: {
    id: string;
    dia:
      | "SEGUNDA"
      | "TERCA"
      | "QUARTA"
      | "QUINTA"
      | "SEXTA"
      | "SABADO"
      | "DOMINGO";
    hora: string;
    titulo: string;
    ordem: number;
  }[];
};

type Props = {
  igrejas: IgrejaDB[];
  initialPublico: IgrejaPublicoData | null;
};

type RadioVisualStatus =
  | "AO_VIVO"
  | "OFFLINE"
  | "MANUTENCAO"
  | "AGUARDANDO_PROGRAMACAO";

export default function IgrejasPageClient({ igrejas, initialPublico }: Props) {
  const router = useRouter();

  const { isLive, isPlaying, togglePlay, radioConfig, canPlay, playError } =
    useRadioPlayer();

  const [buildOpen, setBuildOpen] = useState(false);
  const [buildPage, setBuildPage] = useState("");
  const [openSemanal, setOpenSemanal] = useState(false);
  const [openAnual, setOpenAnual] = useState(false);
  const [publico, setPublico] = useState<IgrejaPublicoData | null>(
    initialPublico,
  );

  const mainSlug = igrejas.length === 1 ? igrejas[0].slug : "";

  async function loadPublico(slug: string) {
    if (!slug) return;

    try {
      const r = await fetch(`/api/igreja-publico/${slug}`, {
        cache: "no-store",
      });

      if (!r.ok) return;

      const j = (await r.json()) as IgrejaPublicoData;
      setPublico(j);
    } catch {}
  }

  useEffect(() => {
    loadPublico(mainSlug);
  }, [mainSlug]);

  function openBuildModal(pageName: string) {
    setBuildPage(pageName);
    setBuildOpen(true);
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  const visualStatus = (radioConfig?.status ?? "OFFLINE") as RadioVisualStatus;

  const statusLabel =
    visualStatus === "AO_VIVO"
      ? "AO VIVO"
      : visualStatus === "MANUTENCAO"
        ? "MANUTENÇÃO"
        : visualStatus === "AGUARDANDO_PROGRAMACAO"
          ? "AGUARDANDO"
          : "OFFLINE";

  const mainRadioText =
    visualStatus === "AO_VIVO"
      ? isPlaying
        ? "Tocando agora"
        : radioConfig?.title || "Ouvir Rádio"
      : radioConfig?.title || "Rádio Offline";

  const radioSubText =
    visualStatus === "AGUARDANDO_PROGRAMACAO" && radioConfig?.nextProgramAt
      ? `Ao ar a partir de ${radioConfig.nextProgramAt}`
      : (radioConfig?.subtitle ?? "").trim();

  const badgeText =
    radioConfig?.badgeLabel?.trim() ||
    (visualStatus === "AO_VIVO"
      ? isPlaying
        ? "Tocando"
        : "Ao vivo"
      : visualStatus === "MANUTENCAO"
        ? "Manutenção"
        : visualStatus === "AGUARDANDO_PROGRAMACAO"
          ? "Programação"
          : "Offline");

  const heroSlogan =
    (publico?.heroSlogan ?? "").trim() ||
    "Transformando Vidas pelo Amor de Cristo";

  const pastorPrincipal = {
    nome: (publico?.pastorNome ?? "").trim() || "Pr. Rodolfo Camargo",
    cargo: (publico?.pastorCargo ?? "").trim() || "Pastor",
    subtitulo:
      (publico?.pastorSubtitle ?? "").trim() ||
      "Servindo com amor, cuidado pastoral e compromisso com a Palavra.",
    mensagem:
      (publico?.pastorMensagem ?? "").trim() ||
      "Seja bem-vindo à nossa igreja. É uma alegria ter você conosco. Que você se sinta acolhido e encontre a graça e o amor de Cristo em sua vida e família.",
    imagem: (publico?.pastorImageUrl ?? "").trim() || "/images/pastor.png",
  };
  const churchName = igrejas?.[0]?.nome || "Igreja Presbiteriana Renovada";

  const heroBackgroundImageUrl =
    (publico?.heroBackgroundImageUrl ?? "").trim() ||
    "/images/bg-hero-igreja.jpg";

  const boasVindasTexto =
    (publico?.boasVindasTexto ?? "").trim() ||
    `Somos a ${churchName}, uma comunidade de fé comprometida em compartilhar o evangelho de Jesus Cristo e transformar vidas para a glória de Deus.`;

  const instagramLink =
    (publico?.instagramUrl ?? "").trim() ||
    "https://www.instagram.com/iprmoreiracesar/";

  const facebookLink =
    (publico?.facebookUrl ?? "").trim() ||
    "https://www.facebook.com/profile.php?id=100067254810345";

  const enderecoIgreja =
    (publico?.endereco ?? "").trim() ||
    (igrejas?.[0]?.publico?.endereco ?? "").trim() ||
    "Endereço não informado";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <HeroPublico
          churchName={churchName}
          slogan={heroSlogan}
          subtitle={
            publico?.bannerSubtitle ?? "Cultos às quartas, sextas e domingos"
          }
          logoUrl="/images/logo_transparente.png"
          heroImageUrl={pastorPrincipal.imagem}
          backgroundImageUrl={heroBackgroundImageUrl}
          radioStatusLabel={statusLabel}
          radioMainText={mainRadioText}
          radioBadgeText={badgeText}
          radioSubText={radioSubText}
          radioCanPlay={canPlay}
          radioIsPlaying={isPlaying}
          radioPlayError={playError}
          address={enderecoIgreja}
          instagramLink={instagramLink}
          facebookLink={facebookLink}
          loginHref="/login"
          onPlayRadio={togglePlay}
          onHistoria={() => router.push("/historia")}
          onDepartamentos={() => scrollToSection("departamentos")}
          onEventos={() => scrollToSection("eventos")}
        />

        <BoasVindasPublica
          churchName={churchName}
          texto={boasVindasTexto}
          tags={["Amor em Cristo", "Comunhão", "Crescimento Espiritual"]}
          pastorName={pastorPrincipal.nome}
          pastorTitle={pastorPrincipal.cargo}
          pastorSubtitle={pastorPrincipal.subtitulo}
          imageUrl={pastorPrincipal.imagem}
          onHistoria={() => router.push("/historia")}
        />

        <CultosSemana horarios={publico?.horarios ?? []} />

        <PastorDestaque
          pastorName={pastorPrincipal.nome}
          pastorTitle={pastorPrincipal.cargo}
          mensagem={pastorPrincipal.mensagem}
          imageUrl={pastorPrincipal.imagem}
          onLideranca={() => router.push("/lideranca")}
        />

        <DepartamentosDestaque igrejaSlug={mainSlug} />

        <EventosPublicos slug={mainSlug} />

        <section id="cronograma" className={styles.cronogramaSection}>
          <div className={styles.cronogramaCard}>
            <button
              type="button"
              className={styles.cronogramaToggle}
              onClick={() => setOpenSemanal((v) => !v)}
              aria-expanded={openSemanal}
            >
              <div className={styles.cronogramaHeader}>
                <span className={styles.cronogramaIcon}>🗂️</span>
                <span className={styles.cronogramaTitle}>
                  Cronograma Semanal
                </span>
              </div>

              <span className={styles.cronogramaArrow}>
                {openSemanal ? "▲" : "▼"}
              </span>
            </button>

            {openSemanal && (
              <div className={styles.cronogramaContent}>
                <CronogramaSemanal items={publico?.cronograma ?? []} />
              </div>
            )}
          </div>

          <div className={styles.cronogramaCard}>
            <button
              type="button"
              className={styles.cronogramaToggle}
              onClick={() => setOpenAnual((v) => !v)}
              aria-expanded={openAnual}
            >
              <div className={styles.cronogramaHeader}>
                <span className={styles.cronogramaIcon}>📆</span>
                <span className={styles.cronogramaTitle}>Cronograma Anual</span>
              </div>

              <span className={styles.cronogramaArrow}>
                {openAnual ? "▲" : "▼"}
              </span>
            </button>

            {openAnual && (
              <div className={styles.cronogramaContent}>
                <CronogramaAnual slug={mainSlug} />
              </div>
            )}
          </div>
        </section>
      </div>

      {publico?.whatsappUrl ? (
        <a
          href={publico.whatsappUrl}
          target="_blank"
          className={styles.whatsappFloat}
          title="WhatsApp"
          rel="noreferrer"
        >
          <span className={styles.whatsIcon}>
            <FaWhatsapp />
          </span>
        </a>
      ) : null}

      {buildOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setBuildOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🚧</div>
            <h3 className={styles.modalTitle}>Página em construção</h3>
            <p className={styles.modalText}>
              A área de <strong>{buildPage}</strong> ainda será conectada na
              próxima etapa.
            </p>
            <button
              type="button"
              className={styles.modalBtn}
              onClick={() => setBuildOpen(false)}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
