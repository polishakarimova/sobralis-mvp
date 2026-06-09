import type { ChangeEvent } from "react";
import { EventVisualFrame, type EventVisualOption } from "@/components/brand/EventVisualFrame";
import styles from "./EventCardPreview.module.css";

type EventVisualPickerPreviewProps = {
  visuals: EventVisualOption[];
  selectedVisualId: string;
  onSelect: (visualId: string) => void;
  onUpload: (file: File) => void;
};

export function EventVisualPickerPreview({ visuals, selectedVisualId, onSelect, onUpload }: EventVisualPickerPreviewProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onUpload(file);
    }

    event.target.value = "";
  }

  return (
    <div className={styles.visualPicker}>
      <div className={styles.visualPickerGrid}>
        <label className={styles.uploadTile}>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <span>Загрузить своё фото</span>
          <small>frontend-only preview, без сохранения</small>
        </label>

        {visuals.map((visual) => (
          <button
            key={visual.id}
            type="button"
            className={`${styles.visualTile} ${selectedVisualId === visual.id ? styles.visualTileActive : ""}`}
            onClick={() => onSelect(visual.id)}
          >
            <EventVisualFrame visual={visual} variant="picker" />
            <span>{visual.title}</span>
            <small>{visual.eyebrow}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
