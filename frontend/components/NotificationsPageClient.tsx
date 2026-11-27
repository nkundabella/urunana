"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WovenStrip from "./WovenStrip";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatKinyarwandaDate } from "@/lib/api-types";
import styles from "./NotificationsPageClient.module.css";

type AccentTone = "orange" | "navy" | "red" | "maroon";

type NotificationItem = {
  id: string;
  tone: AccentTone;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export default function NotificationsPageClient() {
  const { refreshAuth } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<NotificationsResponse>("/api/v1/notifications")
      .then((res) => {
        if (cancelled) return;
        setItems(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setUnreadCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markAsRead(id: string) {
    const target = items.find((item) => item.id === id);
    if (!target || target.isRead) return;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await apiFetch<{ unreadCount: number }>(
        `/api/v1/notifications/${encodeURIComponent(id)}/read`,
        { method: "PATCH" }
      );
      setUnreadCount(res.unreadCount);
      await refreshAuth();
    } catch {
      // keep optimistic UI
    }
  }

  async function handleMarkAllRead() {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await apiFetch("/api/v1/notifications/read-all", {
        method: "PATCH",
      });
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      await refreshAuth();
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" notificationCount={unreadCount} />
      <main className={styles.main}>
        <div className={styles.container}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className={styles.eyebrow}>IMENYESHA</p>
              <h1 className={styles.title}>Imenyesha ryawe</h1>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{
                  border: "1.5px solid var(--ink)",
                  borderRadius: "999px",
                  background: "transparent",
                  color: "var(--ink)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  padding: "0.5rem 1.1rem",
                  cursor: "pointer",
                  marginBottom: "0.4rem",
                }}
              >
                {markingAll ? "Gutunganya…" : "Soma byose"}
              </button>
            ) : null}
          </div>

          <div className={styles.list}>
            {loading ? (
              <p className={styles.cardSub}>Biratunganywa…</p>
            ) : items.length === 0 ? (
              <p className={styles.cardSub}>Nta menyesha rishya ufite.</p>
            ) : (
              items.map((item) => {
                const dateLabel = formatKinyarwandaDate(item.createdAt);
                const subtitle = dateLabel
                  ? `${item.message} · ${dateLabel}`
                  : item.message;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.card} ${styles[`tone_${item.tone}`]}`}
                    onClick={() => void markAsRead(item.id)}
                    aria-pressed={item.isRead}
                  >
                    <span
                      className={`${styles.dot}${item.isRead ? ` ${styles.dotRead}` : ""}`}
                      aria-hidden="true"
                    />
                    <span className={styles.body}>
                      <span className={styles.cardTitle}>{item.title}</span>
                      <span className={styles.cardSub}>{subtitle}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
