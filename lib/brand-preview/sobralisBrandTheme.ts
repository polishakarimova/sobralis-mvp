export const sobralisBrandTokens = {
  colors: {
    milk: "#F5EFE6",
    milkSoft: "#FAF6EE",
    surface: "#FFFDF8",
    sage: "#7E8466",
    sageDeep: "#5F674D",
    clay: "#B88768",
    caramel: "#B78346",
    gold: "#C59A55",
    graphite: "#2B2A27",
    muted: "#7C746A",
    border: "rgba(43, 42, 39, 0.12)",
  },
  radii: {
    card: "34px",
    panel: "26px",
    chip: "999px",
  },
  shadows: {
    soft: "0 24px 70px rgba(52, 44, 35, 0.12)",
    card: "0 16px 48px rgba(52, 44, 35, 0.10)",
    lift: "0 14px 32px rgba(95, 103, 77, 0.18)",
  },
  spacing: {
    page: "clamp(18px, 4vw, 48px)",
    section: "clamp(28px, 5vw, 64px)",
    card: "clamp(22px, 4vw, 42px)",
  },
  buttons: {
    height: "54px",
    radius: "999px",
  },
} as const;

export const previewMetrics = [
  {
    icon: "seat",
    label: "Места",
    value: "6 / 12",
    detail: "осталось 6 мест",
    tone: "sage",
  },
  {
    icon: "payment",
    label: "Оплаты",
    value: "10 из 12",
    detail: "подтверждено",
    tone: "gold",
  },
  {
    icon: "guests",
    label: "Состав",
    value: "16 гостей",
    detail: "4 новых за день",
    tone: "clay",
  },
  {
    icon: "wait",
    label: "Ожидание",
    value: "2 человека",
    detail: "первым придёт место",
    tone: "milk",
  },
  {
    icon: "bell",
    label: "Напоминание",
    value: "За день",
    detail: "Telegram",
    tone: "sage",
  },
  {
    icon: "link",
    label: "Ссылка",
    value: "Скопирована",
    detail: "для гостей",
    tone: "gold",
  },
] as const;

export const paletteSwatches = [
  { name: "Молочный", value: "#F5EFE6" },
  { name: "Surface", value: "#FFFDF8" },
  { name: "Шалфей", value: "#7E8466" },
  { name: "Глина", value: "#B88768" },
  { name: "Карамель", value: "#B78346" },
  { name: "Золото", value: "#C59A55" },
  { name: "Графит", value: "#2B2A27" },
] as const;

export const invitationTemplates = [
  {
    title: "Завтрак клуба",
    meta: "воскресенье · 11:00",
    tone: "sage",
  },
  {
    title: "Банный вечер",
    meta: "пятница · 19:30",
    tone: "clay",
  },
  {
    title: "Камерный ужин",
    meta: "четверг · 20:00",
    tone: "gold",
  },
] as const;

export const uiSamples = [
  "Я иду",
  "Осталось 6 мест",
  "Событие собрано",
  "Ссылка скопирована",
] as const;
