import styles from "./EventCardPreview.module.css";

type MetaIcon = "calendar" | "time" | "pin";

type EventMetaRowProps = {
  icon: MetaIcon;
  title: string;
  detail?: string;
};

function MetaIconView({ icon }: { icon: MetaIcon }) {
  const strokeProps = {
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.65,
  };

  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...strokeProps} fill="none" d="M7 4v3M17 4v3M5 9h14M6.5 6h11A2.5 2.5 0 0 1 20 8.5v10A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-10A2.5 2.5 0 0 1 6.5 6Z" />
      </svg>
    );
  }

  if (icon === "time") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...strokeProps} fill="none" d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path {...strokeProps} fill="none" d="M19 10.5c0 5.2-7 10-7 10s-7-4.8-7-10a7 7 0 1 1 14 0Z" />
      <path {...strokeProps} fill="none" d="M14.4 10.4a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" />
    </svg>
  );
}

export function EventMetaRow({ icon, title, detail }: EventMetaRowProps) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaIcon}>
        <MetaIconView icon={icon} />
      </span>
      <span>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </div>
  );
}
