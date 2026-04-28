//src/components/igreja-publico/HeroPublico/HeroPublico.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, MapPin, Users } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import ProgramacaoRadioModal from "@/components/radio/programacao/ProgramacaoRadioModal/ProgramacaoRadioModal";
import styles from "./styles.module.scss";

type Props = {
  churchName: string;
  slogan: string;
  subtitle?: string;
  logoUrl: string;
  heroImageUrl: string;
  backgroundImageUrl?: string;

  radioStatusLabel: string;
  radioMainText: string;
  radioBadgeText: string;
  radioSubText?: string;
  radioCanPlay: boolean;
  radioIsPlaying: boolean;
  radioPlayError?: string;

  address?: string;
  instagramLink: string;
  facebookLink: string;
  loginHref?: string;

  onPlayRadio: () => void | Promise<void>;
  onHistoria: () => void;
  onDepartamentos: () => void;
  onEventos: () => void;
};

export default function HeroPublico({
  churchName,
  slogan,
  subtitle,
  logoUrl,
  heroImageUrl,
  backgroundImageUrl = "/images/bg-hero-igreja.jpg",
  radioStatusLabel,
  radioMainText,
  radioBadgeText,
  radioSubText,
  radioCanPlay,
  radioIsPlaying,
  radioPlayError,
  address,
  instagramLink,
  facebookLink,
  loginHref = "/login",
  onPlayRadio,
  onHistoria,
  onDepartamentos,
  onEventos,
}: Props) {
  const [openProgramacao, setOpenProgramacao] = useState(false);

  return (
    <>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7,20,38,.92) 0%, rgba(11,34,61,.78) 38%, rgba(11,34,61,.35) 100%), url("${backgroundImageUrl}")`,
        }}
      >
        <div className={styles.content}>
          <div className={styles.copy}>
            <div className={styles.radioCard}>
              <div className={styles.radioTopRow}>
                <div className={styles.radioTopLeft}>
                  <div className={styles.radioMiniLogo}>📻</div>

                  <div className={styles.radioTopMeta}>
                    <h3 className={styles.radioTitle}>Rádio Renovada</h3>
                    <div className={styles.radioStationName}>
                      Presbiteriana Renovada - MC
                    </div>
                  </div>
                </div>

                <div className={styles.radioTopBadges}>
                  <span
                    className={
                      radioStatusLabel === "AO VIVO"
                        ? styles.radioLiveBadge
                        : styles.radioOfflineBadge
                    }
                  >
                    {radioStatusLabel}
                  </span>
                </div>
              </div>

              {radioCanPlay ? (
                <div className={styles.radioNowCard}>
                  <div className={styles.radioCover} aria-hidden="true">
                    🎵
                  </div>

                  <div className={styles.radioNowMeta}>
                    <div className={styles.radioNowLabel}>
                      {radioStatusLabel === "AO VIVO"
                        ? "TOCANDO AGORA"
                        : "RÁDIO"}
                    </div>

                    <div className={styles.radioNowTitle}>{radioMainText}</div>

                    <div
                      className={`${styles.radioWave} ${
                        !radioCanPlay || !radioIsPlaying
                          ? styles.radioWavePaused
                          : ""
                      }`}
                      aria-hidden="true"
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    {radioSubText ? (
                      <p className={styles.radioSubText}>{radioSubText}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={styles.radioPlayBtn}
                    onClick={onPlayRadio}
                    aria-label={radioIsPlaying ? "Pausar rádio" : "Ouvir rádio"}
                    title={radioIsPlaying ? "Pausar rádio" : "Ouvir rádio"}
                  >
                    {radioIsPlaying ? "❚❚" : "▶"}
                  </button>
                </div>
              ) : (
                <div className={styles.radioNowCardDisabled}>
                  <div className={styles.radioCover} aria-hidden="true">
                    📻
                  </div>

                  <div className={styles.radioNowMeta}>
                    <div className={styles.radioNowLabel}>RÁDIO</div>
                    <div className={styles.radioNowTitle}>{radioMainText}</div>

                    {radioSubText ? (
                      <p className={styles.radioSubText}>{radioSubText}</p>
                    ) : null}
                  </div>
                </div>
              )}

              {radioPlayError ? (
                <p className={styles.radioError}>{radioPlayError}</p>
              ) : null}

              <div className={styles.radioActions}>
                <Link href="/radio/ouvir" className={styles.radioPrimaryBtn}>
                  Rádio completa
                </Link>

                <button
                  type="button"
                  className={styles.radioSecondaryBtn}
                  onClick={() => setOpenProgramacao(true)}
                >
                  Ver programação
                </button>
              </div>
            </div>

            <div className={styles.brand}>
              <img
                src={logoUrl}
                alt={`Logo ${churchName}`}
                className={styles.logo}
              />
              <span>{churchName}</span>
            </div>

            <h1 className={styles.title}>{churchName}</h1>
            <p className={styles.slogan}>{slogan}</p>

            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.lightButton}
                onClick={onHistoria}
              >
                <BookOpen size={18} />
                <span>Ver história</span>
              </button>

              <button
                type="button"
                className={styles.darkButton}
                onClick={onDepartamentos}
              >
                <Users size={18} />
                <span>Conhecer departamentos</span>
              </button>

              <button
                type="button"
                className={styles.darkButton}
                onClick={onEventos}
              >
                <CalendarDays size={18} />
                <span>Ver eventos</span>
              </button>

              <Link href={loginHref} className={styles.accessButton}>
                Acesso
              </Link>
            </div>

            {address ? (
              <div className={styles.addressBar}>
                <MapPin size={18} />
                <span>{address}</span>
              </div>
            ) : null}
          </div>

          <div className={styles.media}>
            <img
              src={heroImageUrl}
              alt="Pastor e liderança"
              className={styles.heroImage}
            />

            <div className={styles.socialRow}>
              <a
                href={instagramLink}
                target="_blank"
                rel="noreferrer"
                className={styles.socialInstagram}
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram className={styles.socialIcon} />
                <span>Instagram</span>
              </a>

              <a
                href={facebookLink}
                target="_blank"
                rel="noreferrer"
                className={styles.socialFacebook}
                aria-label="Facebook"
                title="Facebook"
              >
                <FaFacebookF className={styles.socialIcon} />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <ProgramacaoRadioModal
        open={openProgramacao}
        onClose={() => setOpenProgramacao(false)}
      />
    </>
  );
}
