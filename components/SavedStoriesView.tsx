"use client";

import { useEffect, useState } from "react";
import StoryCard, { type StoryItem } from "./StoryCard";
import {
  filterVisiblePosts,
  getPosts,
  type PostStatus,
  type StorePost,
} from "@/lib/store";
import { getSession } from "@/src/data/session";
import styles from "./SavedStoriesView.module.css";

type StoryRecord = StoryItem & {
  saved?: boolean;
  following?: boolean;
  status?: PostStatus;
  authorId?: string;
};

type Props = {
  stories: StoryRecord[];
};

type TabId = "inyandiko" | "abo-ukurikira" | "izitaratangazwa";

export default function SavedStoriesView({ stories }: Props) {
  const [tab, setTab] = useState<TabId>("inyandiko");
  const [allPosts, setAllPosts] = useState<StoryRecord[]>(stories);
  const [viewerSlug, setViewerSlug] = useState("kalisa-mugisha");

  useEffect(() => {
    const stored = getPosts() as StorePost[];
    setAllPosts(stored);
    const session = getSession();
    if (session?.displayName) {
      setViewerSlug(session.displayName.toLowerCase().replace(/\s+/g, "-"));
    }
  }, []);

  const publicStories = filterVisiblePosts(allPosts);
  const myDrafts = allPosts.filter((s) => {
    if (s.status !== "draft") return false;
    const authorId = s.authorId ?? "";
    return authorId === viewerSlug || authorId.startsWith(viewerSlug);
  });

  const visibleStories =
    tab === "inyandiko"
      ? publicStories.filter((s) => s.saved)
      : tab === "abo-ukurikira"
        ? publicStories.filter((s) => s.following)
        : myDrafts;

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
        <button
          type="button"
          role="tab"
          aria-selected={tab === "izitaratangazwa"}
          className={`${styles.tab}${tab === "izitaratangazwa" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("izitaratangazwa")}
        >
          Izitaratangazwa
        </button>
      </div>

      {tab === "izitaratangazwa" && visibleStories.length === 0 ? (
        <p className={styles.empty} role="tabpanel">
          Nta nyandiko itaratangazwa ufite.
        </p>
      ) : (
        <div className={styles.grid} role="tabpanel">
          {visibleStories.map((story) => {
            if (tab === "izitaratangazwa") {
              const hasDraftTag = story.tags.some(
                (t) => t.label === "Itaratangazwa"
              );
              const draftStory: StoryItem = {
                ...story,
                tags: hasDraftTag
                  ? story.tags
                  : [
                      { label: "Itaratangazwa", tone: "sand" },
                      ...story.tags,
                    ],
              };
              return (
                <StoryCard
                  key={story.id}
                  story={draftStory}
                  href={`/inkuru/${story.slug || story.id}/hindura`}
                />
              );
            }
            return (
              <StoryCard
                key={story.id}
                story={story}
                href={`/inkuru/${story.slug || story.id}`}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
