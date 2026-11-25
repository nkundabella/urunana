"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoryEdit } from "@/src/data/storyEdits";
import { getSession } from "@/src/data/session";
import {
  canDelete,
  deletePost,
  getPostById,
  hoursLeft,
  listRemovalRequests,
  requestRemoval,
  type PostStatus,
  type RemovalReason,
} from "@/lib/store";
import styles from "./StoryDetailView.module.css";

type ReplyItem = {
  id: string;
  author: string;
  role?: string;
  body: string;
};

type CommentItem = {
  id: string;
  author?: string;
  date?: string;
  body?: string;
  deleted?: boolean;
  replies: ReplyItem[];
};

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: "c-1",
    author: "Mugabo Eric",
    date: "15 Ukwakira 2026",
    body: "Urakoze cyane Kalisa! Sogokuru wanjye yakundaga kutubwira amateka ya Ruganzu Ndoli n'uburyo yagaruye ubumwe mu gihugu. Iyi nyandiko irasobanutse neza.",
    replies: [
      {
        id: "r-1",
        author: "Kalisa Mugisha",
        role: "Umwanditsi",
        body: "Murakoze cyane Eric! Ni byiza ko dukomeza gusangira izi nkuru kugira ngo abato batazibagirwa.",
      },
    ],
  },
  {
    id: "c-2",
    deleted: true,
    replies: [
      {
        id: "r-2",
        author: "Uwase Aline",
        body: "Nanjye nemeranya nawe ko kubika izi nkuru mu Kinyarwanda ari umurage ukomeye cyane.",
      },
    ],
  },
];

type Props = {
  postId: string;
  slug: string;
  title: string;
  author: string;
  authorSlug: string;
  status: PostStatus;
  publishedAt: string | null;
};

const DEFAULT_PARAGRAPHS = [
  "Mu mateka y'u Rwanda rwo hambere, Umwami Ruganzu II Ndoli yibukwa nk'intwari yagaruye ingoma nyuma y'imyaka myinshi y'akaga n'amacakubiri. Avuye i Karagwe aho yari yarahungiye kwa nyirasenge Nyabunyana, yagarutse mu Rwanda afite icyerekezo cyo kongera guhuza abaturage.",
  "Inkuru n'ibitekerezo by'abakurambere bigaragaza ko ubutwari bwe butari bushingiye ku rugamba gusa, ahubwo no ku buhanga bwo kunga imiryango, kubaka ubufatanye n'ibiganiro by'umuco byasigaye mu migani n'indirimbo kugeza uyu munsi.",
];

export default function StoryDetailView({
  postId,
  slug,
  title,
  author,
  authorSlug,
  status,
  publishedAt,
}: Props) {
  const router = useRouter();
  const [displayTitle, setDisplayTitle] = useState(title);
  const [paragraphs, setParagraphs] = useState<string[]>(DEFAULT_PARAGRAPHS);
  const [updatedLabel, setUpdatedLabel] = useState(
    "Yavuguruwe ku wa 18 Ukwakira 2026"
  );
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);
  const [reported, setReported] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [draft, setDraft] = useState("");
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
    const stored = getStoryEdit(slug);
    if (stored) {
      setDisplayTitle(stored.title);
      const nextParas = stored.body
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (nextParas.length > 0) setParagraphs(nextParas);
      setUpdatedLabel(stored.updatedLabel);
    }

    const session = getSession();
    const viewerSlug = session
      ? session.displayName.toLowerCase().replace(/\s+/g, "-")
      : "kalisa-mugisha";
    const matchesAuthor =
      viewerSlug === authorSlug ||
      authorSlug.startsWith(viewerSlug) ||
      (session?.displayName.toLowerCase() === author.toLowerCase());
    setIsAuthor(matchesAuthor);

    const storePost = getPostById(postId) ?? { status, publishedAt };
    setLiveStatus(storePost.status);
    const allowDelete = canDelete(storePost);
    setDeletable(allowDelete);
    setRemainingHours(hoursLeft(storePost));

    const pending = listRemovalRequests().some(
      (r) =>
        r.status === "pending" && (r.postId === postId || r.postId === slug)
    );
    setHasPendingRemoval(pending);
  }, [slug, postId, author, authorSlug, status, publishedAt]);

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
    deletePost(postId);
    setDeleteModalOpen(false);
    router.push("/ibyo-nabitse");
  }

  function handleRemovalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!removalReason) return;
    requestRemoval({
      postId,
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
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: "Wowe",
        date: "Uyu munsi",
        body: trimmed,
        replies: [],
      },
    ]);
    setDraft("");
  }

  return (
    <article className={styles.container}>
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagNavy}`}>Inkuru (Story)</span>
        <span className={`${styles.tag} ${styles.tagOrange}`}>
          Ubuvanganzo bwo mu muryango
        </span>
        <span className={`${styles.tag} ${styles.tagOrange}`}>
          Amateka yanditse
        </span>
      </div>

      <h1 className={styles.title}>{displayTitle}</h1>

      <div className={styles.meta}>
        <Link href={`/umwirondoro/${authorSlug}`} className={styles.authorLink}>
          {author}
        </Link>
        <span className={styles.metaDate}>Yatangiweho: 14 Ukwakira 2026</span>
        <span className={styles.updatedPill}>{updatedLabel}</span>
      </div>

      <hr className={styles.rule} />

      <div className={styles.actionBar}>
        <div className={styles.actionPills}>
          <button
            type="button"
            className={`${styles.pill} ${styles.pillOrange}`}
            aria-pressed={saved}
            onClick={() => setSaved((prev) => !prev)}
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
          <button
            type="button"
            className={styles.reportLink}
            onClick={() => setReported(true)}
          >
            {reported
              ? "Ikibazo cyamenyeshejwe ✓"
              : "Menyesha ikibazo kuri iyi nyandiko"}
          </button>
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

          <div className={styles.removalRadios} role="radiogroup" aria-label="Impamvu">
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

      <section className={styles.commentsSection} aria-labelledby="comments-heading">
        <h2 id="comments-heading" className={styles.commentsHeading}>
          Ibitekerezo &middot; {totalCount}
        </h2>

        <div className={styles.commentList}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`${styles.commentCard}${comment.deleted ? ` ${styles.commentDeleted}` : ""}`}
            >
              {comment.deleted ? (
                <p className={styles.deletedText}>Igitekerezo cyakuweho</p>
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
                  <p className={styles.commentBody}>{comment.body}</p>
                  <div className={styles.commentActions}>
                    <button type="button" className={styles.commentActionBtn}>
                      Subiza
                    </button>
                    <span aria-hidden="true">&middot;</span>
                    <button type="button" className={styles.commentActionBtn}>
                      Hindura
                    </button>
                    <span aria-hidden="true">&middot;</span>
                    <button type="button" className={styles.commentActionBtn}>
                      Siba
                    </button>
                    <span aria-hidden="true">&middot;</span>
                    <button
                      type="button"
                      className={`${styles.commentActionBtn} ${styles.commentReport}`}
                    >
                      Menyesha
                    </button>
                  </div>
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
          ))}
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
