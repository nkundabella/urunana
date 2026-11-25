"use client";

import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WovenStrip from "./WovenStrip";
import styles from "./NotificationsPageClient.module.css";

type AccentTone = "orange" | "navy" | "red" | "maroon";

type NotificationItem = {
  id: string;
  tone: AccentTone;
  title: string;
  subtitle: string;
  read: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    tone: "orange",
    title: "Yasubije igitekerezo cyawe",
    subtitle: "Mugabo Eric · ku nkuru yawe · hashize amasaha 2",
    read: false,
  },
  {
    id: "n-2",
    tone: "navy",
    title: "Ufite ugukurikira mushya",
    subtitle: "Uwase Aline · hashize amasaha 5",
    read: false,
  },
  {
    id: "n-3",
    tone: "red",
    title: "Inyandiko yawe yahishwe by'agateganyo",
    subtitle: "Reba impamvu n'icyo wakora · hashize umunsi 1",
    read: false,
  },
  {
    id: "n-4",
    tone: "maroon",
    title: "Ijambo ry'icyumweru ryashyizwe hanze",
    subtitle: "Urunana · hashize iminsi 2",
    read: false,
  },
];

export default function NotificationsPageClient() {
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = items.filter((item) => !item.read).length;

  function markAsRead(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" notificationCount={unreadCount} />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>IMENYESHA</p>
          <h1 className={styles.title}>Imenyesha ryawe</h1>

          <div className={styles.list}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.card} ${styles[`tone_${item.tone}`]}`}
                onClick={() => markAsRead(item.id)}
                aria-pressed={item.read}
              >
                <span
                  className={`${styles.dot}${item.read ? ` ${styles.dotRead}` : ""}`}
                  aria-hidden="true"
                />
                <span className={styles.body}>
                  <span className={styles.cardTitle}>{item.title}</span>
                  <span className={styles.cardSub}>{item.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
