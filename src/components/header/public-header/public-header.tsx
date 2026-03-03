///components/header/public-header/public-header.tsx

"use client";
import Link from "next/link";
import styles from "./styles.module.scss";

export default function PublicHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/igrejas" className={styles.logo}>
          <img
            src="/images/logo_transparente.png"
            alt="Logo Igreja Matriz"
            className={styles.logoImg}
          />
          <span className={styles.logoText}>
            <span className={styles.logoLine1}>IPR-Presbiteriana</span>
            <span className={styles.logoLine2}>Renovada - MC</span>
          </span>

          <span className={styles.logoTextMobile}>
            <span className={styles.logoLine1}>IPRB</span>
            <span className={styles.logoLine2}>Presbiteriana Renovada</span>
          </span>
        </Link>

        <div className={styles.actions}>
          <Link href="/login-superadmin" className={styles.superadminBtn}>
            🔑 SuperAdmin
          </Link>
        </div>
      </div>
    </header>
  );
}
