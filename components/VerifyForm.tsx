"use client";

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getSession, setSession } from "@/src/data/session";
import styles from "./VerifyForm.module.css";

const CODE_LENGTH = 6;

export default function VerifyForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isComplete = digits.every((d) => /^\d$/.test(d));

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(CODE_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  }

  function handleChange(index: number, raw: string) {
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

    // Handle autofill or multi-character input
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isComplete) return;
    if (!getSession()) {
      setSession("kalisa@urugero.rw", "kalisa");
    }
    router.push("/ahabanza");
  }

  function handleResend() {
    setDigits(Array(CODE_LENGTH).fill(""));
    setResent(true);
    focusIndex(0);
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>KWEMEZA KONTI</p>
      <h1 className={styles.title}>
        Andika kode
        <br />
        wohererejwe
      </h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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

        <button
          type="submit"
          className={styles.submit}
          disabled={!isComplete}
        >
          Emeza
        </button>
      </form>

      <p className={styles.resend}>
        Nta kode wabonye?{" "}
        <button
          type="button"
          className={styles.resendBtn}
          onClick={handleResend}
        >
          Ongera wohereze
        </button>
      </p>

      {resent ? (
        <p className={styles.notice} role="status" aria-live="polite">
          Kode nshya yoherejwe.
        </p>
      ) : null}
    </div>
  );
}
