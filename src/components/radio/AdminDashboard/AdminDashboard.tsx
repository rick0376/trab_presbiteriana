//src/components/radio/AdminDashboard/AdminDashboard.tsx

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./styles.module.scss";

export default function AdminDashboard() {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      router.replace("/igrejas");
      router.refresh();
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🔐 Painel Administrativo</h1>

        <p className={styles.subtitle}>Escolha o que deseja fazer:</p>

        <div className={styles.actions}>
          <Link href="/radio/admin-radio" className={styles.actionBtn}>
            📻 Controlar Rádio
            <span>Ligar / Desligar transmissão</span>
          </Link>
        </div>

        <button className={styles.logout} onClick={logout}>
          Sair
        </button>
      </div>
    </main>
  );
}
