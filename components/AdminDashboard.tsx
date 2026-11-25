"use client";

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WovenStrip from "./WovenStrip";
import styles from "./AdminDashboard.module.css";

type PeriodId = "7d" | "30d" | "all";
type MainTab = "incamake" | "kugenzura" | "abakoresha" | "igenamiterere";
type QueueFilter = "hidden" | "review" | "done";

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "7d", label: "Iminsi 7" },
  { id: "30d", label: "30" },
  { id: "all", label: "Byose" },
];

const KPIS = [
  { title: "Abanditsi", value: "—", caption: "Contributors" },
  { title: "Abasomyi bakora", value: "—", caption: "Active readers" },
  { title: "Abagaruka", value: "—", caption: "Returning" },
  { title: "Ibitekerezo", value: "—", caption: "Comments" },
  { title: "Inyandiko ku rurimi", value: "—", caption: "Posts by language" },
  {
    title: "Inyandiko ku bwoko bw'ubumenyi",
    value: "—",
    caption: "By knowledge type",
  },
  {
    title: "Abasomyi bahinduka abanditsi",
    value: "—",
    caption: "Reader → contributor",
  },
  {
    title: "Abanditsi basubiramo",
    value: "—",
    caption: "Repeat contributors",
  },
] as const;

const CHARTS = [
  {
    title: "Inyandiko ku rurimi",
    footnote: "Icyitegererezo (sample data)",
    rows: [
      { label: "Ikinyarwanda", pct: 62 },
      { label: "English", pct: 22 },
      { label: "Français", pct: 10 },
      { label: "Mixed", pct: 6 },
    ],
  },
  {
    title: "Ku bwoko bw'ubumenyi",
    rows: [
      { label: "Personal experience", pct: 40 },
      { label: "Family / oral tradition", pct: 30 },
      { label: "Researched", pct: 20 },
      { label: "Interpretation", pct: 10 },
    ],
  },
  {
    title: "Umusomyi → Umwanditsi",
    rows: [
      { label: "Basomyi", pct: 100 },
      { label: "Bakoze igitekerezo", pct: 38 },
      { label: "Batangaje inyandiko", pct: 9 },
    ],
  },
] as const;

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
              Kugenzura &middot; 7
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
                {KPIS.map((kpi) => (
                  <div key={kpi.title} className={styles.card}>
                    <p className={styles.kpiLabel}>{kpi.title}</p>
                    <p className={styles.kpiValue}>{kpi.value}</p>
                    <p className={styles.kpiCaption}>{kpi.caption}</p>
                  </div>
                ))}
              </section>

              {/* 3 Chart Cards */}
              <section className={styles.chartsGrid} aria-label="Imbonerahamwe">
                {CHARTS.map((chart) => (
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
