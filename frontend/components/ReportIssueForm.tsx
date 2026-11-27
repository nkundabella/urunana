"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import styles from "./ReportIssueForm.module.css";

type ReportReasonValue =
  | "THREATS_VIOLENCE"
  | "HATE_SPEECH"
  | "PRIVACY_VIOLATION"
  | "SPAM_MANIPULATION"
  | "PLAGIARISM_IP"
  | "HARASSMENT"
  | "FABRICATED_INFO";

const REASONS: Array<{ value: ReportReasonValue; label: string }> = [
  {
    value: "THREATS_VIOLENCE",
    label: "Threats or encouragement of violence",
  },
  {
    value: "HATE_SPEECH",
    label: "Amagambo y'urwango",
  },
  {
    value: "PRIVACY_VIOLATION",
    label: "Privacy violation",
  },
  {
    value: "SPAM_MANIPULATION",
    label: "Amakuru y'imfabusa cyangwa ayobya (Spam)",
  },
  {
    value: "PLAGIARISM_IP",
    label: "Kwiyitirira igihangano cy'abandi",
  },
  {
    value: "HARASSMENT",
    label: "Gutoteza",
  },
  {
    value: "FABRICATED_INFO",
    label: "Disputed or false information",
  },
];

export default function ReportIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const postId =
    searchParams.get("postId")?.trim() ||
    searchParams.get("publicationId")?.trim() ||
    "";
  const commentId = searchParams.get("commentId")?.trim() || "";

  const [selectedReason, setSelectedReason] = useState<ReportReasonValue | "">(
    ""
  );
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasTarget = Boolean(postId || commentId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedReason || submitting) return;

    if (!user) {
      const qs = searchParams.toString();
      router.push(
        `/kwinjira?next=${encodeURIComponent(qs ? `/menyesha?${qs}` : "/menyesha")}`
      );
      return;
    }

    if (!hasTarget) {
      setError(
        "Fungura inyandiko cyangwa igitekerezo wifuza kumenyesha ubone gukanda 'Menyesha'."
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      await apiFetch("/api/v1/reports", {
        method: "POST",
        json: {
          ...(commentId ? { commentId } : { postId }),
          reason: selectedReason,
          details: details.trim() || undefined,
        },
      });
      setSubmitted(true);
      setDetails("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze kohereza raporo. Ongera ugerageze."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      <p className={styles.eyebrow}>MENYESHA IKIBAZO</p>
      <h1 className={styles.title}>Ni iki kitagenda neza?</h1>
      <p className={styles.lead}>
        Raporo yawe igera ku bayobozi. Nta wundi uzayibona.
      </p>

      <fieldset className={styles.radioGroup}>
        <legend className={styles.srOnly}>Hitamo impamvu yo kumenyesha</legend>
        {REASONS.map((reason) => {
          const checked = selectedReason === reason.value;
          return (
            <label
              key={reason.value}
              className={`${styles.radioBox}${checked ? ` ${styles.radioBoxSelected}` : ""}`}
            >
              <input
                type="radio"
                name="report-reason"
                value={reason.value}
                checked={checked}
                onChange={() => {
                  setSelectedReason(reason.value);
                  setSubmitted(false);
                  setError(null);
                }}
                className={styles.radioInput}
              />
              <span className={styles.radioCircle} aria-hidden="true" />
              <span className={styles.radioLabel}>{reason.label}</span>
            </label>
          );
        })}
      </fieldset>

      <div className={styles.detailsGroup}>
        <label htmlFor="report-details" className={styles.detailsLabel}>
          IBINDI BISOBANURO (BITARI ITEGEKO)
        </label>
        <textarea
          id="report-details"
          rows={3}
          className={styles.textarea}
          value={details}
          onChange={(e) => {
            setDetails(e.target.value);
            setSubmitted(false);
            setError(null);
          }}
        />
      </div>

      {error ? (
        <p
          role="alert"
          style={{
            margin: "0.75rem 0 0",
            color: "var(--red)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      ) : null}

      {submitted ? (
        <p className={styles.success} role="status" aria-live="polite">
          Raporo yawe yoherejwe. Urakoze gufasha kurinda umuryango wa Urunana.
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.outlineBtn}
          onClick={() => router.back()}
        >
          Hagarika
        </button>
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={!selectedReason || submitting}
        >
          {submitting ? "Kohereza…" : "Ohereza raporo"}
        </button>
      </div>
    </form>
  );
}
