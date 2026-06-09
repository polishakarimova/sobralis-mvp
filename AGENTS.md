# AGENTS.md — правила для Codex в проекте «Собрались»

## Главный принцип

«Собрались» — это не CRM и не обычный сервис бронирования.  
Это эстетичный event-tech сервис для красивой организации встреч.

Для гостя продукт должен выглядеть как красивая карточка приглашения.  
Для организатора — как спокойный умный слой управления: гости, места, оплаты, статусы, ожидание, напоминания.

## Обязательные дизайн-документы

Перед любыми дизайн-правками обязательно прочитай:

- `docs/design/SOBRALIS_BRAND_GUIDE.md`
- `docs/design/SOBRALIS_UI_RULES.md`
- `docs/design/SOBRALIS_VISUAL_CHECKLIST.md`
- `docs/design/SOBRALIS_COMPONENT_MAP.md`

## Дизайн-процесс Sobralis

Перед любыми дизайн-изменениями по проекту «Собрались» обязательно использовать референс:

`docs/design/references/sobralis-brand-reference.png`

Если дизайн-решение противоречит этому референсу, не внедрять его без отдельного подтверждения.

Перед любой задачей по дизайну, UI, бренду, лендингу, карточке события или `/brand-preview` обязательно прочитай:

- `docs/design/SOBRALIS_REFERENCE_ANALYSIS.md`
- `docs/design/SOBRALIS_DESIGN_QUALITY_RUBRIC.md`
- `docs/design/SOBRALIS_SELF_REVIEW_PROCESS.md`
- `docs/design/SOBRALIS_DO_NOT_REPEAT.md`

После любой дизайн-задачи обязательно сделай self-review по 100-балльной шкале из `SOBRALIS_DESIGN_QUALITY_RUBRIC.md`.

Если результат ниже 85/100, не завершай задачу: сначала исправь слабые места.

Главный ориентир:
Сначала красивая карточка приглашения.
Потом организаторский слой.
Никогда не наоборот.

## Что нельзя делать

- Не превращать интерфейс в CRM-таблицу.
- Не делать сайт похожим на дешёвый Canva-шаблон.
- Не использовать подарки, сердца, торты, шарики, свадебные клише.
- Не делать цветочный магазин, SPA-бренд или wellness-only стиль.
- Не делать тёмный техно-дашборд как основной стиль.
- Не перегружать интерфейс функциями на первом экране.
- Не ломать существующую бизнес-логику ради дизайна.

## Как работать

- Дизайн-изменения делать постепенно.
- Сначала создавать или обновлять изолированные компоненты.
- Не менять глобальные стили без необходимости.
- Использовать scoped-классы или компоненты, чтобы не сломать текущий сайт.
- После работы запускать доступные проверки: lint, typecheck, build, если они есть в package.json.
- В конце писать отчёт: что изменено, какие файлы тронуты, какие проверки запущены.

## Текущий визуальный вектор

Premium botanical social club / ritual & rest / elegant invitation UI.

Ключевые ощущения:

- молочный фон;
- мягкие карточки;
- тонкие линии;
- спокойная премиальность;
- красивое приглашение;
- эстетика встречи;
- организаторский слой — аккуратно и вторым планом.

Главная фраза бренда:

«Красиво собрать своих»

## Sobralis design skill

For any design/UI task, use the Sobralis design skill:

`.codex/skills/sobralis-design/SKILL.md`

Before changing UI, read the skill and the design docs.

The main rule:
Do not make isolated beautiful previews while the real app shell remains old.
Every design task must either:
1. improve the real product screen, or
2. clearly state that it is preview-only.

Always report:
- what real route changed;
- what remained preview-only;
- whether the main shell still looks old;
- what should be redesigned next.
