"use client";

import { useMemo, useState } from "react";
import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";
import { EventVisualCropperPreview } from "@/components/brand/EventVisualCropperPreview";
import type { EventVisualCrop, EventVisualOption } from "@/components/brand/EventVisualFrame";
import { EventVisualPickerPreview } from "@/components/brand/EventVisualPickerPreview";
import { GuestInfoCard } from "@/components/brand/GuestInfoCard";
import { InvitationGuestCard, type InvitationGuest } from "@/components/brand/InvitationGuestCard";
import styles from "./EventCardPreview.module.css";

type EventCardPreviewPageProps = {
  galleryVisuals?: EventVisualOption[];
};

const previewGuests: InvitationGuest[] = [
  { name: "Анна", initials: "А", tone: "clay" },
  { name: "Мария", initials: "М", tone: "sage" },
  { name: "Катя", initials: "К", tone: "gold" },
  { name: "Лена", initials: "Л", tone: "sand" },
  { name: "Оля", initials: "О", tone: "graphite" },
];

const presetVisuals: EventVisualOption[] = [
  { id: "breakfast-club", title: "Завтрак клуба", eyebrow: "готовый стиль", kind: "fallback", tone: "breakfast" },
  { id: "bath-meeting", title: "Банная встреча", eyebrow: "готовый стиль", kind: "fallback", tone: "bath" },
  { id: "dinner-circle", title: "Камерный ужин", eyebrow: "готовый стиль", kind: "fallback", tone: "dinner" },
  { id: "women-circle", title: "Женский круг", eyebrow: "готовый стиль", kind: "fallback", tone: "circle" },
  { id: "soft-trip", title: "Выезд", eyebrow: "готовый стиль", kind: "fallback", tone: "trip" },
];

const infoCards = [
  {
    icon: "seat",
    label: "Места",
    value: "6 / 12",
    detail: "половина состава уже собралась",
    tone: "sage",
  },
  {
    icon: "users",
    label: "Состав",
    value: "16 гостей",
    detail: "включая приглашённых подруг",
    tone: "clay",
  },
  {
    icon: "wait",
    label: "Ожидание",
    value: "2 человека",
    detail: "получат место при отмене",
    tone: "sand",
  },
  {
    icon: "bell",
    label: "Напоминание",
    value: "за день",
    detail: "мягкое сообщение в Telegram",
    tone: "sage",
  },
  {
    icon: "link",
    label: "Ссылка-приглашение",
    value: "скопирована",
    detail: "готова для чата с гостями",
    tone: "gold",
  },
] as const;

export function EventCardPreviewPage({ galleryVisuals = [] }: EventCardPreviewPageProps) {
  const [uploadedVisual, setUploadedVisual] = useState<EventVisualOption | null>(null);
  const visualOptions = useMemo(
    () => [...(uploadedVisual ? [uploadedVisual] : []), ...galleryVisuals, ...presetVisuals],
    [galleryVisuals, uploadedVisual],
  );
  const [selectedVisualId, setSelectedVisualId] = useState(visualOptions[0]?.id ?? presetVisuals[0].id);
  const [crop, setCrop] = useState<EventVisualCrop>({ x: 0, y: 0, scale: 1 });
  const selectedVisual = visualOptions.find((visual) => visual.id === selectedVisualId) ?? visualOptions[0] ?? presetVisuals[0];

  function selectVisual(visualId: string) {
    setSelectedVisualId(visualId);
    setCrop({ x: 0, y: 0, scale: 1 });
  }

  function handleUpload(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      const src = String(reader.result || "");
      const nextVisual: EventVisualOption = {
        id: `local-upload-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, "") || "Своё фото",
        eyebrow: "локальный preview",
        kind: "upload",
        src,
        tone: "sage",
      };

      setUploadedVisual(nextVisual);
      setSelectedVisualId(nextVisual.id);
      setCrop({ x: 0, y: 0, scale: 1 });
    };

    reader.readAsDataURL(file);
  }

  return (
    <main className={styles.page}>
      <div className={styles.texture} aria-hidden="true" />
      <div className={styles.backdropLine} aria-hidden="true" />

      <section className={styles.shell} aria-labelledby="event-card-preview-title">
        <header className={styles.header}>
          <BrandLogoApproved caption="приглашение в одну ссылку" symbolSize={50} />
          <span className={styles.previewPill}>guest-facing preview</span>
        </header>

        <div className={styles.heroIntro}>
          <p className={styles.kicker}>красивая ссылка-приглашение</p>
          <h1 id="event-card-preview-title">Гость открывает событие и сразу понимает: его ждут</h1>
          <p>
            На этом экране нет админки и лишних функций. Только спокойная карточка встречи,
            понятные места, гости и одно мягкое действие.
          </p>
        </div>

        <div className={styles.previewStage}>
          <div className={styles.leftRail}>
            {infoCards.slice(0, 3).map((card) => (
              <GuestInfoCard key={card.label} {...card} />
            ))}
          </div>

          <InvitationGuestCard
            label="приглашение"
            type="закрытая встреча"
            title="Завтрак клуба"
            description="Тёплые люди, вдохновляющий разговор и вкусное утро вместе."
            date="24 мая, суббота"
            time="10:00 — 12:30"
            place="Москва, Патрики, 12"
            address="Кафе “Свет”, 2 этаж"
            seatsTaken={6}
            seatsTotal={12}
            guests={previewGuests}
            guestsMore={2}
            status="Событие собрано"
            visual={selectedVisual}
            visualCrop={crop}
          />

          <div className={styles.rightRail}>
            {infoCards.slice(3).map((card) => (
              <GuestInfoCard key={card.label} {...card} />
            ))}
          </div>
        </div>

        <section className={styles.visualLab} aria-labelledby="visual-lab-title">
          <div className={styles.visualLabIntro}>
            <span className={styles.kicker}>визуал события</span>
            <h2 id="visual-lab-title">Картинку можно выбрать и мягко подстроить под форму</h2>
            <p>Можно выбрать готовую картинку или настроить свою под арочную область карточки.</p>
          </div>

          <div className={styles.visualLabGrid}>
            <EventVisualPickerPreview
              visuals={visualOptions}
              selectedVisualId={selectedVisual.id}
              onSelect={selectVisual}
              onUpload={handleUpload}
            />

            <div className={styles.visualToolPreview}>
              <EventVisualCropperPreview visual={selectedVisual} crop={crop} onCropChange={setCrop} />
            </div>
          </div>
        </section>

        <footer className={styles.footerNote}>
          <span>Гости, места и напоминания — в одной ссылке.</span>
          <small>Создано в Собрались</small>
        </footer>
      </section>
    </main>
  );
}
