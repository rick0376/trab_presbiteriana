//src/app/(public)/radio/page.tsx

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./styles.module.scss";
import { useRadioStatus } from "@/hooks/useRadioStatus";

export default function Home() {
  const router = useRouter();
  const { isLive } = useRadioStatus({ intervalMs: 15000 });

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>📻 Rádio LHP</h1>

          <span className={isLive ? styles.live : styles.offline}>
            {isLive ? "AO VIVO" : "OFFLINE"}
          </span>
        </header>

        <p className={styles.subtitle}>
          {isLive
            ? "A transmissão está ao vivo agora."
            : "Aguarde, a transmissão começará em breve."}
        </p>

        <button
          type="button"
          className={styles.radioBtn}
          onClick={() => router.push("/radio/ouvir")}
        >
          <span className={styles.radioIcon}>{isLive ? "🔴" : "🔊"}</span>
          <span className={styles.radioText}>
            {isLive ? "Ouvir agora" : "Ouvir Rádio"}
          </span>
          <span className={styles.badge}>
            {isLive ? "Ao vivo" : "Em breve"}
          </span>
        </button>

        <footer className={styles.footer}>
          <Link href="/admin/login" className={styles.adminLink}>
            🔐 Área do Administrador
          </Link>
        </footer>
      </div>
    </main>
  );
}
