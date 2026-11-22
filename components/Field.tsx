import styles from "./Field.module.css";

type Props = {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
};

export default function Field({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${styles.input}${error ? ` ${styles.inputError}` : ""}`}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
