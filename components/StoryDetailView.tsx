"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatKinyarwandaDate, getStoryEdit } from "@/src/data/storyEdits";
import { getSession } from "@/src/data/session";
import {
  addComment,
  addCommentReply,
  canDelete,
  deleteComment,
  deletePost,
  editComment,
  getComments,
  getPostById,
  hoursLeft,
  listRemovalRequests,
  requestRemoval,
  toggleSavePost,
  type PostStatus,
  type RemovalReason,
  type StoreComment,
} from "@/lib/store";
import type { StoryTag } from "./StoryCard";
import styles from "./StoryDetailView.module.css";

type Props = {
  routeId?: string;
  postId: string;
  slug: string;
  title: string;
  author: string;
  authorSlug: string;
  status: PostStatus;
  publishedAt: string | null;
  initialSaved?: boolean;
  initialTags?: StoryTag[];
};

const DEFAULT_PARAGRAPHS = [
  "Mu mateka y'u Rwanda rwo hambere, Umwami Ruganzu II Ndoli yibukwa nk'intwari yagaruye ingoma nyuma y'imyaka myinshi y'akaga n'amacakubiri. Avuye i Karagwe aho yari yarahungiye kwa nyirasenge Nyabunyana, yagarutse mu Rwanda afite icyerekezo cyo kongera guhuza abaturage.",
  "Inkuru n'ibitekerezo by'abakurambere bigaragaza ko ubutwari bwe butari bushingiye ku rugamba gusa, ahubwo no ku buhanga bwo kunga imiryango, kubaka ubufatanye n'ibiganiro by'umuco byasigaye mu migani n'indirimbo kugeza uyu munsi.",
];

export default function StoryDetailView({
  routeId,
  postId,
  slug,
  title,
  author,
  authorSlug,
  status,
  publishedAt,
  initialSaved = false,
  initialTags,
}: Props) {
  const router = useRouter();
  const [livePostId, setLivePostId] = useState(postId);
  const [liveSlug, setLiveSlug] = useState(slug);
  const [displayTitle, setDisplayTitle] = useState(title);
  const [liveAuthor, setLiveAuthor] = useState(author);
  const [liveAuthorSlug, setLiveAuthorSlug] = useState(authorSlug);
  const [liveTags, setLiveTags] = useState<StoryTag[] | undefined>(initialTags);
  const [paragraphs, setParagraphs] = useState<string[]>(DEFAULT_PARAGRAPHS);
  const [publishedLabel, setPublishedLabel] = useState("14 Ukwakira 2026");
  const [updatedLabel, setUpdatedLabel] = useState(
    "Yavuguruwe ku wa 18 Ukwakira 2026"
  );
  const [saved, setSaved] = useState(initialSaved);
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState<StoreComment[]>([]);
  const [draft, setDraft] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [viewerName, setViewerName] = useState("Kalisa Mugisha");
  const [viewerSlug, setViewerSlug] = useState("kalisa-mugisha");
  const [isAuthor, setIsAuthor] = useState(false);
  const [liveStatus, setLiveStatus] = useState<PostStatus>(status);
  const [deletable, setDeletable] = useState(false);
  const [remainingHours, setRemainingHours] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hasPendingRemoval, setHasPendingRemoval] = useState(false);
  const [removalCardOpen, setRemovalCardOpen] = useState(false);
  const [removalReason, setRemovalReason] = useState<RemovalReason | "">("");
  const [removalNote, setRemovalNote] = useState("");
  const [removalToast, setRemovalToast] = useState(false);

  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const lookupKey = routeId || postId || slug;
    const storePost =
      getPostById(lookupKey) ?? getPostById(postId) ?? getPostById(slug);

    const activeId = storePost?.id ?? postId;
    const activeSlug = storePost?.slug ?? slug;
    const activeAuthor = storePost?.author ?? author;
    const activeAuthorSlug =
      storePost?.authorId ??
      activeAuthor.toLowerCase().replace(/\s+/g, "-") ??
      authorSlug;

    setLivePostId(activeId);
    setLiveSlug(activeSlug);
    setLiveAuthor(activeAuthor);
    setLiveAuthorSlug(activeAuthorSlug);

    if (storePost) {
      setDisplayTitle(storePost.title);
      setSaved(Boolean(storePost.saved));
      if (storePost.tags && storePost.tags.length > 0) {
        setLiveTags(storePost.tags);
      }
      if (storePost.body) {
        const nextParas = storePost.body
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (nextParas.length > 0) setParagraphs(nextParas);
      } else if (storePost.excerpt && storePost.id !== "umurage-wa-ruganzu-1") {
        setParagraphs([storePost.excerpt, ...DEFAULT_PARAGRAPHS]);
      }
      if (storePost.publishedAt) {
        const d = new Date(storePost.publishedAt);
        if (!Number.isNaN(d.getTime())) {
          setPublishedLabel(formatKinyarwandaDate(d));
        }
      }
      if (storePost.updatedAt) {
        const u = new Date(storePost.updatedAt);
        if (!Number.isNaN(u.getTime())) {
          setUpdatedLabel(`Yavuguruwe ku wa ${formatKinyarwandaDate(u)}`);
        }
      }
    }

    const storedEdit = getStoryEdit(activeSlug);
    if (storedEdit) {
      setDisplayTitle(storedEdit.title);
      const nextParas = storedEdit.body
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (nextParas.length > 0) setParagraphs(nextParas);
      setUpdatedLabel(storedEdit.updatedLabel);
    }

    const session = getSession();
    const currentName = session?.displayName?.trim() || "Kalisa Mugisha";
    const currentSlug = currentName.toLowerCase().replace(/\s+/g, "-");
    setViewerName(currentName);
    setViewerSlug(currentSlug);

    const matchesAuthor =
      currentSlug === activeAuthorSlug ||
      activeAuthorSlug.startsWith(currentSlug) ||
      currentName.toLowerCase() === activeAuthor.toLowerCase();
    setIsAuthor(matchesAuthor);

    const postForGrace = storePost ?? { status, publishedAt };
    setLiveStatus(postForGrace.status);
    setDeletable(canDelete(postForGrace));
    setRemainingHours(hoursLeft(postForGrace));

    const pending = listRemovalRequests().some(
      (r) =>
        r.status === "pending" &&
        (r.postId === activeId || r.postId === activeSlug)
    );
    setHasPendingRemoval(pending);

    setComments(getComments(activeId));
  }, [routeId, slug, postId, author, authorSlug, status, publishedAt]);

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

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    deleteTriggerRef.current?.focus();
  }

  function handleConfirmDelete() {
    deletePost(livePostId);
    setDeleteModalOpen(false);
    router.push("/ibyo-nabitse");
  }

  function handleToggleSave() {
    const updated = toggleSavePost(livePostId);
    setSaved(updated ? Boolean(updated.saved) : !saved);
  }

  function handleRemovalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!removalReason) return;
    requestRemoval({
      postId: livePostId,
      reason: removalReason,
      note: removalNote,
    });
    setHasPendingRemoval(true);
    setRemovalCardOpen(false);
    setRemovalReason("");
    setRemovalNote("");
    setRemovalToast(true);
    setTimeout(() => setRemovalToast(false), 3000);
  }

  function isOwnComment(comment: StoreComment): boolean {
    if (comment.deleted) return false;
    return Boolean(
      comment.authorId === viewerSlug ||
        comment.author?.toLowerCase() === viewerName.toLowerCase() ||
        comment.author === "Wowe"
    );
  }

  const canRequestRemoval =
    isAuthor && !deletable && liveStatus === "published";

  const totalCount = comments.reduce(
    (sum, c) => sum + (c.deleted ? 0 : 1) + c.replies.length,
    0
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePostComment(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    const next = addComment(livePostId, {
      author: viewerName,
      authorId: viewerSlug,
      body: trimmed,
    });
    if (next) setComments(next);
    setDraft("");
  }

  function handleSubmitReply(e: FormEvent, commentId: string) {
    e.preventDefault();
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    const next = addCommentReply(livePostId, commentId, {
      author: viewerName,
      authorId: viewerSlug,
      role: isAuthor ? "Umwanditsi" : undefined,
      body: trimmed,
    });
    if (next) setComments(next);
    setReplyDraft("");
    setReplyingToId(null);
  }

  function handleStartEdit(comment: StoreComment) {
    setEditingCommentId(comment.id);
    setEditDraft(comment.body ?? "");
    setReplyingToId(null);
  }

  function handleSaveEdit(e: FormEvent, commentId: string) {
    e.preventDefault();
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    const next = editComment(livePostId, commentId, trimmed);
    if (next) setComments(next);
    setEditingCommentId(null);
    setEditDraft("");
  }

  function handleDeleteComment(commentId: string) {
    const next = deleteComment(livePostId, commentId);
    setComments(next);
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setEditDraft("");
    }
  }

  return (
    <article className={styles.container}>
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagNavy}`}>Inkuru (Story)</span>
        {liveTags && liveTags.length > 0 ? (
          liveTags.slice(0, 2).map((t) => (
            <span
              key={t.label}
              className={`${styles.tag} ${styles.tagOrange}`}
            >
              {t.label}
            </span>
          ))
        ) : (
          <>
            <span className={`${styles.tag} ${styles.tagOrange}`}>
              Ubuvanganzo bwo mu muryango
            </span>
            <span className={`${styles.tag} ${styles.tagOrange}`}>
              Amateka yanditse
            </span>
          </>
        )}
      </div>

      <h1 className={styles.title}>{displayTitle}</h1>

      <div className={styles.meta}>
        <Link
          href={`/umwirondoro/${liveAuthorSlug}`}
          className={styles.authorLink}
        >
          {liveAuthor}
        </Link>
        <span className={styles.metaDate}>Yatangiweho: {publishedLabel}</span>
        <span className={styles.updatedPill}>{updatedLabel}</span>
      </div>

      <hr className={styles.rule} />

      <div className={styles.actionBar}>
        <div className={styles.actionPills}>
          <button
            type="button"
            className={`${styles.pill} ${styles.pillOrange}`}
            aria-pressed={saved}
            onClick={handleToggleSave}
          >
            {saved ? "Yabitswe ✓" : "Bika inyandiko"}
          </button>
          <button
            type="button"
            className={`${styles.pill} ${styles.pillOutline}`}
            onClick={handleCopy}
          >
            {copied ? "Ibyakoporowe ✓" : "Kopora ihuzo"}
          </button>
          {isAuthor ? (
            <Link
              href={`/inkuru/${liveSlug}/hindura`}
              className={`${styles.pill} ${styles.pillOutline}`}
            >
              Hindura inyandiko
            </Link>
          ) : null}
          {isAuthor && deletable ? (
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
              onClick={() => setFollowing((prev) => !prev)}
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
          <Link href="/menyesha" className={styles.reportLink}>
            Menyesha ikibazo kuri iyi nyandiko
          </Link>
        ) : null}
      </div>

      <hr className={styles.rule} />

      {isAuthor && deletable ? (
        <p className={styles.graceNote}>
          Ushobora kuyisiba mu masaha {remainingHours} asigaye.
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
                value="ikosa"
                checked={removalReason === "ikosa"}
                onChange={() => setRemovalReason("ikosa")}
              />
              <span>Ikosa ryanjye</span>
            </label>
            <label className={styles.removalRadioItem}>
              <input
                type="radio"
                name="removal-reason"
                value="amakuru-bwite"
                checked={removalReason === "amakuru-bwite"}
                onChange={() => setRemovalReason("amakuru-bwite")}
              />
              <span>Amakuru bwite</span>
            </label>
            <label className={styles.removalRadioItem}>
              <input
                type="radio"
                name="removal-reason"
                value="ikindi"
                checked={removalReason === "ikindi"}
                onChange={() => setRemovalReason("ikindi")}
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
              disabled={!removalReason}
            >
              Ohereza ubusabe
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
              src="/assets/painting.jpg"
              alt="Igishushanyo cy'abagore babiri bikoreye ibiseke"
              className={styles.archImg}
            />
          </div>
        </figure>
      </div>

      <div className={styles.notice} role="note">
        Iyi nyandiko ni ibyanditswe by&apos;umuco, si inama z&apos;umwuga
        w&apos;ubuvuzi. (Cultural documentation, not professional advice.)
      </div>

      <section className={styles.sourceCard} aria-labelledby="source-heading">
        <p id="source-heading" className={styles.sourceEyebrow}>
          INKOMOKO (SOURCE NOTE)
        </p>
        <p className={styles.sourceText}>
          Ibyavuye mu biganiro n&apos;abakuru b&apos;umuryango i Nyanza, hamwe
          n&apos;igitabo &ldquo;Ibitekerezo by&apos;Abami b&apos;u Rwanda&rdquo;
          (1998).
        </p>
      </section>

      <section
        className={styles.commentsSection}
        aria-labelledby="comments-heading"
      >
        <h2 id="comments-heading" className={styles.commentsHeading}>
          Ibitekerezo &middot; {totalCount}
        </h2>

        <div className={styles.commentList}>
          {comments.map((comment) => {
            const own = isOwnComment(comment);
            const canRemoveComment = own || isAuthor;
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
                        {comment.author}
                      </strong>{" "}
                      <span className={styles.commentDate}>
                        &middot; {comment.date}
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
                            onClick={() => handleStartEdit(comment)}
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
                        href="/menyesha"
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
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className={styles.reply}>
                        <p className={styles.commentMeta}>
                          <strong className={styles.commentAuthor}>
                            {reply.author}
                          </strong>
                          {reply.role ? (
                            <span className={styles.commentDate}>
                              {" "}
                              &middot; {reply.role}
                            </span>
                          ) : null}
                        </p>
                        <p className={styles.commentBody}>{reply.body}</p>
                      </div>
                    ))}
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
            placeholder="Andika igitekerezo cyawe..."
          />
          <button type="submit" className={styles.submitBtn}>
            Ohereza
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
                onClick={handleConfirmDelete}
              >
                Siba inyandiko
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
