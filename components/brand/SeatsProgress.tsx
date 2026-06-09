import styles from "./EventCardPreview.module.css";

export function SeatsProgress({ taken, total }: { taken: number; total: number }) {
  const normalizedTotal = Math.max(total, 1);
  const normalizedTaken = Math.min(Math.max(taken, 0), normalizedTotal);
  const percent = Math.round((normalizedTaken / normalizedTotal) * 100);

  return (
    <div className={styles.seatsProgress}>
      <div className={styles.seatsNumber}>
        <strong>{normalizedTaken}</strong>
        <span>из {normalizedTotal}</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
