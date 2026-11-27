"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WovenStrip from "./WovenStrip";
import {
  getPostById,
  getPosts,
  listRemovalRequests,
  resolveRequest,
  type RemovalAction,
  type RemovalReason,
  type RemovalRequest,
  type StorePost,
} from "@/lib/store";
import styles from "./AdminDashboard.module.css";

const REASON_LABELS: Record<RemovalReason, string> = {
  ikosa: "Ikosa ryanjye",
  "amakuru-bwite": "Amakuru bwite",
  ikindi: "Ikindi",
};

type PeriodId = "7d" | "30d" | "all";
type MainTab = "incamake" | "kugenzura" | "abakoresha" | "igenamiterere";
type QueueFilter = "hidden" | "review" | "done";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "7d", label: "Iminsi 7" },
  { id: "30d", label: "30" },
  { id: "all", label: "Byose" },
];

const PERIOD_BASELINES: Record<
  PeriodId,
  {
    contributors: number;
    activeReaders: number;
    returningPct: number;
    commentsBase: number;
    postsBase: number;
    readerToContributorPct: number;
    repeatContributors: number;
    languageCounts: { rw: number; en: number; fr: number; mixed: number };
    sourceCounts: {
      personal: number;
      oral: number;
      researched: number;
      interpretation: number;
    };
    funnel: { commentPct: number; publishPct: number };
  }
> = {
  "7d": {
    contributors: 4,
    activeReaders: 148,
    returningPct: 64,
    commentsBase: 18,
    postsBase: 10,
    readerToContributorPct: 11,
    repeatContributors: 3,
    languageCounts: { rw: 7, en: 2, fr: 1, mixed: 0 },
    sourceCounts: { personal: 3, oral: 4, researched: 2, interpretation: 1 },
    funnel: { commentPct: 44, publishPct: 11 },
  },
  "30d": {
    contributors: 16,
    activeReaders: 512,
    returningPct: 58,
    commentsBase: 98,
    postsBase: 42,
    readerToContributorPct: 9,
    repeatContributors: 11,
    languageCounts: { rw: 26, en: 9, fr: 4, mixed: 3 },
    sourceCounts: { personal: 17, oral: 12, researched: 9, interpretation: 4 },
    funnel: { commentPct: 38, publishPct: 9 },
  },
  all: {
    contributors: 39,
    activeReaders: 1840,
    returningPct: 52,
    commentsBase: 372,
    postsBase: 159,
    readerToContributorPct: 8,
    repeatContributors: 26,
    languageCounts: { rw: 98, en: 35, fr: 16, mixed: 10 },
    sourceCounts: { personal: 64, oral: 47, researched: 32, interpretation: 16 },
    funnel: { commentPct: 34, publishPct: 8 },
  },
};

function toPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return counts.map(() => 0);
  const raw = counts.map((n) => Math.round((n / total) * 100));
  const diff = 100 - raw.reduce((sum, n) => sum + n, 0);
  if (diff !== 0 && raw.length > 0) {
    raw[0] = Math.max(0, raw[0] + diff);
  }
  return raw;
}

type QueueItem = {
  id: string;
  item: string;
  reports: number;
  reason: string;
  status: string;
  statusVariant: "filled" | "outline";
  hasSuspend: boolean;
  bucket: QueueFilter;
};

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: "q-1",
    item: "[Inyandiko]",
    reports: 3,
    reason: "Iterabwoba · Ubuzima bwite",
    status: "Byihishe ako kanya",
    statusVariant: "filled",
    hasSuspend: true,
    bucket: "hidden",
  },
  {
    id: "q-2",
    item: "[Igitekerezo]",
    reports: 5,
    reason: "Spam · Kwiyitirira igihangano cy'abandi",
    status: "Byihishe: bigeze kuri N",
    statusVariant: "filled",
    hasSuspend: false,
    bucket: "hidden",
  },
  {
    id: "q-3",
    item: "[Inyandiko]",
    reports: 2,
    reason: "Gutoteza",
    status: "Kugenzura bisanzwe",
    statusVariant: "outline",
    hasSuspend: true,
    bucket: "review",
  },
  {
    id: "q-4",
    item: "[Igitekerezo]",
    reports: 1,
    reason: "Ukuri kuvugwaho",
    status: "Kugenzura bisanzwe",
    statusVariant: "outline",
    hasSuspend: false,
    bucket: "review",
  },
];

const MOCK_USERS = [
  {
    name: "Kalisa Mugisha",
    handle: "@kalisa",
    role: "Umwanditsi Washinze",
    posts: 3,
    status: "Arakora",
  },
  {
    name: "Uwase Aline",
    handle: "@uwase_aline",
    role: "Umwanditsi",
    posts: 7,
    status: "Arakora",
  },
  {
    name: "Niyonzima Eric",
    handle: "@niyonzima_eric",
    role: "Umwanditsi",
    posts: 4,
    status: "Arakora",
  },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<PeriodId>("7d");
  const [activeTab, setActiveTab] = useState<MainTab>("incamake");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("hidden");
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [topics, setTopics] = useState<string[]>([
    "Amateka",
    "Ururimi",
    "Imigani",
  ]);
  const [codesUsed, setCodesUsed] = useState(0);
  const [threshold, setThreshold] = useState(3);
  const [referenceNow] = useState<number>(() => Date.now());
  const [posts, setPosts] = useState<StorePost[]>([]);
  const [removalRequests, setRemovalRequests] = useState<
    Array<RemovalRequest & { postTitle: string; postAuthor: string }>
  >([]);

  function refreshRemovalRequests() {
    setPosts(getPosts());
    const pending = listRemovalRequests()
      .filter((r) => r.status === "pending")
      .map((r) => {
        const post = getPostById(r.postId);
        return {
          ...r,
          postTitle: post?.title ?? r.postId,
          postAuthor: post?.author ?? "Umwanditsi",
        };
      });
    setRemovalRequests(pending);
  }

  useEffect(() => {
    refreshRemovalRequests();
  }, []);

  const { kpis, charts } = useMemo(() => {
    const baseline = PERIOD_BASELINES[period];
    const cutoffDays = period === "7d" ? 7 : period === "30d" ? 30 : null;
    const publishedPosts = posts.filter((p) => p.status === "published");
    const periodPosts = publishedPosts.filter((p) => {
      if (cutoffDays === null) return true;
      if (!p.publishedAt) return false;
      const ms = new Date(p.publishedAt).getTime();
      if (Number.isNaN(ms)) return false;
      return referenceNow - ms <= cutoffDays * 24 * 60 * 60 * 1000;
    });

    const uniqueAuthors = new Set(periodPosts.map((p) => p.authorId || p.author)).size;
    const periodComments = periodPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalPosts = baseline.postsBase + periodPosts.length;

    const langCounts = { ...baseline.languageCounts };
    const srcCounts = { ...baseline.sourceCounts };

    for (const p of periodPosts) {
      const lang = (p.language || "Ikinyarwanda").toLowerCase();
      if (lang.includes("kinyarwanda")) langCounts.rw += 1;
      else if (lang.includes("english")) langCounts.en += 1;
      else if (lang.includes("fran")) langCounts.fr += 1;
      else langCounts.mixed += 1;

      const src = (p.source || "").toLowerCase();
      if (src.includes("personal")) srcCounts.personal += 1;
      else if (src.includes("oral") || src.includes("family")) srcCounts.oral += 1;
      else if (src.includes("research")) srcCounts.researched += 1;
      else srcCounts.interpretation += 1;
    }

    const [rwPct, enPct, frPct, mixedPct] = toPercentages([
      langCounts.rw,
      langCounts.en,
      langCounts.fr,
      langCounts.mixed,
    ]);
    const [personalPct, oralPct, researchedPct, interpPct] = toPercentages([
      srcCounts.personal,
      srcCounts.oral,
      srcCounts.researched,
      srcCounts.interpretation,
    ]);

    const nextKpis = [
      {
        title: "Abanditsi",
        value: String(baseline.contributors + uniqueAuthors),
        caption: "Contributors",
      },
      {
        title: "Abasomyi bakora",
        value: baseline.activeReaders.toLocaleString("en-US"),
        caption: "Active readers",
      },
      {
        title: "Abagaruka",
        value: `${baseline.returningPct}%`,
        caption: "Returning",
      },
      {
        title: "Ibitekerezo",
        value: String(baseline.commentsBase + periodComments),
        caption: "Comments",
      },
      {
        title: "Inyandiko ku rurimi",
        value: `${totalPosts}`,
        caption: "Posts by language",
      },
      {
        title: "Inyandiko ku bwoko bw'ubumenyi",
        value: `${oralPct}%`,
        caption: "By knowledge type",
      },
      {
        title: "Abasomyi bahinduka abanditsi",
        value: `${baseline.readerToContributorPct}%`,
        caption: "Reader → contributor",
      },
      {
        title: "Abanditsi basubiramo",
        value: String(baseline.repeatContributors),
        caption: "Repeat contributors",
      },
    ];

    const nextCharts = [
      {
        title: "Inyandiko ku rurimi",
        footnote: "Icyitegererezo (sample data)",
        rows: [
          { label: "Ikinyarwanda", pct: rwPct },
          { label: "English", pct: enPct },
          { label: "Français", pct: frPct },
          { label: "Mixed", pct: mixedPct },
        ],
      },
      {
        title: "Ku bwoko bw'ubumenyi",
        rows: [
          { label: "Personal experience", pct: personalPct },
          { label: "Family / oral tradition", pct: oralPct },
          { label: "Researched", pct: researchedPct },
          { label: "Interpretation", pct: interpPct },
        ],
      },
      {
        title: "Umusomyi → Umwanditsi",
        rows: [
          { label: "Basomyi", pct: 100 },
          { label: "Bakoze igitekerezo", pct: baseline.funnel.commentPct },
          { label: "Batangaje inyandiko", pct: baseline.funnel.publishPct },
        ],
      },
    ];

    return { kpis: nextKpis, charts: nextCharts };
  }, [period, posts, referenceNow]);

  function handleResolveRemoval(id: string, action: RemovalAction) {
    if (action === "siba") {
      const ok = window.confirm(
        "Siba iyi nyandiko burundu? Ntibishoboka kuyigarura."
      );
      if (!ok) return;
    }
    resolveRequest(id, action);
    refreshRemovalRequests();
  }

  const baseQueueCount = queue.filter((q) => q.bucket !== "done").length + 1;
  const moderationTotal = baseQueueCount + removalRequests.length;

  function resolveItem(id: string) {
    setQueue((prev) =>
      prev.map((row) => (row.id === id ? { ...row, bucket: "done" } : row))
    );
  }

  function addTopic() {
    const nextNames = ["Imigenzo", "Ubugeni", "Indirimbo", "Ibisakuzo"];
    const candidate = nextNames.find((n) => !topics.includes(n));
    if (candidate) {
      setTopics((prev) => [...prev, candidate]);
    }
  }

  const visibleQueue =
    queueFilter === "done"
      ? queue.filter((q) => q.bucket === "done")
      : queueFilter === "review"
        ? queue.filter((q) => q.bucket === "review")
        : queue.filter((q) => q.bucket !== "done");

  const showOverview = activeTab === "incamake";
  const showQueue = activeTab === "incamake" || activeTab === "kugenzura";
  const showUsers = activeTab === "abakoresha";
  const showSettings = activeTab === "incamake" || activeTab === "igenamiterere";

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" />

      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>UBUYOBOZI &middot; ADMIN</p>
          <h1 className={styles.title}>Ibiro by&apos;ubuyobozi bw&apos;urubuga</h1>

          {/* Period filter pills */}
          <div className={styles.pillRow} role="group" aria-label="Igihe">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.pill}${period === p.id ? ` ${styles.pillActive}` : ""}`}
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Main navigation tabs */}
          <div className={styles.pillRow} role="tablist" aria-label="Ibyiciro by'ubuyobozi">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "incamake"}
              className={`${styles.pill}${activeTab === "incamake" ? ` ${styles.pillActive}` : ""}`}
              onClick={() => setActiveTab("incamake")}
            >
              Incamake
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "kugenzura"}
              className={`${styles.pill}${activeTab === "kugenzura" ? ` ${styles.pillActive}` : ""}`}
              onClick={() => setActiveTab("kugenzura")}
            >
              Kugenzura &middot; {moderationTotal}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "abakoresha"}
              className={`${styles.pill}${activeTab === "abakoresha" ? ` ${styles.pillActive}` : ""}`}
              onClick={() => setActiveTab("abakoresha")}
            >
              Abakoresha
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "igenamiterere"}
              className={`${styles.pill}${activeTab === "igenamiterere" ? ` ${styles.pillActive}` : ""}`}
              onClick={() => setActiveTab("igenamiterere")}
            >
              Igenamiterere
            </button>
          </div>

          {showOverview && (
            <>
              {/* 4x2 KPI Grid */}
              <section className={styles.kpiGrid} aria-label="Imibare y'ingenzi">
                {kpis.map((kpi) => (
                  <div key={kpi.title} className={styles.card}>
                    <p className={styles.kpiLabel}>{kpi.title}</p>
                    <p className={styles.kpiValue}>{kpi.value}</p>
                    <p className={styles.kpiCaption}>{kpi.caption}</p>
                  </div>
                ))}
              </section>

              {/* 3 Chart Cards */}
              <section className={styles.chartsGrid} aria-label="Imbonerahamwe">
                {charts.map((chart) => (
                  <div key={chart.title} className={styles.card}>
                    <h2 className={styles.cardHeading}>{chart.title}</h2>
                    <div className={styles.bars}>
                      {chart.rows.map((row, idx) => (
                        <div key={row.label} className={styles.barRow}>
                          <div className={styles.barMeta}>
                            <span className={styles.barLabel}>{row.label}</span>
                            <span className={styles.barPct}>{row.pct}%</span>
                          </div>
                          <div className={styles.barTrack}>
                            <div
                              className={`${styles.barFill} ${styles[`barTone${idx}`]}`}
                              style={{ width: `${row.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {"footnote" in chart && chart.footnote ? (
                      <p className={styles.footnote}>{chart.footnote}</p>
                    ) : null}
                  </div>
                ))}
              </section>
            </>
          )}

          {activeTab === "kugenzura" && (
            <section
              className={styles.removalCard}
              aria-labelledby="removal-requests-heading"
            >
              <h2 id="removal-requests-heading" className={styles.removalHeading}>
                Ubusabe bwo gukuraho
              </h2>

              {removalRequests.length > 0 ? (
                <div className={styles.removalList}>
                  {removalRequests.map((req) => (
                    <div key={req.id} className={styles.removalRow}>
                      <div className={styles.removalInfo}>
                        <p className={styles.removalTitle}>{req.postTitle}</p>
                        <p className={styles.removalMeta}>
                          {req.postAuthor} &middot;{" "}
                          {REASON_LABELS[req.reason] ?? req.reason}
                        </p>
                      </div>
                      <div className={styles.removalActions}>
                        <button
                          type="button"
                          className={styles.removalPillOrange}
                          onClick={() => handleResolveRemoval(req.id, "emeza")}
                        >
                          Emeza
                        </button>
                        <button
                          type="button"
                          className={styles.removalPillOutline}
                          onClick={() => handleResolveRemoval(req.id, "siba")}
                        >
                          Siba burundu
                        </button>
                        <button
                          type="button"
                          className={styles.removalPillOutline}
                          onClick={() =>
                            handleResolveRemoval(req.id, "hagarika")
                          }
                        >
                          Hagarika
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.removalEmpty}>Nta busabe buhari.</p>
              )}
            </section>
          )}

          {showQueue && (
            <section className={styles.section} aria-labelledby="queue-heading">
              <div className={styles.sectionHeader}>
                <h2 id="queue-heading" className={styles.sectionTitle}>
                  Urutonde rw&apos;ibisuzumwa
                </h2>
                <span className={styles.sectionMeta}>
                  Raporo zihurijwe hamwe
                </span>
              </div>

              <div className={styles.pillRow} role="tablist" aria-label="Ibisuzumwa">
                <button
                  type="button"
                  role="tab"
                  aria-selected={queueFilter === "hidden"}
                  className={`${styles.pill}${queueFilter === "hidden" ? ` ${styles.pillActive}` : ""}`}
                  onClick={() => setQueueFilter("hidden")}
                >
                  Byihishe byonyine &middot; 4
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={queueFilter === "review"}
                  className={`${styles.pill}${queueFilter === "review" ? ` ${styles.pillActive}` : ""}`}
                  onClick={() => setQueueFilter("review")}
                >
                  Bigomba kugenzurwa &middot; 3
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={queueFilter === "done"}
                  className={`${styles.pill}${queueFilter === "done" ? ` ${styles.pillActive}` : ""}`}
                  onClick={() => setQueueFilter("done")}
                >
                  Byarangiye
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ikintu</th>
                      <th>Raporo</th>
                      <th>Impamvu</th>
                      <th>Uko bimeze</th>
                      <th>Igikorwa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleQueue.length > 0 ? (
                      visibleQueue.map((row) => (
                        <tr key={row.id}>
                          <td className={styles.cellItem}>{row.item}</td>
                          <td className={styles.cellNum}>{row.reports}</td>
                          <td className={styles.cellReason}>{row.reason}</td>
                          <td>
                            <span
                              className={
                                row.statusVariant === "filled"
                                  ? styles.statusFilled
                                  : styles.statusOutline
                              }
                            >
                              {row.status}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                type="button"
                                className={styles.actionOutline}
                                onClick={() => resolveItem(row.id)}
                              >
                                Bireke
                              </button>
                              <button
                                type="button"
                                className={styles.actionOutline}
                                onClick={() => resolveItem(row.id)}
                              >
                                Subizaho
                              </button>
                              <button
                                type="button"
                                className={styles.actionOutline}
                                onClick={() => resolveItem(row.id)}
                              >
                                Kuburira
                              </button>
                              <button
                                type="button"
                                className={styles.actionFilled}
                                onClick={() => resolveItem(row.id)}
                              >
                                Kuraho
                              </button>
                              {row.hasSuspend ? (
                                <button
                                  type="button"
                                  className={styles.actionOutline}
                                  onClick={() => resolveItem(row.id)}
                                >
                                  Hagarika konti by&apos;agateganyo
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className={styles.emptyRow}>
                          Nta raporo zihari muri iki cyiciro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {showUsers && (
            <section className={styles.section} aria-labelledby="users-heading">
              <div className={styles.sectionHeader}>
                <h2 id="users-heading" className={styles.sectionTitle}>
                  Abakoresha
                </h2>
                <span className={styles.sectionMeta}>
                  {MOCK_USERS.length} abanditsi bakora
                </span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Izina</th>
                      <th>Konti</th>
                      <th>Uruhare</th>
                      <th>Inyandiko</th>
                      <th>Uko bimeze</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_USERS.map((u) => (
                      <tr key={u.handle}>
                        <td className={styles.cellItem}>{u.name}</td>
                        <td className={styles.cellReason}>{u.handle}</td>
                        <td className={styles.cellReason}>{u.role}</td>
                        <td className={styles.cellNum}>{u.posts}</td>
                        <td>
                          <span className={styles.statusOutline}>{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {showSettings && (
            <section className={styles.section} aria-labelledby="settings-heading">
              <h2 id="settings-heading" className={styles.sectionTitle}>
                Igenamiterere
              </h2>

              <div className={styles.settingsGrid}>
                {/* Card 1: Topics */}
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>Insanganyamatsiko</h3>
                  <div className={styles.topicChips}>
                    {topics.map((topic) => (
                      <span key={topic} className={styles.topicChip}>
                        {topic}
                      </span>
                    ))}
                    <button
                      type="button"
                      className={styles.addChip}
                      onClick={addTopic}
                    >
                      + Ongeraho
                    </button>
                  </div>
                </div>

                {/* Card 2: Founding codes */}
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>
                    Kode z&apos;Abashinze (~30)
                  </h3>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(codesUsed / 30) * 100}%` }}
                    />
                  </div>
                  <p className={styles.settingNote}>
                    {codesUsed} / 30 zakoreshejwe
                  </p>
                  <button
                    type="button"
                    className={styles.orangeBtn}
                    onClick={() => setCodesUsed((c) => Math.min(30, c + 1))}
                  >
                    Kora kode
                  </button>
                </div>

                {/* Card 3: Report threshold slider */}
                <div className={styles.card}>
                  <h3 className={styles.cardHeading}>
                    Umubare w&apos;abatanze raporo (N)
                  </h3>
                  <div className={styles.sliderWrap}>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className={styles.slider}
                      aria-label="Umubare w'abatanze raporo"
                    />
                  </div>
                  <p className={styles.settingNote}>Ku spam na plagiarism</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
