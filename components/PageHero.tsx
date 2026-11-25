import type { ReactNode } from "react";
import ZigzagStrip from "./ZigzagStrip";
import styles from "./PageHero.module.css";

type Props = {
  eyebrow: string;
  title: ReactNode;
  notice?: string;
  lead: string;
};

export default function PageHero({ eyebrow, title, notice, lead }: Props) {
  return (
    <section className={styles.hero}>
      <div className={styles.body}>
        <div className={styles.basketsWrap} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/maroon-baskets.jpg"
            alt=""
            className={styles.basketsImg}
          />
        </div>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {notice ? (
            <div className={styles.notice} role="status">
              {notice}
            </div>
          ) : null}
          <p className={styles.lead}>{lead}</p>
        </div>
      </div>
      <ZigzagStrip />
    </section>
  );
}
