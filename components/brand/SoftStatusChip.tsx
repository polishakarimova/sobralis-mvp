import styles from "./EventCardPreview.module.css";

export function SoftStatusChip({ label }: { label: string }) {
  return (
    <span className={styles.statusChip}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5.5 12.2 4 4 9-9.2" />
      </svg>
      {label}
    </span>
  );
}
