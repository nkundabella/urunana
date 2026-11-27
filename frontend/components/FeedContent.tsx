"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCard, { type StoryItem } from "./StoryCard";
import { filterVisiblePosts, getPosts, type PostStatus } from "@/lib/store";
import styles from "./FeedContent.module.css";

type FeedStory = StoryItem & {
  feed?: boolean;
  category?: string;
  topic?: string;
  status?: PostStatus;
  authorId?: string;
};

type Props = {
  stories: FeedStory[];
};

const CATEGORIES = [
  "Zose",
  "Amateka n'Umurage",
  "Ururimi",
  "Imigani n'Ibisakuzo",
  "Imigenzo Gakondo",
] as const;

export default function FeedContent({ stories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("Zose");
  const [allStories, setAllStories] = useState<FeedStory[]>(stories);

  useEffect(() => {
    setAllStories(getPosts() as FeedStory[]);
  }, []);

  const publicStories = filterVisiblePosts(allStories);
  const visibleStories =
    activeCategory === "Zose"
      ? publicStories.filter((s) => s.feed !== false)
      : publicStories.filter(
          (s) =>
            s.category === activeCategory ||
            (activeCategory === "Ururimi" &&
              s.topic === "Ururimi rw'Ikinyarwanda") ||
            s.topic === activeCategory
        );

  return (
    <div className={styles.container}>
      <div className={styles.chips} role="tablist" aria-label="Ibyiciro by'inkuru">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.chip}${isActive ? ` ${styles.chipActive}` : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className={styles.columns}>
        <section className={styles.feedCol} aria-labelledby="feed-heading">
          <div className={styles.feedHeader}>
            <h2 id="feed-heading" className={styles.feedTitle}>
              Inkuru Ziheruka Kwandikwa
            </h2>
            <span className={styles.feedSort}>Ibishya biheruka (Recency)</span>
          </div>

          <div className={styles.storyList}>
            {visibleStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                href={`/inkuru/${story.slug || story.id}`}
              />
            ))}
          </div>
        </section>

        <aside className={styles.sidebar} aria-label="Ibyatoranyijwe n'umwanditsi">
          <div className={styles.featuredCard}>
            <p className={styles.featuredEyebrow}>IBYATORANYIJWE</p>
            <p className={styles.featuredPrompt}>
              Ikiganiro cy&apos;icyumweru: Ni uwuhe mugani w&apos;Ikinyarwanda
              wagufashije mu buzima?
            </p>
            <Link href="/kwandika" className={styles.featuredBtn}>
              Subiza
            </Link>
          </div>

          <div className={styles.authorCard}>
            <p className={styles.authorEyebrow}>UMWANDITSI W&apos;ICYUMWERU</p>
            <p className={styles.authorName}>Kalisa Mugisha</p>
            <p className={styles.authorSummary}>
              Umwanditsi n&apos;umushakashatsi ku mateka y&apos;u Rwanda
              n&apos;ubuvanganzo nyemvugo bwo mu muryango.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
