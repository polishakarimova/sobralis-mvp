import { BrandSymbolApproved, type BrandSymbolApprovedVariant } from "@/components/brand/BrandSymbolApproved";
import styles from "./LogoLabPage.module.css";

const sizes = [24, 32, 48, 96] as const;
const symbolRows: { label: string; variant: BrandSymbolApprovedVariant }[] = [
  { label: "Light", variant: "light" },
  { label: "Dark", variant: "dark" },
  { label: "Monochrome", variant: "monochrome" },
  { label: "Small", variant: "small" },
  { label: "App icon", variant: "appIcon" },
];

export function LogoSizeTest() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <span>size test</span>
        <h2>Проверка маленьких размеров</h2>
        <p>Знак должен читаться как favicon, app icon, Telegram avatar и watermark.</p>
      </div>

      <div className={styles.sizeGrid}>
        <div className={styles.sizeHeader}>Вариант</div>
        {sizes.map((size) => (
          <div key={size} className={styles.sizeHeader}>
            {size}px
          </div>
        ))}

        {symbolRows.map((row) => (
          <div className={styles.sizeRow} key={row.variant}>
            <div className={styles.sizeName}>
              <strong>approved</strong>
              <span>{row.label}</span>
            </div>
            {sizes.map((size) => (
              <div key={`${row.variant}-${size}`} className={`${styles.sizeCell} ${row.variant === "dark" ? styles.sizeCellDark : ""}`}>
                <BrandSymbolApproved variant={row.variant} size={size} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
