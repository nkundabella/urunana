"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Field from "./Field";
import { ApiError, apiFetch } from "@/lib/api";
import styles from "./ForgotPasswordForm.module.css";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token")?.trim() || "";

  // Request reset mode state
  const [identifier, setIdentifier] = useState("");
  const [requestError, setRequestError] = useState<string | undefined>(undefined);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Complete reset mode state (when ?token= is present)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetErrors, setResetErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  async function handleRequestSubmit(e: FormEvent) {
    e.preventDefault();
    if (requestSubmitting) return;

    const trimmed = identifier.trim();
    if (trimmed.length < 2) {
      setRequestError("Imeri cyangwa telefoni birakenewe.");
      setRequestMessage(null);
      return;
    }

    setRequestSubmitting(true);
    setRequestError(undefined);
    setRequestMessage(null);

    try {
      const res = await apiFetch<{ ok: boolean; message: string }>(
        "/api/v1/auth/forgot-password",
        {
          method: "POST",
          json: { identifier: trimmed },
        }
      );
      setRequestMessage(
        res.message ||
          "Niba konti ihari, ihuzo ryo gushyiraho irindi jambobanga ryoherejwe."
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setRequestError(err.message);
      } else {
        setRequestError("Habaye ikibazo. Ongera ugerageze nyuma y'akanya.");
      }
    } finally {
      setRequestSubmitting(false);
    }
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    if (resetSubmitting) return;

    const nextErrors: typeof resetErrors = {};
    if (newPassword.length < 6) {
      nextErrors.newPassword = "Ijambobanga rigomba kuba nibura inyuguti 6.";
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Amagambobanga ntabwo ahura.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setResetErrors(nextErrors);
      return;
    }

    setResetSubmitting(true);
    setResetErrors({});
    setResetSuccess(null);

    try {
      const res = await apiFetch<{ ok: boolean; message: string }>(
        "/api/v1/auth/reset-password",
        {
          method: "POST",
          json: {
            token: resetToken,
            newPassword,
          },
        }
      );
      setResetSuccess(
        res.message || "Ijambobanga ryawe ryahinduwe neza. Ushobora kwinjira ubu."
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setResetErrors({ form: err.message });
      } else {
        setResetErrors({
          form: "Habaye ikibazo mu guhindura ijambobanga. Ongera ugerageze.",
        });
      }
    } finally {
      setResetSubmitting(false);
    }
  }

  if (resetToken) {
    return (
      <div className={styles.wrap}>
        <p className={styles.eyebrow}>GUSUBIZA KONTI</p>
        <h1 className={styles.title}>
          Shyiraho
          <br />
          ijambobanga rishya
        </h1>

        {resetSuccess ? (
          <div className={styles.success} role="status" aria-live="polite">
            <p className={styles.successText}>{resetSuccess}</p>
            <Link href="/kwinjira" className={styles.loginCta}>
              Injira muri konti yawe →
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleResetSubmit} noValidate>
            {resetErrors.form ? (
              <p className={styles.formError} role="alert">
                {resetErrors.form}
              </p>
            ) : null}

            <Field
              id="newPassword"
              name="newPassword"
              type="password"
              label="Ijambobanga rishya (New Password)"
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                if (resetErrors.newPassword || resetErrors.form) {
                  setResetErrors((prev) => ({
                    ...prev,
                    newPassword: undefined,
                    form: undefined,
                  }));
                }
              }}
              placeholder="Byibura inyuguti 6"
              autoComplete="new-password"
              error={resetErrors.newPassword}
            />

            <Field
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Emeza ijambobanga rishya (Confirm Password)"
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                if (resetErrors.confirmPassword || resetErrors.form) {
                  setResetErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                    form: undefined,
                  }));
                }
              }}
              placeholder="Ongera wandike ijambobanga"
              autoComplete="new-password"
              error={resetErrors.confirmPassword}
            />

            <button
              type="submit"
              className={styles.submit}
              disabled={resetSubmitting}
            >
              {resetSubmitting ? "Kubika…" : "Hindura ijambobanga"}
            </button>
          </form>
        )}

        <p className={styles.back}>
          <Link href="/forgot-password">Saba ihuzo rishya</Link> ·{" "}
          <Link href="/kwinjira">← Garuka kwinjira</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>GUSUBIZA KONTI</p>
      <h1 className={styles.title}>
        Wibagiwe
        <br />
        ijambobanga?
      </h1>

      <form className={styles.form} onSubmit={handleRequestSubmit} noValidate>
        <Field
          id="identifier"
          name="identifier"
          label="Imeri cyangwa Telefoni"
          value={identifier}
          onChange={(v) => {
            setIdentifier(v);
            if (requestError) setRequestError(undefined);
            if (requestMessage) setRequestMessage(null);
          }}
          placeholder="kalisa@urunana.rw"
          autoComplete="username"
          error={requestError}
        />

        <button
          type="submit"
          className={styles.submit}
          disabled={requestSubmitting}
        >
          {requestSubmitting ? "Kohereza…" : "Ohereza ihuzo"}
        </button>
      </form>

      {requestMessage ? (
        <p className={styles.success} role="status" aria-live="polite">
          {requestMessage}
        </p>
      ) : null}

      <p className={styles.back}>
        <Link href="/kwinjira">← Garuka kwinjira</Link>
      </p>
    </div>
  );
}
