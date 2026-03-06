//app/(public/radio/ouvir/page.tsx

"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { useRouter } from "next/navigation";
import { useRadioPlayer } from "@/components/radio/radioplayer/RadioPlayerProvider";

type Listeners = {
  current: number;
  peak: number;
  max?: number;
  uptime?: number;
  online?: boolean;
};

const STATION_NAME = "Radio Presbiteriana";
const ACCOUNT_NAME = "Á Hora do Milagre";
const BG_IMAGE = "/logo.png";
const COVER_IMAGE = "/pastor.png";

export default function OuvirPage() {
  const router = useRouter();
  const { isLive, isPlaying, playError, togglePlay, title, streamUrl } =
    useRadioPlayer();

  const [listeners, setListeners] = useState<Listeners | null>(null);

  async function loadListeners() {
    try {
      const r = await fetch("/api/radio/listeners", { cache: "no-store" });
      if (!r.ok) return;

      const j = (await r.json()) as Listeners;
      setListeners(j);
    } catch {}
  }

  useEffect(() => {
    loadListeners();
    const t = setInterval(loadListeners, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const hasUrl = !!streamUrl;

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.top}>
          <button
            className={styles.back}
            type="button"
            onClick={() => router.back()}
          >
            ← Voltar
          </button>
        </div>

        <h1 className={styles.pageTitle}>{title ?? "Rádio LHP"}</h1>

        <div className={styles.statusRow}>
          <span
            className={isLive ? styles.statusLiveText : styles.statusOffText}
          >
            {isLive ? "AO VIVO" : "OFFLINE"}
          </span>

          <span className={isLive ? styles.dotLive : styles.dotOff} />
        </div>

        {listeners && (
          <div className={styles.listenersPublic}>
            <div>
              👥 Ouvindo agora: <strong>{listeners.current ?? 0}</strong>
            </div>
            <div>
              📈 Pico: <strong>{listeners.peak ?? 0}</strong>
            </div>
          </div>
        )}

        <section
          className={styles.radioShell}
          style={{ ["--bg" as any]: `url(${BG_IMAGE})` }}
        >
          <div className={styles.bg} aria-hidden="true" />
          <div className={styles.overlay} aria-hidden="true" />

          <div className={styles.inner}>
            <div className={styles.stationRow}>
              <div className={styles.logo} aria-hidden="true" />
              <div className={styles.stationMeta}>
                <div className={styles.accountName}>{ACCOUNT_NAME}</div>

                <div className={styles.badges}>
                  <span className={styles.badgeLive}>
                    <span className={styles.badgeDot} />
                    Live
                  </span>
                  <span className={styles.badgeEvent}>Event</span>
                </div>
              </div>
            </div>

            <div className={styles.nowCard}>
              <div
                className={styles.cover}
                style={{ ["--cover" as any]: `url(${COVER_IMAGE})` }}
                aria-hidden="true"
              />

              <div className={styles.nowMeta}>
                <div className={styles.nowLabel}>
                  {isLive ? "LIVE NOW" : "OFFLINE"}
                </div>
                <div className={styles.nowTitle}>{STATION_NAME}</div>

                <div
                  className={`${styles.wave} ${!isLive ? styles.wavePaused : ""}`}
                  aria-hidden="true"
                >
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                </div>
              </div>

              <button
                type="button"
                className={`${styles.playBtn} ${
                  !isLive || !hasUrl ? styles.playDisabled : ""
                }`}
                onClick={togglePlay}
                disabled={!isLive || !hasUrl}
                aria-label={isPlaying ? "Pausar" : "Ouvir"}
                title={isPlaying ? "Pausar" : "Ouvir"}
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>
            </div>

            {!isLive && (
              <p className={styles.muted}>A transmissão ainda não começou.</p>
            )}

            {isLive && !hasUrl && (
              <p className={styles.muted}>
                Rádio ligada, mas nenhuma URL de áudio foi informada.
              </p>
            )}

            {playError && <p className={styles.error}>{playError}</p>}

            <div className={styles.adBadge}>
              Desenvolvedor: <strong>Rick Pereira</strong> :{" "}
              <a
                className={styles.adLink}
                href="https://wa.me/5512991890682"
                target="_blank"
                rel="noreferrer"
              >
                (12) 99189-0682
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
