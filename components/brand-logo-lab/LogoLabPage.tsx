import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";
import { BrandSymbolApproved } from "@/components/brand/BrandSymbolApproved";
import { LogoSizeTest } from "./LogoSizeTest";
import { LogoUseCasePreview } from "./LogoUseCasePreview";
import styles from "./LogoLabPage.module.css";

export function LogoLabPage() {
  return (
    <main className={styles.logoLab}>
      <div className={styles.bgMark} aria-hidden="true" />
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>approved identity</span>
          <h1>Logo Lab — Собрались</h1>
          <p>Финальный знак точки сбора: люди вокруг события.</p>
        </div>
        <aside className={styles.heroNote}>
          <strong>Источник истины</strong>
          <span>public/brand/sobralis_approved_symbol_exact.svg</span>
        </aside>
      </header>

      <section className={styles.approvedHero}>
        <article className={styles.approvedCard}>
          <span className={styles.kicker}>final symbol</span>
          <div className={styles.approvedLogo}>
            <BrandSymbolApproved variant="light" size={118} />
            <BrandLogoApproved symbolSize={58} caption="точка сбора" />
          </div>
          <p>
            Центральный тёплый круг — событие, четыре внешние точки — люди, дуги
            вокруг — движение и сбор вокруг встречи.
          </p>
        </article>

        <div className={styles.symbolSet}>
          <article>
            <BrandSymbolApproved variant="light" size={82} />
            <strong>Light</strong>
            <span>основная версия</span>
          </article>
          <article className={styles.darkTile}>
            <BrandSymbolApproved variant="dark" size={82} />
            <strong>Dark</strong>
            <span>для графита</span>
          </article>
          <article>
            <BrandSymbolApproved variant="monochrome" size={82} />
            <strong>Mono</strong>
            <span>watermark</span>
          </article>
          <article>
            <BrandSymbolApproved variant="appIcon" size={82} />
            <strong>App icon</strong>
            <span>бот / favicon</span>
          </article>
        </div>
      </section>

      <LogoSizeTest />
      <LogoUseCasePreview />

      <section className={styles.doDont}>
        <article>
          <span>do</span>
          <h2>Держим направление</h2>
          <ul>
            <li>точка сбора;</li>
            <li>люди вокруг события;</li>
            <li>чистая геометрия;</li>
            <li>мягкая премиальность.</li>
          </ul>
        </article>
        <article>
          <span>don’t</span>
          <h2>Не уходим сюда</h2>
          <ul>
            <li>SPA, цветок или солнце;</li>
            <li>свадебный логотип;</li>
            <li>случайная орбита;</li>
            <li>слишком тонкий знак или грубый wordmark.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
