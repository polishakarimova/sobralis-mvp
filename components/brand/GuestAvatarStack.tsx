import type { InvitationGuest } from "@/components/brand/InvitationGuestCard";
import styles from "./EventCardPreview.module.css";

export type GuestAvatarStackItem = InvitationGuest;

export function GuestAvatarStack({ guests, more = 0 }: { guests: InvitationGuest[]; more?: number }) {
  return (
    <div className={styles.avatarStack} aria-label={`Гости: ${guests.map((guest) => guest.name).join(", ")}`}>
      {guests.map((guest, index) => (
        <span key={`${guest.name}-${index}`} className={`${styles.avatar} ${styles[`avatar_${guest.tone ?? "sage"}`]}`}>
          {guest.initials}
        </span>
      ))}
      {more > 0 && <span className={`${styles.avatar} ${styles.avatarMore}`}>+{more}</span>}
    </div>
  );
}
