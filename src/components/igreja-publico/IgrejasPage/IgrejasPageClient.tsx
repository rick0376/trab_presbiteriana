//src/components/igreja-publico/IgrejasPage/IgrejasPageClient.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import CronogramaSemanal from "@/components/igreja-publico/CronogramaSemanal/CronogramaSemanal";
import EventosPublicos from "@/components/igreja-publico/eventos/EventosPublicos/EventosPublicos";
import CronogramaAnual from "@/components/igreja-publico/CronogramaAnual/CronogramaAnual";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { useRadioPlayer } from "@/components/radio/radioplayer/RadioPlayerProvider";

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
  whatsappUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  horarios: { id: string; texto: string; ordem: number }[];
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

type RadioListeners = {
  current: number;
  peak: number;
  max?: number;
  uptime?: number;
  online?: boolean;
};

type RadioVisualStatus =
  | "AO_VIVO"
  | "OFFLINE"
  | "MANUTENCAO"
  | "AGUARDANDO_PROGRAMACAO";

const FALLBACK_IMG = "/images/igreja-a.png";
const FALLBACK_ENDERECO = "Sem endereço";

export default function IgrejasPageClient({ igrejas, initialPublico }: Props) {
  const router = useRouter();
  const { isLive, isPlaying, togglePlay, radioConfig, canPlay } =
    useRadioPlayer();

  const [radioListeners, setRadioListeners] = useState<RadioListeners | null>(
    null,
  );

  const [imgOk, setImgOk] = useState(true);
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

  async function loadRadioListeners() {
    try {
      const r = await fetch("/api/radio/listeners", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as RadioListeners;
      setRadioListeners(j);
    } catch {}
  }

  useEffect(() => {
    loadPublico(mainSlug);
  }, [mainSlug]);

  function openBuildModal(pageName: string) {
    setBuildPage(pageName);
    setBuildOpen(true);
  }

  useEffect(() => {
    loadRadioListeners();
    const t = setInterval(loadRadioListeners, 10000);
    return () => clearInterval(t);
  }, []);

  const instagramLink =
    (publico?.instagramUrl ?? "").trim() ||
    "https://www.instagram.com/iprmoreiracesar/";

  const facebookLink =
    (publico?.facebookUrl ?? "").trim() ||
    "https://www.facebook.com/profile.php?id=100067254810345";

  const enderecoBanner =
    ((publico as any)?.endereco ?? "").trim() ||
    (igrejas?.[0]?.publico?.endereco ?? "").trim() ||
    FALLBACK_ENDERECO;

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
        ? "Pausar Rádio"
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

  return (
    <div className={styles.home}>
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <div className={styles.bannerLeft}>
            <div className={styles.topActions}>
              <div className={styles.cardRadio}>
                <header className={styles.header}>
                  <h1 className={styles.title}>📻 Rádio Renovada</h1>
                  <span
                    className={
                      visualStatus === "AO_VIVO" ? styles.live : styles.offline
                    }
                  >
                    {statusLabel}
                  </span>
                </header>

                {canPlay ? (
                  <button
                    type="button"
                    className={styles.radioBtn}
                    onClick={togglePlay}
                    disabled={!canPlay}
                  >
                    <span className={styles.radioIcon}>
                      {isPlaying ? "⏸" : "▶"}
                    </span>
                    <span className={styles.radioText}>{mainRadioText}</span>
                    <span className={styles.badge}>
                      {isPlaying ? "Tocando" : badgeText}
                    </span>
                  </button>
                ) : (
                  <div className={styles.radioNotice}>
                    <div className={styles.radioNoticeTop}>
                      <span className={styles.radioIcon}>📻</span>
                      <span className={styles.radioText}>{mainRadioText}</span>
                      <span className={styles.badge}>{badgeText}</span>
                    </div>

                    {radioSubText ? (
                      <p className={styles.radioSubText}>{radioSubText}</p>
                    ) : null}
                  </div>
                )}

                <footer className={styles.footer}>
                  {/*}
                  {radioListeners && (
                    <div className={styles.radioStats}>
                      <span>
                        <span className={styles.statsEmoji}>👥</span> Online:{" "}
                        <strong>{radioListeners.current ?? 0}</strong>
                      </span>
                      <span>
                        <span className={styles.statsEmoji}>📈</span> Pico:{" "}
                        <strong>{radioListeners.peak ?? 0}</strong>
                      </span>
                    </div>
                  )}
                   */}

                  <div className={styles.radioLinks}>
                    <Link href="" className={styles.adminLink}>
                      <span className={styles.radioEmoji}>📻</span>
                      <span>Rádio Presbiteriana</span>
                    </Link>
                  </div>
                </footer>
              </div>
            </div>

            <div className={styles.bannerTitle}>
              <img
                src="/images/logo_transparente.png"
                alt="Logo Igreja Matriz"
                className={styles.bannerLogo}
              />
              <h1>Igreja Presbiteriana Renovada</h1>
            </div>

            <p className={styles.bannerSubtitle}>
              {publico?.bannerSubtitle ?? "Cultos as Quartas, Sexta e Domingos"}
            </p>

            <div className={styles.bannerInfos}>
              {publico?.horarios?.length ? (
                publico.horarios.map((h) => (
                  <div key={h.id} className={styles.infoItem}>
                    <span className={styles.dot}></span>
                    <p>{h.texto}</p>
                  </div>
                ))
              ) : (
                <div className={styles.infoItem}>
                  <span className={styles.dot}></span>
                  <p>Aguardando Informações</p>
                </div>
              )}
            </div>

            <div className={styles.bannerButtons}>
              <button
                type="button"
                className={styles.btnGreen}
                onClick={() => {
                  const el = document.getElementById("eventos");
                  if (!el) return;
                  const y =
                    el.getBoundingClientRect().top + window.scrollY - 110;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }}
              >
                Eventos
              </button>

              <button
                type="button"
                className={styles.btnRed}
                onClick={() => {
                  const el = document.getElementById("cronograma");
                  if (!el) return;
                  const y =
                    el.getBoundingClientRect().top + window.scrollY - 110;
                  window.scrollTo({ top: y, behavior: "smooth" });
                }}
              >
                Cronograma
              </button>

              <Link href="/login" className={styles.btnBlue}>
                Acesso
              </Link>
            </div>
          </div>

          <div className={styles.bannerGlobal}>
            <div className={styles.bannerRight}>
              {imgOk ? (
                <img
                  src="/images/pastor.png"
                  alt="Pastor Presidente"
                  onError={() => setImgOk(false)}
                />
              ) : (
                <div className={styles.imgFallback}>Sem imagem</div>
              )}
            </div>

            <div className={styles.bannerEndereco}>{enderecoBanner}</div>

            <div className={styles.socialRow}>
              <a
                href={instagramLink}
                target="_blank"
                rel="noreferrer"
                className={styles.socialInstagram}
                aria-label="Instagram"
                title="Instagram Igreja Presbiteriana - MC"
              >
                <FaInstagram className={styles.socialIcon} />
                <span className={styles.socialName}>Instagram</span>
              </a>

              <a
                href={facebookLink}
                target="_blank"
                rel="noreferrer"
                className={styles.socialFacebook}
                aria-label="Facebook"
                title="Facebook Igreja Presbiteriana - MC"
              >
                <FaFacebookF className={styles.socialIcon} />
                <span className={styles.socialName}>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cards}>
        {igrejas.map((item) => {
          return (
            <div key={item.id} className={styles.card}>
              <button
                type="button"
                className={styles.btnVisit}
                onClick={() => openBuildModal(`Site da igreja: ${item.nome}`)}
              >
                Visitar Site
              </button>
            </div>
          );
        })}
      </section>

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
              <span className={styles.cronogramaIcon}>📅</span>
              <span className={styles.cronogramaTitle}>Cronograma Semanal</span>
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
              <span className={styles.cronogramaIcon}>🗓</span>
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
              A área de <strong>{buildPage}</strong> ainda está sendo
              desenvolvida.
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
