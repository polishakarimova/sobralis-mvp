import type { EventVisualCrop } from "@/components/brand/EventVisualFrame";
import styles from "./EventCardPreview.module.css";

type EventVisualCropControlsProps = {
  crop: EventVisualCrop;
  minScale?: number;
  maxScale?: number;
  onScaleChange: (scale: number) => void;
};

export function EventVisualCropControls({
  crop,
  minScale = 1,
  maxScale = 2.5,
  onScaleChange,
}: EventVisualCropControlsProps) {
  return (
    <div className={styles.cropControls}>
      <div>
        <span className={styles.cropTitle}>Перетащите картинку внутри формы</span>
        <small>Положение сохранится в preview. Масштаб: {crop.scale.toFixed(2)}</small>
      </div>

      <label className={styles.zoomSlider}>
        <span>Масштаб</span>
        <div className={styles.zoomSliderRow}>
          <small aria-hidden="true">-</small>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step="0.01"
            value={crop.scale}
            onChange={(event) => onScaleChange(Number(event.currentTarget.value))}
            aria-label="Масштаб картинки"
          />
          <small aria-hidden="true">+</small>
        </div>
      </label>
    </div>
  );
}
