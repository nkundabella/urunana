import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./StateCards.module.css";

type Tone = "maroon" | "navy" | "red";

type BaseProps = {
  tone: Tone;
  title: ReactNode;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  onAction?: () => void;
};

export function StateCard({
  tone,
  title,
  description,
  ctaHref = "/",
  ctaLabel = "Garuka ahabanza",
  onAction,
}: BaseProps) {
  return (
    <article className={`${styles.card} ${styles[`tone_${tone}`]}`}>
      <div className={styles.circle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/baskets-wall.jpg"
          alt=""
          className={styles.circleImg}
        />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {onAction ? (
        <button type="button" className={styles.cta} onClick={onAction}>
          {ctaLabel}
        </button>
      ) : (
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </Link>
      )}
    </article>
  );
}

type ReusableStateProps = {
  ctaHref?: string;
  ctaLabel?: string;
  onAction?: () => void;
};

export function NotFound(props: ReusableStateProps) {
  return (
    <StateCard
      tone="maroon"
      title="Page not found"
      description="Urupapuro ushaka ntabwo ruboneka."
      {...props}
    />
  );
}

export function EmptyResults(props: ReusableStateProps) {
  return (
    <StateCard
      tone="navy"
      title={
        <>
          Nta bisubizo
          <br />
          bibonetse
        </>
      }
      description="Nta nyandiko zabonetse. Gerageza ijambo ritandukanye."
      {...props}
    />
  );
}

export function HiddenPost(props: ReusableStateProps) {
  return (
    <StateCard
      tone="red"
      title={
        <>
          Iyi nyandiko
          <br />
          yahishwe
        </>
      }
      description="Iri hishwe by'agateganyo mu gihe cy'igenzura."
      {...props}
    />
  );
}
