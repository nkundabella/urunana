"use client";

import { FormEvent, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
    form?: string;
  }>({});
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  function validate() {
    const next: typeof errors = {};
    if (name.trim().length < 2) {
      next.name = "Izina rirakenewe.";
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "Imeri irakenewe.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = "Andika imeri yemewe.";
    }
    if (message.trim().length < 5) {
      next.message = "Ubutumwa bugomba kuba bufite nibura inyuguti 5.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) {
      setSentMessage(null);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setSentMessage(null);

    try {
      const res = await apiFetch<{ ok: boolean; message: string }>(
        "/api/v1/contact",
        {
          method: "POST",
          json: {
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
          },
        }
      );
      setName("");
      setEmail("");
      setMessage("");
      setSentMessage(res.message || "Murakoze! Twakiriye ubutumwa bwawe.");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({
          name: err.fields?.name?.[0],
          email: err.fields?.email?.[0],
          message: err.fields?.message?.[0],
          form: err.message,
        });
      } else {
        setErrors({
          form: "Habaye ikibazo mu kohereza ubutumwa. Ongera ugerageze.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
      {errors.form ? (
        <p className={styles.error} role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-name" className={styles.label}>
          Izina
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          className={`${styles.input}${errors.name ? ` ${styles.inputError}` : ""}`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            if (sentMessage) setSentMessage(null);
          }}
          placeholder="Kalisa Mugisha"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? (
          <p className={styles.error} role="alert">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-email" className={styles.label}>
          Imeri
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ""}`}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            if (sentMessage) setSentMessage(null);
          }}
          placeholder="kalisa@urugero.rw"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? (
          <p className={styles.error} role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-message" className={styles.label}>
          Ubutumwa
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          className={`${styles.textarea}${errors.message ? ` ${styles.inputError}` : ""}`}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            if (sentMessage) setSentMessage(null);
          }}
          placeholder="Andika ubutumwa bwawe..."
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message ? (
          <p className={styles.error} role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>

      {sentMessage ? (
        <p className={styles.success} role="status" aria-live="polite">
          {sentMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting}
        >
          {submitting ? "Kohereza…" : "Ohereza ubutumwa"}
        </button>
      </div>
    </form>
  );
}
