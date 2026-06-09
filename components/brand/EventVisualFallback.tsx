import type { EventVisualTone } from "@/components/brand/EventVisualFrame";
import styles from "./EventCardPreview.module.css";

export function EventVisualFallback({ tone }: { tone: EventVisualTone }) {
  return (
    <div className={`${styles.visualFallback} ${styles[`visualFallback_${tone}`]}`}>
      <div className={styles.fallbackMoon} />
      <svg className={styles.fallbackLine} viewBox="0 0 240 320" fill="none" aria-hidden="true">
        <path d="M162 32C122 72 116 116 146 158C184 211 155 276 84 302" />
        <path d="M88 62C128 99 130 139 100 184C74 223 79 263 116 294" />
        <path d="M174 90C151 106 136 126 132 151" />
        <path d="M64 152C88 162 105 181 114 206" />
        <circle cx="162" cy="32" r="6" />
        <circle cx="88" cy="62" r="5" />
        <circle cx="174" cy="90" r="4" />
        <circle cx="64" cy="152" r="4" />
      </svg>
      <div className={styles.fallbackTexture} />
    </div>
  );
}
