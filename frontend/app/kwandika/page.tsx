import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import PublishEditor from "@/components/PublishEditor";
import styles from "./kwandika.module.css";

export const metadata = {
  title: "Kwandika Inkuru — Urunana",
  description: "Andika inkuru, ijambo cyangwa umugani wumvise mu muryango.",
};

export default function KwandikaPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <PageHero
          eyebrow="KWANDIKA INKURU"
          title="Tangaza ubumenyi bwawe"
          lead="Andika inkuru, ijambo cyangwa umugani wumvise mu muryango."
        />
        <PublishEditor />
      </main>
      <Footer />
    </div>
  );
}
