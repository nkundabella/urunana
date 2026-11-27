"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UiLanguage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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

export default function Header({ variant = "C", notificationCount }: Props) {
  const router = useRouter();
  const {
    user,
    loading,
    unreadNotificationCount,
    language,
    setPreferredLanguage,
    logout,
  } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const langWrapRef = useRef<HTMLDivElement | null>(null);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = Boolean(user);
  const effectiveUnread = isAuthenticated
    ? unreadNotificationCount
    : (notificationCount ?? 0);
  const homeHref = isAuthenticated ? "/" : "/ahabanza";

  const navItems = [
    { href: homeHref, label: "Ahabanza" },
    { href: "/gushakisha", label: "Gushakisha" },
    { href: "/ibyo-nabitse", label: "Ibyo Nabitse" },
  ];

  useEffect(() => {
    if (!langMenuOpen && !accountMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        langMenuOpen &&
        langWrapRef.current &&
        !langWrapRef.current.contains(target)
      ) {
        setLangMenuOpen(false);
      }
      if (
        accountMenuOpen &&
        accountWrapRef.current &&
        !accountWrapRef.current.contains(target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLangMenuOpen(false);
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [langMenuOpen, accountMenuOpen]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchText.trim();
    router.push(q ? `/gushakisha?q=${encodeURIComponent(q)}` : "/gushakisha");
  }

  function handleSelectLanguage(next: UiLanguage) {
    setLangMenuOpen(false);
    void setPreferredLanguage(next);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setAccountMenuOpen(false);
    try {
      await logout();
      router.push("/ahabanza");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const currentLang =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) ??
    LANGUAGE_OPTIONS[0];

  const langToggle = (
    <div className={styles.langWrap} ref={langWrapRef}>
      <button
        type="button"
        className={styles.langBtn}
        aria-haspopup="menu"
        aria-expanded={langMenuOpen}
        aria-label={`Ururimi: ${currentLang.label}`}
        onClick={() => {
          setAccountMenuOpen(false);
          setLangMenuOpen((prev) => !prev);
        }}
      >
        {currentLang.short}
      </button>
      {langMenuOpen ? (
        <div
          className={styles.langMenu}
          role="menu"
          aria-label="Hitamo ururimi"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              role="menuitemradio"
              aria-checked={opt.code === language}
              className={`${styles.langOption}${
                opt.code === language ? ` ${styles.langOptionActive}` : ""
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

  const shortDisplayName =
    user?.displayName.trim().split(/\s+/)[0] || user?.username || "Konti";

  const accountMenu = user ? (
    <div className={styles.accountWrap} ref={accountWrapRef}>
      <button
        type="button"
        className={styles.accountTrigger}
        aria-haspopup="menu"
        aria-expanded={accountMenuOpen}
        aria-label={`Konti ya ${user.displayName}`}
        onClick={() => {
          setLangMenuOpen(false);
          setAccountMenuOpen((prev) => !prev);
        }}
      >
        <span className={styles.avatar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.profilePhotoUrl || "/assets/blue-baskets.jpg"}
            alt=""
          />
        </span>
        <span className={styles.accountLabel}>{shortDisplayName}</span>
        <ChevronDownIcon />
      </button>

      {accountMenuOpen ? (
        <div
          className={styles.accountMenu}
          role="menu"
          aria-label="Ibikubiye kuri konti"
        >
          <div className={styles.accountHeader}>
            <span className={styles.accountName}>{user.displayName}</span>
            <span className={styles.accountHandle}>@{user.username}</span>
          </div>

          <Link
            href="/umwirondoro"
            role="menuitem"
            className={styles.accountItem}
            onClick={() => setAccountMenuOpen(false)}
          >
            Umwirondoro
          </Link>
          <Link
            href="/igenamiterere"
            role="menuitem"
            className={styles.accountItem}
            onClick={() => setAccountMenuOpen(false)}
          >
            Igenamiterere
          </Link>
          {user.role === "ADMIN" || user.isModerator ? (
            <Link
              href="/ubuyobozi"
              role="menuitem"
              className={styles.accountItem}
              onClick={() => setAccountMenuOpen(false)}
            >
              Ubuyobozi
            </Link>
          ) : null}

          <div className={styles.accountDivider} role="separator" />

          <button
            type="button"
            role="menuitem"
            className={styles.logoutItem}
            disabled={loggingOut}
            onClick={handleLogout}
          >
            {loggingOut ? "Gusohoka…" : "Gusohoka"}
          </button>
        </div>
      ) : null}
    </div>
  ) : null;

  const notificationBell = (
    <Link
      href="/imenyesha"
      className={effectiveUnread > 0 ? styles.bellBadged : styles.bell}
      aria-label={
        effectiveUnread > 0
          ? `Imenyesha, ${effectiveUnread} bishya`
          : "Imenyesha"
      }
    >
      <BellIcon />
      {effectiveUnread > 0 ? (
        <span className={styles.badge}>{effectiveUnread}</span>
      ) : null}
    </Link>
  );

  const guestAuthLinks = (
    <>
      <Link href="/kwinjira" className={styles.textLink}>
        Kwinjira
      </Link>
      <Link href="/kwiyandikisha" className={styles.pillAccent}>
        Kwiyandikisha
      </Link>
    </>
  );

  return (
    <header className={styles.header}>
      <div
        className={`${styles.inner}${variant === "A" ? ` ${styles.innerA}` : ""}`}
      >
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
              <Link
                key={item.label}
                href={item.href}
                className={styles.navLink}
              >
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
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 20l-3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
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
              {isAuthenticated ? (
                <>
                  <Link href="/kwandika" className={styles.pillAccent}>
                    Kwandika
                  </Link>
                  {notificationBell}
                  {langToggle}
                  {accountMenu}
                </>
              ) : loading ? (
                langToggle
              ) : (
                <>
                  {langToggle}
                  {guestAuthLinks}
                </>
              )}
            </>
          )}

          {variant === "B" && (
            <>
              {isAuthenticated ? (
                <>
                  <Link href="/kwandika" className={styles.pillAccent}>
                    Kwandika Inkuru
                  </Link>
                  {notificationBell}
                  {langToggle}
                  {accountMenu}
                </>
              ) : loading ? (
                langToggle
              ) : (
                <>
                  {langToggle}
                  {guestAuthLinks}
                </>
              )}
            </>
          )}

          {variant === "C" && (
            <>
              <Link href="/kwandika" className={styles.pillOutline}>
                Kwandika Inkuru
              </Link>
              {langToggle}
              {isAuthenticated ? accountMenu : guestAuthLinks}
            </>
          )}

          {variant === "landing" && (
            <>
              {isAuthenticated ? (
                <>
                  <Link href="/" className={styles.pillAccent}>
                    Ahabanza
                  </Link>
                  {accountMenu}
                </>
              ) : (
                guestAuthLinks
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
