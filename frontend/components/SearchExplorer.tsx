"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StoryCard from "./StoryCard";
import { apiFetch } from "@/lib/api";
import {
  postToStoryItem,
  type PostDto,
  type PostsListResponse,
  type TopicCategoryDto,
} from "@/lib/api-types";
import styles from "./SearchExplorer.module.css";

type FilterKey = "topic" | "type" | "source" | "language";

const LEGACY_TOPIC_ALIASES: Record<string, string> = {
  "amateka-n-umurage": "history-heritage",
  "ururimi-rw-ikinyarwanda": "kinyarwanda-language",
  "imigani-n-ibisakuzo": "proverbs-riddles",
  "ubuvanganzo-n-inkuru": "oral-traditions-stories",
  "imigenzo-gakondo": "traditional-practices",
};

const STATIC_FILTER_GROUPS: Array<{
  key: Exclude<FilterKey, "topic">;
  heading: string;
  options: Array<{ value: string; label: string }>;
}> = [
  {
    key: "type",
    heading: "UBWOKO",
    options: [
      { value: "Inkuru", label: "Inkuru" },
      { value: "Article", label: "Article" },
    ],
  },
  {
    key: "source",
    heading: "INKOMOKO",
    options: [
      { value: "Personal experience", label: "Personal experience" },
      { value: "Oral tradition", label: "Oral tradition" },
      { value: "Researched", label: "Researched" },
    ],
  },
  {
    key: "language",
    heading: "URURIMI",
    options: [
      { value: "KINYARWANDA", label: "Ikinyarwanda" },
      { value: "ENGLISH", label: "English" },
      { value: "FRENCH", label: "Français" },
      { value: "MIXED", label: "Ikinyarwanda / English" },
    ],
  },
];

function normalizeTopicParam(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  return LEGACY_TOPIC_ALIASES[lower] ?? trimmed;
}

type Props = {
  initialCategories?: TopicCategoryDto[];
  initialPosts?: PostDto[];
  initialTotal?: number;
};

export default function SearchExplorer({
  initialCategories = [],
  initialPosts = [],
  initialTotal = 0,
}: Props) {
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const urlTopic = normalizeTopicParam(searchParams.get("topic"));

  const [categories, setCategories] =
    useState<TopicCategoryDto[]>(initialCategories);
  const [posts, setPosts] = useState<PostDto[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [queryInput, setQueryInput] = useState(urlQ);
  const [appliedQuery, setAppliedQuery] = useState(urlQ.trim());
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({
    topic: urlTopic ? [urlTopic] : [],
    type: [],
    source: [],
    language: [],
  });

  const isFirstFetchRef = useRef(true);

  useEffect(() => {
    if (categories.length > 0) return;
    let cancelled = false;
    apiFetch<{ categories: TopicCategoryDto[] }>("/api/v1/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.categories);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [categories.length]);

  useEffect(() => {
    setQueryInput(urlQ);
    setAppliedQuery(urlQ.trim());
    setPage(1);
  }, [urlQ]);

  useEffect(() => {
    if (urlTopic) {
      setSelected((prev) => ({
        ...prev,
        topic: [urlTopic],
      }));
      setPage(1);
    }
  }, [urlTopic]);

  useEffect(() => {
    const hasInitialParams = Boolean(urlQ.trim() || urlTopic);
    if (
      isFirstFetchRef.current &&
      !hasInitialParams &&
      initialPosts.length > 0 &&
      page === 1 &&
      !appliedQuery &&
      Object.values(selected).every((arr) => arr.length === 0)
    ) {
      isFirstFetchRef.current = false;
      return;
    }
    isFirstFetchRef.current = false;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (appliedQuery) params.set("q", appliedQuery);
        if (selected.topic.length > 0) {
          params.set("topic", selected.topic.join(","));
        }
        if (selected.type.length > 0) {
          params.set("type", selected.type.join(","));
        }
        if (selected.source.length > 0) {
          params.set("source", selected.source.join(","));
        }
        if (selected.language.length > 0) {
          params.set("language", selected.language.join(","));
        }

        const res = await apiFetch<PostsListResponse>(
          `/api/v1/posts?${params.toString()}`
        );
        if (!cancelled) {
          setPosts(res.posts);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        }
      } catch {
        // Keep previous state on transient network error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [appliedQuery, selected, page, initialPosts.length, urlQ, urlTopic]);

  function toggleFilter(key: FilterKey, value: string) {
    setPage(1);
    setSelected((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      };
    });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(queryInput.trim());
  }

  function clearAll() {
    setQueryInput("");
    setAppliedQuery("");
    setSelected({ topic: [], type: [], source: [], language: [] });
    setPage(1);
  }

  const topicOptions =
    categories.length > 0
      ? categories.map((c) => ({ value: c.slug, label: c.nameRw }))
      : [
          { value: "history-heritage", label: "Amateka n'Umurage" },
          { value: "kinyarwanda-language", label: "Ururimi rw'Ikinyarwanda" },
          { value: "proverbs-riddles", label: "Imigani n'Ibisakuzo" },
          { value: "oral-traditions-stories", label: "Ubuvanganzo n'Inkuru" },
          { value: "traditional-practices", label: "Imigenzo Gakondo" },
        ];

  return (
    <div className={styles.container}>
      <form className={styles.searchRow} onSubmit={handleSearch} role="search">
        <input
          type="search"
          className={styles.searchInput}
          value={queryInput}
          onChange={(e) => {
            setQueryInput(e.target.value);
            setAppliedQuery(e.target.value.trim());
            setPage(1);
          }}
          placeholder="Shakisha ku mutwe cyangwa mu mubiri..."
          aria-label="Shakisha ku mutwe cyangwa mu mubiri"
        />
        <button type="submit" className={styles.searchBtn}>
          Shakisha
        </button>
      </form>

      <div className={styles.columns}>
        <aside className={styles.filterCard} aria-label="Guhitamo">
          <p className={styles.filterEyebrow}>GUHITAMO</p>

          <fieldset className={styles.group}>
            <legend className={styles.groupHeading}>INSANGANYAMATSIKO</legend>
            <div className={styles.options}>
              {topicOptions.map((option) => {
                const checked = selected.topic.includes(option.value);
                return (
                  <label key={option.value} className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilter("topic", option.value)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkLabel}>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {STATIC_FILTER_GROUPS.map((group) => (
            <fieldset key={group.key} className={styles.group}>
              <legend className={styles.groupHeading}>{group.heading}</legend>
              <div className={styles.options}>
                {group.options.map((option) => {
                  const checked = selected[group.key].includes(option.value);
                  return (
                    <label key={option.value} className={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFilter(group.key, option.value)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkLabel}>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </aside>

        <section className={styles.resultsCol} aria-live="polite">
          <div className={styles.resultsHeader}>
            <p className={styles.count}>
              {loading
                ? "Gushakisha…"
                : `${total} inyandiko zabonetse`}
            </p>
            <span className={styles.sort}>Ibishya biheruka (Chrono)</span>
          </div>

          {posts.length > 0 ? (
            <>
              <div className={styles.list}>
                {posts.map((post) => (
                  <StoryCard
                    key={post.id}
                    story={postToStoryItem(post)}
                    variant="wide"
                    href={`/inkuru/${post.slug}`}
                  />
                ))}
              </div>
              {totalPages > 1 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "1.5rem",
                  }}
                >
                  <button
                    type="button"
                    className={styles.resetBtn}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Izibanza
                  </button>
                  <span className={styles.sort}>
                    Urupapuro {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.resetBtn}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Izikurikira →
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nta bisubizo bibonetse</p>
              <p className={styles.emptySub}>
                Gerageza guhindura ijambo ushakisha cyangwa amahitamo yawe.
              </p>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={clearAll}
              >
                Siba amahitamo
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
