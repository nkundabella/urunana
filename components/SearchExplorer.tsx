"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import StoryCard, { type StoryItem } from "./StoryCard";
import { filterVisiblePosts, getPosts, type PostStatus } from "@/lib/store";
import styles from "./SearchExplorer.module.css";

export type SearchStory = StoryItem & {
  feed?: boolean;
  category?: string;
  topic?: string;
  type?: string;
  source?: string;
  language?: string;
  status?: PostStatus;
  authorId?: string;
};

type FilterKey = "topic" | "type" | "source" | "language";

const TOPIC_SLUG_MAP: Record<string, string> = {
  "amateka-n-umurage": "Amateka n'Umurage",
  "ururimi-rw-ikinyarwanda": "Ururimi rw'Ikinyarwanda",
  "imigani-n-ibisakuzo": "Imigani n'Ibisakuzo",
  "ubuvanganzo-n-inkuru": "Ubuvanganzo n'Inkuru",
  "imigenzo-gakondo": "Imigenzo Gakondo",
};

const FILTER_GROUPS: {
  key: FilterKey;
  heading: string;
  options: string[];
}[] = [
  {
    key: "topic",
    heading: "INSANGANYAMATSIKO",
    options: [
      "Amateka n'Umurage",
      "Ururimi rw'Ikinyarwanda",
      "Imigani n'Ibisakuzo",
      "Ubuvanganzo n'Inkuru",
      "Imigenzo Gakondo",
    ],
  },
  {
    key: "type",
    heading: "UBWOKO",
    options: ["Inkuru", "Article"],
  },
  {
    key: "source",
    heading: "INKOMOKO",
    options: ["Personal experience", "Oral tradition"],
  },
  {
    key: "language",
    heading: "URURIMI",
    options: ["Ikinyarwanda", "English"],
  },
];

function resolveTopicParam(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (TOPIC_SLUG_MAP[lower]) return TOPIC_SLUG_MAP[lower];
  const exact = FILTER_GROUPS[0].options.find(
    (opt) => opt.toLowerCase() === lower
  );
  return exact ?? null;
}

type Props = {
  stories: SearchStory[];
};

export default function SearchExplorer({ stories }: Props) {
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";
  const urlTopic = resolveTopicParam(searchParams.get("topic"));

  const [allStories, setAllStories] = useState<SearchStory[]>(stories);
  const [queryInput, setQueryInput] = useState(urlQ);
  const [appliedQuery, setAppliedQuery] = useState(urlQ.trim());
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({
    topic: urlTopic ? [urlTopic] : [],
    type: [],
    source: [],
    language: [],
  });

  useEffect(() => {
    setAllStories(getPosts() as SearchStory[]);
  }, []);

  useEffect(() => {
    setQueryInput(urlQ);
    setAppliedQuery(urlQ.trim());
  }, [urlQ]);

  useEffect(() => {
    if (urlTopic) {
      setSelected((prev) => ({
        ...prev,
        topic: [urlTopic],
      }));
    }
  }, [urlTopic]);

  function toggleFilter(key: FilterKey, option: string) {
    setSelected((prev) => {
      const exists = prev[key].includes(option);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((v) => v !== option)
          : [...prev[key], option],
      };
    });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setAppliedQuery(queryInput.trim());
  }

  function clearAll() {
    setQueryInput("");
    setAppliedQuery("");
    setSelected({ topic: [], type: [], source: [], language: [] });
  }

  const hasFilters =
    appliedQuery.length > 0 ||
    Object.values(selected).some((arr) => arr.length > 0);

  const results = useMemo(() => {
    const visible = filterVisiblePosts(allStories);
    const base = hasFilters ? visible : visible.filter((s) => s.feed !== false);
    const q = appliedQuery.toLowerCase();

    return base.filter((story) => {
      if (q) {
        const hay = `${story.title} ${story.excerpt} ${story.author} ${story.tags
          .map((t) => t.label)
          .join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      for (const group of FILTER_GROUPS) {
        const picks = selected[group.key];
        if (picks.length > 0) {
          if (group.key === "topic") {
            const matchedTopic = picks.some((pick) => {
              if (story.topic === pick || story.category === pick) return true;
              if (
                pick === "Ururimi rw'Ikinyarwanda" &&
                story.category === "Ururimi"
              ) {
                return true;
              }
              if (
                pick === "Ubuvanganzo n'Inkuru" &&
                (story.type === "Inkuru" ||
                  story.tags.some((t) =>
                    t.label.toLowerCase().includes("ubuvanganzo")
                  ))
              ) {
                return true;
              }
              return false;
            });
            if (!matchedTopic) return false;
          } else {
            const val = story[group.key];
            if (!val || !picks.includes(val)) return false;
          }
        }
      }

      return true;
    });
  }, [allStories, hasFilters, appliedQuery, selected]);

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
          {FILTER_GROUPS.map((group) => (
            <fieldset key={group.key} className={styles.group}>
              <legend className={styles.groupHeading}>{group.heading}</legend>
              <div className={styles.options}>
                {group.options.map((option) => {
                  const checked = selected[group.key].includes(option);
                  return (
                    <label key={option} className={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFilter(group.key, option)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkLabel}>{option}</span>
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
              {results.length} inyandiko zabonetse
            </p>
            <span className={styles.sort}>Ibishya biheruka (Chrono)</span>
          </div>

          {results.length > 0 ? (
            <div className={styles.list}>
              {results.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  variant="wide"
                  href={`/inkuru/${story.slug || story.id}`}
                />
              ))}
            </div>
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
