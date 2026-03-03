"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

export default function LoginSuperAdminPage() {
  const router = useRouter();
  //const [email, setEmail] = useState("rick@lhp.com");
  //const [senha, setSenha] = useState("123456");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const openModal = (msg: string) => {
    setModalMsg(msg);
    setModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (res.ok) {
        router.replace("/dashboard");
        return;
      }

      const json = await res.json().catch(() => ({}) as any);
      openModal(json?.error || "Credenciais inválidas");
    } catch {
      openModal("Erro servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.card}>
        <Link href="/igrejas" className={styles.back}>
          ← Voltar
        </Link>
        <h1 className={styles.title}>Login SuperAdmin</h1>
        <p className={styles.subtitle}>Acesso restrito</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={styles.input}
          required
          disabled={loading}
        />

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Atenção</div>
            <div className={styles.modalText}>{modalMsg}</div>
            <button
              className={styles.modalBtn}
              onClick={() => setModalOpen(false)}
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
