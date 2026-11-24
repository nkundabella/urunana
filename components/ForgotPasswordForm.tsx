"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Field from "./Field";
import styles from "./ForgotPasswordForm.module.css";

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Imeri cyangwa telefoni birakenewe.");
      setSentTo(null);
      return;
    }
    setError(undefined);
    setSentTo(trimmed);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>GUSUBIZA KONTI</p>
      <h1 className={styles.title}>
        Wibagiwe
        <br />
        ijambobanga?
      </h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          id="identifier"
          name="identifier"
          label="Imeri cyangwa Telefoni"
          value={identifier}
          onChange={(v) => {
            setIdentifier(v);
            if (error) setError(undefined);
            if (sentTo) setSentTo(null);
          }}
          placeholder="kalisa@urugero.rw"
          autoComplete="username"
          error={error}
        />

        <button type="submit" className={styles.submit}>
          Ohereza ihuzo
        </button>
      </form>

      {sentTo ? (
        <p className={styles.success} role="status" aria-live="polite">
          Ihuzo ryo gushyiraho irindi jambobanga ryoherejwe kuri{" "}
          <strong>{sentTo}</strong>. Reba imeri cyangwa ubutumwa bwawe.
        </p>
      ) : null}

      <p className={styles.back}>
        <Link href="/kwinjira">← Garuka kwinjira</Link>
      </p>
    </div>
  );
}
