"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Field from "./Field";
import { ApiError, apiFetch, type AuthUser, type UiLanguage } from "@/lib/api";
import {
  setPendingVerifyIdentifier,
  useAuth,
} from "@/lib/auth-context";
import styles from "./RegisterForm.module.css";

const LANGUAGES: { id: UiLanguage; label: string }[] = [
  { id: "rw", label: "Ikinyarwanda" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
];

type RegisterErrors = {
  identifier?: string;
  displayName?: string;
  password?: string;
  age?: string;
  rules?: string;
  inviteCode?: string;
  form?: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, setPreferredLanguage } = useAuth();

  const initialInvite = searchParams.get("invite")?.trim() || "";

  const [lang, setLang] = useState<UiLanguage>(language);
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInvite);
  const [showInviteField, setShowInviteField] = useState(Boolean(initialInvite));
  const [ageOk, setAgeOk] = useState(false);
  const [rulesOk, setRulesOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  useEffect(() => {
    setLang(language);
  }, [language]);

  function chooseLanguage(next: UiLanguage) {
    setLang(next);
    void setPreferredLanguage(next);
  }

  function validate() {
    const next: RegisterErrors = {};
    if (!identifier.trim()) {
      next.identifier = "Imeri cyangwa telefoni birakenewe.";
    }
    if (displayName.trim().length < 2) {
      next.displayName = "Izina ry'urubuga rirakenewe (nibura inyuguti 2).";
    }
    if (password.length < 6) {
      next.password = "Ijambobanga rigomba kuba nibura inyuguti 6.";
    }
    if (!ageOk) {
      next.age = "Ugomba kwemeza ko ufite nibura imyaka 13.";
    }
    if (!rulesOk) {
      next.rules = "Ugomba kwemera Amategeko y'Umuryango.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setErrors({});

    const trimmedIdentifier = identifier.trim();
    const trimmedInvite = inviteCode.trim();

    try {
      await apiFetch<{ user: AuthUser; verificationRequired: boolean }>(
        "/api/v1/auth/register",
        {
          method: "POST",
          json: {
            identifier: trimmedIdentifier,
            displayName: displayName.trim(),
            password,
            preferredLanguage: lang,
            ageConfirmed: ageOk,
            rulesAccepted: rulesOk,
            ...(trimmedInvite ? { inviteCode: trimmedInvite } : {}),
          },
        }
      );

      setPendingVerifyIdentifier(trimmedIdentifier);
      router.push(
        `/kwemeza?identifier=${encodeURIComponent(trimmedIdentifier)}`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "IDENTIFIER_TAKEN") {
          setErrors({ identifier: err.message });
        } else if (err.code === "USERNAME_TAKEN") {
          setErrors({ displayName: err.message });
        } else if (err.code === "INVALID_INVITE_CODE") {
          setShowInviteField(true);
          setErrors({ inviteCode: err.message });
        } else if (err.fields) {
          setErrors({
            identifier: err.fields.identifier?.[0],
            displayName: err.fields.displayName?.[0],
            password: err.fields.password?.[0],
            age: err.fields.ageConfirmed?.[0],
            rules: err.fields.rulesAccepted?.[0],
            inviteCode: err.fields.inviteCode?.[0],
            form: err.message,
          });
        } else {
          setErrors({ form: err.message });
        }
      } else {
        setErrors({
          form: "Habaye ikibazo mu gufungura konti. Ongera ugerageze.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>URURIMI WIFUZA GUKORESHA</p>
      <div
        className={styles.langs}
        role="group"
        aria-label="Ururimi wifuza gukoresha"
      >
        {LANGUAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.lang}${lang === item.id ? ` ${styles.langActive}` : ""}`}
            aria-pressed={lang === item.id}
            onClick={() => chooseLanguage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <h1 className={styles.title}>
        Fungura Konti
        <br />
        Nshya
      </h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errors.form ? (
          <p className={styles.formError} role="alert">
            {errors.form}
          </p>
        ) : null}

        <Field
          id="identifier"
          name="identifier"
          label="Imeri cyangwa Telefoni (Email or Phone)"
          value={identifier}
          onChange={(v) => {
            setIdentifier(v);
            if (errors.identifier || errors.form) {
              setErrors((prev) => ({
                ...prev,
                identifier: undefined,
                form: undefined,
              }));
            }
          }}
          placeholder="kalisa@urugero.rw"
          autoComplete="username"
          error={errors.identifier}
        />
        <Field
          id="displayName"
          name="displayName"
          label="Izina ry'Urubuga (Display Name)"
          value={displayName}
          onChange={(v) => {
            setDisplayName(v);
            if (errors.displayName || errors.form) {
              setErrors((prev) => ({
                ...prev,
                displayName: undefined,
                form: undefined,
              }));
            }
          }}
          placeholder="Kalisa Mugisha"
          autoComplete="nickname"
          error={errors.displayName}
        />
        <Field
          id="password"
          name="password"
          type="password"
          label="Ijambobanga (Password)"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password || errors.form) {
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                form: undefined,
              }));
            }
          }}
          placeholder="Byibura inyuguti 6"
          autoComplete="new-password"
          error={errors.password}
        />

        {showInviteField ? (
          <Field
            id="inviteCode"
            name="inviteCode"
            label="Kode y'Ubutumire (Si itegeko / Optional)"
            value={inviteCode}
            onChange={(v) => {
              setInviteCode(v);
              if (errors.inviteCode) {
                setErrors((prev) => ({ ...prev, inviteCode: undefined }));
              }
            }}
            placeholder="URUNANA-2026-01"
            autoComplete="off"
            error={errors.inviteCode}
          />
        ) : (
          <button
            type="button"
            className={styles.inviteToggle}
            onClick={() => setShowInviteField(true)}
          >
            Ufite kode y&apos;ubutumire? (Founding invite code)
          </button>
        )}

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={ageOk}
            onChange={(e) => {
              setAgeOk(e.target.checked);
              if (errors.age) setErrors((prev) => ({ ...prev, age: undefined }));
            }}
          />
          <span>
            Nemeza ko mfite nibura imyaka 13 y&apos;amavuko (I am at least 13)
          </span>
        </label>
        {errors.age ? (
          <p className={styles.error} role="alert">
            {errors.age}
          </p>
        ) : null}

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={rulesOk}
            onChange={(e) => {
              setRulesOk(e.target.checked);
              if (errors.rules) {
                setErrors((prev) => ({ ...prev, rules: undefined }));
              }
            }}
          />
          <span>
            Nemeye Amategeko y&apos;Umuryango (I accept the Community Rules)
          </span>
        </label>
        {errors.rules ? (
          <p className={styles.error} role="alert">
            {errors.rules}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Gufungura konti…" : "Fungura Konti"}
        </button>
      </form>

      <p className={styles.login}>
        Usanzwe ufite konti? <Link href="/kwinjira">Injira</Link>
      </p>
    </div>
  );
}
