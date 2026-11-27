import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import FeedContent from "@/components/FeedContent";
import { serverApiFetch } from "@/lib/api";
import type { HomeResponse, PostsListResponse } from "@/lib/api-types";
import styles from "./feed.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Urunana — Umuco n'Ururimi",
  description: "Inkuru ziheruka kwandikwa n'ijambo ry'icyumweru kuri Urunana.",
};

export default async function FeedPage() {
  const cookieHeader = (await headers()).get("cookie");

  let home: HomeResponse | null = null;
  let initialPosts: PostsListResponse["posts"] = [];

  try {
    const [homeRes, postsRes] = await Promise.all([
      serverApiFetch<HomeResponse>("/api/v1/home", cookieHeader),
      serverApiFetch<PostsListResponse>("/api/v1/posts?limit=20", cookieHeader),
    ]);
    home = homeRes;
    initialPosts = postsRes.posts;
  } catch {
    home = null;
    initialPosts = [];
  }

  const wotw = home?.wordOfTheWeek;

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" />
      <main className={styles.main}>
        <section className={styles.wotwBanner} aria-labelledby="wotw-word">
          <div className={styles.wotwCard}>
            <p className={styles.wotwEyebrow}>
              IJAMBO RY&apos;ICYUMWERU &middot; WORD OF THE WEEK
            </p>
            <div className={styles.wotwHeadingRow}>
              <h1 id="wotw-word" className={styles.wotwWord}>
                {wotw?.word || "Urunana"}
              </h1>
              <span className={styles.wotwPhonetic}>
                [{wotw?.pronunciation || "u-ru-na-na"}]
              </span>
            </div>
            <p className={styles.wotwDef}>
              {wotw?.explanationRw ||
                "Urunana ni isano rikomeye cyangwa umurongo w'abantu bafatanye mu gushyigikirana."}
            </p>
          </div>
        </section>

        <FeedContent
          initialPosts={initialPosts}
          categories={home?.categories ?? []}
          featuredPrompt={
            home?.featuredPrompt ||
            "Ikiganiro cy'icyumweru: Ni uwuhe mugani w'Ikinyarwanda wagufashije mu buzima?"
          }
          authorOfTheWeek={home?.authorOfTheWeek ?? null}
        />
      </main>
      <Footer />
    </div>
  );
}
