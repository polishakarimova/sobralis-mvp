import { useId, type CSSProperties } from "react";
import { BrandSymbolApproved } from "@/components/brand/BrandSymbolApproved";
import { EventVisualFallback } from "@/components/brand/EventVisualFallback";
import styles from "./EventCardPreview.module.css";

export type EventVisualTone = "breakfast" | "bath" | "dinner" | "circle" | "trip" | "sage";

export type EventVisualOption = {
  id: string;
  title: string;
  eyebrow: string;
  kind: "fallback" | "image" | "upload";
  tone: EventVisualTone;
  src?: string;
};

export type EventVisualCrop = {
  x: number;
  y: number;
  scale: number;
};

type EventVisualFrameProps = {
  visual: EventVisualOption;
  crop?: EventVisualCrop;
  variant?: "card" | "picker" | "tool";
  positionMode?: "object" | "translate";
  shape?: "arch" | "wave";
};

export function EventVisualFrame({
  visual,
  crop,
  variant = "card",
  positionMode = "object",
  shape = "arch",
}: EventVisualFrameProps) {
  const clipPathId = `${useId().replace(/:/g, "")}-visual-wave`;
  const resolvedCrop = crop ?? (positionMode === "translate" ? { x: 0, y: 0, scale: 1 } : { x: 50, y: 50, scale: 1 });
  const imageStyle = {
    objectPosition: `${resolvedCrop.x}% ${resolvedCrop.y}%`,
    transform: `scale(${resolvedCrop.scale})`,
  } as CSSProperties;

  const translatedImageMoverStyle = {
    transform: `translate3d(${resolvedCrop.x}px, ${resolvedCrop.y}px, 0)`,
  } as CSSProperties;

  const translatedImageStyle = {
    objectPosition: "center",
    transform: `scale(${resolvedCrop.scale})`,
  } as CSSProperties;
  const frameStyle = shape === "wave"
    ? ({
        clipPath: `url(#${clipPathId})`,
        WebkitClipPath: `url(#${clipPathId})`,
      } as CSSProperties)
    : undefined;

  return (
    <figure className={`${styles.visualFrame} ${styles[`visualFrame_${variant}`]} ${shape === "wave" ? styles.visualFrame_wave : ""}`} style={frameStyle}>
      {shape === "wave" && (
        <svg className={styles.visualClipDefs} width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
              <path d="M 1 0 C 0.7 0.08 0.48 0.2 0.32 0.31 S 0.03 0.55 0.12 0.66 S 0.54 0.82 0.78 0.82 H 1 V 0 Z" />
            </clipPath>
          </defs>
        </svg>
      )}
      <div className={styles.visualInner}>
        {visual.src && positionMode === "translate" ? (
          <div className={styles.visualImageMover} style={translatedImageMoverStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={`${styles.visualImage} ${styles.visualImageTranslated}`} src={visual.src} alt={visual.title} style={translatedImageStyle} draggable={false} />
          </div>
        ) : visual.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.visualImage} src={visual.src} alt={visual.title} style={imageStyle} draggable={false} />
        ) : (
          <EventVisualFallback tone={visual.tone} />
        )}
        <div className={styles.visualShade} aria-hidden="true" />
        {shape === "wave" && (
          <svg className={styles.visualWaveLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 100 0 C 70 8 48 20 32 31 S 3 55 12 66 S 54 82 78 82" />
          </svg>
        )}
        {variant === "card" && (
          <div className={styles.visualBadge}>
            <BrandSymbolApproved variant="light" size={42} decorative />
          </div>
        )}
      </div>
    </figure>
  );
}
