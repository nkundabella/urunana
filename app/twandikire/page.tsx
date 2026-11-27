import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import ContactForm from "@/components/ContactForm";
import styles from "./twandikire.module.css";

export const metadata = {
  title: "Twandikire — Urunana",
  description:
    "Ufite ikibazo, igitekerezo cyangwa ushaka kutugira inama? Tubwire, tuzagusubiza.",
};

export default function TwandikirePage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="contact-heading">
          <div className={styles.heroBody}>
            <div className={styles.heroInner}>
              <p className={styles.heroEyebrow}>TWANDIKIRE</p>
              <h1 id="contact-heading" className={styles.heroTitle}>
                Tuvugishe
              </h1>
              <p className={styles.heroLead}>
                Ufite ikibazo, igitekerezo cyangwa ushaka kutugira inama?
                Tubwire, tuzagusubiza.
              </p>
            </div>
          </div>
          <div className={styles.zigzag} aria-hidden="true" />
        </section>

        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.formCol}>
              <ContactForm />
            </div>

            <aside
              className={styles.helpCard}
              aria-labelledby="quick-help-heading"
            >
              <p className={styles.helpEyebrow}>MBERE YO KWANDIKA</p>
              <h2 id="quick-help-heading" className={styles.helpTitle}>
                Ushaka ubufasha bwihuse?
              </h2>
              <p className={styles.helpText}>
                Ubutumwa bwose busomwa n&apos;umuntu. Niba ushaka kumenyesha
                ikibazo ku nyandiko, koresha ihuzo rya &laquo;Menyesha&raquo;.
              </p>
              <Link href="/amategeko" className={styles.helpLink}>
                Amategeko y&apos;Umuryango &rarr;
              </Link>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
