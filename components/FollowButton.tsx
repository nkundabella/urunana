"use client";

import React, { useState } from "react";
import { toggleFollowAction } from "@/app/actions/publications";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowerCount,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await toggleFollowAction(targetUserId);
      if (res && "following" in res && typeof res.following === "boolean") {
        setFollowing(res.following);
        setFollowerCount((prev) => (res.following ? prev + 1 : Math.max(0, prev - 1)));
      } else if (res && "error" in res && res.error) {
        alert(res.error);
      }
    } catch {
      alert("Habaye ikosa. Ongera ugerageze.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs active:scale-95 disabled:opacity-50 ${
          following
            ? isHovered
              ? "bg-rose-50 text-rose-700 border border-rose-300"
              : "bg-emerald-50 text-emerald-900 border border-emerald-200"
            : "bg-emerald-800 text-white hover:bg-emerald-900"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : following ? (
          isHovered ? (
            <span>Rekera aho</span>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Urakurikira</span>
            </>
          )
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Kurikira</span>
          </>
        )}
      </button>

      <span className="text-xs text-stone-500">
        <strong className="font-semibold text-stone-800">{followerCount}</strong>{" "}
        {followerCount === 1 ? "umukunzi" : "abakunzi"}
      </span>
    </div>
  );
}

