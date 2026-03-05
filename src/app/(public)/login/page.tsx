"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  //const [email, setEmail] = useState("admin@lhp.com");
  //const [senha, setSenha] = useState("123456");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

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
        credentials: "include",
      });

      // tenta ler body sempre (pra pegar {error})
      const data = await res.json().catch(() => ({}));

      // ❌ login inválido
      if (!res.ok) {
        openModal(data?.error || "Email ou senha inválidos");
        return;
      }

      // ✅ ok
      window.location.replace("/dashboard");
    } catch {
      openModal("Erro de conexão. Tente novamente.");
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
        <h1 className={styles.title}>Login Admin </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
          disabled={loading}
        />

        <div className={styles.passwordInput}>
          <input
            type={showSenha ? "text" : "password"}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={styles.input}
            required
            disabled={loading}
          />

          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowSenha((v) => !v)}
            disabled={loading}
            title={showSenha ? "Ocultar" : "Mostrar"}
          >
            {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

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
