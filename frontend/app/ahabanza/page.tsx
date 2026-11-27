import Link from "next/link";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import { serverApiFetch } from "@/lib/api";
import type { HomeResponse, PostDto, TopicCategoryDto } from "@/lib/api-types";
import styles from "./ahabanza.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Urunana — Umuco n'Ururimi",
  description:
    "Dusigasire umurage, amateka n'imigenzo y'Abakurambere, duhe agaciro ururimi rw'Ikinyarwanda no kwandika inkuru z'umuryango.",
};

const CROP_CLASSES = [
  styles.catCrop1,
  styles.catCrop2,
  styles.catCrop3,
  styles.catCrop4,
  styles.catCrop5,
];

const FALLBACK_CATEGORIES: Array<{ slug: string; nameRw: string }> = [
  { slug: "history-heritage", nameRw: "Amateka n'Umurage" },
  { slug: "kinyarwanda-language", nameRw: "Ururimi rw'Ikinyarwanda" },
  { slug: "proverbs-riddles", nameRw: "Imigani n'Ibisakuzo" },
  { slug: "oral-traditions-stories", nameRw: "Ubuvanganzo n'Inkuru" },
  { slug: "traditional-practices", nameRw: "Imigenzo Gakondo" },
];

export default async function AhabanzaPage() {
  const cookieHeader = (await headers()).get("cookie");
  let home: HomeResponse | null = null;

  try {
    home = await serverApiFetch<HomeResponse>("/api/v1/home", cookieHeader);
  } catch {
    home = null;
  }

  const wotw = home?.wordOfTheWeek;
  const displayCategories: Array<Pick<TopicCategoryDto, "slug" | "nameRw">> =
    home && home.categories.length > 0
      ? home.categories.slice(0, 5)
      : FALLBACK_CATEGORIES;
  const featuredStories: PostDto[] = (home?.featuredStories ?? []).slice(0, 2);

  return (
    <div className={styles.page}>
      <div className={styles.heroViewport}>
        <WovenStrip />
        <Header variant="landing" />

        {/* 1. Hero */}
        <section className={styles.hero} aria-labelledby="hero-wordmark">
          <div className={styles.heroInner}>
            <div className={styles.cowWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/hero-cow.jpg"
                alt="Inka y'Inyambo n'umutako wa gakondo"
                className={styles.cowImg}
                style={{ height: "67vh", maxHeight: "690px", width: "auto" }}
              />
            </div>

            <div className={styles.heroTextStack} style={{ marginTop: "-15.5vh" }}>
              <h1
                id="hero-wordmark"
                className={styles.wordmark}
                style={{
                  fontSize: "clamp(4.75rem, 13vh, 8.5rem)",
                  lineHeight: 0.85,
                }}
              >
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
          </div>
        </section>
      </div>

      <main className={styles.main}>
        {/* 2. Word of the Week */}
        <section className={styles.wotwBand} aria-labelledby="home-wotw-word">
          <div className={styles.wotwCard}>
            <p className={styles.wotwEyebrow}>
              IJAMBO RY&apos;ICYUMWERU &middot; WORD OF THE WEEK
            </p>
            <h2 id="home-wotw-word" className={styles.wotwWord}>
              {wotw?.word || "Urunana"}
            </h2>
            <p className={styles.wotwPhonetic}>
              [{wotw?.pronunciation || "u-ru-na-na"}]
            </p>
            <p className={styles.wotwDef}>
              {wotw?.explanationRw ||
                "Urunana ni isano rikomeye cyangwa umurongo w'abantu bafatanye mu gushyigikirana no guhuriza hamwe imbaraga."}
            </p>
            <p className={styles.wotwNote}>
              Urugero: &ldquo;
              {wotw?.exampleSentenceRw ||
                "Urunana rw'Abanyarwanda ni rwo rwatugize abo turi bo uyu munsi."}
              &rdquo;
            </p>
          </div>
        </section>

        {/* 3. Categories */}
        <section className={styles.creamSection} aria-labelledby="doors-heading">
          <div className={styles.container}>
            <p className={styles.sectionEyebrowCenter}>
              IBYICIRO BY&apos;UBUMENYI
            </p>
            <h2 id="doors-heading" className={styles.doorsHeading}>
              Hitamo urugi winjiremo
            </h2>

            <div className={styles.categoriesGrid}>
              {displayCategories.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={`/gushakisha?topic=${encodeURIComponent(cat.slug)}`}
                  className={styles.catItem}
                >
                  <div className={styles.catCircle}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/baskets-wall.jpg"
                      alt=""
                      className={`${styles.catImg} ${CROP_CLASSES[idx % CROP_CLASSES.length]}`}
                    />
                  </div>
                  <span className={styles.catLabel}>{cat.nameRw}</span>
                </Link>
              ))}
            </div>

            <hr className={styles.divider} />

            {/* 4. Featured Stories */}
            <p className={styles.sectionEyebrow}>INKURU ZATORANYIJWE</p>
            <div className={styles.storiesGrid}>
              {featuredStories.map((story, idx) => {
                const isFirst = idx === 0;
                const coverSrc =
                  story.images[0] ||
                  (isFirst ? "/assets/painting.jpg" : "/assets/pattern-bw.jpg");
                const tagLine = [
                  story.categories[0]?.nameRw?.toUpperCase(),
                  story.contentLanguageLabel?.toUpperCase(),
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <Link
                    key={story.id}
                    href={`/inkuru/${story.slug}`}
                    className={styles.storyLink}
                  >
                    <div className={isFirst ? styles.archFrame : styles.rectFrame}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverSrc}
                        alt={story.title}
                        className={styles.storyImg}
                      />
                    </div>
                    <p
                      className={
                        isFirst ? styles.storyTagOrange : styles.storyTagNavy
                      }
                    >
                      {tagLine || "UMUCO N'URURIMI"}
                    </p>
                    <h3 className={styles.storyTitle}>{story.title}</h3>
                    <p className={styles.storyExcerpt}>{story.excerpt}</p>
                    <p className={styles.storyMeta}>
                      <strong>{story.author.displayName}</strong> &middot;{" "}
                      {story.commentCount} ibitekerezo
                    </p>
                  </Link>
                );
              })}
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
