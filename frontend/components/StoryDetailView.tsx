"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  formatKinyarwandaDate,
  type CommentDto,
  type CommentsResponse,
  type PostDto,
  type PostRemovalReason,
} from "@/lib/api-types";
import styles from "./StoryDetailView.module.css";

type Props = {
  initialPost: PostDto;
  initialComments: CommentDto[];
};

export default function StoryDetailView({
  initialPost,
  initialComments,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostDto>(initialPost);
  const [saved, setSaved] = useState(initialPost.saved);
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [following, setFollowing] = useState(initialPost.isFollowingAuthor);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [copied, setCopied] = useState(false);

  const [comments, setComments] = useState<CommentDto[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasPendingRemoval, setHasPendingRemoval] = useState(
    initialPost.hasPendingRemoval
  );
  const [removalCardOpen, setRemovalCardOpen] = useState(false);
  const [removalReason, setRemovalReason] = useState<PostRemovalReason | "">(
    ""
  );
  const [removalNote, setRemovalNote] = useState("");
  const [submittingRemoval, setSubmittingRemoval] = useState(false);
  const [removalToast, setRemovalToast] = useState(false);

  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const isAuthor = Boolean(user && user.id === post.author.id);
  const isAdminOrMod = Boolean(user && (user.role === "ADMIN" || user.isModerator));
  const deletable = isAuthor && (post.canDelete || post.status === "DRAFT");
  const canRequestRemoval =
    isAuthor && !post.canDelete && post.status === "PUBLISHED";

  useEffect(() => {
    setPost(initialPost);
    setSaved(initialPost.saved);
    setFollowing(initialPost.isFollowingAuthor);
    setHasPendingRemoval(initialPost.hasPendingRemoval);
    setComments(initialComments);
  }, [initialPost, initialComments]);

  useEffect(() => {
    if (!deleteModalOpen) return;
    cancelBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setDeleteModalOpen(false);
        deleteTriggerRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        const focusables = [cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean
        ) as HTMLButtonElement[];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleteModalOpen]);

  function requireLoginRedirect() {
    router.push(`/kwinjira?next=${encodeURIComponent(`/inkuru/${post.slug}`)}`);
  }

  async function reloadComments() {
    try {
      const res = await apiFetch<CommentsResponse>(
        `/api/v1/posts/${encodeURIComponent(post.id)}/comments`
      );
      setComments(res.comments);
    } catch {
      // ignore transient reload failure
    }
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    deleteTriggerRef.current?.focus();
  }

  async function handleConfirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setActionError(null);
    try {
      await apiFetch<{ ok: boolean }>(`/api/v1/posts/${post.id}`, {
        method: "DELETE",
      });
      setDeleteModalOpen(false);
      router.push("/ibyo-nabitse");
      router.refresh();
    } catch (err) {
      setDeleteModalOpen(false);
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze gusiba iyi nyandiko."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleSave() {
    if (!user) {
      requireLoginRedirect();
      return;
    }
    if (savingBookmark) return;
    setSavingBookmark(true);
    setActionError(null);
    try {
      const res = await apiFetch<{ saved: boolean }>(
        `/api/v1/posts/${post.id}/bookmark`,
        { method: "POST" }
      );
      setSaved(res.saved);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Ntibyakunze kubika inyandiko."
      );
    } finally {
      setSavingBookmark(false);
    }
  }

  async function handleToggleFollow() {
    if (!user) {
      requireLoginRedirect();
      return;
    }
    if (togglingFollow) return;
    setTogglingFollow(true);
    setActionError(null);
    try {
      const res = await apiFetch<{ following: boolean }>(
        `/api/v1/users/${post.author.id}/follow`,
        { method: "POST" }
      );
      setFollowing(res.following);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze guhindura gukurikira umwanditsi."
      );
    } finally {
      setTogglingFollow(false);
    }
  }

  async function handleRemovalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!removalReason || submittingRemoval) return;
    setSubmittingRemoval(true);
    setActionError(null);
    try {
      await apiFetch(`/api/v1/posts/${post.id}/removal-requests`, {
        method: "POST",
        json: {
          reason: removalReason,
          note: removalNote.trim() || undefined,
        },
      });
      setHasPendingRemoval(true);
      setRemovalCardOpen(false);
      setRemovalReason("");
      setRemovalNote("");
      setRemovalToast(true);
      setTimeout(() => setRemovalToast(false), 3500);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze kohereza ubusabe."
      );
    } finally {
      setSubmittingRemoval(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      requireLoginRedirect();
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed || submittingComment) return;
    setSubmittingComment(true);
    setActionError(null);
    try {
      await apiFetch(`/api/v1/posts/${post.id}/comments`, {
        method: "POST",
        json: { body: trimmed },
      });
      setDraft("");
      await reloadComments();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze kohereza igitekerezo."
      );
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleSubmitReply(e: FormEvent, commentId: string) {
    e.preventDefault();
    if (!user) {
      requireLoginRedirect();
      return;
    }
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    setActionError(null);
    try {
      await apiFetch(`/api/v1/posts/${post.id}/comments`, {
        method: "POST",
        json: { body: trimmed, parentId: commentId },
      });
      setReplyDraft("");
      setReplyingToId(null);
      await reloadComments();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Ntibyakunze kohereza igisubizo."
      );
    }
  }

  function handleStartEdit(commentId: string, body: string) {
    setEditingCommentId(commentId);
    setEditDraft(body);
    setReplyingToId(null);
  }

  async function handleSaveEdit(e: FormEvent, commentId: string) {
    e.preventDefault();
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    setActionError(null);
    try {
      await apiFetch(`/api/v1/comments/${commentId}`, {
        method: "PATCH",
        json: { body: trimmed },
      });
      setEditingCommentId(null);
      setEditDraft("");
      await reloadComments();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze guhindura igitekerezo."
      );
    }
  }

  async function handleDeleteComment(commentId: string) {
    setActionError(null);
    try {
      await apiFetch(`/api/v1/comments/${commentId}`, {
        method: "DELETE",
      });
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditDraft("");
      }
      await reloadComments();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze gusiba igitekerezo."
      );
    }
  }

  const paragraphs = (post.body || post.excerpt || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const publishedLabel = post.publishedAt
    ? formatKinyarwandaDate(post.publishedAt)
    : formatKinyarwandaDate(post.createdAt);

  const updatedLabel =
    post.isEdited && post.lastEditedAt
      ? `Yavuguruwe ku wa ${formatKinyarwandaDate(post.lastEditedAt)}`
      : null;

  const totalCount = comments.reduce(
    (sum, c) =>
      sum +
      (c.deleted ? 0 : 1) +
      c.replies.filter((r) => !r.deleted).length,
    0
  );

  const coverImage = post.images[0] || "/assets/painting.jpg";

  return (
    <article className={styles.container}>
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagNavy}`}>
          {post.contentTypeLabel}
        </span>
        {post.categories.slice(0, 2).map((cat) => (
          <span
            key={cat.id}
            className={`${styles.tag} ${styles.tagOrange}`}
          >
            {cat.nameRw}
          </span>
        ))}
        {post.knowledgeSourceLabels.slice(0, 1).map((label) => (
          <span key={label} className={`${styles.tag} ${styles.tagOrange}`}>
            {label}
          </span>
        ))}
      </div>

      <h1 className={styles.title}>{post.title}</h1>

      <div className={styles.meta}>
        <Link
          href={`/umwirondoro/${post.author.username}`}
          className={styles.authorLink}
        >
          {post.author.displayName}
        </Link>
        <span className={styles.metaDate}>
          {post.status === "DRAFT"
            ? "Inyandiko itaratangazwa"
            : `Yatangiweho: ${publishedLabel}`}
        </span>
        {updatedLabel ? (
          <span className={styles.updatedPill}>{updatedLabel}</span>
        ) : null}
      </div>

      <hr className={styles.rule} />

      <div className={styles.actionBar}>
        <div className={styles.actionPills}>
          {post.status === "PUBLISHED" ? (
            <button
              type="button"
              className={`${styles.pill} ${styles.pillOrange}`}
              aria-pressed={saved}
              disabled={savingBookmark}
              onClick={handleToggleSave}
            >
              {saved ? "Yabitswe ✓" : "Bika inyandiko"}
            </button>
          ) : null}
          <button
            type="button"
            className={`${styles.pill} ${styles.pillOutline}`}
            onClick={handleCopy}
          >
            {copied ? "Ibyakoporowe ✓" : "Kopora ihuzo"}
          </button>
          {isAuthor ? (
            <Link
              href={`/inkuru/${post.slug}/hindura`}
              className={`${styles.pill} ${styles.pillOutline}`}
            >
              Hindura inyandiko
            </Link>
          ) : null}
          {deletable ? (
            <button
              ref={deleteTriggerRef}
              type="button"
              className={`${styles.pill} ${styles.pillMaroonOutline}`}
              onClick={() => setDeleteModalOpen(true)}
            >
              Siba inyandiko
            </button>
          ) : null}
          {!isAuthor ? (
            <button
              type="button"
              className={`${styles.pill} ${styles.pillMaroon}`}
              aria-pressed={following}
              disabled={togglingFollow}
              onClick={handleToggleFollow}
            >
              {following ? "Uramukurikira" : "Kurikira Umwanditsi"}
            </button>
          ) : null}
        </div>

        {canRequestRemoval ? (
          hasPendingRemoval ? (
            <span className={styles.pendingNote}>
              Ubusabe bwawe buracyasuzumwa.
            </span>
          ) : (
            <button
              type="button"
              className={styles.removalLink}
              onClick={() => setRemovalCardOpen((prev) => !prev)}
            >
              Saba gukuraho inyandiko
            </button>
          )
        ) : !isAuthor ? (
          <Link
            href={`/menyesha?postId=${encodeURIComponent(post.id)}`}
            className={styles.reportLink}
          >
            Menyesha ikibazo kuri iyi nyandiko
          </Link>
        ) : null}
      </div>

      <hr className={styles.rule} />

      {actionError ? (
        <p className={styles.removalToast} role="alert">
          {actionError}
        </p>
      ) : null}

      {isAuthor && post.canDelete ? (
        <p className={styles.graceNote}>
          Ushobora kuyisiba mu masaha {post.hoursLeft} asigaye.
        </p>
      ) : null}

      {removalToast ? (
        <p className={styles.removalToast} role="status" aria-live="polite">
          Ubusabe bwawe bwoherejwe
        </p>
      ) : null}

      {canRequestRemoval && !hasPendingRemoval && removalCardOpen ? (
        <form
          className={styles.removalCard}
          onSubmit={handleRemovalSubmit}
          noValidate
        >
          <h2 className={styles.removalTitle}>
            Kuki ushaka gukuraho iyi nyandiko?
          </h2>

          <div
            className={styles.removalRadios}
            role="radiogroup"
            aria-label="Impamvu"
          >
            <label className={styles.removalRadioItem}>
              <input
                type="radio"
                name="removal-reason"
                value="IKOSA"
                checked={removalReason === "IKOSA"}
                onChange={() => setRemovalReason("IKOSA")}
              />
              <span>Ikosa ryanjye</span>
            </label>
            <label className={styles.removalRadioItem}>
              <input
                type="radio"
                name="removal-reason"
                value="AMAKURU_BWITE"
                checked={removalReason === "AMAKURU_BWITE"}
                onChange={() => setRemovalReason("AMAKURU_BWITE")}
              />
              <span>Amakuru bwite</span>
            </label>
            <label className={styles.removalRadioItem}>
              <input
                type="radio"
                name="removal-reason"
                value="IKINDI"
                checked={removalReason === "IKINDI"}
                onChange={() => setRemovalReason("IKINDI")}
              />
              <span>Ikindi</span>
            </label>
          </div>

          <div className={styles.removalField}>
            <label htmlFor="removal-note" className={styles.removalLabel}>
              IBINDI BISOBANURO (BITARI ITEGEKO)
            </label>
            <textarea
              id="removal-note"
              className={styles.removalTextarea}
              value={removalNote}
              onChange={(e) => setRemovalNote(e.target.value)}
            />
          </div>

          <div className={styles.removalActions}>
            <button
              type="button"
              className={styles.modalCancel}
              onClick={() => setRemovalCardOpen(false)}
            >
              Hagarika
            </button>
            <button
              type="submit"
              className={styles.modalConfirm}
              disabled={!removalReason || submittingRemoval}
            >
              {submittingRemoval ? "Kohereza…" : "Ohereza ubusabe"}
            </button>
          </div>
        </form>
      ) : null}

      <div className={styles.bodyGrid}>
        <div className={styles.prose}>
          {paragraphs.map((text, idx) => (
            <p key={idx}>{text}</p>
          ))}
        </div>

        <figure className={styles.archFigure}>
          <div className={styles.archFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={post.title}
              className={styles.archImg}
            />
          </div>
        </figure>
      </div>

      {post.isHealthOrMedicine ? (
        <div className={styles.notice} role="note">
          Iyi nyandiko ni ibyanditswe by&apos;umuco, si inama z&apos;umwuga
          w&apos;ubuvuzi. (Cultural documentation, not professional advice.)
        </div>
      ) : null}

      {post.sourceCitation ? (
        <section className={styles.sourceCard} aria-labelledby="source-heading">
          <p id="source-heading" className={styles.sourceEyebrow}>
            INKOMOKO (SOURCE NOTE)
          </p>
          <p className={styles.sourceText}>{post.sourceCitation}</p>
        </section>
      ) : null}

      <section
        className={styles.commentsSection}
        aria-labelledby="comments-heading"
      >
        <h2 id="comments-heading" className={styles.commentsHeading}>
          Ibitekerezo &middot; {totalCount}
        </h2>

        <div className={styles.commentList}>
          {comments.map((comment) => {
            const own = Boolean(
              !comment.deleted && user && comment.authorId === user.id
            );
            const canRemoveComment = Boolean(
              !comment.deleted && (own || isAuthor || isAdminOrMod)
            );
            const isEditing = editingCommentId === comment.id;
            const isReplying = replyingToId === comment.id;

            return (
              <div
                key={comment.id}
                className={`${styles.commentCard}${comment.deleted ? ` ${styles.commentDeleted}` : ""}`}
              >
                {comment.deleted ? (
                  <p className={styles.deletedText}>[igitekerezo cyakuweho]</p>
                ) : (
                  <>
                    <p className={styles.commentMeta}>
                      <strong className={styles.commentAuthor}>
                        {comment.author?.displayName ?? "Umwanditsi"}
                      </strong>{" "}
                      <span className={styles.commentDate}>
                        &middot; {formatKinyarwandaDate(comment.createdAt)}
                        {comment.isEdited ? " (Byavuguruwe)" : ""}
                      </span>
                    </p>

                    {isEditing ? (
                      <form
                        className={styles.inlineForm}
                        onSubmit={(e) => handleSaveEdit(e, comment.id)}
                      >
                        <input
                          type="text"
                          className={styles.inlineInput}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          aria-label="Hindura igitekerezo"
                        />
                        <div className={styles.inlineActions}>
                          <button
                            type="button"
                            className={styles.inlineCancel}
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditDraft("");
                            }}
                          >
                            Hagarika
                          </button>
                          <button type="submit" className={styles.inlineSubmit}>
                            Bika
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className={styles.commentBody}>{comment.body}</p>
                    )}

                    <div className={styles.commentActions}>
                      <button
                        type="button"
                        className={styles.commentActionBtn}
                        onClick={() => {
                          if (!user) {
                            requireLoginRedirect();
                            return;
                          }
                          setReplyingToId(isReplying ? null : comment.id);
                          setReplyDraft("");
                        }}
                      >
                        Subiza
                      </button>
                      {own ? (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <button
                            type="button"
                            className={styles.commentActionBtn}
                            onClick={() =>
                              handleStartEdit(comment.id, comment.body)
                            }
                          >
                            Hindura
                          </button>
                        </>
                      ) : null}
                      {canRemoveComment ? (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <button
                            type="button"
                            className={styles.commentActionBtn}
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Siba
                          </button>
                        </>
                      ) : null}
                      <span aria-hidden="true">&middot;</span>
                      <Link
                        href={`/menyesha?commentId=${encodeURIComponent(comment.id)}`}
                        className={`${styles.commentActionBtn} ${styles.commentReport}`}
                      >
                        Menyesha
                      </Link>
                    </div>

                    {isReplying ? (
                      <form
                        className={styles.inlineForm}
                        onSubmit={(e) => handleSubmitReply(e, comment.id)}
                      >
                        <input
                          type="text"
                          className={styles.inlineInput}
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder="Andika igisubizo cyawe..."
                          aria-label="Andika igisubizo cyawe"
                        />
                        <div className={styles.inlineActions}>
                          <button
                            type="button"
                            className={styles.inlineCancel}
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyDraft("");
                            }}
                          >
                            Hagarika
                          </button>
                          <button type="submit" className={styles.inlineSubmit}>
                            Ohereza
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </>
                )}

                {comment.replies.length > 0 && (
                  <div className={styles.replies}>
                    {comment.replies.map((reply) => {
                      const ownReply = Boolean(
                        !reply.deleted && user && reply.authorId === user.id
                      );
                      const canRemoveReply = Boolean(
                        !reply.deleted && (ownReply || isAuthor || isAdminOrMod)
                      );
                      const isEditingReply = editingCommentId === reply.id;

                      return (
                        <div key={reply.id} className={styles.reply}>
                          {reply.deleted ? (
                            <p className={styles.deletedText}>
                              [igitekerezo cyakuweho]
                            </p>
                          ) : (
                            <>
                              <p className={styles.commentMeta}>
                                <strong className={styles.commentAuthor}>
                                  {reply.author?.displayName ?? "Umwanditsi"}
                                </strong>
                                {reply.role ? (
                                  <span className={styles.commentDate}>
                                    {" "}
                                    &middot; {reply.role}
                                  </span>
                                ) : null}
                                <span className={styles.commentDate}>
                                  {" "}
                                  &middot; {formatKinyarwandaDate(reply.createdAt)}
                                  {reply.isEdited ? " (Byavuguruwe)" : ""}
                                </span>
                              </p>

                              {isEditingReply ? (
                                <form
                                  className={styles.inlineForm}
                                  onSubmit={(e) => handleSaveEdit(e, reply.id)}
                                >
                                  <input
                                    type="text"
                                    className={styles.inlineInput}
                                    value={editDraft}
                                    onChange={(e) =>
                                      setEditDraft(e.target.value)
                                    }
                                    aria-label="Hindura igisubizo"
                                  />
                                  <div className={styles.inlineActions}>
                                    <button
                                      type="button"
                                      className={styles.inlineCancel}
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditDraft("");
                                      }}
                                    >
                                      Hagarika
                                    </button>
                                    <button
                                      type="submit"
                                      className={styles.inlineSubmit}
                                    >
                                      Bika
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <p className={styles.commentBody}>
                                  {reply.body}
                                </p>
                              )}

                              {(ownReply || canRemoveReply) && (
                                <div className={styles.commentActions}>
                                  {ownReply ? (
                                    <button
                                      type="button"
                                      className={styles.commentActionBtn}
                                      onClick={() =>
                                        handleStartEdit(reply.id, reply.body)
                                      }
                                    >
                                      Hindura
                                    </button>
                                  ) : null}
                                  {ownReply && canRemoveReply ? (
                                    <span aria-hidden="true">&middot;</span>
                                  ) : null}
                                  {canRemoveReply ? (
                                    <button
                                      type="button"
                                      className={styles.commentActionBtn}
                                      onClick={() =>
                                        handleDeleteComment(reply.id)
                                      }
                                    >
                                      Siba
                                    </button>
                                  ) : null}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form className={styles.commentForm} onSubmit={handlePostComment}>
          <label htmlFor="comment-input" className={styles.formLabel}>
            ANDIKA IGITEKEREZO CYAWE
          </label>
          <input
            id="comment-input"
            type="text"
            className={styles.formInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              user
                ? "Andika igitekerezo cyawe..."
                : "Injira muri konti yawe kugira ngo utange igitekerezo..."
            }
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submittingComment}
          >
            {submittingComment ? "Kohereza…" : "Ohereza"}
          </button>
        </form>
      </section>

      {deleteModalOpen ? (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDeleteModal();
          }}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <p className={styles.modalEyebrow}>SIBA INYANDIKO</p>
            <h2 id="delete-modal-title" className={styles.modalTitle}>
              Siba inyandiko burundu?
            </h2>
            <p className={styles.modalText}>
              Iyi nyandiko izavanwaho burundu. Ntibishoboka kuyigarura.
            </p>
            <div className={styles.modalActions}>
              <button
                ref={cancelBtnRef}
                type="button"
                className={styles.modalCancel}
                onClick={closeDeleteModal}
              >
                Hagarika
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={styles.modalConfirm}
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? "Gusiba…" : "Siba inyandiko"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
