import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import FeedContent from "@/components/FeedContent";
import storiesData from "@/src/data/stories.json";
import type { StoryItem } from "@/components/StoryCard";
import styles from "./feed.module.css";

export const metadata = {
  title: "Urunana — Umuco n'Ururimi",
  description: "Inkuru ziheruka kwandikwa n'ijambo ry'icyumweru kuri Urunana.",
};

type FeedStory = StoryItem & {
  feed?: boolean;
  category?: string;
};

export default function FeedPage() {
  const stories = storiesData as FeedStory[];

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
                Urunana
              </h1>
              <span className={styles.wotwPhonetic}>[u-ru-na-na]</span>
            </div>
            <p className={styles.wotwDef}>
              Urunana ni isano rikomeye cyangwa umurongo w&apos;abantu bafatanye mu
              gushyigikirana.
            </p>
          </div>
        </section>

        <FeedContent stories={stories} />
      </main>
      <Footer />
    </div>
  );
}
