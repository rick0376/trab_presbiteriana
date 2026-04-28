//components/header/public-header/public-header.tsx

//components/header/public-header/public-header.tsx

"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import styles from "./styles.module.scss";

export default function PublicHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/igrejas" className={styles.brand}>
          <img
            src="/images/logo_transparente.png"
            alt="Logo Igreja Presbiteriana Renovada"
            className={styles.logoImg}
          />

          <div className={styles.brandText}>
            <span className={styles.brandTop}>IPR - Igreja</span>
            <span className={styles.brandBottom}>
              Presbiteriana Renovada - MC
            </span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/igrejas" className={styles.navLink}>
            Início
          </Link>

          <Link href="/igrejas#eventos" className={styles.navLink}>
            Eventos
          </Link>

          <Link href="/igrejas#cronograma" className={styles.navLink}>
            Cronograma
          </Link>
        </nav>

        <div className={styles.actions}>
          <Link
            href="/login-superadmin"
            className={styles.superadminBtn}
            title="Área administrativa"
            aria-label="Área administrativa"
          >
            <ShieldCheck size={18} className={styles.superadminIcon} />
            <span className={styles.superadminText}>Área administrativa</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
