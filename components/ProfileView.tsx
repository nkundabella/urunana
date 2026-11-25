"use client";

import { useState } from "react";
import StoryCard, { type StoryItem } from "./StoryCard";
import styles from "./ProfileView.module.css";

export type ProfileData = {
  id: string;
  name: string;
  badge: string;
  bio: string;
  interests: string[];
  followers: number | null;
  following: number | null;
};

type Props = {
  profile: ProfileData;
  authoredStories: StoryItem[];
  savedStories: StoryItem[];
};

type TabId = "inyandiko" | "byabitswe";

export default function ProfileView({
  profile,
  authoredStories,
  savedStories,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<TabId>("inyandiko");

  const storyCount = authoredStories.length > 0 ? String(authoredStories.length) : "—";
  const followerCount =
    profile.followers !== null
      ? String(profile.followers + (isFollowing ? 1 : 0))
      : "—";
  const followingCount =
    profile.following !== null ? String(profile.following) : "—";

  const visibleStories = tab === "inyandiko" ? authoredStories : savedStories;

  return (
    <div className={styles.container}>
      <div className={styles.identityRow}>
        <div className={styles.identityLeft}>
          <div className={styles.avatar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/blue-baskets.jpg" alt={profile.name} />
          </div>

          <div className={styles.nameBlock}>
            <h1 className={styles.name}>{profile.name}</h1>
            <span className={styles.badge}>{profile.badge}</span>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.followBtn}${isFollowing ? ` ${styles.followingBtn}` : ""}`}
          aria-pressed={isFollowing}
          onClick={() => setIsFollowing((prev) => !prev)}
        >
          {isFollowing ? "Uramukurikira" : "Kurikira"}
        </button>
      </div>

      <p className={styles.bio}>{profile.bio}</p>

      <div className={styles.interests}>
        {profile.interests.map((interest) => (
          <span key={interest} className={styles.interestChip}>
            {interest}
          </span>
        ))}
      </div>

      <hr className={styles.divider} />

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dd className={styles.statValue}>{storyCount}</dd>
          <dt className={styles.statLabel}>Inyandiko</dt>
        </div>
        <div className={styles.stat}>
          <dd className={styles.statValue}>{followerCount}</dd>
          <dt className={styles.statLabel}>Abagukurikira</dt>
        </div>
        <div className={styles.stat}>
          <dd className={styles.statValue}>{followingCount}</dd>
          <dt className={styles.statLabel}>Abo ukurikira</dt>
        </div>
      </dl>

      <hr className={styles.divider} />

      <div className={styles.tabs} role="tablist" aria-label="Ibyiciro by'umwirondoro">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "inyandiko"}
          className={`${styles.tab}${tab === "inyandiko" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("inyandiko")}
        >
          Inyandiko
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "byabitswe"}
          className={`${styles.tab}${tab === "byabitswe" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("byabitswe")}
        >
          Byabitswe
        </button>
      </div>

      <div className={styles.grid} role="tabpanel">
        {visibleStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
