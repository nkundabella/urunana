import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import styles from "./ibyerekeye.module.css";

export const metadata = {
  title: "Ibyerekeye Urunana — Urunana",
  description:
    "Urunana ni umwanya aho urubyiruko rw'Abanyarwanda rushobora kumenya, kuganira, kubika no gutanga ubumenyi bw'umuco n'ururimi.",
};

const CYCLE_CIRCLES = [
  { label: "Menya", cropClass: styles.crop1 },
  { label: "Kwiga", cropClass: styles.crop2 },
  { label: "Ganira", cropClass: styles.crop3 },
  { label: "Tanga", cropClass: styles.crop4 },
  { label: "Menya", cropClass: styles.crop5 },
] as const;

const PILLARS = [
  {
    title: "Ubumenyi",
    desc: "Inkuru, imigani, amateka n'imigenzo.",
    cardClass: styles.cardSoft,
  },
  {
    title: "Ikinyarwanda",
    desc: "Ururimi ruri hagati.",
    cardClass: styles.cardNavy,
  },
  {
    title: "Umuryango",
    desc: "Abasomyi bahinduka abanditsi.",
    cardClass: styles.cardOrange,
  },
] as const;

export default function IbyerekeyePage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="about-hero-title">
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>IBYEREKEYE URUNANA</p>
            <h1 id="about-hero-title" className={styles.heroTitle}>
              u Rwanda nk&rsquo;umwe mu
              <br />
              bice bigize isi, ntabwo ari
              <br />
              u Rwanda mu cyimbo
              <br />
              cy&rsquo;isi
            </h1>
            <div className={styles.cowWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/hero-cow.jpg"
                alt="Inka y'Inyambo n'umutako wa gakondo"
                className={styles.cowImg}
              />
            </div>
          </div>
        </section>

        <section className={styles.bodySection} aria-labelledby="cycle-heading">
          <div className={styles.container}>
            <p id="cycle-heading" className={styles.eyebrow}>
              UMUZENGURUKO
            </p>

            <div className={styles.circlesRow}>
              {CYCLE_CIRCLES.map((item, idx) => (
                <div key={`${item.label}-${idx}`} className={styles.circleItem}>
                  <div className={styles.circleFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/baskets-wall.jpg"
                      alt=""
                      className={`${styles.circleImg} ${item.cropClass}`}
                    />
                  </div>
                  <span className={styles.circlePill}>{item.label}</span>
                </div>
              ))}
            </div>

            <p className={styles.summary}>
              Urunana ni umwanya aho urubyiruko rw&rsquo;Abanyarwanda rushobora
              kumenya, kuganira, kubika no gutanga ubumenyi bw&rsquo;umuco
              n&rsquo;ururimi.
            </p>

            <div className={styles.pillarsGrid}>
              {PILLARS.map((pillar) => (
                <article
                  key={pillar.title}
                  className={`${styles.pillarCard} ${pillar.cardClass}`}
                >
                  <h2 className={styles.pillarTitle}>{pillar.title}</h2>
                  <p className={styles.pillarDesc}>{pillar.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
