"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ReportIssueForm.module.css";

const REASONS = [
  "Threats or encouragement of violence",
  "Amagambo y'urwango",
  "Privacy violation",
  "Amakuru y'imfabusa cyangwa ayobya",
  "Kwiyitirira igihangano cy'abandi",
  "Gutoteza",
  "Disputed or false information",
] as const;

export default function ReportIssueForm() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedReason) return;
    setSubmitted(true);
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
          const checked = selectedReason === reason;
          return (
            <label
              key={reason}
              className={`${styles.radioBox}${checked ? ` ${styles.radioBoxSelected}` : ""}`}
            >
              <input
                type="radio"
                name="report-reason"
                value={reason}
                checked={checked}
                onChange={() => {
                  setSelectedReason(reason);
                  setSubmitted(false);
                }}
                className={styles.radioInput}
              />
              <span className={styles.radioCircle} aria-hidden="true" />
              <span className={styles.radioLabel}>{reason}</span>
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
          }}
        />
      </div>

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
          disabled={!selectedReason}
        >
          Ohereza raporo
        </button>
      </div>
    </form>
  );
}
