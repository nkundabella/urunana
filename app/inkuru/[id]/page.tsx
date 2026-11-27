import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import StoryDetailView from "@/components/StoryDetailView";
import storiesData from "@/src/data/stories.json";
import type { StorePost } from "@/lib/store";
import styles from "./story.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const stories = storiesData as StorePost[];
  const story =
    stories.find((s) => s.slug === id || s.id === id) ?? stories[0];
  return {
    title: `${story.title} — Urunana`,
    description: story.excerpt,
  };
}

export default async function StoryDetailPage({ params }: Props) {
  const { id } = await params;
  const stories = storiesData as StorePost[];
  const matched = stories.find((s) => s.slug === id || s.id === id);
  const story = matched ?? stories[0];

  const authorSlug = story.authorId || story.author.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <div className={styles.patternBand} aria-hidden="true" />
      <main className={styles.main}>
        <StoryDetailView
          routeId={id}
          postId={matched ? matched.id : id}
          slug={matched ? matched.slug : id}
          title={story.title}
          author={story.author}
          authorSlug={authorSlug}
          status={story.status}
          publishedAt={story.publishedAt}
          initialSaved={Boolean(matched?.saved)}
          initialTags={matched?.tags}
        />
      </main>
      <Footer />
    </div>
  );
}
