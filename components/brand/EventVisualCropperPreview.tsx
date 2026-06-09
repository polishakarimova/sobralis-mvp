"use client";

import { useRef, useState, type PointerEvent } from "react";
import { EventVisualCropControls } from "@/components/brand/EventVisualCropControls";
import { EventVisualFrame, type EventVisualCrop, type EventVisualOption } from "@/components/brand/EventVisualFrame";
import styles from "./EventCardPreview.module.css";

type DragStart = {
  pointerId: number;
  clientX: number;
  clientY: number;
  crop: EventVisualCrop;
};

type EventVisualCropperPreviewProps = {
  visual: EventVisualOption;
  crop: EventVisualCrop;
  onCropChange: (crop: EventVisualCrop) => void;
};

const minScale = 1;
const maxScale = 2.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function EventVisualCropperPreview({ visual, crop, onCropChange }: EventVisualCropperPreviewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function getOffsetLimits(scale: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    const width = rect?.width || 260;
    const height = rect?.height || 330;
    const safeScale = Math.max(scale, 1);

    return {
      x: Math.max(((safeScale - 1) * width) / 2, 0),
      y: Math.max(((safeScale - 1) * height) / 2, 0),
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      crop,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    event.preventDefault();
    const dx = event.clientX - start.clientX;
    const dy = event.clientY - start.clientY;
    const limits = getOffsetLimits(start.crop.scale);

    onCropChange({
      ...start.crop,
      x: clamp(start.crop.x + dx, -limits.x, limits.x),
      y: clamp(start.crop.y + dy, -limits.y, limits.y),
    });
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (start?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragStartRef.current = null;
      setIsDragging(false);
    }
  }

  function handleScaleChange(scale: number) {
    const nextScale = Number(clamp(scale, minScale, maxScale).toFixed(2));
    const limits = getOffsetLimits(nextScale);

    onCropChange({
      ...crop,
      x: clamp(crop.x, -limits.x, limits.x),
      y: clamp(crop.y, -limits.y, limits.y),
      scale: nextScale,
    });
  }

  return (
    <div className={styles.cropperPreview}>
      <div
        ref={stageRef}
        className={`${styles.cropperStage} ${isDragging ? styles.cropperStageDragging : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        role="application"
        aria-label="Перетащите картинку внутри арочной формы"
      >
        <EventVisualFrame visual={visual} crop={crop} variant="tool" positionMode="translate" shape="wave" />
        <span className={styles.cropperHint}>тащите фото внутри формы</span>
      </div>

      <EventVisualCropControls
        crop={crop}
        minScale={minScale}
        maxScale={maxScale}
        onScaleChange={handleScaleChange}
      />
    </div>
  );
}
