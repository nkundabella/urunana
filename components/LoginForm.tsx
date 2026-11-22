"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "./Field";
import { setSession } from "@/src/data/session";
import styles from "./LoginForm.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSession(identifier.trim());
    router.push("/ahabanza");
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>MURAKAZA NEZA</p>
      <h1 className={styles.title}>Injira muri Konti yawe</h1>
      <p className={styles.lead}>
        Uzuza amakuru yawe kugira ngo ukomeze gusoma no kwandika.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          id="identifier"
          name="identifier"
          label="Imeri cyangwa Izina ry'Urubuga (Email or Username)"
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
          autoComplete="current-password"
          error={errors.password}
        />

        <Link href="/forgot-password" className={styles.forgot}>
          Wibagiwe ijambobanga?
        </Link>

        <button type="submit" className={styles.submit}>
          Injira →
        </button>
      </form>

      <p className={styles.signup}>
        Nta konti uragira?{" "}
        <Link href="/kwiyandikisha">Iyandikishe hano</Link>
      </p>
    </div>
  );
}
