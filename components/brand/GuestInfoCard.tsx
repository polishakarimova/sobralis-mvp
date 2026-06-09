import styles from "./EventCardPreview.module.css";

type GuestInfoCardIcon = "seat" | "users" | "wait" | "bell" | "link";

type GuestInfoCardProps = {
  icon: GuestInfoCardIcon;
  label: string;
  value: string;
  detail: string;
  tone: "sage" | "clay" | "sand" | "gold";
};

function InfoIcon({ icon }: { icon: GuestInfoCardIcon }) {
  const strokeProps = {
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.6,
    fill: "none",
  };

  switch (icon) {
    case "seat":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...strokeProps} d="M6 12.5V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4.5M5 12.5h14a2 2 0 0 1 2 2v1.8a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 16.3v-1.8a2 2 0 0 1 2-2ZM6 18v2M18 18v2" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...strokeProps} d="M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM4 19.5c.7-3.4 2.6-5.1 5.5-5.1s4.8 1.7 5.5 5.1M16 11.3a2.6 2.6 0 1 0-.8-5M15.8 14.7c2.2.2 3.6 1.7 4.2 4.8" />
        </svg>
      );
    case "wait":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...strokeProps} d="M7 4h10M7 20h10M8 4c0 4.1 4 4.7 4 8s-4 3.9-4 8M16 4c0 4.1-4 4.7-4 8s4 3.9 4 8" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...strokeProps} d="M18 9.8c0-3.4-2.3-5.8-6-5.8S6 6.4 6 9.8c0 6-2 5.9-2 7.7h16c0-1.8-2-1.7-2-7.7ZM10 20a2.2 2.2 0 0 0 4 0" />
        </svg>
      );
    case "link":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...strokeProps} d="M10 13.5a4.2 4.2 0 0 0 6 0l2-2a4.2 4.2 0 0 0-6-6l-1.1 1.1M14 10.5a4.2 4.2 0 0 0-6 0l-2 2a4.2 4.2 0 0 0 6 6l1.1-1.1" />
        </svg>
      );
  }
}

export function GuestInfoCard({ icon, label, value, detail, tone }: GuestInfoCardProps) {
  return (
    <article className={`${styles.infoCard} ${styles[`info_${tone}`]}`}>
      <span className={styles.infoIcon}>
        <InfoIcon icon={icon} />
      </span>
      <div>
        <span className={styles.infoLabel}>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
