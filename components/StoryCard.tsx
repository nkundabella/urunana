import Link from "next/link";
import styles from "./StoryCard.module.css";

export type StoryTag = {
  label: string;
  tone: "orange" | "sand" | "ink";
};

export type StoryItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  comments: number;
  tags: StoryTag[];
};

type Props = {
  story: StoryItem;
  href?: string;
  variant?: "default" | "wide";
};

export default function StoryCard({ story, href, variant = "default" }: Props) {
  const content = (
    <article
      className={`${styles.card}${variant === "wide" ? ` ${styles.cardWide}` : ""}`}
    >
      <div className={styles.tags}>
        {story.tags.map((tag) => (
          <span
            key={tag.label}
            className={`${styles.tag} ${
              tag.tone === "orange"
                ? styles.tagOrange
                : tag.tone === "ink"
                  ? styles.tagInk
                  : styles.tagSand
            }`}
          >
            {tag.label}
          </span>
        ))}
      </div>

      <h2 className={styles.title}>{story.title}</h2>
      <p className={styles.excerpt}>{story.excerpt}</p>

      <hr className={styles.divider} />

      <div className={styles.footer}>
        <span className={styles.author}>{story.author}</span>
        <span className={styles.comments}>{story.comments} ibitekerezo</span>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className={styles.link}>
        {content}
      </Link>
    );
  }

  return content;
}
