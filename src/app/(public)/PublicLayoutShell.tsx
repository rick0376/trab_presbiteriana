//src/app/(public)/PublicLayoutShell.tsx

"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header/public-header/public-header";
import Footer from "@/components/footer/public-footer/public-footer";
import SiteAccessTracker from "@/components/contador/SiteAccessTracker";
import styles from "./styles.module.scss";

export default function PublicLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideHeaderFooter = pathname.startsWith("/radio/ouvir");

  return (
    <div className={styles.publicLayout}>
      <SiteAccessTracker />

      {!hideHeaderFooter && <Header />}

      <main className={styles.content}>{children}</main>

      {!hideHeaderFooter && <Footer />}
    </div>
  );
}
