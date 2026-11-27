"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "./Field";
import {
  getUiLanguage,
  setSession,
  setUiLanguage,
  type UiLanguage,
} from "@/src/data/session";
import styles from "./RegisterForm.module.css";

const LANGUAGES: { id: UiLanguage; label: string }[] = [
  { id: "rw", label: "Ikinyarwanda" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
];

export default function RegisterForm() {
  const router = useRouter();
  const [lang, setLang] = useState<UiLanguage>("rw");
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [rulesOk, setRulesOk] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    displayName?: string;
    password?: string;
    age?: string;
    rules?: string;
  }>({});

  useEffect(() => {
    setLang(getUiLanguage());
  }, []);

  function chooseLanguage(next: UiLanguage) {
    setLang(next);
    setUiLanguage(next);
  }

  function validate() {
    const next: typeof errors = {};
    if (!identifier.trim()) {
      next.identifier = "Imeri cyangwa telefoni birakenewe.";
    }
    if (!displayName.trim()) {
      next.displayName = "Izina ry'urubuga rirakenewe.";
    }
    if (password.length < 6) {
      next.password = "Ijambobanga rigomba kuba nibura inyuguti 6.";
    }
    if (!ageOk) {
      next.age = "Iyi nyandiko irakenewe.";
    }
    if (!rulesOk) {
      next.rules = "Iyi nyandiko irakenewe.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSession(identifier.trim(), displayName.trim());
    router.push("/kwemeza");
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>URURIMI WIFUZA GUKORESHA</p>
      <div className={styles.langs} role="group" aria-label="Ururimi wifuza gukoresha">
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
        <Field
          id="identifier"
          name="identifier"
          label="Imeri cyangwa Telefoni (Email or Phone)"
          value={identifier}
          onChange={(v) => {
            setIdentifier(v);
            if (errors.identifier) {
              setErrors((prev) => ({ ...prev, identifier: undefined }));
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
            if (errors.displayName) {
              setErrors((prev) => ({ ...prev, displayName: undefined }));
            }
          }}
          placeholder="kalisa"
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
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          placeholder="Byibura inyuguti 6"
          autoComplete="new-password"
          error={errors.password}
        />

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={ageOk}
            onChange={(e) => {
              setAgeOk(e.target.checked);
              if (errors.age) setErrors((prev) => ({ ...prev, age: undefined }));
            }}
          />
          <span>Nemeza ko mfite nibura imyaka 13 y&apos;amavuko (I am at least 13)</span>
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
              if (errors.rules) setErrors((prev) => ({ ...prev, rules: undefined }));
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

        <button type="submit" className={styles.submit}>
          Fungura Konti
        </button>
      </form>

      <p className={styles.login}>
        Usanzwe ufite konti? <Link href="/kwinjira">Injira</Link>
      </p>
    </div>
  );
}
