//src/components/footer/public-footer/public-footer.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import styles from "./styles.module.scss";

type FooterData = {
  churchName: string;
  bannerSubtitle: string;
  footerDescricao: string;
  endereco: string;
  whatsappUrl: string | null;
  telefonePublico: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  horarios: { id: string; texto: string; ordem: number }[];
  email: string;
};

const FALLBACK_DATA: FooterData = {
  churchName: "Igreja Presbiteriana Renovada",
  bannerSubtitle:
    "Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo.",
  footerDescricao:
    "Uma comunidade de fé, comunhão e transformação de vidas pelo amor de Cristo.",
  endereco: "Moreira César - SP",
  whatsappUrl: null,
  telefonePublico: null,
  instagramUrl: null,
  facebookUrl: null,
  horarios: [],
  email: "lhpsystems0376@gmail.com",
};

function formatPhone(value?: string | null) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "Telefone não informado";
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

export default function PublicFooter() {
  const [data, setData] = useState<FooterData>(FALLBACK_DATA);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/publico/footer", {
          cache: "no-store",
        });

        if (!r.ok) return;

        const j = (await r.json()) as FooterData;
        setData(j);
      } catch {}
    }

    load();
  }, []);

  const telefoneLabel = useMemo(
    () => formatPhone(data.telefonePublico || data.whatsappUrl),
    [data.telefonePublico, data.whatsappUrl],
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <div className={styles.logoRow}>
            <img
              src="/images/logo_transparente.png"
              alt={`Logo ${data.churchName}`}
              className={styles.logo}
            />
            <div>
              <h3 className={styles.title}>{data.churchName}</h3>
              <p className={styles.text}>{data.footerDescricao}</p>
            </div>
          </div>

          <div className={styles.socialRow}>
            {data.instagramUrl ? (
              <a
                href={data.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.socialInstagram}
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            ) : null}

            {data.facebookUrl ? (
              <a
                href={data.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.socialFacebook}
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
            ) : null}

            {data.whatsappUrl ? (
              <a
                href={data.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.socialWhatsapp}
                aria-label="WhatsApp"
              >
                <FaWhatsapp />
              </a>
            ) : null}
          </div>
        </div>

        <div className={styles.col}>
          <h4 className={styles.subtitle}>Contato</h4>

          <div className={styles.item}>
            <MapPin size={16} />
            <span>{data.endereco}</span>
          </div>

          <div className={styles.item}>
            <Phone size={16} />
            <span>{telefoneLabel}</span>
          </div>

          <div className={styles.item}>
            <Mail size={16} />
            <a href={`mailto:${data.email}`}>{data.email}</a>
          </div>
        </div>

        <div className={styles.col}>
          <h4 className={styles.subtitle}>Cultos e horários</h4>

          {data.horarios?.length ? (
            data.horarios.map((item) => (
              <p key={item.id} className={styles.textSmall}>
                {item.texto}
              </p>
            ))
          ) : (
            <>
              <p className={styles.textSmall}>Quarta-feira</p>
              <p className={styles.textSmall}>Sexta-feira</p>
              <p className={styles.textSmall}>Domingo</p>
            </>
          )}
        </div>

        <div className={styles.col}>
          <h4 className={styles.subtitle}>Links rápidos</h4>

          <Link href="/igrejas" className={styles.linkItem}>
            Página inicial
          </Link>

          <Link href="/departamentos" className={styles.linkItem}>
            Departamentos
          </Link>

          <a href="/igrejas#eventos" className={styles.linkItem}>
            Eventos
          </a>

          <a href="/igrejas#cronograma" className={styles.linkItem}>
            Cronogramas
          </a>

          <Link href="/login" className={styles.linkItem}>
            Área de acesso
          </Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>
          © {new Date().getFullYear()} {data.churchName}
        </span>
        <span>
          Desenvolvido por <strong>Rick Pereira</strong>
        </span>
      </div>
    </footer>
  );
}
