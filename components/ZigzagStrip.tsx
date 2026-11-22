import styles from "./ZigzagStrip.module.css";

type Props = {
  className?: string;
};

export default function ZigzagStrip({ className }: Props) {
  return (
    <div
      className={`${styles.strip}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    />
  );
}
