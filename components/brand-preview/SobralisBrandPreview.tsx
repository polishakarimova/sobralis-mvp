import type { CSSProperties } from "react";
import {
  invitationTemplates,
  paletteSwatches,
  previewMetrics,
  sobralisBrandTokens,
  uiSamples,
} from "@/lib/brand-preview/sobralisBrandTheme";
import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";
import { BrandSymbolApproved } from "@/components/brand/BrandSymbolApproved";
import styles from "./SobralisBrandPreview.module.css";

type IconName =
  | "calendar"
  | "time"
  | "place"
  | "guests"
  | "seat"
  | "link"
  | "payment"
  | "check"
  | "wait"
  | "bell"
  | "message"
  | "list";

function Icon({ name }: { name: IconName }) {
  const common = {
    className: styles.icon,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
  } as const;

  const strokeProps = {
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.6,
  };

  switch (name) {
    case "calendar":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M7 4v3M17 4v3M5 9h14M6.5 6h11A2.5 2.5 0 0 1 20 8.5v10A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-10A2.5 2.5 0 0 1 6.5 6Z" />
        </svg>
      );
    case "time":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "place":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M19 10.5c0 5.2-7 10-7 10s-7-4.8-7-10a7 7 0 1 1 14 0Z" />
          <path {...strokeProps} d="M14.4 10.4a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" />
        </svg>
      );
    case "guests":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM4 19.5c.7-3.4 2.6-5.1 5.5-5.1s4.8 1.7 5.5 5.1" />
          <path {...strokeProps} d="M16 11.3a2.6 2.6 0 1 0-.8-5M15.8 14.7c2.2.2 3.6 1.7 4.2 4.8" />
        </svg>
      );
    case "seat":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M6 12.5V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4.5M5 12.5h14a2 2 0 0 1 2 2v1.8a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 16.3v-1.8a2 2 0 0 1 2-2ZM6 18v2M18 18v2" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M10 13.5a4.2 4.2 0 0 0 6 0l2-2a4.2 4.2 0 0 0-6-6l-1.1 1.1" />
          <path {...strokeProps} d="M14 10.5a4.2 4.2 0 0 0-6 0l-2 2a4.2 4.2 0 0 0 6 6l1.1-1.1" />
        </svg>
      );
    case "payment":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M4.5 7.5h15A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5ZM3 11h18M7 16h4" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path {...strokeProps} d="m5 12.4 4 4L19 6.8" />
        </svg>
      );
    case "wait":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M7 4h10M7 20h10M8 4c0 4.1 4 4.7 4 8s-4 3.9-4 8M16 4c0 4.1-4 4.7-4 8s4 3.9 4 8" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M18 9.8c0-3.4-2.3-5.8-6-5.8S6 6.4 6 9.8c0 6-2 5.9-2 7.7h16c0-1.8-2-1.7-2-7.7ZM10 20a2.2 2.2 0 0 0 4 0" />
        </svg>
      );
    case "message":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M5.5 6.5h13A2.5 2.5 0 0 1 21 9v6a2.5 2.5 0 0 1-2.5 2.5H12l-5 3v-3.1H5.5A2.5 2.5 0 0 1 3 15V9a2.5 2.5 0 0 1 2.5-2.5Z" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path {...strokeProps} d="M8 6h13M8 12h13M8 18h13M3.5 6h.1M3.5 12h.1M3.5 18h.1" />
        </svg>
      );
  }
}

function MetricCard({ metric }: { metric: (typeof previewMetrics)[number] }) {
  return (
    <article className={`${styles.metricCard} ${styles[`tone_${metric.tone}`]}`}>
      <div className={styles.metricIcon}>
        <Icon name={metric.icon} />
      </div>
      <div>
        <div className={styles.metricLabel}>{metric.label}</div>
        <div className={styles.metricValue}>{metric.value}</div>
        <div className={styles.metricDetail}>{metric.detail}</div>
      </div>
    </article>
  );
}

function GuestDots() {
  const guests = ["П", "А", "М", "К"];
  return (
    <div className={styles.guestDots} aria-label="Гости события">
      {guests.map((guest) => (
        <span key={guest}>{guest}</span>
      ))}
      <span className={styles.guestMore}>+8</span>
    </div>
  );
}

function InvitationCard() {
  return (
    <article className={styles.invitationCard}>
      <div className={styles.cardAura} />
      <div className={styles.invitationHeader}>
        <span className={styles.overline}>приглашение</span>
        <span className={styles.statusChip}>
          <Icon name="check" />
          Событие собрано
        </span>
      </div>

      <div className={styles.cardOrnament}>
        <BrandSymbolApproved variant="light" size={86} decorative />
      </div>

      <h1 className={styles.invitationTitle}>Завтрак клуба</h1>
      <p className={styles.invitationDescription}>
        Камерная встреча для своих: тёплый завтрак, разговоры без спешки и
        аккуратная организация гостей в одной ссылке.
      </p>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <Icon name="calendar" />
          <span>14 июня</span>
        </div>
        <div className={styles.metaItem}>
          <Icon name="time" />
          <span>11:00–13:30</span>
        </div>
        <div className={styles.metaItemWide}>
          <Icon name="place" />
          <span>Кафе у залива · Калининград</span>
        </div>
      </div>

      <div className={styles.seatsBlock}>
        <div className={styles.seatsTop}>
          <span>Места</span>
          <strong>6 из 12 свободно</strong>
        </div>
        <div className={styles.progressTrack}>
          <span />
        </div>
      </div>

      <div className={styles.invitationFooter}>
        <GuestDots />
        <button className={styles.primaryButton} type="button">
          Я иду
        </button>
      </div>
    </article>
  );
}

function BrandBoard() {
  return (
    <section className={styles.brandBoard} aria-labelledby="brand-board-title">
      <div className={styles.sectionIntro}>
        <span className={styles.overline}>foundation</span>
        <h2 id="brand-board-title">Новый визуальный фундамент</h2>
        <p>
          Базовая доска стиля: логотип, мягкая палитра, line-иконки, чипы,
          кнопки и варианты invitation-карточек.
        </p>
      </div>

      <div className={styles.boardGrid}>
        <article className={styles.boardCard}>
          <h3>Логотип</h3>
          <div className={styles.logoShowcase}>
            <BrandLogoApproved />
            <BrandSymbolApproved variant="light" size={96} />
          </div>
        </article>

        <article className={styles.boardCard}>
          <h3>Палитра</h3>
          <div className={styles.paletteGrid}>
            {paletteSwatches.map((swatch) => (
              <div key={swatch.name} className={styles.swatch}>
                <span style={{ background: swatch.value }} />
                <div>
                  <strong>{swatch.name}</strong>
                  <small>{swatch.value}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.boardCard}>
          <h3>Иконки</h3>
          <div className={styles.iconGrid}>
            {(["guests", "calendar", "time", "place", "seat", "link", "payment", "bell", "message", "list"] as IconName[]).map(
              (icon) => (
                <span key={icon} className={styles.iconSample}>
                  <Icon name={icon} />
                </span>
              ),
            )}
          </div>
        </article>

        <article className={styles.boardCard}>
          <h3>UI элементы</h3>
          <div className={styles.uiKit}>
            <button className={styles.primaryButton} type="button">
              Создать событие
            </button>
            <button className={styles.secondaryButton} type="button">
              Скопировать ссылку
            </button>
            <div className={styles.chipRow}>
              {uiSamples.map((sample) => (
                <span key={sample} className={styles.softChip}>
                  {sample}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className={styles.templateRow}>
        {invitationTemplates.map((template) => (
          <article key={template.title} className={`${styles.templateCard} ${styles[`tone_${template.tone}`]}`}>
            <span>приглашение</span>
            <h3>{template.title}</h3>
            <p>{template.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SobralisBrandPreview() {
  return (
    <main
      className={styles.previewPage}
      style={
        {
          "--sobralis-milk": sobralisBrandTokens.colors.milk,
          "--sobralis-surface": sobralisBrandTokens.colors.surface,
          "--sobralis-graphite": sobralisBrandTokens.colors.graphite,
          "--sobralis-muted": sobralisBrandTokens.colors.muted,
          "--sobralis-sage": sobralisBrandTokens.colors.sage,
          "--sobralis-sage-deep": sobralisBrandTokens.colors.sageDeep,
          "--sobralis-clay": sobralisBrandTokens.colors.clay,
          "--sobralis-caramel": sobralisBrandTokens.colors.caramel,
          "--sobralis-gold": sobralisBrandTokens.colors.gold,
          "--sobralis-border": sobralisBrandTokens.colors.border,
          "--sobralis-shadow-soft": sobralisBrandTokens.shadows.soft,
          "--sobralis-shadow-card": sobralisBrandTokens.shadows.card,
        } as CSSProperties
      }
    >
      <div className={styles.noise} />
      <div className={styles.blobOne} />
      <div className={styles.blobTwo} />

      <section className={styles.hero}>
        <header className={styles.header}>
          <BrandLogoApproved caption="event-tech invitation system" />
          <div className={styles.headerPills}>
            <span>style preview</span>
            <span>isolated route</span>
          </div>
        </header>

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <span className={styles.overline}>premium social gathering</span>
            <h2>Красиво собрать своих</h2>
            <p>
              Новый визуальный язык «Собрались»: сначала красивая карточка
              приглашения, затем спокойный слой для мест, гостей, оплат и
              ожидания.
            </p>
          </div>

          <div className={styles.heroStage}>
            <InvitationCard />
            <div className={styles.metricsCluster}>
              {previewMetrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <BrandBoard />
    </main>
  );
}
