"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getUiLanguage,
  setUiLanguage,
  type UiLanguage,
} from "@/lib/store";
import styles from "./Header.module.css";

export type HeaderVariant = "A" | "B" | "C" | "landing";

type Props = {
  variant?: HeaderVariant;
  notificationCount?: number;
};

const LANGUAGE_OPTIONS: { code: UiLanguage; short: string; label: string }[] = [
  { code: "rw", short: "RW", label: "Ikinyarwanda" },
  { code: "en", short: "EN", label: "English" },
  { code: "fr", short: "FR", label: "Français" },
];

export default function Header({ variant = "C", notificationCount = 2 }: Props) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [lang, setLang] = useState<UiLanguage>("rw");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langWrapRef = useRef<HTMLDivElement | null>(null);

  const isLoggedInView = variant === "A" || variant === "B";
  const homeHref = isLoggedInView ? "/" : "/ahabanza";
  const navItems = [
    { href: homeHref, label: "Ahabanza" },
    { href: "/gushakisha", label: "Gushakisha" },
    { href: "/ibyo-nabitse", label: "Ibyo Nabitse" },
  ];

  useEffect(() => {
    const stored = getUiLanguage();
    setLang(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!langMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        langWrapRef.current &&
        !langWrapRef.current.contains(e.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLangMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [langMenuOpen]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchText.trim();
    router.push(q ? `/gushakisha?q=${encodeURIComponent(q)}` : "/gushakisha");
  }

  function handleSelectLanguage(next: UiLanguage) {
    setUiLanguage(next);
    setLang(next);
    setLangMenuOpen(false);
  }

  const currentLang =
    LANGUAGE_OPTIONS.find((opt) => opt.code === lang) ?? LANGUAGE_OPTIONS[0];

  const langToggle = (
    <div className={styles.langWrap} ref={langWrapRef}>
      <button
        type="button"
        className={styles.langBtn}
        aria-haspopup="menu"
        aria-expanded={langMenuOpen}
        aria-label={`Ururimi: ${currentLang.label}`}
        onClick={() => setLangMenuOpen((prev) => !prev)}
      >
        {currentLang.short}
      </button>
      {langMenuOpen ? (
        <div className={styles.langMenu} role="menu" aria-label="Hitamo ururimi">
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              role="menuitemradio"
              aria-checked={opt.code === lang}
              className={`${styles.langOption}${
                opt.code === lang ? ` ${styles.langOptionActive}` : ""
              }`}
              onClick={() => handleSelectLanguage(opt.code)}
            >
              <span>{opt.label}</span>
              <span className={styles.langCode}>{opt.short}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={`${styles.inner}${variant === "A" ? ` ${styles.innerA}` : ""}`}>
        <Link href={homeHref} className={styles.brand}>
          <span className={styles.logo}>Urunana</span>
          <span className={styles.tagline}>UMUCO N&apos;URURIMI</span>
        </Link>

        {variant === "B" ? (
          <form
            className={styles.searchB}
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Shakisha mu Urunana…"
              aria-label="Shakisha mu Urunana"
            />
          </form>
        ) : variant === "landing" ? (
          <div aria-hidden="true" />
        ) : (
          <nav className={styles.nav} aria-label="Ibiyerekeye">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className={styles.actions}>
          {variant === "A" && (
            <>
              <form
                className={styles.searchA}
                onSubmit={handleSearchSubmit}
                role="search"
              >
                <span className={styles.searchIcon} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Shakisha inkuru, imigani…"
                  aria-label="Shakisha inkuru, imigani"
                />
              </form>
              <Link href="/kwandika" className={styles.pillAccent}>
                Kwandika
              </Link>
              <Link href="/imenyesha" className={styles.bell} aria-label="Imenyesha">
                <BellIcon />
              </Link>
              {langToggle}
              <div className={styles.avatarArea}>
                <Link href="/umwirondoro" className={styles.avatar} aria-label="Umwirondoro">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/blue-baskets.jpg" alt="" />
                </Link>
                <Link href="/igenamiterere" className={styles.settingsLink}>
                  Igenamiterere
                </Link>
              </div>
            </>
          )}

          {variant === "B" && (
            <>
              <Link href="/kwandika" className={styles.pillAccent}>
                Kwandika Inkuru
              </Link>
              <Link
                href="/imenyesha"
                className={styles.bellBadged}
                aria-label={
                  notificationCount > 0
                    ? `Imenyesha, ${notificationCount} bishya`
                    : "Imenyesha"
                }
              >
                <BellIcon />
                {notificationCount > 0 ? (
                  <span className={styles.badge}>{notificationCount}</span>
                ) : null}
              </Link>
              <div className={styles.avatarArea}>
                <Link href="/umwirondoro" className={styles.avatar} aria-label="Umwirondoro">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/blue-baskets.jpg" alt="" />
                </Link>
                <Link href="/igenamiterere" className={styles.settingsLink}>
                  Igenamiterere
                </Link>
              </div>
            </>
          )}

          {variant === "C" && (
            <>
              <Link href="/kwandika" className={styles.pillOutline}>
                Kwandika Inkuru
              </Link>
              {langToggle}
              <Link href="/kwinjira" className={styles.textLink}>
                Kwinjira
              </Link>
              <Link href="/kwiyandikisha" className={styles.pillAccent}>
                Kwiyandikisha
              </Link>
            </>
          )}

          {variant === "landing" && (
            <>
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
