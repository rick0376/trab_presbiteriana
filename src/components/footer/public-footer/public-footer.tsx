"use client";
import { Mail, Phone } from "lucide-react";
import styles from "./styles.module.scss";

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          © {new Date().getFullYear()} IPR Presbiteriana Renovada
        </span>

        {/*<span className={styles.address}>Rua Rafael Popoaski, 130 - Ipê I</span>*/}

        <div className={styles.contact}>
          <Mail size={14} />
          <a href="mailto:lhpsystems0376@gmail.com">lhpsystems0376@gmail.com</a>

          <Phone size={14} />
          <span>(12) 99189-0682</span>
        </div>

        <span className={styles.dev}>
          Desenvolvido por: <strong>Rick Pereira</strong>
        </span>
      </div>
    </footer>
  );
}
