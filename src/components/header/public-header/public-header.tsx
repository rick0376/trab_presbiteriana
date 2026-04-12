//components/header/public-header/public-header.tsx

"use client";

import Link from "next/link";
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
            <span className={styles.brandTop}>Igreja Presbiteriana</span>
            <span className={styles.brandBottom}>Renovada - Moreira César</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <a href="/igrejas" className={styles.navLink}>
            Início
          </a>
          <a href="#eventos" className={styles.navLink}>
            Eventos
          </a>
          <a href="#cronograma" className={styles.navLink}>
            Cronograma
          </a>
        </nav>

        <div className={styles.actions}>
          <Link href="/login-superadmin" className={styles.superadminBtn}>
            Área administrativa
          </Link>
        </div>
      </div>
    </header>
  );
}
