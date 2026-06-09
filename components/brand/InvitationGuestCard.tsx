import type { CSSProperties } from "react";
import { EventMetaRow } from "@/components/brand/EventMetaRow";
import { EventVisualFrame, type EventVisualCrop, type EventVisualOption } from "@/components/brand/EventVisualFrame";
import { GuestAvatarStack } from "@/components/brand/GuestAvatarStack";
import { SeatsProgress } from "@/components/brand/SeatsProgress";
import { SoftStatusChip } from "@/components/brand/SoftStatusChip";
import styles from "./EventCardPreview.module.css";

export type InvitationGuest = {
  name: string;
  initials: string;
  tone?: "sage" | "clay" | "gold" | "sand" | "graphite";
};

type InvitationGuestCardProps = {
  label: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  place: string;
  address: string;
  seatsTaken: number;
  seatsTotal: number;
  guests: InvitationGuest[];
  guestsMore?: number;
  status: string;
  visual: EventVisualOption;
  visualCrop: EventVisualCrop;
  onJoin?: () => void;
};

function getTitleStyle(title: string) {
  const compactLength = title.replace(/\s/g, "").length;

  if (compactLength > 56) {
    return {
      "--event-title-size": "clamp(34px, 4.2vw, 50px)",
      "--event-title-mobile-size": "clamp(32px, 10vw, 44px)",
    } as CSSProperties;
  }

  if (compactLength > 40) {
    return {
      "--event-title-size": "clamp(38px, 4.8vw, 58px)",
      "--event-title-mobile-size": "clamp(36px, 11vw, 50px)",
    } as CSSProperties;
  }

  if (compactLength > 28) {
    return {
      "--event-title-size": "clamp(44px, 5.2vw, 64px)",
      "--event-title-mobile-size": "clamp(40px, 13vw, 56px)",
    } as CSSProperties;
  }

  return {
    "--event-title-size": "clamp(48px, 5.8vw, 72px)",
    "--event-title-mobile-size": "clamp(48px, 16vw, 66px)",
  } as CSSProperties;
}

function getDescriptionStyle(description: string) {
  const length = description.trim().length;

  if (length > 110) {
    return {
      "--event-description-size": "14px",
      "--event-description-line-height": "1.45",
      "--event-description-width": "250px",
    } as CSSProperties;
  }

  if (length > 72) {
    return {
      "--event-description-size": "15px",
      "--event-description-line-height": "1.52",
      "--event-description-width": "265px",
    } as CSSProperties;
  }

  return {
    "--event-description-size": "16px",
    "--event-description-line-height": "1.58",
    "--event-description-width": "285px",
  } as CSSProperties;
}

export function InvitationGuestCard({
  label,
  type,
  title,
  description,
  date,
  time,
  place,
  address,
  seatsTaken,
  seatsTotal,
  guests,
  guestsMore = 0,
  status,
  visual,
  visualCrop,
  onJoin,
}: InvitationGuestCardProps) {
  const titleStyle = getTitleStyle(title);
  const descriptionStyle = getDescriptionStyle(description);

  return (
    <article className={styles.invitationCard} aria-label={`${label}: ${title}`}>
      <div className={styles.invitationPaper} aria-hidden="true" />

      <div className={styles.invitationContent}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.overline}>{label}</span>
            <span className={styles.eventType}>{type}</span>
          </div>
          <SoftStatusChip label={status} />
        </div>

        <div className={styles.cardBody}>
          <section className={styles.cardCopy}>
            <h2 style={titleStyle}>{title}</h2>
            <p style={descriptionStyle}>{description}</p>

            <div className={styles.metaStack}>
              <EventMetaRow icon="calendar" title={date} />
              <EventMetaRow icon="time" title={time} />
              <EventMetaRow icon="pin" title={place} detail={address} />
            </div>
          </section>
        </div>

        <EventVisualFrame visual={visual} crop={visualCrop} variant="card" positionMode="translate" shape="wave" />

        <div className={styles.cardDivider} />

        <div className={styles.cardBottom}>
          <div className={styles.seatsColumn}>
            <span className={styles.sectionLabel}>места</span>
            <SeatsProgress taken={seatsTaken} total={seatsTotal} />
          </div>

          <div className={styles.guestsColumn}>
            <span className={styles.sectionLabel}>гости</span>
            <GuestAvatarStack guests={guests} more={guestsMore} />
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button className={styles.primaryButton} type="button" onClick={onJoin}>
            Я иду
          </button>
          <button className={styles.secondaryButton} type="button">
            Скопировать приглашение
          </button>
        </div>
      </div>
    </article>
  );
}
