"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, apiFetch, type AuthUser, type UiLanguage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import styles from "./ProfileSettingsForm.module.css";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

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

function parseInterestsInput(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function ProfileSettingsForm() {
  const { user, refreshAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [savedState, setSavedState] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [language, setLanguage] = useState<UiLanguage>("rw");
  const [avatarUrl, setAvatarUrl] = useState("/assets/blue-baskets.jpg");
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loaded: ProfileSettings = {
      displayName: user.displayName || "",
      bio: user.bio || "",
      interests: (user.areasOfInterest ?? []).join(", "),
      language:
        user.preferredLanguage === "en" || user.preferredLanguage === "fr"
          ? user.preferredLanguage
          : "rw",
      avatarUrl: user.profilePhotoUrl || "/assets/blue-baskets.jpg",
    };
    setSavedState(loaded);
    setDisplayName(loaded.displayName);
    setBio(loaded.bio);
    setInterests(loaded.interests);
    setLanguage(loaded.language);
    setAvatarUrl(loaded.avatarUrl);
  }, [user]);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Ifoto ntigomba kurenza 2 MB.");
      return;
    }

    setAvatarError(null);
    setStatusMessage(
      "Ifoto izabikwa ku rubuga nyuma yo guhuza serivisi yo kohereza amafoto (Milestone 4)."
    );
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      setErrorMessage("Izina rigomba kuba rifite nibura inyuguti 2.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const parsedInterests = parseInterestsInput(interests);

    try {
      const res = await apiFetch<{ user: AuthUser }>("/api/v1/users/me", {
        method: "PATCH",
        json: {
          displayName: cleanName,
          bio: bio.trim() || null,
          areasOfInterest: parsedInterests,
          preferredLanguage: language,
        },
      });

      const updated: ProfileSettings = {
        displayName: res.user.displayName,
        bio: res.user.bio || "",
        interests: res.user.areasOfInterest.join(", "),
        language:
          res.user.preferredLanguage === "en" ||
          res.user.preferredLanguage === "fr"
            ? res.user.preferredLanguage
            : "rw",
        avatarUrl: res.user.profilePhotoUrl || avatarUrl,
      };
      setSavedState(updated);
      await refreshAuth();
      setStatusMessage("Impinduka zabitswe.");
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze kubika impinduka. Ongera ugerageze."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDisplayName(savedState.displayName);
    setBio(savedState.bio);
    setInterests(savedState.interests);
    setLanguage(savedState.language);
    setAvatarUrl(savedState.avatarUrl);
    setAvatarError(null);
    setErrorMessage(null);
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
            setErrorMessage(null);
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
            setErrorMessage(null);
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
            setErrorMessage(null);
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
              setErrorMessage(null);
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

      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? "Kubika…" : "Bika impinduka"}
        </button>
        <button
          type="button"
          className={styles.outlineBtn}
          disabled={saving}
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
