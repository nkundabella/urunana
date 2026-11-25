import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import SavedStoriesView from "@/components/SavedStoriesView";
import storiesData from "@/src/data/stories.json";
import type { StoryItem } from "@/components/StoryCard";
import styles from "./ibyo-nabitse.module.css";

export const metadata = {
  title: "Ibyo Nabitse — Urunana",
  description: "Ibyo wabitse byose biri hano, ubisomere igihe cyose.",
};

type StoryRecord = StoryItem & {
  saved?: boolean;
  following?: boolean;
};

export default function IbyoNabitsePage() {
  const stories = storiesData as StoryRecord[];

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>IBYO NABITSE</p>
          <h1 className={styles.title}>Inkuru wabitse</h1>
          <p className={styles.lead}>
            Ibyo wabitse byose biri hano, ubisomere igihe cyose.
          </p>
          <SavedStoriesView stories={stories} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
