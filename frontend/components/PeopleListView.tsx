"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { PeopleListResponse, PersonListItemDto } from "@/lib/api-types";
import styles from "./PeopleListView.module.css";

type TabId = "abagukurikira" | "abo-ukurikira";

type Props = {
  eyebrowClassName?: string;
  titleClassName?: string;
};

export default function PeopleListView({
  eyebrowClassName,
  titleClassName,
}: Props) {
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();

  const paramTab = searchParams.get("tab");
  const paramUser = searchParams.get("user")?.trim() || "";
  const targetUser = paramUser || authUser?.username || "kalisa_m";

  const urlTab: TabId =
    paramTab === "abo-ukurikira" ? "abo-ukurikira" : "abagukurikira";
  const [selected, setSelected] = useState<{
    source: string | null;
    tab: TabId;
  } | null>(null);
  const tab: TabId =
    selected && selected.source === paramTab ? selected.tab : urlTab;

  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [followers, setFollowers] = useState<PersonListItemDto[]>([]);
  const [following, setFollowing] = useState<PersonListItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiFetch<PeopleListResponse>(
        `/api/v1/users/${encodeURIComponent(targetUser)}/followers`
      ),
      apiFetch<PeopleListResponse>(
        `/api/v1/users/${encodeURIComponent(targetUser)}/following`
      ),
    ])
      .then(([followersRes, followingRes]) => {
        if (cancelled) return;
        setProfileDisplayName(followersRes.user.displayName);
        setFollowers(followersRes.people);
        setFollowing(followingRes.people);
      })
      .catch(() => {
        if (!cancelled) {
          setFollowers([]);
          setFollowing([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetUser]);

  function setTab(next: TabId) {
    setSelected({ source: paramTab, tab: next });
  }

  const people = tab === "abagukurikira" ? followers : following;

  return (
    <>
      <p className={eyebrowClassName}>
        {(profileDisplayName || targetUser).toUpperCase()}
      </p>
      <h1 className={titleClassName}>Abantu</h1>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Ibyiciro by'abantu"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "abagukurikira"}
          className={`${styles.tab}${tab === "abagukurikira" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("abagukurikira")}
        >
          Abagukurikira ({followers.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "abo-ukurikira"}
          className={`${styles.tab}${tab === "abo-ukurikira" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("abo-ukurikira")}
        >
          Abo ukurikira ({following.length})
        </button>
      </div>

      <div className={styles.list} role="tabpanel">
        {loading ? (
          <p className={styles.count}>Biratunganywa…</p>
        ) : people.length === 0 ? (
          <p className={styles.count}>
            {tab === "abagukurikira"
              ? "Nta bantu bagukurikira baraboneka."
              : "Nta bantu ukurikira baraboneka."}
          </p>
        ) : (
          people.map((person) => (
            <Link
              key={person.id}
              href={`/umwirondoro/${person.username}`}
              className={styles.card}
            >
              <div className={styles.left}>
                <div className={styles.thumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.profilePhotoUrl || "/assets/blue-baskets.jpg"}
                    alt={person.displayName}
                  />
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{person.displayName}</span>
                  <span className={styles.handle}>@{person.username}</span>
                </div>
              </div>
              <span className={styles.count}>
                {person.storiesCount} inyandiko
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
