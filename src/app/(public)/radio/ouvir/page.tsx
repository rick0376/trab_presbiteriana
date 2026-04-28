//app/(public/radio/ouvir/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
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

type NowPlaying = {
  title: string;
  art: string;
  djusername: string;
  history: string[];
};

type Banner = {
  id: string;
  titulo: string;
  posicao: "TOPO" | "LATERAL" | "INFERIOR" | string;
  imageUrl: string;
  linkUrl?: string | null;
  ativo: boolean;
  ordem: number;
};

const ACCOUNT_NAME = "Rádio Renovada - MC";
const BG_IMAGE = "/logo.png";
const FALLBACK_COVER = "/pastor.png";

function cleanHistoryItem(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "")
    .replace(/^\d+\.\)\s*/g, "")
    .trim();
}

function BannerBox({
  banner,
  variant,
}: {
  banner?: Banner;
  variant: "top" | "side" | "bottom";
}) {
  if (!banner) {
    return (
      <div className={`${styles.adBox} ${styles[`adBox_${variant}`]}`}>
        <div className={styles.adPlaceholder}>
          <span>📣</span>
          <strong>Seu anúncio aqui</strong>
          <small>
            {variant === "top"
              ? "Banner superior"
              : variant === "side"
                ? "Banner lateral"
                : "Banner inferior"}
          </small>
        </div>
      </div>
    );
  }

  const image = (
    <img src={banner.imageUrl} alt={banner.titulo} className={styles.adImage} />
  );

  return (
    <div className={`${styles.adBox} ${styles[`adBox_${variant}`]}`}>
      {banner.linkUrl ? (
        <a
          href={banner.linkUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.adLinkBox}
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}

export default function OuvirPage() {
  const router = useRouter();

  const {
    isLive,
    isPlaying,
    playError,
    togglePlay,
    title,
    streamUrl,
    canPlay,
  } = useRadioPlayer();

  const [listeners, setListeners] = useState<Listeners | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  async function loadListeners() {
    try {
      const r = await fetch("/api/radio/listeners", { cache: "no-store" });
      if (!r.ok) return;

      const j = (await r.json()) as Listeners;
      setListeners(j);
    } catch {}
  }

  async function loadNowPlaying() {
    try {
      const r = await fetch("/api/radio/now-playing", { cache: "no-store" });
      if (!r.ok) return;

      const j = (await r.json()) as NowPlaying;
      setNowPlaying(j);
    } catch {}
  }

  async function loadBanners() {
    try {
      const r = await fetch("/api/radio/banners", { cache: "no-store" });
      if (!r.ok) return;

      const j = await r.json();
      setBanners(Array.isArray(j?.banners) ? j.banners : []);
    } catch {
      setBanners([]);
    }
  }

  useEffect(() => {
    loadListeners();
    loadNowPlaying();
    loadBanners();

    const t1 = setInterval(loadListeners, 10000);
    const t2 = setInterval(loadNowPlaying, 10000);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const bannerTopo = useMemo(
    () => banners.find((b) => b.posicao === "TOPO"),
    [banners],
  );

  // Banner cadastrado como LATERAL, mas exibido em cima no formato largo igual ao antigo banner inferior
  const bannerDestaqueSuperior = useMemo(
    () => banners.find((b) => b.posicao === "LATERAL"),
    [banners],
  );

  const bannerInferior = useMemo(
    () => banners.find((b) => b.posicao === "INFERIOR"),
    [banners],
  );

  const hasUrl = !!streamUrl;
  const publicIsLive = isLive && canPlay;
  const publicCanPlay = publicIsLive && hasUrl;

  const currentTrack = publicIsLive
    ? nowPlaying?.title?.trim() || title || "Transmitindo agora"
    : "Rádio Offline";

  const currentArt = nowPlaying?.art?.trim() || FALLBACK_COVER;

  const currentDj =
    nowPlaying?.djusername?.trim() === "No DJ"
      ? "AutoDJ"
      : nowPlaying?.djusername?.trim() || "AutoDJ";

  const history = Array.from(
    new Set(nowPlaying?.history?.map(cleanHistoryItem).filter(Boolean) || []),
  ).slice(0, 5);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <button
          className={styles.back}
          type="button"
          onClick={() => router.back()}
        >
          ← Voltar
        </button>

        <h1 className={styles.pageTitle}>{title ?? "Ouvir Rádio"}</h1>

        <div className={styles.statusRow}>
          <span
            className={
              publicIsLive ? styles.statusLiveText : styles.statusOffText
            }
          >
            {publicIsLive ? "AO VIVO" : "OFFLINE"}
          </span>

          <span className={publicIsLive ? styles.dotLive : styles.dotOff} />
        </div>

        <div className={styles.logoTopArea}>
          <BannerBox banner={bannerDestaqueSuperior} variant="bottom" />
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
            <BannerBox banner={bannerTopo} variant="top" />

            <div className={styles.stationRow}>
              <div className={styles.stationMeta}>
                <div className={styles.accountName}>{ACCOUNT_NAME}</div>

                <div className={styles.badges}>
                  <span
                    className={
                      publicIsLive ? styles.badgeLive : styles.badgeOffline
                    }
                  >
                    <span className={styles.badgeDot} />
                    {publicIsLive ? "AO VIVO" : "OFFLINE"}
                  </span>

                  {publicIsLive ? (
                    <span className={styles.badgeEvent}>{currentDj}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.mainGrid}>
              <div className={styles.leftColumn}>
                <div className={styles.nowCard}>
                  <div
                    className={styles.cover}
                    style={{ ["--cover" as any]: `url(${currentArt})` }}
                    aria-hidden="true"
                  />

                  <div className={styles.nowMeta}>
                    <div className={styles.nowLabel}>
                      {publicIsLive ? "TOCANDO AGORA" : "OFFLINE"}
                    </div>

                    <div className={styles.nowTitle}>{currentTrack}</div>

                    <div
                      className={`${styles.wave} ${
                        !publicIsLive || !isPlaying ? styles.wavePaused : ""
                      }`}
                      aria-hidden="true"
                    >
                      <span className={styles.bar} />
                      <span className={styles.bar} />
                      <span className={styles.bar} />
                      <span className={styles.bar} />
                      <span className={styles.bar} />
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
                      !publicCanPlay ? styles.playDisabled : ""
                    }`}
                    onClick={togglePlay}
                    disabled={!publicCanPlay}
                    aria-label={isPlaying ? "Pausar" : "Ouvir"}
                    title={isPlaying ? "Pausar" : "Ouvir"}
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </button>
                </div>

                {history.length > 0 && (
                  <div className={styles.historyBox}>
                    <div className={styles.historyTitle}>Últimas músicas</div>

                    <ul className={styles.historyList}>
                      {history.map((item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className={styles.historyItem}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <BannerBox banner={bannerInferior} variant="bottom" />

            {!publicIsLive && (
              <p className={styles.muted}>
                A transmissão ainda não está liberada para o público.
              </p>
            )}

            {publicIsLive && !hasUrl && (
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
