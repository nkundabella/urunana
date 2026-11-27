"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { setUiLanguage, type UiLanguage } from "@/src/data/session";
import styles from "./ProfileSettingsForm.module.css";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const STORAGE_KEY = "urunana_profile_settings";

type ProfileSettings = {
  displayName: string;
  bio: string;
  interests: string;
  language: UiLanguage;
  avatarUrl: string;
};

const DEFAULT_SETTINGS: ProfileSettings = {
  displayName: "",
  bio: "",
  interests: "",
  language: "rw",
  avatarUrl: "/assets/blue-baskets.jpg",
};

export default function ProfileSettingsForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savedState, setSavedState] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [language, setLanguage] = useState<UiLanguage>("rw");
  const [avatarUrl, setAvatarUrl] = useState("/assets/blue-baskets.jpg");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
      const merged: ProfileSettings = {
        displayName: parsed.displayName ?? "",
        bio: parsed.bio ?? "",
        interests: parsed.interests ?? "",
        language:
          parsed.language === "en" || parsed.language === "fr"
            ? parsed.language
            : "rw",
        avatarUrl: parsed.avatarUrl || "/assets/blue-baskets.jpg",
      };
      setSavedState(merged);
      setDisplayName(merged.displayName);
      setBio(merged.bio);
      setInterests(merged.interests);
      setLanguage(merged.language);
      setAvatarUrl(merged.avatarUrl);
    } catch {
      // ignore invalid storage
    }
  }, []);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Ifoto ntigomba kurenza 2 MB.");
      return;
    }

    setAvatarError(null);
    setStatusMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: ProfileSettings = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      interests: interests.trim(),
      language,
      avatarUrl,
    };
    setSavedState(next);
    setUiLanguage(language);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors for large base64 previews
    }
    setStatusMessage("Impinduka zabitswe.");
  }

  function handleCancel() {
    setDisplayName(savedState.displayName);
    setBio(savedState.bio);
    setInterests(savedState.interests);
    setLanguage(savedState.language);
    setAvatarUrl(savedState.avatarUrl);
    setAvatarError(null);
    setStatusMessage(null);
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <div className={styles.avatarRow}>
        <div className={styles.avatar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="Ifoto y'umwirondoro" />
        </div>
        <div className={styles.avatarControls}>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Hindura ifoto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className={styles.hiddenInput}
            tabIndex={-1}
          />
          <span className={styles.hint}>Ntarenze 2 MB</span>
          {avatarError ? (
            <p className={styles.error} role="alert">
              {avatarError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="settings-name" className={styles.label}>
          IZINA (DISPLAY NAME)
        </label>
        <input
          id="settings-name"
          type="text"
          className={styles.input}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setStatusMessage(null);
          }}
          placeholder="Kalisa Mugisha"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="settings-bio" className={styles.label}>
          INCAMAKE Y&apos;UMWIRONDORO
        </label>
        <textarea
          id="settings-bio"
          rows={3}
          className={styles.textarea}
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setStatusMessage(null);
          }}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="settings-interests" className={styles.label}>
          IBIKUNDWA (INTERESTS)
        </label>
        <input
          id="settings-interests"
          type="text"
          className={styles.input}
          value={interests}
          onChange={(e) => {
            setInterests(e.target.value);
            setStatusMessage(null);
          }}
          placeholder="Amateka, imigani..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="settings-lang" className={styles.label}>
          URURIMI RW&apos;IMIKORESHEREZE
        </label>
        <div className={styles.selectWrap}>
          <select
            id="settings-lang"
            className={styles.select}
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as UiLanguage);
              setStatusMessage(null);
            }}
          >
            <option value="rw">Ikinyarwanda</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
          <span className={styles.chevron} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn}>
          Bika impinduka
        </button>
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={handleCancel}
        >
          Hagarika
        </button>
        {statusMessage ? (
          <span className={styles.status} role="status" aria-live="polite">
            {statusMessage}
          </span>
        ) : null}
      </div>
    </form>
  );
}
