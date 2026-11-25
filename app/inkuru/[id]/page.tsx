import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import StoryDetailView from "@/components/StoryDetailView";
import storiesData from "@/src/data/stories.json";
import type { StoryItem } from "@/components/StoryCard";
import styles from "./story.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const stories = storiesData as StoryItem[];
  const story =
    stories.find((s) => s.slug === id || s.id === id) ?? stories[0];
  return {
    title: `${story.title} — Urunana`,
    description: story.excerpt,
  };
}

export default async function StoryDetailPage({ params }: Props) {
  const { id } = await params;
  const stories = storiesData as StoryItem[];
  const story =
    stories.find((s) => s.slug === id || s.id === id) ?? stories[0];

  const authorSlug = story.author.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <div className={styles.patternBand} aria-hidden="true" />
      <main className={styles.main}>
        <StoryDetailView
          slug={story.slug}
          title={story.title}
          author={story.author}
          authorSlug={authorSlug}
        />
      </main>
      <Footer />
    </div>
  );
}
