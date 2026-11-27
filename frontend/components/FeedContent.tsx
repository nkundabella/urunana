"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCard from "./StoryCard";
import { apiFetch } from "@/lib/api";
import {
  postToStoryItem,
  type AuthorSummaryDto,
  type PostDto,
  type PostsListResponse,
  type TopicCategoryDto,
} from "@/lib/api-types";
import styles from "./FeedContent.module.css";

type Props = {
  initialPosts: PostDto[];
  categories: TopicCategoryDto[];
  featuredPrompt: string;
  authorOfTheWeek: AuthorSummaryDto | null;
};

export default function FeedContent({
  initialPosts,
  categories,
  featuredPrompt,
  authorOfTheWeek,
}: Props) {
  const [activeTopicSlug, setActiveTopicSlug] = useState<string>("all");
  const [posts, setPosts] = useState<PostDto[]>(initialPosts);
  const [loading, setLoading] = useState(false);

  const chipCategories = categories.slice(0, 6);

  useEffect(() => {
    let cancelled = false;
    async function loadPosts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (activeTopicSlug !== "all") {
          params.set("topic", activeTopicSlug);
        }
        const res = await apiFetch<PostsListResponse>(
          `/api/v1/posts?${params.toString()}`
        );
        if (!cancelled) {
          setPosts(res.posts);
        }
      } catch {
        // Keep current posts visible on transient failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (activeTopicSlug === "all" && initialPosts.length > 0 && posts === initialPosts) {
      return;
    }
    void loadPosts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopicSlug]);

  return (
    <div className={styles.container}>
      <div
        className={styles.chips}
        role="tablist"
        aria-label="Ibyiciro by'inkuru"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTopicSlug === "all"}
          className={`${styles.chip}${activeTopicSlug === "all" ? ` ${styles.chipActive}` : ""}`}
          onClick={() => setActiveTopicSlug("all")}
        >
          Zose
        </button>
        {chipCategories.map((category) => {
          const isActive = activeTopicSlug === category.slug;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.chip}${isActive ? ` ${styles.chipActive}` : ""}`}
              onClick={() => setActiveTopicSlug(category.slug)}
            >
              {category.nameRw}
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
            <span className={styles.feedSort}>
              {loading ? "Biratunganywa…" : "Ibishya biheruka (Recency)"}
            </span>
          </div>

          <div className={styles.storyList}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <StoryCard
                  key={post.id}
                  story={postToStoryItem(post)}
                  href={`/inkuru/${post.slug}`}
                />
              ))
            ) : (
              <p className={styles.feedSort}>
                Nta nkuru iraboneka muri iki cyiciro.
              </p>
            )}
          </div>
        </section>

        <aside
          className={styles.sidebar}
          aria-label="Ibyatoranyijwe n'umwanditsi"
        >
          <div className={styles.featuredCard}>
            <p className={styles.featuredEyebrow}>IBYATORANYIJWE</p>
            <p className={styles.featuredPrompt}>{featuredPrompt}</p>
            <Link href="/kwandika" className={styles.featuredBtn}>
              Subiza
            </Link>
          </div>

          <div className={styles.authorCard}>
            <p className={styles.authorEyebrow}>UMWANDITSI W&apos;ICYUMWERU</p>
            {authorOfTheWeek ? (
              <>
                <p className={styles.authorName}>
                  <Link
                    href={`/umwirondoro/${authorOfTheWeek.username}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {authorOfTheWeek.displayName}
                  </Link>
                </p>
                <p className={styles.authorSummary}>
                  {authorOfTheWeek.bio ||
                    "Umwanditsi n'umushakashatsi ku mateka y'u Rwanda n'ubuvanganzo nyemvugo bwo mu muryango."}
                </p>
              </>
            ) : (
              <>
                <p className={styles.authorName}>Kalisa Mugisha</p>
                <p className={styles.authorSummary}>
                  Umwanditsi n&apos;umushakashatsi ku mateka y&apos;u Rwanda
                  n&apos;ubuvanganzo nyemvugo bwo mu muryango.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
