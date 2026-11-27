import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import styles from "./ahabanza.module.css";

export const metadata = {
  title: "Urunana — Umuco n'Ururimi",
  description:
    "Dusigasire umurage, amateka n'imigenzo y'Abakurambere, duhe agaciro ururimi rw'Ikinyarwanda no kwandika inkuru z'umuryango.",
};

const CATEGORIES = [
  {
    label: "Amateka\nn'Umurage",
    slug: "amateka-n-umurage",
    cropClass: styles.catCrop1,
  },
  {
    label: "Ururimi\nrw'Ikinyarwanda",
    slug: "ururimi-rw-ikinyarwanda",
    cropClass: styles.catCrop2,
  },
  {
    label: "Imigani\nn'Ibisakuzo",
    slug: "imigani-n-ibisakuzo",
    cropClass: styles.catCrop3,
  },
  {
    label: "Ubuvanganzo\nn'Inkuru",
    slug: "ubuvanganzo-n-inkuru",
    cropClass: styles.catCrop4,
  },
  {
    label: "Imigenzo\nGakondo",
    slug: "imigenzo-gakondo",
    cropClass: styles.catCrop5,
  },
] as const;

export default function AhabanzaPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="landing" />

      <main className={styles.main}>
        {/* 1. Hero */}
        <section className={styles.hero} aria-labelledby="hero-wordmark">
          <div className={styles.heroInner}>
            <div className={styles.cowWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/hero-cow.jpg"
                alt="Inka y'Inyambo n'umutako wa gakondo"
                className={styles.cowImg}
              />
            </div>

            <h1 id="hero-wordmark" className={styles.wordmark}>
              Urunana
            </h1>

            <p className={styles.heroLead}>
              Dusigasire umurage, amateka n&apos;imigenzo y&apos;Abakurambere,
              duhe agaciro ururimi rw&apos;Ikinyarwanda no kwandika inkuru
              z&apos;umuryango.
            </p>

            <div className={styles.heroActions}>
              <Link href="/kwiyandikisha" className={styles.btnOrange}>
                Kwiyandikisha
              </Link>
              <Link href="/gushakisha" className={styles.btnOutlineCream}>
                Gushakisha
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Word of the Week */}
        <section className={styles.wotwBand} aria-labelledby="home-wotw-word">
          <div className={styles.wotwCard}>
            <p className={styles.wotwEyebrow}>
              IJAMBO RY&apos;ICYUMWERU &middot; WORD OF THE WEEK
            </p>
            <h2 id="home-wotw-word" className={styles.wotwWord}>
              Urunana
            </h2>
            <p className={styles.wotwPhonetic}>[u-ru-na-na]</p>
            <p className={styles.wotwDef}>
              Urunana ni isano rikomeye cyangwa umurongo w&apos;abantu bafatanye
              mu gushyigikirana no guhuriza hamwe imbaraga.
            </p>
            <p className={styles.wotwNote}>
              Urugero: &ldquo;Urunana rw&apos;Abanyarwanda ni rwo rwatugize abo
              turi bo uyu munsi.&rdquo;
            </p>
          </div>
        </section>

        {/* 3. Categories */}
        <section className={styles.creamSection} aria-labelledby="doors-heading">
          <div className={styles.container}>
            <p className={styles.sectionEyebrowCenter}>IBYICIRO BY&apos;UBUMENYI</p>
            <h2 id="doors-heading" className={styles.doorsHeading}>
              Hitamo urugi winjiremo
            </h2>

            <div className={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/gushakisha?topic=${cat.slug}`}
                  className={styles.catItem}
                >
                  <div className={styles.catCircle}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/baskets-wall.jpg"
                      alt=""
                      className={`${styles.catImg} ${cat.cropClass}`}
                    />
                  </div>
                  <span className={styles.catLabel}>{cat.label}</span>
                </Link>
              ))}
            </div>

            <hr className={styles.divider} />

            {/* 4. Featured Stories */}
            <p className={styles.sectionEyebrow}>INKURU ZATORANYIJWE</p>
            <div className={styles.storiesGrid}>
              <Link
                href="/inkuru/umurage-wa-ruganzu-ii-ndoli"
                className={styles.storyLink}
              >
                <div className={styles.archFrame}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/painting.jpg"
                    alt="Igishushanyo cy'abagore babiri bikoreye ibiseke"
                    className={styles.storyImg}
                  />
                </div>
                <p className={styles.storyTagOrange}>
                  UBUVANGANZO BWO MU MURYANGO &middot; AMATEKA YANDITSE
                </p>
                <h3 className={styles.storyTitle}>
                  Umurage wa Ruganzu II Ndoli n&apos;Inzira y&apos;Ubutwari mu
                  Mateka y&apos;u Rwanda
                </h3>
                <p className={styles.storyExcerpt}>
                  Amateka n&apos;ibitekerezo bya kera bigaragaza ubutwari bwa
                  Ruganzu Ndoli n&apos;uko yagaruye ingoma.
                </p>
                <p className={styles.storyMeta}>
                  <strong>Kalisa Mugisha</strong> &middot; 2 ibitekerezo
                </p>
              </Link>

              <Link
                href="/inkuru/wisdom-of-unity-imigani"
                className={styles.storyLink}
              >
                <div className={styles.rectFrame}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/pattern-bw.jpg"
                    alt="Imitako y'umukara n'umweru y'Imigongo"
                    className={styles.storyImg}
                  />
                </div>
                <p className={styles.storyTagNavy}>
                  IMIGANI N&apos;IBISAKUZO &middot; ENGLISH
                </p>
                <h3 className={styles.storyTitle}>
                  Wisdom of Unity in Ancient Rwandan Proverbs (Imigani
                  y&apos;Imigenurano)
                </h3>
                <p className={styles.storyExcerpt}>
                  Uko imigani ya kera yigisha ubumwe, ubwubahane n&apos;ubufatanye
                  mu muryango Nyarwanda.
                </p>
                <p className={styles.storyMeta}>
                  <strong>Kalisa Mugisha</strong> &middot; 7 ibitekerezo
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Maroon CTA */}
        <section className={styles.ctaSection} aria-labelledby="cta-heading">
          <div className={styles.ctaBaskets} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/maroon-baskets.jpg"
              alt=""
              className={styles.ctaBasketsImg}
            />
          </div>
          <div className={styles.ctaInner}>
            <p className={styles.ctaEyebrow}>IGIHE CYO KWINJIRA MU MURYANGO</p>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              Abishyize hamwe
              <br />
              ntakibananira
            </h2>
            <p className={styles.ctaSub}>
              Injira muri Urunana, usangize inkuru yawe, usome abandi, ubike
              iby&apos;umuco.
            </p>
            <Link href="/kwiyandikisha" className={styles.ctaBtn}>
              Kwiyandikisha
            </Link>
          </div>
        </section>

        {/* 6. Thin B&W Discs Strip */}
        <div className={styles.discsStrip} aria-hidden="true" />
      </main>

      <Footer showAboutLink />
    </div>
  );
}
