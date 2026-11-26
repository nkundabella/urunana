"use client";

import { FormEvent, useState } from "react";
import { saveContactMessage } from "@/lib/store";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [sent, setSent] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) {
      next.name = "Izina rirakenewe.";
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = "Imeri irakenewe.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      next.email = "Andika imeri yemewe.";
    }
    if (!message.trim()) {
      next.message = "Ubutumwa burakenewe.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setSent(false);
      return;
    }
    saveContactMessage({ name, email, message });
    setName("");
    setEmail("");
    setMessage("");
    setSent(true);
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate>
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
            if (sent) setSent(false);
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
            if (sent) setSent(false);
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
          rows={5}
          className={`${styles.textarea}${errors.message ? ` ${styles.inputError}` : ""}`}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            if (sent) setSent(false);
          }}
          placeholder="Andika ubutumwa bwawe hano..."
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message ? (
          <p className={styles.error} role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>

      {sent ? (
        <p className={styles.success} role="status" aria-live="polite">
          Murakoze! Twakiriye ubutumwa bwawe.
        </p>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submitBtn}>
          Ohereza ubutumwa
        </button>
      </div>
    </form>
  );
}
