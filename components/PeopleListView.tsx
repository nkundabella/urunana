"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./PeopleListView.module.css";

type PersonItem = {
  id: string;
  name: string;
  handle: string;
  storiesCount: number;
};

const FOLLOWERS: PersonItem[] = [
  {
    id: "uwase-aline",
    name: "Uwase Aline",
    handle: "@uwase_aline",
    storiesCount: 7,
  },
  {
    id: "niyonzima-eric",
    name: "Niyonzima Eric",
    handle: "@niyonzima_eric",
    storiesCount: 4,
  },
  {
    id: "mugabo-eric",
    name: "Mugabo Eric",
    handle: "@mugabo_eric",
    storiesCount: 3,
  },
];

const FOLLOWING: PersonItem[] = [
  {
    id: "uwase-aline",
    name: "Uwase Aline",
    handle: "@uwase_aline",
    storiesCount: 7,
  },
  {
    id: "mukamana-claire",
    name: "Mukamana Claire",
    handle: "@mukamana_c",
    storiesCount: 11,
  },
  {
    id: "habimana-jean",
    name: "Habimana Jean",
    handle: "@habimana_j",
    storiesCount: 5,
  },
];

type TabId = "abagukurikira" | "abo-ukurikira";

export default function PeopleListView() {
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const urlTab: TabId =
    paramTab === "abo-ukurikira" ? "abo-ukurikira" : "abagukurikira";
  const [selected, setSelected] = useState<{
    source: string | null;
    tab: TabId;
  } | null>(null);
  const tab: TabId =
    selected && selected.source === paramTab ? selected.tab : urlTab;

  function setTab(next: TabId) {
    setSelected({ source: paramTab, tab: next });
  }

  const people = tab === "abagukurikira" ? FOLLOWERS : FOLLOWING;

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Ibyiciro by'abantu">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "abagukurikira"}
          className={`${styles.tab}${tab === "abagukurikira" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("abagukurikira")}
        >
          Abagukurikira
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
      </div>

      <div className={styles.list} role="tabpanel">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/umwirondoro/${person.id}`}
            className={styles.card}
          >
            <div className={styles.left}>
              <div className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/blue-baskets.jpg" alt={person.name} />
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{person.name}</span>
                <span className={styles.handle}>{person.handle}</span>
              </div>
            </div>
            <span className={styles.count}>
              {person.storiesCount} inyandiko
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
