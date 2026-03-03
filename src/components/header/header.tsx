"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import styles from "./styles.module.scss";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  userName: string;
  userRole: string;
  igrejaNome: string;
}

export default function DashboardHeader({
  onMenuToggle,
  userName,
  userRole,
  igrejaNome,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      router.replace("/igrejas");
      router.refresh();
    }
  };

  // Inicial do avatar
  const avatarInitial = userName ? userName.charAt(0).toUpperCase() : "A";

  return (
    <>
      <header className={styles.header}>
        <div className={styles.mainContainer}>
          <Link href="/dashboard" className={styles.logo}>
            <span className={styles.logoIcon}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={48}
                height={48}
                priority
              />
            </span>
          </Link>

          <div className={styles.igrejaNome}>
            {igrejaNome || "IPR-Presbiteriana Renovada"}
          </div>

          <div className={styles.rightSection}>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>{avatarInitial}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{userName}</div>
                <div className={styles.userRole}>{userRole}</div>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className={styles.logoutBtn}
              >
                <LogOut className={styles.icoLogout} size={18} />
              </button>
            </div>
            <button className={styles.menuToggle} onClick={onMenuToggle}>
              ☰
            </button>
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className={styles.logoutModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>🚪</div>
            <h3>Sair do sistema?</h3>
            <p>Todas sessões serão encerradas.</p>
            <div className={styles.modalButtons}>
              <button
                onClick={handleLogoutConfirm}
                className={styles.confirmBtn}
              >
                Sair
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={styles.cancelBtn}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
