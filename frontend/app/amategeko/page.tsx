import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import styles from "./amategeko.module.css";

export const metadata = {
  title: "Amategeko y'Umuryango — Urunana",
  description:
    "Amategeko 18 arinda ibiganiro n'abantu. Dutandukane mu bitekerezo, si mu bantu.",
};

const RULES = [
  { num: "01", title: "Disagree with ideas, not people" },
  { num: "02", title: "No harassment or bullying" },
  { num: "03", title: "No hate or dehumanizing content" },
  { num: "04", title: "No threats or encouragement of violence" },
  { num: "05", title: "Protect people's privacy" },
  { num: "06", title: "Do not present personal knowledge as established fact" },
  { num: "07", title: "Multiple versions can exist" },
  { num: "08", title: "Do not deliberately spread fabricated information" },
  { num: "09", title: "Respect intellectual ownership" },
  { num: "10", title: "Keep discussion relevant" },
  { num: "11", title: "No impersonation" },
  { num: "12", title: "No spam or manipulation" },
  { num: "13", title: "Sensitive cultural topics require care" },
  { num: "14", title: "Cultural documentation is not professional advice" },
  { num: "15", title: "Moderation protects discussion" },
  { num: "16", title: "Moderation decisions are consistent" },
  { num: "17", title: "Good-faith correction is encouraged" },
  { num: "18", title: "The rules may evolve" },
] as const;

export default function AmategekoPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>AMATEGEKO Y&apos;UMURYANGO</p>
          <h1 className={styles.title}>
            Dutandukane mu bitekerezo, si mu
            <br />
            bantu
          </h1>
          <p className={styles.lead}>
            Amategeko 18 arinda ibiganiro n&apos;abantu. Kwemera ni itegeko mbere
            yo gutangaza, gutanga ibitekerezo, gukurikira cyangwa kubika.
          </p>

          <section className={styles.examples} aria-label="Ingero z'ibiremewe n'ibitemewe">
            <div className={`${styles.exampleCard} ${styles.cardTeal}`}>
              <span className={`${styles.pill} ${styles.pillTeal}`}>
                Biremewe
              </span>
              <p className={styles.exampleText}>
                &ldquo;Nigeze kumva indi nkuru mu muryango wanjye.&rdquo;
              </p>
            </div>

            <div className={`${styles.exampleCard} ${styles.cardRed}`}>
              <span className={`${styles.pill} ${styles.pillRed}`}>
                Ntibyemewe
              </span>
              <p className={styles.exampleText}>
                Gutuka cyangwa gusuzugura uwatanze igitekerezo.
              </p>
            </div>
          </section>

          <ol className={styles.rulesGrid} aria-label="Amategeko 18 y'Umuryango">
            {RULES.map((rule) => (
              <li key={rule.num} className={styles.ruleCell}>
                <span className={styles.ruleNum} aria-hidden="true">
                  {rule.num}
                </span>
                <span className={styles.ruleTitle}>{rule.title}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
}
