import type { ReactNode } from "react";
import styles from "./SplitAuth.module.css";

type Caption = {
  title: string;
  sub: string;
};

type Props = {
  form: ReactNode;
  imageSrc: string;
  imageAlt: string;
  caption: Caption;
  /** Default: form left, image right (login). Pass "image-left" to flip. */
  imageSide?: "left" | "right";
};

export default function SplitAuth({
  form,
  imageSrc,
  imageAlt,
  caption,
  imageSide = "right",
}: Props) {
  const imagePane = (
    <div className={styles.imagePane}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt={imageAlt} className={styles.image} />
      <div className={styles.caption}>
        <p className={styles.captionTitle}>{caption.title}</p>
        <p className={styles.captionSub}>{caption.sub}</p>
      </div>
    </div>
  );

  const formPane = <div className={styles.formPane}>{form}</div>;

  return (
    <section
      className={`${styles.split} ${imageSide === "left" ? styles.imageLeft : ""}`}
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
