"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoryCard, { type StoryItem } from "./StoryCard";
import { filterVisiblePosts, getPosts, type StorePost } from "@/lib/store";
import { getSession } from "@/src/data/session";
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
  const [isOwner, setIsOwner] = useState(false);
  const [tab, setTab] = useState<TabId>("inyandiko");
  const [liveAuthored, setLiveAuthored] = useState<StoryItem[]>(authoredStories);
  const [liveSaved, setLiveSaved] = useState<StoryItem[]>(savedStories);

  useEffect(() => {
    const visible = filterVisiblePosts(getPosts() as StorePost[]);
    const authored = visible.filter(
      (s) =>
        s.authorId === profile.id ||
        s.author.toLowerCase() === profile.name.toLowerCase()
    );
    const saved = visible.filter((s) => s.saved);
    setLiveAuthored(authored);
    setLiveSaved(saved);

    const session = getSession();
    const viewerSlug = session?.displayName
      ? session.displayName.toLowerCase().replace(/\s+/g, "-")
      : "kalisa-mugisha";
    const matchesOwner =
      viewerSlug === profile.id ||
      profile.id.startsWith(viewerSlug) ||
      session?.displayName?.toLowerCase() === profile.name.toLowerCase();
    setIsOwner(matchesOwner);
  }, [profile.id, profile.name]);

  const storyCount = liveAuthored.length > 0 ? String(liveAuthored.length) : "0";
  const followerCount =
    profile.followers !== null
      ? String(profile.followers + (isFollowing ? 1 : 0))
      : "—";
  const followingCount =
    profile.following !== null ? String(profile.following) : "—";

  const visibleStories = tab === "inyandiko" ? liveAuthored : liveSaved;

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

        {isOwner ? (
          <Link href="/igenamiterere" className={styles.editProfileBtn}>
            Hindura umwirondoro
          </Link>
        ) : (
          <button
            type="button"
            className={`${styles.followBtn}${isFollowing ? ` ${styles.followingBtn}` : ""}`}
            aria-pressed={isFollowing}
            onClick={() => setIsFollowing((prev) => !prev)}
          >
            {isFollowing ? "Uramukurikira" : "Kurikira"}
          </button>
        )}
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

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{storyCount}</span>
          <span className={styles.statLabel}>Inyandiko</span>
        </div>
        <Link href="/abantu?tab=abagukurikira" className={styles.statLink}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{followerCount}</span>
            <span className={styles.statLabel}>Abagukurikira</span>
          </div>
        </Link>
        <Link href="/abantu?tab=abo-ukurikira" className={styles.statLink}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{followingCount}</span>
            <span className={styles.statLabel}>Abo ukurikira</span>
          </div>
        </Link>
      </div>

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
          <StoryCard
            key={story.id}
            story={story}
            href={`/inkuru/${story.slug || story.id}`}
          />
        ))}
      </div>
    </div>
  );
}
