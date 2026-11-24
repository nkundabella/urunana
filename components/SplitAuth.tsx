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
  fit = false,
}: Props) {
  const imagePane = (
    <div className={styles.imagePane}>
      {imageLayout === "clusters" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            className={`${styles.cluster} ${styles.clusterTop}`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`${styles.cluster} ${styles.clusterBottom}`}
          />
        </>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`${styles.image}${imageLayout === "contain" ? ` ${styles.imageContain}` : ""}`}
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
      className={`${styles.split}${fit ? ` ${styles.fit}` : ""}${imageSide === "left" ? ` ${styles.imageLeft}` : ""}`}
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
