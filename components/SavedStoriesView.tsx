"use client";

import { useState } from "react";
import StoryCard, { type StoryItem } from "./StoryCard";
import styles from "./SavedStoriesView.module.css";

type StoryRecord = StoryItem & {
  saved?: boolean;
  following?: boolean;
};

type Props = {
  stories: StoryRecord[];
};

type TabId = "inyandiko" | "abo-ukurikira";

export default function SavedStoriesView({ stories }: Props) {
  const [tab, setTab] = useState<TabId>("inyandiko");

  const visibleStories =
    tab === "inyandiko"
      ? stories.filter((s) => s.saved)
      : stories.filter((s) => s.following);

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Ibyiciro by'ibyo wabitse">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "inyandiko"}
          className={`${styles.tab}${tab === "inyandiko" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("inyandiko")}
        >
          Inyandiko
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "abo-ukurikira"}
          className={`${styles.tab}${tab === "abo-ukurikira" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("abo-ukurikira")}
        >
          Abo ukurikira
        </button>
      </div>

      <div className={styles.grid} role="tabpanel">
        {visibleStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </>
  );
}
