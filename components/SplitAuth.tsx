import type { ReactNode } from "react";
import styles from "./SplitAuth.module.css";

type Caption = {
  eyebrow?: string;
  title: string;
  sub?: string;
};

type Props = {
  form: ReactNode;
  imageSrc: string;
  imageAlt: string;
  caption: Caption;
  /** Default: form left, image right (login). */
  imageSide?: "left" | "right";
  /** cover fills the pane; contain keeps a composed asset fully visible. */
  imageLayout?: "cover" | "contain" | "clusters";
  /** Optional CSS object-position override for cover images. */
  imagePosition?: string;
  /** Cap left image pane width by viewport height so portrait art isn't over-zoomed on wide screens. */
  portraitSplit?: boolean;
  /** Fill the parent instead of forcing a tall 60vw split. */
  fit?: boolean;
};

export default function SplitAuth({
  form,
  imageSrc,
  imageAlt,
  caption,
  imageSide = "right",
  imageLayout = "cover",
  imagePosition,
  portraitSplit = false,
  fit = false,
}: Props) {
  const imagePane = (
    <div
      className={`${styles.imagePane}${imageLayout === "clusters" ? ` ${styles.imagePaneClusters}` : ""}`}
    >
      {imageLayout === "clusters" ? (
        <>
          <div className={`${styles.cluster} ${styles.clusterTop}`} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="" className={styles.clusterTopImg} />
          </div>
          <div className={`${styles.cluster} ${styles.clusterBottom}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt={imageAlt} className={styles.clusterBottomImg} />
          </div>
        </>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`${styles.image}${imageLayout === "contain" ? ` ${styles.imageContain}` : ""}`}
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
      )}
      <div
        className={`${styles.caption}${caption.eyebrow ? ` ${styles.captionWrap}` : ""}`}
      >
        {caption.eyebrow ? (
          <p className={styles.captionEyebrow}>{caption.eyebrow}</p>
        ) : null}
        <p className={styles.captionTitle}>{caption.title}</p>
        {caption.sub ? <p className={styles.captionSub}>{caption.sub}</p> : null}
      </div>
    </div>
  );

  const formPane = <div className={styles.formPane}>{form}</div>;

  return (
    <section
      className={`${styles.split}${fit ? ` ${styles.fit}` : ""}${imageSide === "left" ? ` ${styles.imageLeft}` : ""}${portraitSplit ? ` ${styles.portraitSplit}` : ""}`}
    >
      {imageSide === "left" ? (
        <>
          {imagePane}
          {formPane}
        </>
      ) : (
        <>
          {formPane}
          {imagePane}
        </>
      )}
    </section>
  );
}
