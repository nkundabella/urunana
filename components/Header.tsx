import Link from "next/link";
import styles from "./Header.module.css";

export type HeaderVariant = "A" | "B" | "C";

type Props = {
  variant?: HeaderVariant;
};

const NAV = [
  { href: "/ahabanza", label: "Ahabanza" },
  { href: "/gushakisha", label: "Gushakisha" },
  { href: "/ibyo-nabitse", label: "Ibyo Nabitse" },
];

export default function Header({ variant = "C" }: Props) {
  return (
    <header className={styles.header}>
      <div className={`${styles.inner}${variant === "A" ? ` ${styles.innerA}` : ""}`}>
        <Link href="/ahabanza" className={styles.brand}>
          <span className={styles.logo}>Urunana</span>
          <span className={styles.tagline}>UMUCO N&apos;URURIMI</span>
        </Link>

        {variant !== "B" ? (
          <nav className={styles.nav} aria-label="Ibiyerekeye">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : (
          <label className={styles.searchB}>
            <input
              type="search"
              placeholder="Shakisha mu Urunana…"
              aria-label="Shakisha mu Urunana"
            />
          </label>
        )}

        <div className={styles.actions}>
          {variant === "A" && (
            <>
              <label className={styles.searchA}>
                <span className={styles.searchIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Shakisha inkuru, imigani…"
                  aria-label="Shakisha inkuru, imigani"
                />
              </label>
              <Link href="/kwandika" className={styles.pillAccent}>
                Kwandika
              </Link>
              <button type="button" className={styles.bell} aria-label="Ubutumire">
                <BellIcon />
              </button>
              <span className={styles.lang}>RW</span>
              <Link href="/umwirondoro" className={styles.avatar} aria-label="Umwirondoro">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/blue-baskets.jpg" alt="" />
              </Link>
            </>
          )}

          {variant === "B" && (
            <>
              <Link href="/kwandika" className={styles.pillAccent}>
                Kwandika Inkuru
              </Link>
              <button type="button" className={styles.bellBadged} aria-label="Ubutumire, 2 bishya">
                <BellIcon />
                <span className={styles.badge}>2</span>
              </button>
              <Link href="/umwirondoro" className={styles.avatar} aria-label="Umwirondoro">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/blue-baskets.jpg" alt="" />
              </Link>
            </>
          )}

          {variant === "C" && (
            <>
              <Link href="/kwandika" className={styles.pillOutline}>
                Kwandika Inkuru
              </Link>
              <span className={styles.lang}>RW</span>
              <Link href="/kwinjira" className={styles.textLink}>
                Kwinjira
              </Link>
              <Link href="/kwiyandikisha" className={styles.pillAccent}>
                Kwiyandikisha
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
