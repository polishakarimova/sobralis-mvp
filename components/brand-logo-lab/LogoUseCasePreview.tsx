import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";
import { BrandSymbolApproved } from "@/components/brand/BrandSymbolApproved";
import styles from "./LogoLabPage.module.css";

export function LogoUseCasePreview() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <span>use cases</span>
        <h2>Как логотип живёт в интерфейсе</h2>
        <p>Navbar, карточка приглашения, app icon, Telegram bot avatar, watermark и dark mode.</p>
      </div>

      <div className={styles.useCaseGrid}>
        <article className={styles.navbarPreview}>
          <BrandLogoApproved compact symbolVariant="small" symbolSize={38} />
          <span>Создать событие</span>
        </article>

        <article className={styles.invitePreview}>
          <div className={styles.watermark}>
            <BrandSymbolApproved variant="monochrome" size={130} decorative />
          </div>
          <span>приглашение</span>
          <h3>Завтрак клуба</h3>
          <p>14 июня · 11:00 · Калининград</p>
          <footer>
            <BrandSymbolApproved variant="small" size={24} decorative />
            <small>Создано в Собрались</small>
          </footer>
        </article>

        <article className={styles.appIconPreview}>
          <div className={styles.appIcon}>
            <BrandSymbolApproved variant="appIcon" size={92} />
          </div>
          <span>app icon</span>
        </article>

        <article className={styles.telegramPreview}>
          <div className={styles.telegramAvatar}>
            <BrandSymbolApproved variant="appIcon" size={74} />
          </div>
          <div>
            <strong>Собрались</strong>
            <span>Telegram bot avatar</span>
          </div>
        </article>

        <article className={styles.watermarkPreview}>
          <BrandSymbolApproved variant="monochrome" size={42} />
          <span>watermark / подпись</span>
        </article>

        <article className={styles.darkModePreview}>
          <BrandLogoApproved variant="dark" symbolVariant="dark" symbolSize={48} />
          <span>dark premium</span>
        </article>
      </div>
    </section>
  );
}
