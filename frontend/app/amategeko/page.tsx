import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import { serverApiFetch } from "@/lib/api";
import type { CommunityRuleDto } from "@/lib/api-types";
import styles from "./amategeko.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Amategeko y'Umuryango — Urunana",
  description:
    "Amategeko 18 arinda ibiganiro n'abantu. Dutandukane mu bitekerezo, si mu bantu.",
};

const FALLBACK_RULES: Array<{ number: string; titleRw: string; titleEn: string }> = [
  { number: "01", titleRw: "Guhugura ibitekerezo, si abantu", titleEn: "Disagree with ideas, not people" },
  { number: "02", titleRw: "Nta gutoteza cyangwa guhohotera", titleEn: "No harassment or bullying" },
  { number: "03", titleRw: "Kwirinda urwango n'amagambo anezeza", titleEn: "No hate or dehumanizing content" },
  { number: "04", titleRw: "Nta gutera ubwoba cyangwa gukangisha urugomo", titleEn: "No threats or encouragement of violence" },
  { number: "05", titleRw: "Kubaha ibanga ry'umuntu (Privacy)", titleEn: "Protect people's privacy" },
  { number: "06", titleRw: "Sobanura inkomoko y'ubumenyi", titleEn: "Provide context for knowledge sources" },
  { number: "07", titleRw: "Inkuru zitandukanye zibana mu mahoro", titleEn: "Multiple versions can coexist" },
  { number: "08", titleRw: "Kwirinda guhimba ibitari byo", titleEn: "Do not knowingly fabricate information" },
  { number: "09", titleRw: "Kubaha umutungo mu by'ubwenge", titleEn: "Respect intellectual ownership & credit sources" },
  { number: "10", titleRw: "Kuguma ku nsanganyamatsiko", titleEn: "Keep discussion relevant; no spam or derailing" },
  { number: "11", titleRw: "Kutiyitirira undi muntu", titleEn: "No impersonation" },
  { number: "12", titleRw: "Nta kwinjiza ibikorwa bya robot (Spam)", titleEn: "No spam or manipulation of engagement" },
  { number: "13", titleRw: "Kwitondera ingingo ziremereye mu mateka", titleEn: "Sensitive cultural topics require care" },
  { number: "14", titleRw: "Ubumenyi bw'imiti gakondo si inama z'ubuvuzi", titleEn: "Traditional health knowledge is not professional advice" },
  { number: "15", titleRw: "Ubuyobozi buhana amakosa, ntibuhana ibitekerezo", titleEn: "Moderation targets rule violations, not viewpoints" },
  { number: "16", titleRw: "Ubutabera n'ubucamanza buciye mu mucyo", titleEn: "Moderation is logged and consistent" },
  { number: "17", titleRw: "Gukosorana mu rukundo", titleEn: "Good-faith correction is encouraged over conflict" },
  { number: "18", titleRw: "Amategeko ashobora kuvugururwa", titleEn: "Rules may evolve transparently" },
];

export default async function AmategekoPage() {
  const cookieHeader = (await headers()).get("cookie");
  let rules: Array<{ number: string; titleRw: string; titleEn: string; ruleCode?: string }> =
    FALLBACK_RULES;

  try {
    const res = await serverApiFetch<{ rules: CommunityRuleDto[] }>(
      "/api/v1/rules",
      cookieHeader
    );
    if (res.rules.length > 0) {
      rules = res.rules;
    }
  } catch {
    // fallback already initialized
  }

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
            Amategeko {rules.length} arinda ibiganiro n&apos;abantu. Kwemera ni
            itegeko mbere yo gutangaza, gutanga ibitekerezo, gukurikira cyangwa
            kubika.
          </p>

          <section
            className={styles.examples}
            aria-label="Ingero z'ibiremewe n'ibitemewe"
          >
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

          <ol
            className={styles.rulesGrid}
            aria-label={`Amategeko ${rules.length} y'Umuryango`}
          >
            {rules.map((rule) => (
              <li key={rule.ruleCode ?? rule.number} className={styles.ruleCell}>
                <span className={styles.ruleNum} aria-hidden="true">
                  {rule.number}
                </span>
                <span className={styles.ruleTitle}>{rule.titleRw}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
}
