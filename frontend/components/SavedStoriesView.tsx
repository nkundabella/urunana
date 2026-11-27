"use client";

import { useEffect, useState } from "react";
import StoryCard from "./StoryCard";
import { apiFetch } from "@/lib/api";
import {
  postToStoryItem,
  type BookmarksResponse,
  type PostDto,
} from "@/lib/api-types";
import styles from "./SavedStoriesView.module.css";

type Props = {
  initialData: BookmarksResponse;
};

type TabId = "inyandiko" | "abo-ukurikira" | "izitaratangazwa";

export default function SavedStoriesView({ initialData }: Props) {
  const [tab, setTab] = useState<TabId>("inyandiko");
  const [data, setData] = useState<BookmarksResponse>(initialData);

  useEffect(() => {
    let cancelled = false;
    apiFetch<BookmarksResponse>("/api/v1/bookmarks")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        // keep SSR data if transient failure
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePosts: PostDto[] =
    tab === "inyandiko"
      ? data.savedPosts
      : tab === "abo-ukurikira"
        ? data.followingPosts
        : data.drafts;

  const emptyText =
    tab === "inyandiko"
      ? "Nta nyandiko urabika kugeza ubu."
      : tab === "abo-ukurikira"
        ? "Nta nkuru z'abo ukurikira ziraboneka."
        : "Nta nyandiko itaratangazwa ufite.";

  return (
    <>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Ibyiciro by'ibyo wabitse"
      >
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

      {visiblePosts.length === 0 ? (
        <p className={styles.empty} role="tabpanel">
          {emptyText}
        </p>
      ) : (
        <div className={styles.grid} role="tabpanel">
          {visiblePosts.map((post) => (
            <StoryCard
              key={post.id}
              story={postToStoryItem(post)}
              href={
                tab === "izitaratangazwa"
                  ? `/inkuru/${post.id}/hindura`
                  : `/inkuru/${post.slug}`
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
