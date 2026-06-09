import Image from "next/image";
import styles from "./BrandLogo.module.css";

export type BrandSymbolApprovedVariant =
  | "light"
  | "dark"
  | "monochrome"
  | "small"
  | "appIcon";

type BrandSymbolApprovedProps = {
  variant?: BrandSymbolApprovedVariant;
  size?: number;
  className?: string;
  decorative?: boolean;
};

const exactSymbolSrc = "/brand/sobralis_approved_symbol_exact.svg";
const vectorCleanSymbolSrc = "/brand/sobralis_approved_symbol_vector_clean.svg";

function getSymbolSrc(variant: BrandSymbolApprovedVariant) {
  if (variant === "dark" || variant === "monochrome") {
    return vectorCleanSymbolSrc;
  }

  return exactSymbolSrc;
}

export function BrandSymbolApproved({
  variant = "light",
  size = 64,
  className = "",
  decorative = false,
}: BrandSymbolApprovedProps) {
  const src = getSymbolSrc(variant);

  return (
    <span
      aria-hidden={decorative || undefined}
      className={`${styles.symbol} ${styles[`symbol_${variant}`]} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={decorative ? "" : "Фирменный знак Собрались"}
        width={size}
        height={size}
        unoptimized
        draggable={false}
      />
    </span>
  );
}
