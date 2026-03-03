"use client";

import { useState } from "react";
import Header from "@/components/header/header";
import Sidebar from "@/components/sidebar/sidebar";
import Footer from "@/components/footer/public-footer/public-footer";
import styles from "./styles.module.scss";

interface PrivateShellProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  igrejaNome: string;
}

export default function PrivateShell({
  children,
  userName,
  userRole,
  igrejaNome,
}: PrivateShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <Header
        onMenuToggle={() => setIsSidebarOpen(true)}
        userName={userName}
        userRole={userRole}
        igrejaNome={igrejaNome}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.mainArea}>
        <main className={styles.dashboardContent}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
