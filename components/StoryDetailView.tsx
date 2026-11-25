"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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
  title: string;
  author: string;
  authorSlug: string;
};

export default function StoryDetailView({ title, author, authorSlug }: Props) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);
  const [reported, setReported] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [draft, setDraft] = useState("");

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

      <h1 className={styles.title}>{title}</h1>

      <div className={styles.meta}>
        <Link href={`/umwirondoro/${authorSlug}`} className={styles.authorLink}>
          {author}
        </Link>
        <span className={styles.metaDate}>Yatangiweho: 14 Ukwakira 2026</span>
        <span className={styles.updatedPill}>
          Yavuguruwe ku wa 18 Ukwakira 2026
        </span>
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
          <button
            type="button"
            className={`${styles.pill} ${styles.pillMaroon}`}
            aria-pressed={following}
            onClick={() => setFollowing((prev) => !prev)}
          >
            {following ? "Uramukurikira" : "Kurikira Umwanditsi"}
          </button>
        </div>

        <button
          type="button"
          className={styles.reportLink}
          onClick={() => setReported(true)}
        >
          {reported
            ? "Ikibazo cyamenyeshejwe ✓"
            : "Menyesha ikibazo kuri iyi nyandiko"}
        </button>
      </div>

      <hr className={styles.rule} />

      <div className={styles.bodyGrid}>
        <div className={styles.prose}>
          <p>
            Mu mateka y&apos;u Rwanda rwo hambere, Umwami Ruganzu II Ndoli
            yibukwa nk&apos;intwari yagaruye ingoma nyuma y&apos;imyaka myinshi
            y&apos;akaga n&apos;amacakubiri. Avuye i Karagwe aho yari
            yarahungiye kwa nyirasenge Nyabunyana, yagarutse mu Rwanda afite
            icyerekezo cyo kongera guhuza abaturage.
          </p>
          <p>
            Inkuru n&apos;ibitekerezo by&apos;abakurambere bigaragaza ko
            ubutwari bwe butari bushingiye ku rugamba gusa, ahubwo no ku
            buhanga bwo kunga imiryango, kubaka ubufatanye n&apos;ibiganiro
            by&apos;umuco byasigaye mu migani n&apos;indirimbo kugeza uyu munsi.
          </p>
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
    </article>
  );
}
