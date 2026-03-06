//src/components/igreja-publico/IgrejasPage/IgrejasPageClient.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import CronogramaSemanal from "@/components/igreja-publico/CronogramaSemanal/CronogramaSemanal";
import EventosPublicos from "@/components/igreja-publico/eventos/EventosPublicos/EventosPublicos";
import CronogramaAnual from "@/components/igreja-publico/CronogramaAnual/CronogramaAnual";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { useRadioStatus } from "@/hooks/useRadioStatus";

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

// ✅ fallback enquanto Igreja ainda não tem imagem/endereço no banco
const FALLBACK_IMG = "/images/igreja-a.png";
const FALLBACK_ENDERECO = "Sem endereço";

export default function IgrejasPageClient({ igrejas, initialPublico }: Props) {
  const router = useRouter();

  const [imgOk, setImgOk] = useState(true);
  const [buildOpen, setBuildOpen] = useState(false);
  const [buildPage, setBuildPage] = useState("");

  const [openSemanal, setOpenSemanal] = useState(false);
  const [openAnual, setOpenAnual] = useState(false);

  const [publico, setPublico] = useState<IgrejaPublicoData | null>(
    initialPublico,
  );

  // ✅ usa hook compartilhado para status da rádio
  const { isLive } = useRadioStatus({ intervalMs: 15000 });

  //const mainSlug = useMemo(() => igrejas?.[0]?.slug ?? "", [igrejas]);
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

  return (
    <div className={styles.home}>
      {/* BANNER */}
      <section className={styles.banner}>
        <div className={styles.bannerInner}>
          <div className={styles.bannerLeft}>
            <div className={styles.topActions}>
              <div className={styles.cardRadio}>
                <header className={styles.header}>
                  <h1 className={styles.title}>📻 Rádio Presbiteriana</h1>
                  <span className={isLive ? styles.live : styles.offline}>
                    {isLive ? "AO VIVO" : "OFFLINE"}
                  </span>
                </header>

                <button
                  type="button"
                  className={styles.radioBtn}
                  onClick={() => router.push("/radio/ouvir")}
                >
                  <span className={styles.radioIcon}>
                    {isLive ? "🔴" : "🔊"}
                  </span>
                  <span className={styles.radioText}>
                    {isLive ? "Ouvir agora" : "Ouvir Rádio"}
                  </span>
                  <span className={styles.badge}>
                    {isLive ? "Ao vivo" : "Em breve"}
                  </span>
                </button>

                <footer className={styles.footer}>
                  <Link href="/radio/admin" className={styles.adminLink}>
                    🔐 Área do Administrador
                  </Link>
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
                <>
                  <div className={styles.infoItem}>
                    <span className={styles.dot}></span>
                    <p>Aguardando Informações</p>
                  </div>
                </>
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

      {/* ✅ CARD(S) DA IGREJA */}
      <section className={styles.cards}>
        {igrejas.map((item) => {
          const endereco =
            item.publico?.endereco ?? "Rua Rafael Popoaski, 130 - IPE I";

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
        {/* CRONOGRAMA SEMANAL */}
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

        {/* CRONOGRAMA ANUAL */}
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
