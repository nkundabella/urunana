"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoryCard from "./StoryCard";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { postToStoryItem, type ProfileResponse } from "@/lib/api-types";
import styles from "./ProfileView.module.css";

type Props = {
  initialData: ProfileResponse;
};

type TabId = "inyandiko" | "byabitswe";

export default function ProfileView({ initialData }: Props) {
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [data, setData] = useState<ProfileResponse>(initialData);
  const [isFollowing, setIsFollowing] = useState(initialData.isFollowing);
  const [followersCount, setFollowersCount] = useState(
    initialData.stats.followersCount
  );
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [tab, setTab] = useState<TabId>("inyandiko");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
    setIsFollowing(initialData.isFollowing);
    setFollowersCount(initialData.stats.followersCount);
  }, [initialData]);

  const profile = data.user;
  const isOwner = Boolean(
    data.isOwner || (authUser && authUser.id === profile.id)
  );

  async function handleToggleFollow() {
    if (!authUser) {
      router.push(
        `/kwinjira?next=${encodeURIComponent(`/umwirondoro/${profile.username}`)}`
      );
      return;
    }
    if (togglingFollow) return;
    setTogglingFollow(true);
    setError(null);
    try {
      const res = await apiFetch<{
        following: boolean;
        followersCount: number;
      }>(`/api/v1/users/${profile.id}/follow`, {
        method: "POST",
      });
      setIsFollowing(res.following);
      setFollowersCount(res.followersCount);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze guhindura gukurikira."
      );
    } finally {
      setTogglingFollow(false);
    }
  }

  const visiblePosts = tab === "inyandiko" ? data.posts : data.savedPosts;

  return (
    <div className={styles.container}>
      <div className={styles.identityRow}>
        <div className={styles.identityLeft}>
          <div className={styles.avatar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.profilePhotoUrl || "/assets/blue-baskets.jpg"}
              alt={profile.displayName}
            />
          </div>

          <div className={styles.nameBlock}>
            <h1 className={styles.name}>{profile.displayName}</h1>
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
            disabled={togglingFollow}
            onClick={handleToggleFollow}
          >
            {isFollowing ? "Uramukurikira" : "Kurikira"}
          </button>
        )}
      </div>

      {error ? (
        <p role="alert" style={{ color: "var(--red)", marginTop: "0.75rem" }}>
          {error}
        </p>
      ) : null}

      {profile.bio ? <p className={styles.bio}>{profile.bio}</p> : null}

      {profile.areasOfInterest.length > 0 ? (
        <div className={styles.interests}>
          {profile.areasOfInterest.map((interest) => (
            <span key={interest} className={styles.interestChip}>
              {interest}
            </span>
          ))}
        </div>
      ) : null}

      <hr className={styles.divider} />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{data.stats.postsCount}</span>
          <span className={styles.statLabel}>Inyandiko</span>
        </div>
        <Link
          href={`/abantu?user=${encodeURIComponent(profile.username)}&tab=abagukurikira`}
          className={styles.statLink}
        >
          <div className={styles.stat}>
            <span className={styles.statValue}>{followersCount}</span>
            <span className={styles.statLabel}>Abagukurikira</span>
          </div>
        </Link>
        <Link
          href={`/abantu?user=${encodeURIComponent(profile.username)}&tab=abo-ukurikira`}
          className={styles.statLink}
        >
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.stats.followingCount}</span>
            <span className={styles.statLabel}>Abo ukurikira</span>
          </div>
        </Link>
      </div>

      <hr className={styles.divider} />

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Ibyiciro by'umwirondoro"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "inyandiko"}
          className={`${styles.tab}${tab === "inyandiko" ? ` ${styles.tabActive}` : ""}`}
          onClick={() => setTab("inyandiko")}
        >
          Inyandiko
        </button>
        {isOwner ? (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "byabitswe"}
            className={`${styles.tab}${tab === "byabitswe" ? ` ${styles.tabActive}` : ""}`}
            onClick={() => setTab("byabitswe")}
          >
            Byabitswe
          </button>
        ) : null}
      </div>

      {visiblePosts.length === 0 ? (
        <p className={styles.bio} role="tabpanel">
          {tab === "inyandiko"
            ? "Nta nyandiko iratangazwa kugeza ubu."
            : "Nta nyandiko urabika kugeza ubu."}
        </p>
      ) : (
        <div className={styles.grid} role="tabpanel">
          {visiblePosts.map((post) => (
            <StoryCard
              key={post.id}
              story={postToStoryItem(post)}
              href={`/inkuru/${post.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
