import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import styles from "./twandikire.module.css";

export const metadata = {
  title: "Twandikire — Urunana",
  description:
    "Ufite ikibazo, igitekerezo cyangwa ubufatanye? Twandikire, tuzagusubiza vuba.",
};

export default function TwandikirePage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <PageHero
          eyebrow="TWANDIKIRE"
          title="Tuvugishe"
          lead="Ufite ikibazo, igitekerezo cyangwa ubufatanye? Twandikire, tuzagusubiza vuba."
        />
        <div className={styles.container}>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
