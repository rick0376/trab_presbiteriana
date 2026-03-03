import Header from "@/components/header/public-header/public-header";
import Footer from "@/components/footer/public-footer/public-footer";
import styles from "./styles.module.scss";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.publicLayout}>
      <Header />
      <main className={styles.content}>{children}</main>
      <Footer />
    </div>
  );
}
