import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import styles from "./igenamiterere.module.css";

export const metadata = {
  title: "Igenamiterere — Urunana",
  description: "Hindura umwirondoro wawe kuri Urunana.",
};

export default function IgenamitererePage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>IGENAMITERERE</p>
          <h1 className={styles.title}>Hindura umwirondoro</h1>
          <ProfileSettingsForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
