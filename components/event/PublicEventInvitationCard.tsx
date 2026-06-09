"use client";

import type { CSSProperties, ReactNode } from "react";

import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";
import { EventMetaRow } from "@/components/brand/EventMetaRow";
import { EventVisualFrame, type EventVisualCrop, type EventVisualOption } from "@/components/brand/EventVisualFrame";
import { GuestAvatarStack, type GuestAvatarStackItem } from "@/components/brand/GuestAvatarStack";
import { SeatsProgress } from "@/components/brand/SeatsProgress";
import { SoftStatusChip } from "@/components/brand/SoftStatusChip";
import styles from "./PublicEventInvitationCard.module.css";

type PublicEventInvitationCardProps = {
  title: string;
  eventType: string;
  description?: string;
  dateLabel: string;
  timeLabel: string;
  placeLabel: string;
  addressLabel?: string;
  mapHref?: string;
  seatsTaken: number;
  seatsTotal: number;
  seatsLeft: number;
  waitlistCount: number;
  guests: GuestAvatarStackItem[];
  guestsMore: number;
  visual: EventVisualOption;
  visualCrop: EventVisualCrop;
  statusLabel: string;
  isFull: boolean;
  isOrganizerPreview: boolean;
  needsTelegramAuth: boolean;
  isEventAuthLoading: boolean;
  currentGuestStatus: "joined" | "waitlisted" | null;
  activeInvitation?: { name: string } | null;
  guestName: string;
  guestComment: string;
  paymentMode: "none" | "manual";
  paymentSummary?: string;
  calendarLinks: { google: string; ics: string };
  notice?: string;
  error?: string;
  shareCopied: boolean;
  onGuestNameChange: (value: string) => void;
  onGuestCommentChange: (value: string) => void;
  onJoin: () => void;
  onAcceptInvitation: () => void;
  onStartTelegramLogin: () => void;
  onCopyShareLink: () => void;
  onOrganizerJoinBlocked?: () => void;
  onAddDescription?: () => void;
};

function getTitleStyle(title: string) {
  const compactLength = title.replace(/\s/g, "").length;

  if (compactLength > 56) {
    return {
      "--event-title-size": "clamp(32px, 4vw, 48px)",
      "--event-title-mobile-size": "clamp(32px, 10vw, 42px)",
    } as CSSProperties;
  }

  if (compactLength > 40) {
    return {
      "--event-title-size": "clamp(36px, 4.4vw, 54px)",
      "--event-title-mobile-size": "clamp(34px, 10vw, 48px)",
    } as CSSProperties;
  }

  if (compactLength > 28) {
    return {
      "--event-title-size": "clamp(40px, 5vw, 60px)",
      "--event-title-mobile-size": "clamp(38px, 12vw, 54px)",
    } as CSSProperties;
  }

  return {
    "--event-title-size": "clamp(46px, 5.4vw, 66px)",
    "--event-title-mobile-size": "clamp(42px, 14vw, 60px)",
  } as CSSProperties;
}

function getDescriptionStyle(description?: string) {
  const length = description?.trim().length ?? 0;

  if (length > 110) {
    return {
      "--event-description-size": "14px",
      "--event-description-line-height": "1.45",
      "--event-description-width": "232px",
    } as CSSProperties;
  }

  if (length > 72) {
    return {
      "--event-description-size": "15px",
      "--event-description-line-height": "1.52",
      "--event-description-width": "246px",
    } as CSSProperties;
  }

  return {
    "--event-description-size": "15px",
    "--event-description-line-height": "1.58",
    "--event-description-width": "260px",
  } as CSSProperties;
}

export function PublicEventInvitationCard(props: PublicEventInvitationCardProps) {
  const titleStyle = getTitleStyle(props.title);
  const descriptionStyle = getDescriptionStyle(props.description);

  return (
    <div className={styles.surface}>
      <div className={styles.texture} aria-hidden="true" />

      <div className={styles.header}>
        <BrandLogoApproved caption="приглашение в одну ссылку" symbolSize={46} />
        <span className={styles.guestChip}>вид гостя</span>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sideCards} aria-label="Сводка события">
          <FloatingMetric icon="seat" label="Места" value={`${props.seatsTaken} / ${props.seatsTotal}`} detail={`${props.seatsLeft} свободно`} />
        </aside>

        <article className={styles.card} aria-label={`Приглашение: ${props.title}`}>
          <div className={styles.invitationCore}>
            <div className={styles.cardTop}>
              <div>
                <span className={styles.overline}>приглашение</span>
              </div>
              <SoftStatusChip label={props.statusLabel} />
            </div>

            <div className={styles.cardBody}>
              <section className={styles.copy}>
                <h1 style={titleStyle}>{props.title}</h1>
                {props.description ? (
                  <p style={descriptionStyle}>{props.description}</p>
                ) : (
                  <button type="button" className={styles.futureNote} onClick={props.onAddDescription}>
                    + Добавить описание
                  </button>
                )}

                <div className={styles.metaStack}>
                  <EventMetaRow icon="calendar" title={props.dateLabel} />
                  <EventMetaRow icon="time" title={props.timeLabel} />
                  <EventMetaRow icon="pin" title={props.placeLabel} detail={props.addressLabel} />
                </div>
              </section>
            </div>

            <EventVisualFrame visual={props.visual} crop={props.visualCrop} variant="card" shape="wave" />

            <div className={styles.divider} />

            <div className={styles.cardBottom}>
              <div className={styles.seatsColumn}>
                <span className={styles.sectionLabel}>места</span>
                <SeatsProgress taken={props.seatsTaken} total={props.seatsTotal} />
              </div>
              <div className={styles.guestsColumn}>
                <span className={styles.sectionLabel}>гости</span>
                <GuestAvatarStack guests={props.guests} more={props.guestsMore} />
              </div>
            </div>

            <div className={styles.actionLinks}>
              {props.mapHref && (
                <a href={props.mapHref} target="_blank" rel="noreferrer">
                  Как добраться
                </a>
              )}
              <button type="button" onClick={props.onCopyShareLink}>
                {props.shareCopied ? "Ссылка скопирована" : "Скопировать приглашение"}
              </button>
            </div>
          </div>

          <GuestActionPanel {...props} />
        </article>

        <aside className={styles.sideCards} aria-label="Дополнительные статусы">
          <FloatingMetric icon="wait" label="Ожидание" value={`${props.waitlistCount} чел.`} detail={props.waitlistCount ? "есть лист ожидания" : "пока пусто"} />
          <FloatingMetric icon="bell" label="Напоминание" value="скоро" detail="future: автосообщения" isFuture />
          <FloatingMetric icon="link" label="Ссылка" value={props.shareCopied ? "скопирована" : "готова"} detail="для чата с гостями" />
        </aside>
      </div>
    </div>
  );
}

function GuestActionPanel(props: PublicEventInvitationCardProps) {
  const joined = props.currentGuestStatus === "joined";
  const waitlisted = props.currentGuestStatus === "waitlisted";

  return (
    <div className={styles.joinPanel}>
      {props.isOrganizerPreview ? (
        <button type="button" className={`${styles.primaryButton} ${styles.primaryButtonBlocked}`} onClick={props.onOrganizerJoinBlocked}>
          Я иду
        </button>
      ) : props.needsTelegramAuth ? (
        <TelegramGate isLoading={props.isEventAuthLoading} eventTitle={props.title} onStart={props.onStartTelegramLogin} />
      ) : props.activeInvitation ? (
        <>
          <SoftNotice type="success">Для вас освободилось место из листа ожидания.</SoftNotice>
          <button type="button" className={styles.primaryButton} onClick={props.onAcceptInvitation}>
            Занять освободившееся место
          </button>
        </>
      ) : joined ? (
        <SoftNotice type="success">Готово, место за вами закреплено.</SoftNotice>
      ) : waitlisted ? (
        <SoftNotice type="info">Вы в листе ожидания. Если место освободится, бот пришлёт личное приглашение.</SoftNotice>
      ) : (
        <div className={styles.formBlock}>
          <div>
            <h2>{props.isFull ? "Встать в лист ожидания" : "Я иду"}</h2>
            <p>Оставьте имя и короткий комментарий организатору.</p>
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Ваше имя</span>
              <input value={props.guestName} onChange={(event) => props.onGuestNameChange(event.target.value)} placeholder="Имя и фамилия" />
            </label>
            <label>
              <span>Комментарий организатору</span>
              <textarea value={props.guestComment} onChange={(event) => props.onGuestCommentChange(event.target.value)} placeholder="Например: буду без мяса / хочу место у окна" />
            </label>
          </div>

          <button type="button" className={styles.primaryButton} onClick={props.onJoin}>
            {props.isFull ? "В лист ожидания" : "Я иду"}
          </button>
        </div>
      )}

      {props.paymentMode === "manual" && (
        <SoftNotice type="info">
          {props.paymentSummary || "После подтверждения участия организатор пришлёт реквизиты для оплаты."}
        </SoftNotice>
      )}
      {props.notice && !joined && <SoftNotice type="success">{props.notice}</SoftNotice>}
      {props.error && <SoftNotice type="error">{props.error}</SoftNotice>}
    </div>
  );
}

function TelegramGate({ eventTitle, isLoading, onStart }: { eventTitle: string; isLoading: boolean; onStart: () => void }) {
  return (
    <div className={styles.telegramGate}>
      <div>
        <span>вход через Telegram</span>
        <h2>Авторизуйтесь, чтобы занять место</h2>
        <p>Бот подтвердит ваш профиль и сможет прислать уведомление по событию «{eventTitle}» или листу ожидания.</p>
      </div>
      <button type="button" disabled={isLoading} className={styles.primaryButton} onClick={onStart}>
        {isLoading ? "Жду подтверждение..." : "Авторизоваться"}
      </button>
    </div>
  );
}

type FloatingMetricIcon = "seat" | "users" | "wait" | "bell" | "link";

function FloatingMetricIconView({ icon }: { icon: FloatingMetricIcon }) {
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

function FloatingMetric({
  icon,
  label,
  value,
  detail,
  isFuture = false,
}: {
  icon: FloatingMetricIcon;
  label: string;
  value: string;
  detail: string;
  isFuture?: boolean;
}) {
  return (
    <div className={`${styles.floatingMetric} ${isFuture ? styles.futureMetric : ""}`}>
      <span className={styles.metricIcon}>
        <FloatingMetricIconView icon={icon} />
      </span>
      <div>
        <span className={styles.metricLabel}>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function SoftNotice({ type, children }: { type: "success" | "info" | "error"; children: ReactNode }) {
  return <div className={`${styles.notice} ${styles[`notice_${type}`]}`}>{children}</div>;
}
