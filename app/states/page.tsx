import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import { NotFound, EmptyResults, HiddenPost } from "@/components/StateCards";
import styles from "./states.module.css";

export const metadata = {
  title: "Imiterere — Urunana",
  description: "Iyo bidasanzwe kuri Urunana.",
};

export default function StatesPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>IMITERERE</p>
          <h1 className={styles.title}>Iyo bidasanzwe</h1>

          <div className={styles.grid}>
            <NotFound />
            <EmptyResults />
            <HiddenPost />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
