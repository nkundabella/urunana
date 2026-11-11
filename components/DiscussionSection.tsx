"use client";

import React, { useState } from "react";
import { deleteCommentAction } from "@/app/actions/publications";
import { useRouter } from "next/navigation";
import ReportModal from "@/components/ReportModal";
import CommentForm from "@/components/CommentForm";
import {
  MessageSquare,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  Award,
  CornerDownRight,
} from "lucide-react";

type CommentAuthor = {
  id: string;
  username: string;
  displayName: string;
  isFoundingContributor: boolean;
};

type Reply = {
  id: string;
  body: string;
  isAlternativeVersion: boolean;
  status: string;
  isEdited: boolean;
  createdAt: Date;
  author: CommentAuthor;
};

export type DiscussionComment = {
  id: string;
  body: string;
  isAlternativeVersion: boolean;
  status: string;
  isEdited: boolean;
  createdAt: Date;
  author: CommentAuthor;
  replies: Reply[];
};

type Comment = DiscussionComment;

interface DiscussionSectionProps {
  publicationId: string;
  publicationSlug: string;
  initialComments: Comment[];
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ubu";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("rw-RW", {
    month: "short",
    day: "numeric",
  });
}

function AuthorBadge({ author }: { author: CommentAuthor }) {
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <span className="font-semibold text-stone-900 text-sm">
        {author.displayName}
      </span>
      {author.isFoundingContributor && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider">
          <Award className="w-2.5 h-2.5" />
          Intangiriro
        </span>
      )}
    </span>
  );
}

function SingleComment({
  comment,
  currentUserId,
  currentUserIsAdmin,
  isReply = false,
  onDeleted,
}: {
  comment: Comment | Reply;
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  isReply?: boolean;
  onDeleted: (id: string) => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete =
    currentUserIsAdmin || currentUserId === comment.author.id;
  const isRemoved = comment.status === "REMOVED_PLACEHOLDER";

  async function handleDelete() {
    if (
      !confirm(
        "Ugomba gusiba iki gitabo? Bizashyira ubutumwa bwa placeholder."
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteCommentAction(comment.id);
      onDeleted(comment.id);
    } catch {
      setDeleting(false);
    }
  }

  if (isRemoved) {
    return (
      <div
        className={`${
          isReply ? "ml-8 pl-4 border-l border-stone-100" : ""
        } py-2`}
      >
        <p className="text-xs text-stone-400 italic">[Igitabo gikuweho]</p>
      </div>
    );
  }

  return (
    <div
      className={`group ${
        isReply ? "ml-8 pl-4 border-l-2 border-stone-100" : ""
      }`}
    >
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs mt-0.5">
          {comment.author.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {/* Author + meta */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <AuthorBadge author={comment.author} />
            <span className="text-[10px] text-stone-400">
              {timeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-[10px] text-stone-400 italic">
                (ihinduwe)
              </span>
            )}
            {/* Alternative version chip */}
            {comment.isAlternativeVersion && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wide">
                Indi nyito / Uburambe bwanjye
              </span>
            )}
          </div>

          {/* Body */}
          <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>

          {/* Actions row */}
          <div className="mt-1.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-rose-700 transition"
              >
                <Trash2 className="w-3 h-3" />
                {deleting ? "..." : "Siba"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-rose-700 transition"
            >
              <Flag className="w-3 h-3" />
              Raporo
            </button>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        commentId={comment.id}
        targetTitle={comment.body.slice(0, 60)}
      />
    </div>
  );
}

function CommentThread({
  comment,
  publicationId,
  currentUserId,
  currentUserIsAdmin,
  onDeleted,
}: {
  comment: Comment;
  publicationId: string;
  currentUserId: string | null;
  currentUserIsAdmin: boolean;
  onDeleted: (id: string) => void;
}) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [localReplies, setLocalReplies] = useState<Reply[]>(comment.replies);
  const router = useRouter();

  const totalReplies = localReplies.length;

  function handleReplyPosted() {
    setRepliesOpen(true);
    setShowReplyForm(false);
    router.refresh();
  }

  return (
    <div className="border-b border-stone-100 last:border-0">
      <SingleComment
        comment={comment}
        currentUserId={currentUserId}
        currentUserIsAdmin={currentUserIsAdmin}
        onDeleted={onDeleted}
      />

      {/* Reply toggle + form */}
      <div className="pl-10 pb-2 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {totalReplies > 0 && (
            <button
              type="button"
              onClick={() => setRepliesOpen(!repliesOpen)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-800 transition"
            >
              {repliesOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {repliesOpen
                ? "Hisha ibisubizo"
                : `Reba ibisubizo ${totalReplies}`}
            </button>
          )}
          {currentUserId && (
            <button
              type="button"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-800 transition"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              Subiza
            </button>
          )}
        </div>

        {/* Replies */}
        {repliesOpen && localReplies.length > 0 && (
          <div className="mt-1 space-y-0 divide-y divide-stone-50">
            {localReplies.map((reply) => (
              <SingleComment
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                currentUserIsAdmin={currentUserIsAdmin}
                isReply
                onDeleted={(id) =>
                  setLocalReplies((prev) => prev.filter((r) => r.id !== id))
                }
              />
            ))}
          </div>
        )}

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mt-2 ml-6">
            <CommentForm
              publicationId={publicationId}
              parentId={comment.id}
              onPosted={handleReplyPosted}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscussionSection({
  publicationId,
  publicationSlug: _publicationSlug,
  initialComments,
  currentUserId,
  currentUserIsAdmin,
}: DiscussionSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const router = useRouter();

  function handleCommentDeleted(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  function handleCommentPosted() {
    router.refresh();
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-emerald-700" />
        <h2 className="font-serif text-xl font-bold text-stone-900">
          Ibitekerezo ({comments.length})
        </h2>
      </div>

      {/* Comment form */}
      {currentUserId ? (
        <div className="mb-8">
          <CommentForm
            publicationId={publicationId}
            onPosted={handleCommentPosted}
          />
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-600 text-center">
          <span>
            <a
              href="/login"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Injira
            </a>{" "}
            cyangwa{" "}
            <a
              href="/register"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Iyandikishe
            </a>{" "}
            kugira ngo usangire ibitekerezo byawe.
          </span>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="py-12 text-center text-stone-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nta bitekerezo bihari kuri ubu.</p>
          <p className="text-xs mt-1">Banza usangire ibitekerezo byawe!</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl bg-white px-4 overflow-hidden">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              publicationId={publicationId}
              currentUserId={currentUserId}
              currentUserIsAdmin={currentUserIsAdmin}
              onDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </section>
  );
}
