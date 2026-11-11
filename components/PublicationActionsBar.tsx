"use client";

import React, { useState } from "react";
import {
  appreciateStoryAction,
  toggleBookmarkAction,
} from "@/app/actions/publications";
import ReportModal from "@/components/ReportModal";
import {
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  Flag,
  Check,
  Copy,
  Send,
  Loader2,
} from "lucide-react";

interface PublicationActionsBarProps {
  publicationId: string;
  publicationTitle: string;
  commentCount: number;
  initialBookmarked?: boolean;
}

export default function PublicationActionsBar({
  publicationId,
  publicationTitle,
  commentCount,
  initialBookmarked = false,
}: PublicationActionsBarProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isAppreciated, setIsAppreciated] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);

  async function handleAppreciate() {
    if (isAppreciated) return;
    setIsAppreciated(true);
    try {
      await appreciateStoryAction(publicationId);
    } catch {
      // quiet fail
    }
  }

  async function handleBookmark() {
    setLoadingBookmark(true);
    try {
      const res = await toggleBookmarkAction(publicationId);
      if (res && typeof res.bookmarked === "boolean") {
        setIsBookmarked(res.bookmarked);
      }
    } catch {
      // quiet fail
    } finally {
      setLoadingBookmark(false);
    }
  }

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleWhatsAppShare() {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Soma iyi nkuru gakondo ku Urunana: "${publicationTitle}"\n`);
      window.open(`https://api.whatsapp.com/send?text=${text}${url}`, "_blank");
    }
  }

  function handleTwitterShare() {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Soma iyi nkuru ku Urunana: "${publicationTitle}" #Urunana #RwandaCulture\n`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    }
  }

  function scrollToDiscussion() {
    const el = document.getElementById("discussion");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="relative py-4 my-6 border-y border-stone-200 flex items-center justify-between text-xs text-stone-600">
      {/* Left side actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Gushima (Appreciate / Thank Author) */}
        <button
          type="button"
          onClick={handleAppreciate}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-medium transition ${
            isAppreciated
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "hover:bg-stone-100 text-stone-700"
          }`}
          title="Shima umwanditsi (Thank the storyteller)"
        >
          <Heart className={`w-4 h-4 ${isAppreciated ? "fill-rose-600 text-rose-600" : ""}`} />
          <span>{isAppreciated ? "Washimiye umwanditsi" : "Gushima"}</span>
        </button>

        {/* Scroll to Comments */}
        <button
          type="button"
          onClick={scrollToDiscussion}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-stone-100 text-stone-700 font-medium transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{commentCount} Ibitekerezo</span>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-2">
        {/* Bookmark */}
        <button
          type="button"
          onClick={handleBookmark}
          disabled={loadingBookmark}
          className={`p-2 rounded-full transition ${
            isBookmarked
              ? "bg-emerald-100 text-emerald-900"
              : "hover:bg-stone-100 text-stone-600 hover:text-stone-900"
          }`}
          title={isBookmarked ? "Yabitswe mu byo wasomye" : "Bika iyi nkuru (Bookmark)"}
        >
          {loadingBookmark ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-emerald-800 text-emerald-800" : ""}`} />
          )}
        </button>

        {/* Share Popover Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsShareOpen(!isShareOpen)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full hover:bg-stone-100 text-stone-700 font-medium transition"
            title="Sangiza abandi (Share)"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Sangiza</span>
          </button>

          {isShareOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-20 text-xs divide-y divide-stone-100">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full flex items-center space-x-2 px-3 py-2 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 text-left"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sangiza kuri WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleTwitterShare}
                className="w-full flex items-center space-x-2 px-3 py-2 text-stone-700 hover:bg-stone-50 text-left"
              >
                <span className="font-bold text-xs text-stone-600">𝕏</span>
                <span>Sangiza kuri X / Twitter</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-2 px-3 py-2 text-stone-700 hover:bg-stone-50 text-left"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                <span>{copied ? "Ihuza ryafashwe!" : "Kopera Ihuza (Copy Link)"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Report Button */}
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-rose-700 transition"
          title="Tanga raporo ku bibangamye (Report)"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        publicationId={publicationId}
        targetTitle={publicationTitle}
      />
    </div>
  );
}

