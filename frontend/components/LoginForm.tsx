"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Field from "./Field";
import { ApiError, apiFetch, type AuthUser } from "@/lib/api";
import { setPendingVerifyIdentifier, useAuth } from "@/lib/auth-context";
import styles from "./LoginForm.module.css";

function getSafeNextPath(raw: string | null): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }
  return "/";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    form?: string;
  }>({});

  function validate() {
    const next: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      next.identifier = "Imeri cyangwa izina ry'urubuga birakenewe.";
    }
    if (!password) {
      next.password = "Ijambobanga rirakenewe.";
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

    try {
      await apiFetch<{ user: AuthUser }>("/api/v1/auth/login", {
        method: "POST",
        json: {
          identifier: trimmedIdentifier,
          password,
        },
      });
      await refreshAuth();
      const target = getSafeNextPath(searchParams.get("next"));
      router.push(target);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ACCOUNT_NOT_VERIFIED") {
          setPendingVerifyIdentifier(trimmedIdentifier);
          router.push(
            `/kwemeza?identifier=${encodeURIComponent(trimmedIdentifier)}&unverified=1`
          );
          return;
        }
        setErrors({ form: err.message });
      } else {
        setErrors({
          form: "Habaye ikibazo mu kwinjira. Ongera ugerageze.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>MURAKAZA NEZA</p>
      <h1 className={styles.title}>Injira muri Konti yawe</h1>
      <p className={styles.lead}>
        Uzuza amakuru yawe kugira ngo ukomeze gusoma no kwandika.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {errors.form ? (
          <p className={styles.formError} role="alert">
            {errors.form}
          </p>
        ) : null}

        <Field
          id="identifier"
          name="identifier"
          label="Imeri cyangwa Izina ry'Urubuga (Email or Username)"
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
          placeholder="kalisa@urunana.rw"
          autoComplete="username"
          error={errors.identifier}
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
          autoComplete="current-password"
          error={errors.password}
        />

        <Link href="/forgot-password" className={styles.forgot}>
          Wibagiwe ijambobanga?
        </Link>

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Kwinjira…" : "Injira →"}
        </button>
      </form>

      <p className={styles.signup}>
        Nta konti uragira?{" "}
        <Link href="/kwiyandikisha">Iyandikishe hano</Link>
      </p>
    </div>
  );
}
