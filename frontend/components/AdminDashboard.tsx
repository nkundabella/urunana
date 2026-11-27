"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WovenStrip from "./WovenStrip";
import { ApiError, apiFetch } from "@/lib/api";
import styles from "./AdminDashboard.module.css";

type PeriodId = "7d" | "30d" | "all";
type MainTab = "incamake" | "kugenzura" | "abakoresha" | "igenamiterere";
type QueueFilter = "hidden" | "review" | "done";
type RemovalAction = "emeza" | "siba" | "hagarika";
type ModerationAction =
  | "Bireke"
  | "Subizaho"
  | "Kuburira"
  | "Kuraho"
  | "Hagarika konti";

const REASON_LABELS: Record<string, string> = {
  IKOSA: "Ikosa ryanjye",
  AMAKURU_BWITE: "Amakuru bwite",
  IKINDI: "Ikindi",
};

const PERIODS: { id: PeriodId; label: string }[] = [
  { id: "7d", label: "Iminsi 7" },
  { id: "30d", label: "30" },
  { id: "all", label: "Byose" },
];

type OverviewKpi = {
  id: string;
  title: string;
  value: string | null;
  caption: string;
};

type OverviewChart = {
  id: string;
  title: string;
  rows: Array<{ label: string; pct: number; count: number }>;
};

type TopicItem = {
  id: string;
  slug: string;
  nameRw: string;
  nameEn: string;
};

type OverviewResponse = {
  period: PeriodId;
  kpis: OverviewKpi[];
  charts: OverviewChart[];
  counts: {
    pendingRemovalRequests: number;
    openReports: number;
  };
  settings: {
    reportThreshold: number;
  };
  topics: TopicItem[];
  foundingCodes: {
    total: number;
    used: number;
    target: number;
  };
};

type RemovalRequestRow = {
  id: string;
  publicationId: string | null;
  postTitle: string;
  postAuthor: string;
  reason: string | null;
  notes: string | null;
  status: string;
};

type QueueItem = {
  id: string;
  targetType: "PUBLICATION" | "COMMENT";
  targetId: string;
  item: string;
  reports: number;
  reason: string;
  ruleCited: string;
  status: string;
  statusVariant: "filled" | "outline";
  hasSuspend: boolean;
  bucket: QueueFilter;
};

type QueueResponse = {
  filter: QueueFilter;
  counts: { hidden: number; review: number; done: number };
  items: QueueItem[];
};

type AdminUserRow = {
  id: string;
  displayName: string;
  handle: string;
  role: string;
  postsCount: number;
  statusLabel: string;
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState<PeriodId>("7d");
  const [activeTab, setActiveTab] = useState<MainTab>("incamake");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("hidden");

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [removalRequests, setRemovalRequests] = useState<RemovalRequestRow[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueCounts, setQueueCounts] = useState({ hidden: 0, review: 0, done: 0 });
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [showTopicInput, setShowTopicInput] = useState(false);

  const [codesStats, setCodesStats] = useState({ total: 0, used: 0, target: 30 });
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(3);

  const [accessError, setAccessError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const loadOverview = useCallback(async (nextPeriod: PeriodId) => {
    try {
      const res = await apiFetch<OverviewResponse>(
        `/api/v1/admin/overview?period=${nextPeriod}`
      );
      setOverview(res);
      setTopics(res.topics);
      setThreshold(res.settings.reportThreshold);
      setCodesStats(res.foundingCodes);
      setAccessError(null);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setAccessError(err.message);
      }
    }
  }, []);

  const loadQueue = useCallback(async (filter: QueueFilter) => {
    try {
      const res = await apiFetch<QueueResponse>(
        `/api/v1/admin/moderation-queue?filter=${filter}`
      );
      setQueueItems(res.items);
      setQueueCounts(res.counts);
    } catch {
      // handled via overview access error
    }
  }, []);

  const loadRemovalRequests = useCallback(async () => {
    try {
      const res = await apiFetch<{ removalRequests: RemovalRequestRow[] }>(
        "/api/v1/admin/removal-requests"
      );
      setRemovalRequests(res.removalRequests);
    } catch {
      // ignore
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await apiFetch<{ users: AdminUserRow[] }>(
        "/api/v1/admin/users"
      );
      setUsers(res.users);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadOverview(period);
  }, [period, loadOverview]);

  useEffect(() => {
    void loadQueue(queueFilter);
  }, [queueFilter, loadQueue]);

  useEffect(() => {
    void loadRemovalRequests();
    void loadUsers();
  }, [loadRemovalRequests, loadUsers]);

  async function handleResolveRemoval(id: string, action: RemovalAction) {
    if (action === "siba") {
      const ok = window.confirm(
        "Siba iyi nyandiko burundu? Ntibishoboka kuyigarura."
      );
      if (!ok) return;
    }
    setStatusNotice(null);
    try {
      await apiFetch(`/api/v1/admin/removal-requests/${encodeURIComponent(id)}/resolve`, {
        method: "POST",
        json: { action },
      });
      await Promise.all([loadRemovalRequests(), loadOverview(period)]);
      setStatusNotice("Ubusabe bwasuzumwe neza.");
    } catch (err) {
      setStatusNotice(
        err instanceof ApiError ? err.message : "Ntibyakunze gusuzuma ubusabe."
      );
    }
  }

  async function handleQueueAction(item: QueueItem, action: ModerationAction) {
    setStatusNotice(null);
    try {
      await apiFetch(
        `/api/v1/admin/moderation-queue/${encodeURIComponent(item.id)}/action`,
        {
          method: "POST",
          json: {
            action,
            ruleCited: item.ruleCited,
          },
        }
      );
      await Promise.all([loadQueue(queueFilter), loadOverview(period), loadUsers()]);
      setStatusNotice(`Igikorwa "${action}" cyakozwe neza.`);
    } catch (err) {
      setStatusNotice(
        err instanceof ApiError ? err.message : "Ntibyakunze kurangiza igikorwa."
      );
    }
  }

  async function handleCreateTopic(e: FormEvent) {
    e.preventDefault();
    const trimmed = newTopicName.trim();
    if (trimmed.length < 2) return;
    setStatusNotice(null);
    try {
      const res = await apiFetch<{ category: TopicItem }>("/api/v1/admin/topics", {
        method: "POST",
        json: { nameRw: trimmed },
      });
      setTopics((prev) => [...prev, res.category]);
      setNewTopicName("");
      setShowTopicInput(false);
      setStatusNotice(`Insanganyamatsiko "${res.category.nameRw}" yongeweho.`);
    } catch (err) {
      setStatusNotice(
        err instanceof ApiError ? err.message : "Ntibyakunze kongeraho insanganyamatsiko."
      );
    }
  }

  async function handleGenerateCode() {
    setStatusNotice(null);
    try {
      const res = await apiFetch<{
        inviteCode: { code: string };
        stats: { total: number; used: number; target: number };
      }>("/api/v1/admin/founding-codes", {
        method: "POST",
      });
      setLastGeneratedCode(res.inviteCode.code);
      setCodesStats(res.stats);
      setStatusNotice(`Kode nshya yakozwe: ${res.inviteCode.code}`);
    } catch (err) {
      setStatusNotice(
        err instanceof ApiError ? err.message : "Ntibyakunze gukora kode nshya."
      );
    }
  }

  async function handleThresholdChange(nextVal: number) {
    setThreshold(nextVal);
    try {
      const res = await apiFetch<{ threshold: number }>(
        "/api/v1/admin/settings/report-threshold",
        {
          method: "PATCH",
          json: { threshold: nextVal },
        }
      );
      setThreshold(res.threshold);
      setStatusNotice(`Umubare w'abatanze raporo (N) washyizwe kuri ${res.threshold}.`);
    } catch (err) {
      setStatusNotice(
        err instanceof ApiError ? err.message : "Ntibyakunze guhindura igenamiterere."
      );
    }
  }

  const moderationTotal =
    queueCounts.hidden + queueCounts.review + removalRequests.length;

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
          <h1 className={styles.title}>
            Ibiro by&apos;ubuyobozi bw&apos;urubuga
          </h1>

          {accessError ? (
            <div className={styles.card} role="alert" style={{ marginTop: "1.5rem" }}>
              <p className={styles.cardHeading}>Nta burenganzira</p>
              <p className={styles.settingNote}>{accessError}</p>
            </div>
          ) : (
            <>
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
              <div
                className={styles.pillRow}
                role="tablist"
                aria-label="Ibyiciro by'ubuyobozi"
              >
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

              {statusNotice ? (
                <p
                  role="status"
                  aria-live="polite"
                  style={{
                    margin: "0.75rem 0",
                    color: "var(--teal)",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                  }}
                >
                  {statusNotice}
                </p>
              ) : null}

              {showOverview && overview && (
                <>
                  {/* 4x2 KPI Grid */}
                  <section
                    className={styles.kpiGrid}
                    aria-label="Imibare y'ingenzi"
                  >
                    {overview.kpis.map((kpi) => (
                      <div key={kpi.id} className={styles.card}>
                        <p className={styles.kpiLabel}>{kpi.title}</p>
                        <p className={styles.kpiValue}>{kpi.value ?? "—"}</p>
                        <p className={styles.kpiCaption}>{kpi.caption}</p>
                      </div>
                    ))}
                  </section>

                  {/* 3 Chart Cards */}
                  <section
                    className={styles.chartsGrid}
                    aria-label="Imbonerahamwe"
                  >
                    {overview.charts.map((chart) => (
                      <div key={chart.id} className={styles.card}>
                        <h2 className={styles.cardHeading}>{chart.title}</h2>
                        <div className={styles.bars}>
                          {chart.rows.map((row, idx) => (
                            <div key={row.label} className={styles.barRow}>
                              <div className={styles.barMeta}>
                                <span className={styles.barLabel}>
                                  {row.label}
                                </span>
                                <span className={styles.barPct}>
                                  {row.pct}%
                                </span>
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
                  <h2
                    id="removal-requests-heading"
                    className={styles.removalHeading}
                  >
                    Ubusabe bwo gukuraho
                  </h2>

                  {removalRequests.length > 0 ? (
                    <div className={styles.removalList}>
                      {removalRequests.map((req) => (
                        <div key={req.id} className={styles.removalRow}>
                          <div className={styles.removalInfo}>
                            <p className={styles.removalTitle}>
                              {req.postTitle}
                            </p>
                            <p className={styles.removalMeta}>
                              {req.postAuthor} &middot;{" "}
                              {(req.reason && REASON_LABELS[req.reason]) ||
                                req.reason ||
                                "Ikindi"}
                            </p>
                          </div>
                          <div className={styles.removalActions}>
                            <button
                              type="button"
                              className={styles.removalPillOrange}
                              onClick={() =>
                                void handleResolveRemoval(req.id, "emeza")
                              }
                            >
                              Emeza
                            </button>
                            <button
                              type="button"
                              className={styles.removalPillOutline}
                              onClick={() =>
                                void handleResolveRemoval(req.id, "siba")
                              }
                            >
                              Siba burundu
                            </button>
                            <button
                              type="button"
                              className={styles.removalPillOutline}
                              onClick={() =>
                                void handleResolveRemoval(req.id, "hagarika")
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
                <section
                  className={styles.section}
                  aria-labelledby="queue-heading"
                >
                  <div className={styles.sectionHeader}>
                    <h2 id="queue-heading" className={styles.sectionTitle}>
                      Urutonde rw&apos;ibisuzumwa
                    </h2>
                    <span className={styles.sectionMeta}>
                      Raporo zihurijwe hamwe
                    </span>
                  </div>

                  <div
                    className={styles.pillRow}
                    role="tablist"
                    aria-label="Ibisuzumwa"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={queueFilter === "hidden"}
                      className={`${styles.pill}${queueFilter === "hidden" ? ` ${styles.pillActive}` : ""}`}
                      onClick={() => setQueueFilter("hidden")}
                    >
                      Byihishe byonyine &middot; {queueCounts.hidden}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={queueFilter === "review"}
                      className={`${styles.pill}${queueFilter === "review" ? ` ${styles.pillActive}` : ""}`}
                      onClick={() => setQueueFilter("review")}
                    >
                      Bigomba kugenzurwa &middot; {queueCounts.review}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={queueFilter === "done"}
                      className={`${styles.pill}${queueFilter === "done" ? ` ${styles.pillActive}` : ""}`}
                      onClick={() => setQueueFilter("done")}
                    >
                      Byarangiye &middot; {queueCounts.done}
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
                        {queueItems.length > 0 ? (
                          queueItems.map((row) => (
                            <tr key={row.id}>
                              <td className={styles.cellItem}>{row.item}</td>
                              <td className={styles.cellNum}>{row.reports}</td>
                              <td className={styles.cellReason}>
                                {row.reason}
                              </td>
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
                                    onClick={() =>
                                      void handleQueueAction(row, "Bireke")
                                    }
                                  >
                                    Bireke
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.actionOutline}
                                    onClick={() =>
                                      void handleQueueAction(row, "Subizaho")
                                    }
                                  >
                                    Subizaho
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.actionOutline}
                                    onClick={() =>
                                      void handleQueueAction(row, "Kuburira")
                                    }
                                  >
                                    Kuburira
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.actionFilled}
                                    onClick={() =>
                                      void handleQueueAction(row, "Kuraho")
                                    }
                                  >
                                    Kuraho
                                  </button>
                                  {row.hasSuspend ? (
                                    <button
                                      type="button"
                                      className={styles.actionOutline}
                                      onClick={() =>
                                        void handleQueueAction(
                                          row,
                                          "Hagarika konti"
                                        )
                                      }
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
                <section
                  className={styles.section}
                  aria-labelledby="users-heading"
                >
                  <div className={styles.sectionHeader}>
                    <h2 id="users-heading" className={styles.sectionTitle}>
                      Abakoresha
                    </h2>
                    <span className={styles.sectionMeta}>
                      {users.length} abakoresha banditse
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
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td className={styles.cellItem}>{u.displayName}</td>
                            <td className={styles.cellReason}>{u.handle}</td>
                            <td className={styles.cellReason}>{u.role}</td>
                            <td className={styles.cellNum}>{u.postsCount}</td>
                            <td>
                              <span className={styles.statusOutline}>
                                {u.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {showSettings && (
                <section
                  className={styles.section}
                  aria-labelledby="settings-heading"
                >
                  <h2 id="settings-heading" className={styles.sectionTitle}>
                    Igenamiterere
                  </h2>

                  <div className={styles.settingsGrid}>
                    {/* Card 1: Topics */}
                    <div className={styles.card}>
                      <h3 className={styles.cardHeading}>Insanganyamatsiko</h3>
                      <div className={styles.topicChips}>
                        {topics.map((topic) => (
                          <span key={topic.id} className={styles.topicChip}>
                            {topic.nameRw}
                          </span>
                        ))}
                        {!showTopicInput ? (
                          <button
                            type="button"
                            className={styles.addChip}
                            onClick={() => setShowTopicInput(true)}
                          >
                            + Ongeraho
                          </button>
                        ) : null}
                      </div>
                      {showTopicInput ? (
                        <form
                          onSubmit={handleCreateTopic}
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "0.75rem",
                          }}
                        >
                          <input
                            type="text"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            placeholder="Izina ry'insanganyamatsiko..."
                            style={{
                              flex: 1,
                              padding: "0.4rem 0.65rem",
                              border: "1px solid var(--line)",
                              borderRadius: "8px",
                              fontSize: "0.875rem",
                            }}
                          />
                          <button type="submit" className={styles.orangeBtn}>
                            Bika
                          </button>
                        </form>
                      ) : null}
                    </div>

                    {/* Card 2: Founding codes */}
                    <div className={styles.card}>
                      <h3 className={styles.cardHeading}>
                        Kode z&apos;Abashinze (~{codesStats.target})
                      </h3>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${Math.min(100, (codesStats.used / codesStats.target) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className={styles.settingNote}>
                        {codesStats.used} / {codesStats.target} zakoreshejwe (
                        {codesStats.total} zakozwe)
                      </p>
                      {lastGeneratedCode ? (
                        <p
                          className={styles.settingNote}
                          style={{ fontWeight: 700, color: "var(--maroon)" }}
                        >
                          Kode nshya: {lastGeneratedCode}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className={styles.orangeBtn}
                        onClick={() => void handleGenerateCode()}
                      >
                        Kora kode
                      </button>
                    </div>

                    {/* Card 3: Report threshold slider */}
                    <div className={styles.card}>
                      <h3 className={styles.cardHeading}>
                        Umubare w&apos;abatanze raporo (N = {threshold})
                      </h3>
                      <div className={styles.sliderWrap}>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={threshold}
                          onChange={(e) =>
                            void handleThresholdChange(Number(e.target.value))
                          }
                          className={styles.slider}
                          aria-label="Umubare w'abatanze raporo"
                        />
                      </div>
                      <p className={styles.settingNote}>
                        Ku spam na plagiarism
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
