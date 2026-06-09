import { BrandSymbolApproved, type BrandSymbolApprovedVariant } from "./BrandSymbolApproved";
import styles from "./BrandLogo.module.css";

type BrandLogoApprovedProps = {
  variant?: "light" | "dark" | "monochrome";
  symbolVariant?: BrandSymbolApprovedVariant;
  symbolSize?: number;
  caption?: string;
  compact?: boolean;
  className?: string;
};

export function BrandLogoApproved({
  variant = "light",
  symbolVariant,
  symbolSize = 46,
  caption,
  compact = false,
  className = "",
}: BrandLogoApprovedProps) {
  const resolvedSymbolVariant = symbolVariant ?? (variant === "dark" ? "dark" : variant);

  return (
    <div className={`${styles.logo} ${styles[`logo_${variant}`]} ${compact ? styles.logoCompact : ""} ${className}`}>
      <BrandSymbolApproved variant={resolvedSymbolVariant} size={symbolSize} decorative />
      <div className={styles.logoText}>
        <span className={styles.wordmark}>Собрались</span>
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
    </div>
  );
}
