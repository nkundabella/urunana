"use client";

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Field from "./Field";
import { ApiError, apiFetch, type AuthUser } from "@/lib/api";
import {
  clearPendingVerifyIdentifier,
  getPendingVerifyIdentifier,
  setPendingVerifyIdentifier,
  useAuth,
} from "@/lib/auth-context";
import styles from "./VerifyForm.module.css";

const CODE_LENGTH = 6;

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();

  const queryIdentifier = searchParams.get("identifier")?.trim() || "";
  const unverifiedRedirect = searchParams.get("unverified") === "1";

  const [identifier, setIdentifier] = useState(queryIdentifier);
  const [hasPresetIdentifier, setHasPresetIdentifier] = useState(
    Boolean(queryIdentifier)
  );
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    unverifiedRedirect
      ? "Konti yawe ntiyaremezwa. Andika kode wohererejwe cyangwa usabe indi."
      : null
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (queryIdentifier) {
      setIdentifier(queryIdentifier);
      setHasPresetIdentifier(true);
      setPendingVerifyIdentifier(queryIdentifier);
      return;
    }
    const stored = getPendingVerifyIdentifier();
    if (stored) {
      setIdentifier(stored);
      setHasPresetIdentifier(true);
    }
  }, [queryIdentifier]);

  const code = digits.join("");
  const isComplete =
    digits.every((d) => /^\d$/.test(d)) && identifier.trim().length >= 2;

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(CODE_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  }

  function handleChange(index: number, raw: string) {
    setError(null);
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (clean.length === 1) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = clean;
        return next;
      });
      if (index < CODE_LENGTH - 1) {
        focusIndex(index + 1);
      }
      return;
    }

    const chars = clean.slice(0, CODE_LENGTH - index).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((ch, offset) => {
        next[index + offset] = ch;
      });
      return next;
    });
    const nextFocus = Math.min(index + chars.length, CODE_LENGTH - 1);
    focusIndex(nextFocus);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        e.preventDefault();
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        e.preventDefault();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        focusIndex(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    setError(null);
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const start = pasted.length >= CODE_LENGTH ? 0 : index;
    const chars = pasted.slice(0, CODE_LENGTH - start).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((ch, offset) => {
        next[start + offset] = ch;
      });
      return next;
    });
    const nextFocus = Math.min(start + chars.length, CODE_LENGTH - 1);
    focusIndex(nextFocus);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !isComplete) return;

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await apiFetch<{ user: AuthUser }>("/api/v1/auth/verify", {
        method: "POST",
        json: {
          identifier: identifier.trim(),
          code,
        },
      });
      clearPendingVerifyIdentifier();
      await refreshAuth();
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Habaye ikibazo mu kwemeza kode. Ongera ugerageze.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resending) return;
    const trimmed = identifier.trim();
    if (trimmed.length < 2) {
      setError("Banza wandike imeri cyangwa telefoni wakoresheje.");
      return;
    }

    setResending(true);
    setError(null);
    setNotice(null);

    try {
      const res = await apiFetch<{ ok: boolean; message: string }>(
        "/api/v1/auth/resend-otp",
        {
          method: "POST",
          json: { identifier: trimmed },
        }
      );
      setDigits(Array(CODE_LENGTH).fill(""));
      setNotice(res.message || "Kode nshya yoherejwe.");
      focusIndex(0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ntibyakunze kongera kohereza kode. Ongera ugerageze.");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>KWEMEZA KONTI</p>
      <h1 className={styles.title}>
        Andika kode
        <br />
        wohererejwe
      </h1>

      {hasPresetIdentifier && identifier ? (
        <p className={styles.target}>
          Kode yoherejwe kuri <strong>{identifier}</strong>.
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {!hasPresetIdentifier ? (
          <Field
            id="verify-identifier"
            name="identifier"
            label="Imeri cyangwa Telefoni"
            value={identifier}
            onChange={(v) => {
              setIdentifier(v);
              if (error) setError(null);
            }}
            placeholder="kalisa@urugero.rw"
            autoComplete="username"
          />
        ) : null}

        <div
          className={styles.otpRow}
          role="group"
          aria-label="Kode y'imibare itandatu yo kwemeza"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={(e) => e.currentTarget.select()}
              className={styles.otpBox}
              aria-label={`Umubare wa ${index + 1} kuri ${CODE_LENGTH}`}
            />
          ))}
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={styles.submit}
          disabled={!isComplete || submitting}
        >
          {submitting ? "Kwemeza…" : "Emeza"}
        </button>
      </form>

      <p className={styles.resend}>
        Nta kode wabonye?{" "}
        <button
          type="button"
          className={styles.resendBtn}
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Kohereza…" : "Ongera wohereze"}
        </button>
      </p>

      {notice ? (
        <p className={styles.notice} role="status" aria-live="polite">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
