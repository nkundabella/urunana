import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import { NotFound } from "@/components/StateCards";
import styles from "./not-found.module.css";

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <div className={styles.cardWrap}>
          <NotFound ctaHref="/" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
