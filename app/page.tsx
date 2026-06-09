"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent, type ReactNode } from "react";
import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";
import { EventVisualFrame, type EventVisualCrop, type EventVisualOption, type EventVisualTone } from "@/components/brand/EventVisualFrame";
import { PublicEventInvitationCard } from "@/components/event/PublicEventInvitationCard";

type Screen = "home" | "account" | "dashboard" | "kind" | "builder" | "event";
type EventKind = "breakfast" | "bath" | "lunch" | "other";
type ViewMode = "guest" | "organizer";
type ParticipantStatus = "interested" | "joined" | "invited_from_waitlist" | "cancelled";
type PaymentMode = "none" | "manual";

type CabinetUser = {
  id?: string;
  name: string;
  phone: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
  };
  ready?: () => void;
  expand?: () => void;
  openTelegramLink?: (url: string) => void;
  showPopup?: (
    params: {
      title?: string;
      message: string;
      buttons?: Array<{ id?: string; type?: "default" | "ok" | "close" | "cancel" | "destructive"; text?: string }>;
    },
    callback?: (buttonId: string) => void,
  ) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

type Participant = {
  id: string;
  userId?: string | null;
  name: string;
  comment: string;
  status: ParticipantStatus;
  paymentStatus?: string;
};

type WaitlistEntry = {
  id: string;
  userId?: string | null;
  name: string;
  comment: string;
  status?: string;
};

type EventRecord = {
  id: string;
  organizerId?: string | null;
  kind: EventKind;
  title: string;
  venue: string;
  mapUrl: string;
  coverImageUrl: string;
  coverImageKey: string;
  coverImageSource: string;
  coverImagePositionX: number;
  coverImagePositionY: number;
  coverImageScale: number;
  date: string;
  time: string;
  minGuests: number;
  maxGuests: number;
  totalCost: number;
  paymentMode: PaymentMode;
  bankName: string;
  paymentPhone: string;
  participants: Participant[];
  waitlist: WaitlistEntry[];
};

type ApiEvent = {
  id: string;
  kind?: string | null;
  title: string;
  mapUrl?: string | null;
  date: string;
  startTime: string;
  guestsLimit: number;
  minGuests: number;
  targetBudget: number;
  paymentMode: string;
  organizerId?: string | null;
  coverImageUrl?: string | null;
  coverImageKey?: string | null;
  coverImageSource?: string | null;
  coverImagePositionX?: number | null;
  coverImagePositionY?: number | null;
  coverImageScale?: number | null;
  place?: { title?: string | null; location?: string | null };
  participants?: Array<{ id: string; userId?: string | null; name: string; comment?: string | null; status: ParticipantStatus; paymentStatus?: string | null }>;
  waitlistEntries?: Array<{ id: string; userId?: string | null; name: string; comment?: string | null; status?: string | null }>;
};

type EventVisual = {
  id: string;
  kind: EventKind;
  title: string;
  imageSrc: string;
  tone: string;
  isPlaceholder?: boolean;
};

type VisualState = {
  eventImageId: string;
  customImagePreview: string;
  imagePositionX: number;
  imagePositionY: number;
  imageScale: number;
};

type GuestReservation = {
  eventId: string;
  name: string;
  status: "joined" | "waitlisted";
};

type PendingTelegramLogin = {
  token: string;
  returnTo: string;
  eventId?: string;
  createdAt: number;
  source: "account" | "event";
};

const PROFILE_KEY = "sobralis:cabinet-user";
const EVENT_VISUALS_STORAGE_KEY = "sobralis:event-visuals";
const LOCAL_STORAGE_RESET_KEY = "sobralis:local-reset:2026-06-02-no-demo";
const PENDING_TELEGRAM_LOGIN_KEY = "sobralis:pending-telegram-login";
const TELEGRAM_BOT_USERNAME = "sobraliss_bot";
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

async function safeReadJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text.trim();

  if (!body) {
    throw new Error(response.ok ? "Сервер вернул пустой ответ." : `Сервер вернул пустой ответ (HTTP ${response.status}). Попробуйте позже.`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`Сервер вернул ответ не в формате JSON (HTTP ${response.status}). Попробуйте позже.`);
  }
}

function savePendingTelegramLogin(pending: PendingTelegramLogin) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_TELEGRAM_LOGIN_KEY, JSON.stringify(pending));
}

function readPendingTelegramLogin() {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("loginToken");
    if (tokenFromUrl) {
      url.searchParams.delete("loginToken");
      const cleanReturnTo = `${url.pathname}${url.search}${url.hash}`;
      const pending: PendingTelegramLogin = {
        token: tokenFromUrl,
        returnTo: cleanReturnTo || "/profile/events",
        eventId: url.searchParams.get("event") || undefined,
        createdAt: Date.now(),
        source: url.searchParams.has("event") ? "event" : "account",
      };
      localStorage.setItem(PENDING_TELEGRAM_LOGIN_KEY, JSON.stringify(pending));
      window.history.replaceState(null, "", cleanReturnTo || "/profile/events");
      return pending;
    }

    const raw = localStorage.getItem(PENDING_TELEGRAM_LOGIN_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingTelegramLogin;
    if (!pending.token || Date.now() - pending.createdAt > 10 * 60 * 1000) {
      localStorage.removeItem(PENDING_TELEGRAM_LOGIN_KEY);
      return null;
    }
    return pending;
  } catch {
    localStorage.removeItem(PENDING_TELEGRAM_LOGIN_KEY);
    return null;
  }
}

function clearPendingTelegramLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_TELEGRAM_LOGIN_KEY);
}

function getTelegramWebApp() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

function showTelegramAuthInstruction(message: string) {
  return new Promise<void>((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp?.showPopup) {
      webApp.showPopup(
        {
          title: "Вход через Telegram",
          message,
          buttons: [{ id: "ok", type: "ok", text: "ОК" }],
        },
        () => resolve(),
      );
      return;
    }

    window.alert(message);
    resolve();
  });
}

const eventKinds: Array<{ id: EventKind; title: string; description: string; accent: string }> = [
  { id: "breakfast", title: "Завтрак", description: "Гости занимают места и пишут, что хотят заказать.", accent: "bg-amber-100" },
  { id: "bath", title: "Банный вечер", description: "Считаем сумму на человека и собираем оплату вручную.", accent: "bg-emerald-100" },
  { id: "lunch", title: "Бизнес-ланч", description: "Быстро собрать людей, место, время и комментарии.", accent: "bg-sky-100" },
  { id: "other", title: "Другое", description: "Для любого камерного события со своими деталями.", accent: "bg-violet-100" },
];

const defaults: Record<EventKind, Pick<EventRecord, "title" | "venue" | "minGuests" | "maxGuests" | "totalCost" | "paymentMode">> = {
  breakfast: { title: "Женский завтрак", venue: "", minGuests: 1, maxGuests: 8, totalCost: 0, paymentMode: "none" },
  bath: { title: "Банный вечер", venue: "", minGuests: 1, maxGuests: 12, totalCost: 18000, paymentMode: "manual" },
  lunch: { title: "Бизнес-ланч", venue: "", minGuests: 1, maxGuests: 10, totalCost: 0, paymentMode: "none" },
  other: { title: "", venue: "", minGuests: 1, maxGuests: 10, totalCost: 0, paymentMode: "none" },
};

const eventVisuals: EventVisual[] = [
  {
    id: "breakfast-photo-1",
    kind: "breakfast",
    title: "Завтрак у окна",
    imageSrc: "/event-images/breakfast/28945079a4b89696466660ea791b099a.webp",
    tone: "from-amber-100 to-orange-50",
  },
  {
    id: "breakfast-photo-2",
    kind: "breakfast",
    title: "Солнечный стол",
    imageSrc: "/event-images/breakfast/29b509068e2d08f74f57eafe0689a581.webp",
    tone: "from-orange-100 to-rose-50",
  },
  {
    id: "bath-photo-1",
    kind: "bath",
    title: "Тёплая баня",
    imageSrc: "/event-images/bath/2dd94cea47b3375330ce791fffb4164d.jpg",
    tone: "from-emerald-100 to-stone-50",
  },
  {
    id: "bath-photo-2",
    kind: "bath",
    title: "Вечер у воды",
    imageSrc: "/event-images/bath/9037b38c0c9e8088996eb4ac785decd9.webp",
    tone: "from-teal-100 to-stone-50",
  },
  {
    id: "bath-photo-3",
    kind: "bath",
    title: "Домик и пар",
    imageSrc: "/event-images/bath/94b2f2df1678d143d1297244fe126f37.jpg",
    tone: "from-lime-100 to-stone-50",
  },
  { id: "breakfast-fallback", kind: "breakfast", title: "Завтрак", imageSrc: "/event-images/breakfast/1.svg", tone: "from-amber-100 to-orange-50", isPlaceholder: true },
  { id: "bath-fallback", kind: "bath", title: "Баня", imageSrc: "/event-images/bath/1.svg", tone: "from-emerald-100 to-stone-50", isPlaceholder: true },
  { id: "lunch-notes", kind: "lunch", title: "Бизнес-ланч", imageSrc: "/event-images/lunch/1.svg", tone: "from-sky-100 to-stone-50", isPlaceholder: true },
  { id: "other-spark", kind: "other", title: "Другое", imageSrc: "/event-images/other/1.svg", tone: "from-violet-100 to-stone-50", isPlaceholder: true },
];

const defaultVisualByKind: Record<EventKind, string> = {
  breakfast: "breakfast-photo-1",
  bath: "bath-photo-1",
  lunch: "lunch-notes",
  other: "other-spark",
};

const developmentDemoEvent: EventRecord = {
  id: "dev-demo-breakfast",
  organizerId: "dev-organizer",
  kind: "breakfast",
  title: "Завтрак клуба",
  venue: "Кафе «Свет», 2 этаж",
  mapUrl: "https://yandex.ru/maps/",
  coverImageUrl: "",
  coverImageKey: "",
  coverImageSource: "dev",
  coverImagePositionX: 55,
  coverImagePositionY: 48,
  coverImageScale: 112,
  date: "2026-06-24",
  time: "10:00",
  minGuests: 6,
  maxGuests: 12,
  totalCost: 0,
  paymentMode: "none",
  bankName: "",
  paymentPhone: "",
  participants: [
    { id: "dev-participant-1", name: "Алина", comment: "Капучино и сырники", status: "joined" },
    { id: "dev-participant-2", name: "Марина", comment: "Без мяса", status: "joined" },
    { id: "dev-participant-3", name: "Кира", comment: "Место у окна, если можно", status: "joined" },
    { id: "dev-participant-4", name: "Лена", comment: "Латте", status: "joined" },
    { id: "dev-participant-5", name: "Оля", comment: "Буду к 10:15", status: "joined" },
    { id: "dev-participant-6", name: "Ника", comment: "Омлет", status: "joined" },
  ],
  waitlist: [
    { id: "dev-waitlist-1", name: "Саша", comment: "Если освободится место", status: "waiting" },
    { id: "dev-waitlist-2", name: "Вера", comment: "Очень хочу попасть", status: "waiting" },
  ],
};

const money = new Intl.NumberFormat("ru-RU");
const timeOptions = Array.from({ length: 24 * 12 }, (_, index) => {
  const totalMinutes = index * 5;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

function isEventKind(value: unknown): value is EventKind {
  return value === "breakfast" || value === "bath" || value === "lunch" || value === "other";
}

function mapApiEvent(event: ApiEvent): EventRecord {
  return {
    id: event.id,
    organizerId: event.organizerId,
    kind: isEventKind(event.kind) ? event.kind : "other",
    title: event.title,
    venue: event.place?.title || "",
    mapUrl: event.mapUrl || event.place?.location || "",
    coverImageUrl: event.coverImageUrl || "",
    coverImageKey: event.coverImageKey || "",
    coverImageSource: event.coverImageSource || "",
    coverImagePositionX: event.coverImagePositionX ?? 50,
    coverImagePositionY: event.coverImagePositionY ?? 50,
    coverImageScale: event.coverImageScale ?? 100,
    date: event.date?.slice(0, 10) || "",
    time: event.startTime || "",
    minGuests: event.minGuests || 1,
    maxGuests: event.guestsLimit,
    totalCost: event.targetBudget || 0,
    paymentMode: event.paymentMode === "manual" ? "manual" : "none",
    bankName: "",
    paymentPhone: "",
    participants: (event.participants || [])
      .filter((participant) => participant.status !== "cancelled")
      .map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        name: participant.name,
        comment: participant.comment || "",
        status: participant.status,
        paymentStatus: participant.paymentStatus || undefined,
      })),
    waitlist: (event.waitlistEntries || [])
      .filter((entry) => entry.status !== "accepted" && entry.status !== "skipped")
      .map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        name: entry.name,
        comment: entry.comment || "",
        status: entry.status || undefined,
      })),
  };
}

function formatDate(date: string, time?: string) {
  if (!date) return "Дата будет позже";
  const value = new Date(`${date}T${time || "00:00"}:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: time ? "2-digit" : undefined,
    minute: time ? "2-digit" : undefined,
  }).format(value);
}

function getVisual(id: string, kind: EventKind) {
  return eventVisuals.find((visual) => visual.id === id) || eventVisuals.find((visual) => visual.id === defaultVisualByKind[kind]) || eventVisuals[0];
}

const publicEventKindLabels: Record<EventKind, string> = {
  breakfast: "завтрак",
  bath: "банная встреча",
  lunch: "бизнес-ланч",
  other: "камерная встреча",
};

const publicVisualToneByKind: Record<EventKind, EventVisualTone> = {
  breakfast: "breakfast",
  bath: "bath",
  lunch: "dinner",
  other: "circle",
};

const guestAvatarTones = ["sage", "clay", "gold", "sand", "graphite"] as const;

function formatEventDateLabel(date: string) {
  if (!date) return "Дата уточняется";
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return "Дата уточняется";
  const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(value);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(value);
  return `${dayMonth}, ${weekday}`;
}

function formatEventTimeRange(date: string, time: string) {
  if (!time) return "Время уточняется";
  const baseDate = date || "2026-01-01";
  const endDate = new Date(`${baseDate}T${time}:00`);
  if (Number.isNaN(endDate.getTime())) return time;
  endDate.setHours(endDate.getHours() + 2);
  const end = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(endDate);
  return `${time} — ${end}`;
}

function guestInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Г";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function toPublicEventVisual(event: EventRecord, visual: EventVisual, customImagePreview: string): EventVisualOption {
  const src = customImagePreview || visual.imageSrc || undefined;

  return {
    id: customImagePreview ? `${event.id}-custom-cover` : visual.id,
    title: customImagePreview ? "Обложка события" : visual.title,
    eyebrow: publicEventKindLabels[event.kind],
    kind: customImagePreview ? "upload" : visual.isPlaceholder ? "fallback" : "image",
    tone: publicVisualToneByKind[event.kind],
    src,
  };
}

function toBuilderEventVisualOption(visual: EventVisual, kind: EventKind, customImagePreview = ""): EventVisualOption {
  const src = customImagePreview || visual.imageSrc || undefined;

  return {
    id: customImagePreview ? "builder-custom-cover" : visual.id,
    title: customImagePreview ? "Своё изображение" : visual.title,
    eyebrow: publicEventKindLabels[kind],
    kind: customImagePreview ? "upload" : visual.isPlaceholder ? "fallback" : "image",
    tone: publicVisualToneByKind[kind],
    src,
  };
}

function calendarLinks(event: EventRecord) {
  const start = `${event.date.replaceAll("-", "")}T${(event.time || "12:00").replace(":", "")}00`;
  const endDate = new Date(`${event.date}T${event.time || "12:00"}:00`);
  endDate.setHours(endDate.getHours() + 2);
  const end = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const text = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.venue);
  const details = encodeURIComponent("Событие создано в Собрались.");
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&location=${location}&details=${details}`;
  const ics = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${start}
DTEND:${end}
LOCATION:${event.venue}
DESCRIPTION:Событие создано в Собрались.
END:VEVENT
END:VCALENDAR`;
  return { google, ics };
}

function normalizeExternalUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function App() {
  const [afterAuthScreen, setAfterAuthScreen] = useState<Screen>(() => {
    if (typeof window === "undefined") return "dashboard";
    const params = new URLSearchParams(window.location.search);
    return window.location.pathname.startsWith("/app") && params.get("intent") === "create" ? "kind" : "dashboard";
  });
  const [screen, setScreen] = useState<Screen>(() => {
    if (typeof window === "undefined") return "home";
    if (window.location.pathname.startsWith("/app")) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("event") || params.get("devEvent") === "1") return "home";
      if (params.get("intent") === "create") return localStorage.getItem(PROFILE_KEY) ? "kind" : "account";
      return localStorage.getItem(PROFILE_KEY) ? "dashboard" : "account";
    }
    if (!window.location.pathname.startsWith("/profile/events")) return "home";

    try {
      return localStorage.getItem(PROFILE_KEY) ? "dashboard" : "account";
    } catch {
      return "account";
    }
  });
  const [cabinetUser, setCabinetUser] = useState<CabinetUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const profile = localStorage.getItem(PROFILE_KEY);
      return profile ? (JSON.parse(profile) as CabinetUser) : null;
    } catch {
      return null;
    }
  });
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [eventKind, setEventKind] = useState<EventKind>("breakfast");
  const [viewMode, setViewMode] = useState<ViewMode>("guest");
  const [title, setTitle] = useState(defaults.breakfast.title);
  const [venue, setVenue] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [minGuests, setMinGuests] = useState(defaults.breakfast.minGuests);
  const [maxGuests, setMaxGuests] = useState(defaults.breakfast.maxGuests);
  const [totalCost, setTotalCost] = useState(defaults.breakfast.totalCost);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(defaults.breakfast.paymentMode);
  const [bankName, setBankName] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestComment, setGuestComment] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [createAttempted, setCreateAttempted] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [guestReservation, setGuestReservation] = useState<GuestReservation | null>(null);
  const [eventVisualsState, setEventVisualsState] = useState<Record<string, VisualState>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const visuals = localStorage.getItem(EVENT_VISUALS_STORAGE_KEY);
      return visuals ? (JSON.parse(visuals) as Record<string, VisualState>) : {};
    } catch {
      return {};
    }
  });
  const [eventImageId, setEventImageId] = useState(defaultVisualByKind.breakfast);
  const [customImagePreview, setCustomImagePreview] = useState("");
  const [customImageKey, setCustomImageKey] = useState("");
  const [imagePositionX, setImagePositionX] = useState(50);
  const [imagePositionY, setImagePositionY] = useState(50);
  const [imageScale, setImageScale] = useState(100);
  const [shareCopied, setShareCopied] = useState(false);
  const [eventAuthLoading, setEventAuthLoading] = useState(false);

  const applyAuthenticatedUser = useCallback((profile: CabinetUser) => {
    setCabinetUser(profile);
    setGuestName((current) => current || profile.name);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setScreen(afterAuthScreen === "kind" ? "kind" : "dashboard");
    void fetch(`/api/events?organizerId=${profile.id}`, { cache: "no-store" })
      .then((response) => safeReadJson<{ ok: boolean; data: ApiEvent[] }>(response))
      .then((payload) => {
        if (payload.ok) setEvents(payload.data.map(mapApiEvent));
      })
      .catch((eventsError) => console.error("Events load after auth failed", eventsError));
  }, [afterAuthScreen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LOCAL_STORAGE_RESET_KEY)) return;

    localStorage.setItem(LOCAL_STORAGE_RESET_KEY, "done");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = await safeReadJson<{
          ok: boolean;
          data?: { user?: { id: string; name: string; phone?: string | null; telegramUsername?: string | null } | null };
        }>(response);

        if (!payload.ok || cancelled) return;
        if (!payload.data?.user) {
          localStorage.removeItem(PROFILE_KEY);
          setCabinetUser(null);
          return;
        }

        const profile = {
          id: payload.data.user.id,
          name: payload.data.user.name,
          phone: payload.data.user.phone || (payload.data.user.telegramUsername ? `@${payload.data.user.telegramUsername}` : ""),
        };

        setCabinetUser(profile);
        setGuestName((current) => current || profile.name);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        const params = new URLSearchParams(window.location.search);
        if (window.location.pathname.startsWith("/app") && params.get("intent") === "create") {
          setAfterAuthScreen("kind");
          setScreen("kind");
        } else if (window.location.pathname.startsWith("/profile/events") || (window.location.pathname.startsWith("/app") && !params.has("event"))) {
          setScreen("dashboard");
        }
      } catch (sessionError) {
        console.error("Session restore failed", sessionError);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    async function authorizeTelegramUser(webApp: TelegramWebApp) {
      setNotice("Подтверждаем вход через Telegram...");
      setError("");
      try {
        const response = await fetch("/api/auth/telegram-mini-app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: webApp.initData }),
        });
        const payload = await safeReadJson<{
          ok: boolean;
          data?: { id: string; name: string; phone?: string | null; telegramUsername?: string | null };
        }>(response);

        if (!payload.ok || !payload.data || cancelled) return;

        const profile = {
          id: payload.data.id,
          name: payload.data.name,
          phone: payload.data.phone || (payload.data.telegramUsername ? `@${payload.data.telegramUsername}` : ""),
        };

        setCabinetUser(profile);
        setGuestName((current) => current || profile.name);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        const params = new URLSearchParams(window.location.search);
        const hasEventInvite = params.has("event");
        const wantsCreate = params.get("intent") === "create";
        if (wantsCreate) setAfterAuthScreen("kind");
        setScreen((current) =>
          wantsCreate
            ? "kind"
            : current === "account" || window.location.pathname.startsWith("/profile/events") || (window.location.pathname.startsWith("/app") && !hasEventInvite)
              ? "dashboard"
              : current,
        );
        setNotice("Вы вошли через Telegram. Можно продолжать.");
        setError("");
      } catch (authError) {
        console.error("Telegram Mini App authorization failed", authError);
        setScreen("account");
        setNotice("");
        setError(authError instanceof Error ? authError.message : "Не получилось войти через Telegram");
      }
    }

    function waitForTelegramWebApp(attempt = 0) {
      if (cancelled) return;

      const webApp = getTelegramWebApp();
      webApp?.ready?.();
      webApp?.expand?.();

      if (webApp?.initData) {
        void authorizeTelegramUser(webApp);
        return;
      }

      if (attempt < 16) {
        retryTimer = window.setTimeout(() => waitForTelegramWebApp(attempt + 1), 250);
      }
    }

    waitForTelegramWebApp();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = readPendingTelegramLogin();
    if (!pending) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setNotice("Проверяю подтверждение Telegram. Если вы уже нажали «Авторизоваться» в боте, вход продолжится автоматически.");
      setError("");

      try {
        const profile = await waitForTelegramLogin(pending.token);
        if (cancelled) return;

        setCabinetUser(profile);
        setGuestName((current) => current || profile.name);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

        if (pending.eventId) {
          await refreshActiveEvent(pending.eventId);
          setScreen("event");
          setNotice("Telegram подтверждён. Теперь можно занять место.");
          return;
        }

        if (pending.returnTo.includes("intent=create")) {
          setAfterAuthScreen("kind");
          setScreen("kind");
        } else {
          await loadEvents();
          setScreen("dashboard");
        }

        setNotice("Telegram подтверждён. Можно продолжать.");
      } catch {
        if (!cancelled) {
          setNotice("");
          setError("Не получилось завершить вход. Нажмите «Авторизоваться» ещё раз и подтвердите вход в боте.");
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedKind = eventKinds.find((kind) => kind.id === eventKind) || eventKinds[0];
  const activeEvent = events.find((event) => event.id === activeEventId) || null;
  const seatsLeft = Math.max(maxGuests - participants.length, 0);
  const isFull = seatsLeft === 0;
  const visual = getVisual(eventImageId, eventKind);
  const availableVisuals = eventVisuals.filter((item) => item.kind === eventKind && !item.isPlaceholder);
  const requiredErrors = {
    title: createAttempted && !title.trim(),
    venue: createAttempted && !venue.trim(),
    date: createAttempted && !date,
    time: createAttempted && !time,
    maxGuests: createAttempted && maxGuests < 1,
  };
  const priceRange = useMemo(() => {
    if (paymentMode !== "manual" || totalCost <= 0) return null;
    const low = Math.ceil(totalCost / Math.max(maxGuests, 1));
    const high = Math.ceil(totalCost / Math.max(minGuests || maxGuests, 1));
    return low === high ? `${money.format(low)} ₽` : `${money.format(low)}-${money.format(high)} ₽`;
  }, [maxGuests, minGuests, paymentMode, totalCost]);
  const exportText = useMemo(() => {
    if (participants.length === 0) return "Пока нет участников.";
    return participants.map((participant, index) => `${index + 1}. ${participant.name} - ${participant.comment || "без комментария"}`).join("\n");
  }, [participants]);
  const persistedUserId = cabinetUser?.id && !cabinetUser.id.startsWith("local-") ? cabinetUser.id : undefined;
  const activeInvitation = persistedUserId ? waitlist.find((entry) => entry.userId === persistedUserId && entry.status === "invited") || null : null;

  const persistVisual = useCallback((eventId: string, next: VisualState) => {
    setEventVisualsState((current) => {
      const updated = { ...current, [eventId]: next };
      localStorage.setItem(EVENT_VISUALS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const url = cabinetUser?.id ? `/api/events?organizerId=${cabinetUser.id}` : "/api/events";
      const response = await fetch(url, { cache: "no-store" });
      const payload = await safeReadJson<{ ok: boolean; data: ApiEvent[]; error?: string }>(response);
      if (payload.ok) setEvents(payload.data.map(mapApiEvent));
      else setError(payload.error || "Не получилось загрузить события.");
    } catch (eventsError) {
      console.error("Events load failed", eventsError);
      setError(eventsError instanceof Error ? eventsError.message : "Не получилось загрузить события.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, [cabinetUser?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.pathname.startsWith("/profile/events")) return;
    if (!cabinetUser) return;

    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [cabinetUser, loadEvents]);

  async function refreshActiveEvent(id: string) {
    const response = await fetch(`/api/events/${id}`, { cache: "no-store" });
    const payload = await safeReadJson<{ ok: boolean; data: ApiEvent; error?: string }>(response);
    if (!payload.ok) return;
    const record = mapApiEvent(payload.data);
    setEvents((current) => [record, ...current.filter((event) => event.id !== record.id)]);
    openEvent(record);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eventId = new URLSearchParams(window.location.search).get("event");
    if (!eventId) return;
    const timer = window.setTimeout(() => {
      void refreshActiveEvent(eventId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goHome() {
    setScreen("home");
    setNotice("");
    setError("");
  }

  function openDashboard() {
    setAfterAuthScreen("dashboard");
    if (!cabinetUser) {
      setScreen("account");
      return;
    }
    loadEvents();
    setScreen("dashboard");
  }

  function startCreate() {
    setAfterAuthScreen("kind");
    if (!cabinetUser) {
      setScreen("account");
      return;
    }
    setScreen("kind");
  }

  function chooseKind(kind: EventKind) {
    const next = defaults[kind];
    setEventKind(kind);
    setTitle(next.title);
    setVenue(next.venue);
    setMinGuests(next.minGuests);
    setMaxGuests(next.maxGuests);
    setTotalCost(next.totalCost);
    setPaymentMode(next.paymentMode);
    setBankName("");
    setPaymentPhone("");
    setMapUrl("");
    setDate("");
    setTime("");
    setParticipants([]);
    setWaitlist([]);
    setNotice("");
    setError("");
    setCreateAttempted(false);
    setActiveEventId(null);
    setEventImageId(defaultVisualByKind[kind]);
    setCustomImagePreview("");
    setCustomImageKey("");
    setImagePositionX(50);
    setImagePositionY(50);
    setImageScale(100);
    setShareCopied(false);
    setScreen("builder");
  }

  async function createEvent() {
    setError("");
    setCreateAttempted(true);
    if (!title.trim() || !venue.trim() || !date || !time || maxGuests < 1) {
      setError("Заполните обязательные поля: название, место, дату, время и количество мест.");
      return;
    }

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        kind: eventKind,
        venue: venue.trim(),
        mapUrl,
        date,
        startTime: time,
        guestsLimit: maxGuests,
        minGuests: Math.max(minGuests || 1, 1),
        targetBudget: totalCost,
        paymentMode,
        organizerId: cabinetUser?.id,
        coverImageUrl: customImagePreview || visual.imageSrc,
        coverImageKey: customImageKey || undefined,
        coverImageSource: customImageKey ? "upload" : eventImageId,
        coverImagePositionX: imagePositionX,
        coverImagePositionY: imagePositionY,
        coverImageScale: imageScale,
      }),
    });
    const payload = await safeReadJson<{ ok: boolean; data: ApiEvent; error?: string }>(response);

    if (!payload.ok) {
      setError("Не получилось сохранить событие. Проверьте обязательные поля и попробуйте ещё раз.");
      return;
    }

    const record = mapApiEvent(payload.data);
    const visualState = { eventImageId, customImagePreview: record.coverImageUrl || customImagePreview, imagePositionX, imagePositionY, imageScale };
    persistVisual(record.id, visualState);
    setActiveEventId(record.id);
    setEvents((current) => [record, ...current.filter((event) => event.id !== record.id)]);
    setParticipants([]);
    setWaitlist([]);
    setGuestName("");
    setGuestComment("");
    setGuestReservation(null);
    setNotice("Событие создано. Теперь можно отправить ссылку гостям.");
    setExportCopied(false);
    setViewMode("guest");
    setScreen("event");
  }

  function openEvent(event: EventRecord) {
    const savedVisual = eventVisualsState[event.id];
    setActiveEventId(event.id);
    setEventKind(event.kind);
    setTitle(event.title);
    setVenue(event.venue);
    setMapUrl(event.mapUrl);
    setDate(event.date);
    setTime(event.time);
    setMinGuests(event.minGuests);
    setMaxGuests(event.maxGuests);
    setTotalCost(event.totalCost);
    setPaymentMode(event.paymentMode);
    setBankName(event.bankName);
    setPaymentPhone(event.paymentPhone);
    setParticipants(event.participants);
    setWaitlist(event.waitlist);
    setEventImageId(savedVisual?.eventImageId || defaultVisualByKind[event.kind]);
    setCustomImagePreview(event.coverImageUrl || savedVisual?.customImagePreview || "");
    setCustomImageKey(event.coverImageKey || "");
    setImagePositionX(event.coverImagePositionX ?? savedVisual?.imagePositionX ?? 50);
    setImagePositionY(event.coverImagePositionY ?? savedVisual?.imagePositionY ?? 50);
    setImageScale(event.coverImageScale ?? savedVisual?.imageScale ?? 100);
    setNotice("");
    setError("");
    setGuestReservation(null);
    setShareCopied(false);
    setViewMode("guest");
    setScreen("event");
  }

  useEffect(() => {
    if (typeof window === "undefined" || !IS_DEVELOPMENT) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("devEvent") !== "1") return;

    const timer = window.setTimeout(() => {
      setEvents((current) => [developmentDemoEvent, ...current.filter((event) => event.id !== developmentDemoEvent.id)]);
      openEvent(developmentDemoEvent);
      setNotice("Открыта локальная demo-карточка. Это development-only режим без записи в базу.");
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deleteEvent(id: string) {
    if (!window.confirm("Удалить это событие?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((current) => current.filter((event) => event.id !== id));
    setEventVisualsState((current) => {
      const updated = { ...current };
      delete updated[id];
      localStorage.setItem(EVENT_VISUALS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    if (activeEventId === id) {
      setActiveEventId(null);
      setScreen("dashboard");
    }
  }

  async function joinEvent() {
    const cleanName = guestName.trim();
    if (!cleanName) {
      setError("Укажите имя, чтобы занять место.");
      return;
    }
    if (!activeEventId || guestReservation?.eventId === activeEventId) return;

    const response = await fetch(`/api/events/${activeEventId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cleanName, comment: guestComment.trim(), status: "joined", userId: persistedUserId }),
    });
    const payload = await safeReadJson<{ ok: boolean; data: { waitlisted?: boolean }; error?: string }>(response);
    if (!payload.ok) {
      setError("Не получилось сохранить гостя. Попробуйте ещё раз.");
      return;
    }

    await refreshActiveEvent(activeEventId);
    const status = payload.data.waitlisted ? "waitlisted" : "joined";
    setGuestReservation({ eventId: activeEventId, name: cleanName, status });
    setNotice(status === "waitlisted" ? "Места закончились, вы в листе ожидания." : "Готово, место за вами закреплено.");
    setError("");
    setGuestName("");
    setGuestComment("");
  }

  async function acceptPersonalInvitation() {
    if (!activeInvitation || !activeEventId) return;

    const response = await fetch(`/api/waitlist/${activeInvitation.id}/accept`, { method: "POST" });
    const payload = await safeReadJson<{ ok: boolean; error?: string }>(response);
    if (!payload.ok) {
      setError("Не получилось занять освободившееся место. Возможно, приглашение уже не активно.");
      return;
    }

    await refreshActiveEvent(activeEventId);
    setGuestReservation({ eventId: activeEventId, name: activeInvitation.name, status: "joined" });
    setNotice("Готово, освободившееся место закреплено за вами.");
    setError("");
  }

  async function cancelParticipant(participant: Participant) {
    if (!window.confirm(`Удалить ${participant.name} из события?`)) return;
    if (!activeEventId) return;

    const response = await fetch(`/api/events/${activeEventId}/participants/${participant.id}/cancel`, { method: "POST" });
    const payload = await safeReadJson<{ ok: boolean; data: { invitedWaitlistEntry?: unknown }; error?: string }>(response);
    if (!payload.ok) {
      setError("Не получилось отменить участника. Попробуйте ещё раз.");
      return;
    }

    await refreshActiveEvent(activeEventId);
    setNotice(
      payload.data.invitedWaitlistEntry
        ? `${participant.name} удалена. Первому человеку из листа ожидания отправлено личное приглашение.`
        : `${participant.name} удалена. Лист ожидания пуст.`,
    );
    setError("");
  }

  function copyExport() {
    navigator.clipboard?.writeText(exportText);
    setExportCopied(true);
  }

  function copyShareLink() {
    if (!activeEventId || typeof window === "undefined") return;
    navigator.clipboard?.writeText(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=event_${activeEventId}`);
    setShareCopied(true);
  }

  async function waitForTelegramLogin(token: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const response = await fetch(`/api/auth/telegram-login/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = await safeReadJson<{
        ok: boolean;
        data?: {
          status: "pending" | "confirmed";
          user?: { id: string; name: string; phone?: string | null; telegramUsername?: string | null };
        };
        error?: string;
      }>(response);

      if (!payload.ok) {
        if (response.status === 404 || response.status === 410) clearPendingTelegramLogin();
        throw new Error(payload.error || "Не получилось проверить вход");
      }
      if (payload.data?.status === "confirmed" && payload.data.user) {
        clearPendingTelegramLogin();
        return {
          id: payload.data.user.id,
          name: payload.data.user.name,
          phone: payload.data.user.phone || (payload.data.user.telegramUsername ? `@${payload.data.user.telegramUsername}` : ""),
        };
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }

    throw new Error("Вход не подтвердился. Откройте бот и нажмите «Авторизоваться».");
  }

  async function startTelegramLoginForEvent(eventId: string) {
    if (eventAuthLoading) return;

    const webApp = getTelegramWebApp();
    if (webApp?.initData) {
      setEventAuthLoading(true);
      try {
        const response = await fetch("/api/auth/telegram-mini-app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: webApp.initData }),
        });
        const payload = await safeReadJson<{
          ok: boolean;
          data?: { id: string; name: string; phone?: string | null; telegramUsername?: string | null };
          error?: string;
        }>(response);
        if (!payload.ok || !payload.data) throw new Error(payload.error || "Не получилось войти через Telegram");

        const profile = {
          id: payload.data.id,
          name: payload.data.name,
          phone: payload.data.phone || (payload.data.telegramUsername ? `@${payload.data.telegramUsername}` : ""),
        };
        setCabinetUser(profile);
        setGuestName((current) => current || profile.name);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        await refreshActiveEvent(eventId);
        setNotice("Готово, Telegram подтверждён. Теперь можно занять место.");
        setError("");
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Не получилось войти через Telegram");
      } finally {
        setEventAuthLoading(false);
      }
      return;
    }

    const userAgent = navigator.userAgent || "";
    const shouldOpenInCurrentWindow = /Telegram/i.test(userAgent);
    const pendingWindow = webApp?.openTelegramLink || shouldOpenInCurrentWindow ? null : window.open("", "_blank", "noopener,noreferrer");
    setEventAuthLoading(true);
    setNotice("Открываем Telegram. В боте нажмите «Авторизоваться». Если вы вернётесь на эту страницу, вход продолжится автоматически.");
    setError("");

    try {
      const response = await fetch("/api/auth/telegram-login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: `/app?event=${eventId}` }),
      });
      const payload = await safeReadJson<{ ok: boolean; data?: { token: string; botUrl: string }; error?: string }>(response);
      if (!payload.ok || !payload.data) throw new Error(payload.error || "Не получилось открыть Telegram");
      savePendingTelegramLogin({
        token: payload.data.token,
        returnTo: `/app?event=${eventId}`,
        eventId,
        createdAt: Date.now(),
        source: "event",
      });

      await showTelegramAuthInstruction(
        "Сейчас откроется бот «Собрались». В боте нажмите «Авторизоваться», а потом кнопку «Вернуться к событию». После возврата приложение продолжит вход автоматически.",
      );

      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(payload.data.botUrl);
      } else if (shouldOpenInCurrentWindow) {
        window.location.href = payload.data.botUrl;
        return;
      } else if (pendingWindow) {
        pendingWindow.location.href = payload.data.botUrl;
      } else {
        window.location.href = payload.data.botUrl;
      }

      const profile = await waitForTelegramLogin(payload.data.token);
      setCabinetUser(profile);
      setGuestName((current) => current || profile.name);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      await refreshActiveEvent(eventId);
      setNotice("Готово, Telegram подтверждён. Теперь можно занять место.");
      setError("");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Не получилось войти через Telegram");
    } finally {
      setEventAuthLoading(false);
    }
  }

  return (
    <main className="sobralis-page">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 12% 14%, rgba(197,154,85,0.18), transparent 30%), radial-gradient(circle at 86% 18%, rgba(126,132,102,0.16), transparent 32%), radial-gradient(circle at 72% 88%, rgba(184,135,104,0.14), transparent 30%), linear-gradient(135deg, #f5efe6 0%, #fbf7ef 52%, #eee4d7 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(43,42,39,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(43,42,39,0.025) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <div className="relative z-10">
        <Header goHome={goHome} openDashboard={openDashboard} startCreate={startCreate} />

        {screen === "home" && <Home startCreate={startCreate} openExample={() => window.location.assign(IS_DEVELOPMENT ? "/app?devEvent=1" : "/event-card-preview")} />}
        {screen === "account" && <Account goHome={goHome} onAuthenticated={applyAuthenticatedUser} returnTo={afterAuthScreen === "kind" ? "/app?intent=create" : "/profile/events"} />}
        {screen === "dashboard" && <Dashboard events={events} isLoading={isLoadingEvents} openEvent={openEvent} deleteEvent={deleteEvent} createNew={() => setScreen("kind")} />}
        {screen === "kind" && <KindPicker goBack={() => setScreen("home")} chooseKind={chooseKind} />}
        {screen === "builder" && (
          <Builder
            selectedKind={selectedKind}
            eventKind={eventKind}
            title={title}
            setTitle={setTitle}
            venue={venue}
            setVenue={setVenue}
            mapUrl={mapUrl}
            setMapUrl={setMapUrl}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            minGuests={minGuests}
            setMinGuests={setMinGuests}
            maxGuests={maxGuests}
            setMaxGuests={setMaxGuests}
            totalCost={totalCost}
            setTotalCost={setTotalCost}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            bankName={bankName}
            setBankName={setBankName}
            paymentPhone={paymentPhone}
            setPaymentPhone={setPaymentPhone}
            priceRange={priceRange}
            eventImageId={eventImageId}
            setEventImageId={setEventImageId}
            setCustomImagePreview={setCustomImagePreview}
            setCustomImageKey={setCustomImageKey}
            customImagePreview={customImagePreview}
            imagePositionX={imagePositionX}
            setImagePositionX={setImagePositionX}
            imagePositionY={imagePositionY}
            setImagePositionY={setImagePositionY}
            imageScale={imageScale}
            setImageScale={setImageScale}
            visual={visual}
            availableVisuals={availableVisuals}
            error={error}
            requiredErrors={requiredErrors}
            goBack={() => setScreen("kind")}
            createEvent={createEvent}
          />
        )}
        {screen === "event" && activeEvent && (
          <EventPage
            event={activeEvent}
            visual={visual}
            customImagePreview={customImagePreview}
            imagePositionX={imagePositionX}
            imagePositionY={imagePositionY}
            imageScale={imageScale}
            isOrganizerPreview={Boolean(persistedUserId && activeEvent.organizerId === persistedUserId)}
            needsTelegramAuth={!persistedUserId}
            eventAuthLoading={eventAuthLoading}
            participants={participants}
            waitlist={waitlist}
            seatsLeft={seatsLeft}
            isFull={isFull}
            viewMode={viewMode}
            setViewMode={setViewMode}
            guestName={guestName}
            setGuestName={setGuestName}
            guestComment={guestComment}
            setGuestComment={setGuestComment}
            guestReservation={guestReservation}
            activeInvitation={activeInvitation}
            notice={notice}
            setNotice={setNotice}
            error={error}
            startTelegramLoginForEvent={startTelegramLoginForEvent}
            joinEvent={joinEvent}
            acceptPersonalInvitation={acceptPersonalInvitation}
            cancelParticipant={cancelParticipant}
            exportText={exportText}
            exportCopied={exportCopied}
            copyExport={copyExport}
            shareCopied={shareCopied}
            copyShareLink={copyShareLink}
            goDashboard={openDashboard}
            goEdit={() => setScreen("builder")}
          />
        )}
      </div>
    </main>
  );
}

function Header({ goHome, openDashboard, startCreate }: { goHome: () => void; openDashboard: () => void; startCreate: () => void }) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[26px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/82 px-3 py-2.5 shadow-[0_18px_50px_rgba(52,44,35,0.10)] backdrop-blur-2xl sm:px-4">
        <button onClick={goHome} className="min-w-0 rounded-[20px] px-1 text-left transition hover:opacity-80" aria-label="На главную">
          <BrandLogoApproved caption="Красиво собрать своих" symbolSize={42} compact />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={openDashboard} className="hidden rounded-[18px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/75 px-4 py-2.5 text-sm font-semibold text-[#2b2a27] transition hover:-translate-y-0.5 hover:border-[#c59a55]/50 hover:shadow-[0_10px_24px_rgba(52,44,35,0.10)] sm:block">
            Мои события
          </button>
          <button onClick={startCreate} className="rounded-[18px] bg-[#7e8466] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] shadow-[0_12px_26px_rgba(89,96,71,0.22)] transition hover:-translate-y-0.5 hover:bg-[#596047] sm:px-5">
            Создать
          </button>
        </div>
      </div>
    </header>
  );
}

function Home({ startCreate, openExample }: { startCreate: () => void; openExample: () => void }) {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-92px)] max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-10">
      <div className="max-w-xl text-center lg:text-left">
        <div className="mb-5 flex justify-center lg:justify-start">
          <BrandLogoApproved caption="приглашение в одну ссылку" symbolSize={50} />
        </div>
        <h1 className="font-serif text-[3.1rem] font-normal leading-[0.96] tracking-[-0.01em] text-[#2b2a27] sm:text-[4.8rem] lg:text-[5.3rem]">
          Красиво собрать своих
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#7c746a] sm:text-lg sm:leading-8 lg:mx-0">
          Гости, места, оплаты и напоминания — в одной ссылке.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <button onClick={startCreate} className="rounded-[22px] bg-[#7e8466] px-7 py-4 text-base font-semibold text-[#fffdf8] shadow-[0_18px_34px_rgba(89,96,71,0.24)] transition hover:-translate-y-0.5 hover:bg-[#596047]">
            Создать событие
          </button>
          <button onClick={openExample} className="rounded-[22px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/76 px-7 py-4 text-base font-semibold text-[#2b2a27] shadow-[0_14px_34px_rgba(52,44,35,0.08)] transition hover:-translate-y-0.5 hover:border-[#c59a55]/50">
            Посмотреть пример
          </button>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#7e8466]">
          завтраки · бани · ужины · камерные встречи
        </p>
      </div>

      <HomeInvitationMock />
    </section>
  );
}

function HomeInvitationMock() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="absolute -left-4 top-8 hidden rounded-[24px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/82 px-5 py-4 shadow-[0_18px_48px_rgba(52,44,35,0.12)] backdrop-blur-xl sm:block">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#596047]">места</div>
        <div className="mt-1 font-serif text-3xl font-normal text-[#2b2a27]">6 / 12</div>
      </div>
      <div className="absolute -right-2 bottom-10 hidden rounded-[24px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/82 px-5 py-4 shadow-[0_18px_48px_rgba(52,44,35,0.12)] backdrop-blur-xl sm:block">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#596047]">ожидание</div>
        <div className="mt-1 font-serif text-2xl font-normal text-[#2b2a27]">2 человека</div>
      </div>

      <article className="relative overflow-hidden rounded-[34px] border border-[rgba(43,42,39,0.14)] bg-[#fffdf8]/92 p-6 shadow-[0_30px_90px_rgba(52,44,35,0.16)] sm:p-8">
        <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: "linear-gradient(rgba(43,42,39,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(43,42,39,0.018) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative z-10 grid min-h-[420px] gap-6 sm:grid-cols-[1fr_0.78fr] sm:items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#596047]">приглашение</div>
            <h2 className="mt-5 max-w-[330px] font-serif text-[4.1rem] font-normal leading-[0.94] tracking-[-0.01em] text-[#2b2a27] sm:text-[5.1rem]">
              Завтрак клуба
            </h2>
            <p className="mt-5 max-w-[300px] text-base leading-7 text-[#7c746a]">
              Тёплые люди, вдохновляющий разговор и вкусное утро вместе.
            </p>
            <div className="mt-6 grid gap-3 text-sm font-semibold text-[#2b2a27]">
              <span>24 мая, суббота</span>
              <span>10:00 — 12:30</span>
              <span>Москва, Патрики, 12</span>
            </div>
          </div>

          <div className="relative min-h-[310px] overflow-hidden rounded-[999px_999px_30px_30px] border border-white/70 shadow-[0_20px_48px_rgba(52,44,35,0.18)] sm:min-h-[390px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/event-images/breakfast/28945079a4b89696466660ea791b099a.webp')" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2b2a27]/18 to-transparent" aria-hidden="true" />
          </div>
        </div>

        <div className="relative z-10 mt-5 grid gap-4 rounded-[26px] border border-[rgba(43,42,39,0.10)] bg-[#fffdf8]/76 p-4 sm:grid-cols-[0.85fr_1fr]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#596047]">места</div>
            <div className="mt-1 font-serif text-3xl font-normal text-[#2b2a27]">6 <span className="text-base text-[#7c746a]">из 12</span></div>
            <div className="mt-3 h-1.5 max-w-36 overflow-hidden rounded-full bg-[#e4dccf]">
              <div className="h-full w-1/2 rounded-full bg-[#7e8466]" />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#596047]">гости</div>
            <div className="mt-3 flex -space-x-2">
              {["А", "М", "К", "Л", "+2"].map((item, index) => (
                <span key={item} className={`grid h-10 w-10 place-items-center rounded-full border-2 border-[#fffdf8] text-sm font-bold text-white shadow-sm ${index === 0 ? "bg-[#b88768]" : index === 1 ? "bg-[#7e8466]" : index === 2 ? "bg-[#c59a55]" : index === 3 ? "bg-[#c9baa6]" : "bg-[#efe7da] text-[#7c746a]"}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="h-px bg-[rgba(43,42,39,0.10)]" />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="rounded-[20px] bg-[#7e8466] px-7 py-3.5 text-sm font-semibold text-[#fffdf8] shadow-[0_14px_28px_rgba(89,96,71,0.22)]">
                Я иду
              </button>
              <span className="text-sm font-semibold text-[#596047]">Событие собрано</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function Account({ goHome, onAuthenticated, returnTo }: { goHome: () => void; onAuthenticated: (profile: CabinetUser) => void; returnTo: string }) {
  const [isTelegramAuthLoading, setIsTelegramAuthLoading] = useState(false);
  const [telegramAuthMessage, setTelegramAuthMessage] = useState("");

  async function pollTelegramLogin(token: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const response = await fetch(`/api/auth/telegram-login/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = await safeReadJson<{
        ok: boolean;
        data?: {
          status: "pending" | "confirmed";
          user?: { id: string; name: string; phone?: string | null; telegramUsername?: string | null };
        };
        error?: string;
      }>(response);

      if (!payload.ok) {
        if (response.status === 404 || response.status === 410) clearPendingTelegramLogin();
        throw new Error(payload.error || "Не получилось проверить вход");
      }

      if (payload.data?.status === "confirmed" && payload.data.user) {
        clearPendingTelegramLogin();
        const profile = {
          id: payload.data.user.id,
          name: payload.data.user.name,
          phone: payload.data.user.phone || (payload.data.user.telegramUsername ? `@${payload.data.user.telegramUsername}` : ""),
        };
        onAuthenticated(profile);
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }

    throw new Error("Вход не подтвердился. Нажмите кнопку ещё раз, затем в боте нажмите «Авторизоваться».");
  }

  async function openTelegramAuth() {
    if (isTelegramAuthLoading) return;

    const webApp = getTelegramWebApp();
    if (webApp?.initData) {
      setIsTelegramAuthLoading(true);
      setTelegramAuthMessage("Подтверждаю вход через Telegram...");
      try {
        const response = await fetch("/api/auth/telegram-mini-app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: webApp.initData }),
        });
        const payload = await safeReadJson<{
          ok: boolean;
          data?: { id: string; name: string; phone?: string | null; telegramUsername?: string | null };
          error?: string;
        }>(response);

        if (!payload.ok || !payload.data) throw new Error(payload.error || "Не получилось войти через Telegram");

        onAuthenticated({
          id: payload.data.id,
          name: payload.data.name,
          phone: payload.data.phone || (payload.data.telegramUsername ? `@${payload.data.telegramUsername}` : ""),
        });
      } catch (error) {
        setTelegramAuthMessage(error instanceof Error ? error.message : "Не получилось войти через Telegram");
      } finally {
        setIsTelegramAuthLoading(false);
      }
      return;
    }

    const userAgent = navigator.userAgent || "";
    const shouldOpenInCurrentWindow = /Telegram/i.test(userAgent);
    const pendingWindow = webApp?.openTelegramLink || shouldOpenInCurrentWindow ? null : window.open("", "_blank", "noopener,noreferrer");

    setIsTelegramAuthLoading(true);
    setTelegramAuthMessage("Открываем Telegram. В боте нажмите «Авторизоваться». Если вы вернётесь сюда, вход продолжится автоматически.");

    try {
      const response = await fetch("/api/auth/telegram-login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo }),
      });
      const payload = await safeReadJson<{ ok: boolean; data?: { token: string; botUrl: string }; error?: string }>(response);

      if (!payload.ok || !payload.data) {
        throw new Error(payload.error || "Не получилось начать вход через Telegram");
      }
      savePendingTelegramLogin({
        token: payload.data.token,
        returnTo,
        createdAt: Date.now(),
        source: "account",
      });

      await showTelegramAuthInstruction(
        "Сейчас откроется бот «Собрались». В боте нажмите «Авторизоваться», а потом кнопку «Вернуться в приложение». После возврата кабинет откроется автоматически.",
      );

      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(payload.data.botUrl);
      } else if (shouldOpenInCurrentWindow) {
        window.location.href = payload.data.botUrl;
        return;
      } else if (pendingWindow) {
        pendingWindow.location.href = payload.data.botUrl;
      } else {
        window.location.href = payload.data.botUrl;
      }

      await pollTelegramLogin(payload.data.token);
    } catch (error) {
      setTelegramAuthMessage(error instanceof Error ? error.message : "Не получилось войти через Telegram");
    } finally {
      setIsTelegramAuthLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100svh-96px)] max-w-6xl items-center px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <StepBack onClick={goHome} />
        <Card className="relative overflow-hidden">
          <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[#c59a55]/15 blur-2xl" aria-hidden="true" />
          <div className="relative">
            <BrandLogoApproved caption="личный кабинет" symbolSize={48} />
            <h1 className="mt-8 font-serif text-[2.7rem] font-normal leading-none tracking-[-0.01em] text-[#2b2a27] sm:text-[3.6rem]">
              Войти в Собрались
            </h1>
            <p className="mt-4 text-base leading-7 text-[#7c746a]">
              Telegram подтвердит профиль, а мы откроем кабинет, события и уведомления без лишней регистрации.
            </p>
          </div>

          <button type="button" disabled={isTelegramAuthLoading} onClick={openTelegramAuth} className="relative mt-7 flex w-full items-center justify-center rounded-[22px] bg-[#7e8466] px-5 py-4 text-center font-semibold text-[#fffdf8] shadow-[0_18px_34px_rgba(89,96,71,0.22)] transition hover:-translate-y-0.5 hover:bg-[#596047] disabled:cursor-wait disabled:opacity-70">
          {isTelegramAuthLoading ? "Жду подтверждение в Telegram..." : "Авторизоваться"}
          </button>
          <p className="mt-4 rounded-[20px] border border-[#d8e4ef] bg-[#eaf4ff]/72 px-4 py-3 text-sm font-medium leading-6 text-[#315c82]">
            {telegramAuthMessage || "После нажатия откроется бот «Собрались». В нём нажмите «Авторизоваться» — мы сохраним Telegram ID, имя и username для входа и уведомлений."}
          </p>
          {IS_DEVELOPMENT && (
            <a href="/app?devEvent=1" className="mt-3 flex w-full items-center justify-center rounded-[20px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/80 px-5 py-3.5 text-sm font-semibold text-[#2b2a27] transition hover:-translate-y-0.5 hover:border-[#c59a55]/60 hover:shadow-[0_12px_26px_rgba(52,44,35,0.10)]">
              Открыть локальную demo-карточку
            </a>
          )}
        </Card>
      </div>
    </section>
  );
}

function Dashboard({ events, isLoading, openEvent, deleteEvent, createNew }: { events: EventRecord[]; isLoading: boolean; openEvent: (event: EventRecord) => void; deleteEvent: (id: string) => void; createNew: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="sobralis-surface flex flex-col justify-between gap-5 rounded-[34px] p-5 sm:flex-row sm:items-end sm:p-7">
        <div>
          <span className="sobralis-chip">кабинет организатора</span>
          <h1 className="sobralis-display mt-4 text-[2.8rem] leading-none sm:text-[4rem]">Мои события</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#7c746a] sm:text-base">Здесь живут ваши карточки-приглашения: гости, места, ожидание и ссылка для отправки.</p>
        </div>
        <button onClick={createNew} className="sobralis-button-primary shrink-0">Создать событие</button>
      </div>
      <div className="mt-5 grid gap-4 sm:mt-7">
        {isLoading && <EmptyState title="Загружаю события" text="Сейчас подтяну список из базы." />}
        {!isLoading && events.length === 0 && <EmptyState title="Пока нет событий" text="Создайте первую карточку и отправьте гостям одну красивую ссылку вместо хаоса в чате." action={<button onClick={createNew} className="sobralis-button-primary">Создать событие</button>} />}
        {events.map((event) => (
          <article key={event.id} className="overflow-hidden rounded-[30px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/88 shadow-[0_18px_48px_rgba(52,44,35,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(52,44,35,0.12)]">
            <div className="grid gap-0 sm:grid-cols-[190px_1fr]">
              <EventThumb event={event} />
              <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#596047]">{formatDate(event.date, event.time)}</div>
                  <h2 className="sobralis-display mt-2 text-3xl leading-none sm:text-4xl">{event.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#7c746a] sm:text-base">{event.venue || "Место не указано"} · {event.participants.length}/{event.maxGuests} мест занято</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#e8f8ef] px-3 py-1 text-xs font-semibold text-[#596047]">{event.participants.length >= event.minGuests ? "состав собран" : "нужно гостей"}</span>
                    <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-semibold text-[#8a642b]">{event.waitlist.length} в ожидании</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openEvent(event)} className="sobralis-button-primary min-h-11 px-5 py-2.5 text-sm">Открыть</button>
                  <button onClick={() => deleteEvent(event.id)} className="sobralis-button-secondary min-h-11 px-5 py-2.5 text-sm text-[#d94a38]">Удалить</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function KindPicker({ goBack, chooseKind }: { goBack: () => void; chooseKind: (kind: EventKind) => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
      <StepBack onClick={goBack} />
      <div className="max-w-3xl">
        <span className="sobralis-chip">новое приглашение</span>
        <h1 className="sobralis-display mt-4 text-[2.8rem] leading-none sm:text-[4.2rem]">Что собираем?</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7c746a] sm:text-base">Выберите сценарий, а дальше соберём красивую карточку для гостей: место, время, комментарии и лист ожидания.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 sm:mt-8">
        {eventKinds.map((kind) => (
          <button key={kind.id} onClick={() => chooseKind(kind.id)} className="group relative overflow-hidden rounded-[30px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/86 p-5 text-left shadow-[0_16px_44px_rgba(52,44,35,0.08)] transition hover:-translate-y-1 hover:border-[#c59a55]/55 hover:shadow-[0_24px_60px_rgba(52,44,35,0.12)] sm:p-6">
            <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${kind.accent} opacity-70 blur-xl`} aria-hidden="true" />
            <div className="relative">
              <div className={`mb-5 grid h-12 w-12 place-items-center rounded-[20px] ${kind.accent} text-sm font-bold tracking-[0.18em] text-[#596047] shadow-inner`}>{kind.id === "breakfast" ? "01" : kind.id === "bath" ? "02" : kind.id === "lunch" ? "03" : "+"}</div>
              <h2 className="sobralis-display text-3xl leading-none sm:text-4xl">{kind.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#7c746a] sm:text-base sm:leading-7">{kind.description}</p>
              <div className="mt-5 inline-flex rounded-full bg-[#f5efe6] px-4 py-2 text-sm font-semibold text-[#596047] transition group-hover:bg-[#7e8466] group-hover:text-[#fffdf8]">Выбрать</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

type BuilderProps = {
  selectedKind: { title: string };
  eventKind: EventKind;
  title: string;
  setTitle: (value: string) => void;
  venue: string;
  setVenue: (value: string) => void;
  mapUrl: string;
  setMapUrl: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  time: string;
  setTime: (value: string) => void;
  minGuests: number;
  setMinGuests: (value: number) => void;
  maxGuests: number;
  setMaxGuests: (value: number) => void;
  totalCost: number;
  setTotalCost: (value: number) => void;
  paymentMode: PaymentMode;
  setPaymentMode: (value: PaymentMode) => void;
  bankName: string;
  setBankName: (value: string) => void;
  paymentPhone: string;
  setPaymentPhone: (value: string) => void;
  priceRange: string | null;
  eventImageId: string;
  setEventImageId: (value: string) => void;
  setCustomImagePreview: (value: string) => void;
  setCustomImageKey: (value: string) => void;
  customImagePreview: string;
  imagePositionX: number;
  setImagePositionX: (value: number) => void;
  imagePositionY: number;
  setImagePositionY: (value: number) => void;
  imageScale: number;
  setImageScale: (value: number) => void;
  visual: EventVisual;
  availableVisuals: EventVisual[];
  error: string;
  requiredErrors: Record<"title" | "venue" | "date" | "time" | "maxGuests", boolean>;
  goBack: () => void;
  createEvent: () => void;
};

function Builder(props: BuilderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropFrameRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ pointerId: number; startX: number; startY: number; positionX: number; positionY: number } | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftPositionX, setDraftPositionX] = useState(50);
  const [draftPositionY, setDraftPositionY] = useState(50);
  const [draftScale, setDraftScale] = useState(100);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const selectedVisualOption = toBuilderEventVisualOption(props.visual, props.eventKind, props.customImagePreview);
  const selectedVisualCrop: EventVisualCrop = {
    x: props.imagePositionX,
    y: props.imagePositionY,
    scale: Math.max(props.imageScale / 100, 1),
  };
  const draftVisualOption: EventVisualOption = {
    id: "draft-upload-cover",
    title: "Загруженное фото",
    eyebrow: "локально",
    kind: "upload",
    tone: publicVisualToneByKind[props.eventKind],
    src: draftImagePreview,
  };
  const draftVisualCrop: EventVisualCrop = {
    x: draftPositionX,
    y: draftPositionY,
    scale: Math.max(draftScale / 100, 1),
  };

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError("");
    setDraftImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setDraftImagePreview(String(reader.result || ""));
      setDraftPositionX(50);
      setDraftPositionY(50);
      setDraftScale(100);
    };
    reader.readAsDataURL(file);
  }

  function clampPosition(value: number) {
    return Math.max(0, Math.min(100, value));
  }

  function startCropDrag(event: PointerEvent<HTMLDivElement>) {
    if (!draftImagePreview) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      positionX: draftPositionX,
      positionY: draftPositionY,
    };
  }

  function moveCropDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragStartRef.current;
    const frame = cropFrameRef.current;
    if (!drag || !frame || drag.pointerId !== event.pointerId) return;
    const rect = frame.getBoundingClientRect();
    const nextX = drag.positionX - ((event.clientX - drag.startX) / rect.width) * 100;
    const nextY = drag.positionY - ((event.clientY - drag.startY) / rect.height) * 100;
    setDraftPositionX(clampPosition(nextX));
    setDraftPositionY(clampPosition(nextY));
  }

  function stopCropDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  }

  async function confirmCrop() {
    if (!draftImageFile) return;

    setIsUploadingImage(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", draftImageFile);
      const response = await fetch("/api/uploads/event-image", {
        method: "POST",
        body: formData,
      });
      const payload = await safeReadJson<{ ok: boolean; data?: { url: string; key: string }; error?: string }>(response);

      if (!payload.ok || !payload.data) {
        throw new Error(payload.error || "Не получилось загрузить изображение");
      }

      props.setCustomImagePreview(payload.data.url);
      props.setCustomImageKey(payload.data.key);
      props.setImagePositionX(draftPositionX);
      props.setImagePositionY(draftPositionY);
      props.setImageScale(draftScale);
      setDraftImagePreview("");
      setDraftImageFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не получилось загрузить изображение";
      if (message.includes("S3_") || message.includes("Хранилище") || message.toLowerCase().includes("configured")) {
        props.setCustomImagePreview(draftImagePreview);
        props.setCustomImageKey("");
        props.setImagePositionX(draftPositionX);
        props.setImagePositionY(draftPositionY);
        props.setImageScale(draftScale);
        setDraftImagePreview("");
        setDraftImageFile(null);
        setUploadError("");
        return;
      }

      setUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function cancelCrop() {
    setDraftImagePreview("");
    setDraftImageFile(null);
    setDraftPositionX(50);
    setDraftPositionY(50);
    setDraftScale(100);
    setUploadError("");
  }

  function inputStateClass(hasError: boolean) {
    return hasError ? "border-[#d94a38] bg-[#fff7f5] shadow-[0_0_0_4px_rgba(217,74,56,0.10)]" : "";
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
      <StepBack onClick={props.goBack} />
      <Card className="relative overflow-hidden">
        <div className="absolute -right-28 -top-32 h-72 w-72 rounded-full bg-[#c59a55]/12 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[#7e8466]/10 blur-3xl" aria-hidden="true" />
        <div className="relative mb-6 max-w-2xl">
          <span className="sobralis-chip">{props.selectedKind.title}</span>
          <h1 className="sobralis-display mt-4 text-[2.8rem] leading-none sm:text-[4.2rem]">Создать событие</h1>
          <p className="mt-3 text-sm leading-6 text-[#7c746a] sm:text-base">Заполните только то, что нужно гостю для решения: куда прийти, когда, сколько мест и как присоединиться.</p>
        </div>

        <div className="relative grid gap-4 sm:gap-5">
          <Section title="Название события">
            <Field label="Название *">
              <input className={`input ${inputStateClass(props.requiredErrors.title)}`} value={props.title} onChange={(event) => props.setTitle(event.target.value)} placeholder="Например: Женский завтрак" />
              <RequiredHint show={props.requiredErrors.title} />
            </Field>
          </Section>

          <Section title="Место и время">
            <div className="grid gap-4">
              <Field label="Место проведения *">
                <input className={`input ${inputStateClass(props.requiredErrors.venue)}`} value={props.venue} onChange={(event) => props.setVenue(event.target.value)} />
                <RequiredHint show={props.requiredErrors.venue} />
              </Field>
              <Field label="Ссылка на точку на карте">
                <input className="input" value={props.mapUrl} onChange={(event) => props.setMapUrl(event.target.value)} placeholder="Яндекс.Карты, 2ГИС или Google Maps" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Дата *">
                  <input type="date" className={`input input-compact ${inputStateClass(props.requiredErrors.date)}`} value={props.date} onChange={(event) => props.setDate(event.target.value)} />
                  <RequiredHint show={props.requiredErrors.date} />
                </Field>
                <Field label="Время *">
                  <select className={`input input-compact ${inputStateClass(props.requiredErrors.time)}`} value={props.time} onChange={(event) => props.setTime(event.target.value)}>
                    <option value="">Выберите время</option>
                    {timeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <RequiredHint show={props.requiredErrors.time} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Участники">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Минимум гостей">
                <input type="number" min="1" className="input" value={props.minGuests} onChange={(event) => props.setMinGuests(Number(event.target.value))} />
              </Field>
              <Field label="Максимум гостей *">
                <input type="number" min="1" className={`input ${inputStateClass(props.requiredErrors.maxGuests)}`} value={props.maxGuests} onChange={(event) => props.setMaxGuests(Number(event.target.value))} />
                <RequiredHint show={props.requiredErrors.maxGuests} />
              </Field>
            </div>
          </Section>

          <Section title="Оплата">
            <Field label="Оплата">
              <select className="input" value={props.paymentMode} onChange={(event) => props.setPaymentMode(event.target.value as PaymentMode)}>
                <option value="none">Без оплаты</option>
                <option value="manual">Оплата по реквизитам организатора</option>
              </select>
            </Field>
            {props.paymentMode === "manual" && (
              <div className="mt-4 grid gap-4">
                <Field label="Общая сумма">
                  <input type="number" min="0" className="input" value={props.totalCost} onChange={(event) => props.setTotalCost(Number(event.target.value))} />
                </Field>
              <div className="rounded-[20px] border border-[#cce9d8] bg-[#e8f8ef] px-4 py-3 text-sm font-semibold text-[#426c50]">
                  Примерно на человека: {props.priceRange || "укажите сумму и гостей"}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Банк">
                    <input className="input" value={props.bankName} onChange={(event) => props.setBankName(event.target.value)} placeholder="Например: Т-Банк" />
                  </Field>
                  <Field label="Телефон для перевода">
                    <input className="input" value={props.paymentPhone} onChange={(event) => props.setPaymentPhone(event.target.value)} placeholder="+7..." />
                  </Field>
                </div>
              </div>
            )}
          </Section>

          <Section title="Изображение для карточки события">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => fileInputRef.current?.click()} className="min-h-32 rounded-[26px] border border-dashed border-[#d8cdbf] bg-[#fffdf8]/74 p-4 text-left font-semibold text-[#2b2a27] transition hover:-translate-y-0.5 hover:border-[#7e8466] hover:shadow-[0_14px_32px_rgba(52,44,35,0.08)] sm:min-h-36">
                <span className="block text-sm font-bold uppercase tracking-[0.14em] text-[#596047]">своё фото</span>
                <span className="mt-2 block text-base">Загрузить изображение</span>
              </button>
              {props.availableVisuals.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    props.setEventImageId(item.id);
                    props.setCustomImagePreview("");
                    props.setCustomImageKey("");
                    props.setImagePositionX(55);
                    props.setImagePositionY(48);
                    props.setImageScale(100);
                  }}
                  className={`overflow-hidden rounded-[26px] border bg-[#fffdf8] text-left shadow-[0_10px_26px_rgba(52,44,35,0.06)] transition hover:-translate-y-0.5 ${props.eventImageId === item.id && !props.customImagePreview ? "border-[#7e8466] ring-2 ring-[#c59a55]/30" : "border-[#e7ded2]"}`}
                >
                  <div className="px-3 pt-3">
                    <EventVisualFrame visual={toBuilderEventVisualOption(item, item.kind)} variant="picker" shape="wave" />
                  </div>
                  <div className="p-2.5 text-sm font-semibold">{item.title}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[28px] border border-[#e7ded2] bg-[#fffdf8]/80 p-4 shadow-[0_14px_36px_rgba(52,44,35,0.08)]">
              <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,230px)_minmax(0,1fr)]">
                <EventVisualFrame visual={selectedVisualOption} crop={selectedVisualCrop} variant="tool" shape="wave" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#596047]">как увидят гости</div>
                  <div className="mt-2 text-base font-semibold text-[#2b2a27]">{props.customImagePreview ? "Своё изображение выбрано" : props.visual.title}</div>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#7c746a]">Картинка сразу показана в форме итоговой карточки события.</p>
                  {props.customImagePreview && (
                    <button
                      onClick={() => {
                        props.setCustomImagePreview("");
                        props.setCustomImageKey("");
                        props.setImagePositionX(55);
                        props.setImagePositionY(48);
                        props.setImageScale(100);
                      }}
                      className="sobralis-button-secondary mt-3 min-h-10 px-4 py-2 text-sm text-[#d94a38]"
                    >
                      Убрать
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </div>

        {props.error && <Alert type="error">{props.error}</Alert>}
        <button onClick={props.createEvent} className="sobralis-button-primary mt-6 w-full text-base">
          Создать событие
        </button>
      </Card>
      {draftImagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b2a27]/48 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8] p-4 shadow-[0_28px_100px_rgba(43,42,39,0.24)] sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="sobralis-display text-3xl leading-none text-[#2b2a27] sm:text-4xl">Выберите фрагмент</h2>
                <p className="mt-1 text-sm leading-6 text-[#6f665d]">Двигайте фотографию пальцем или мышкой, чтобы в светлой рамке осталась нужная часть.</p>
              </div>
              <button onClick={cancelCrop} className="sobralis-button-secondary min-h-10 rounded-full px-4 py-2 text-sm">
                Отменить
              </button>
            </div>
            <div
              ref={cropFrameRef}
              onPointerDown={startCropDrag}
              onPointerMove={moveCropDrag}
              onPointerUp={stopCropDrag}
              onPointerCancel={stopCropDrag}
              className="relative mt-4 grid min-h-72 cursor-grab touch-none place-items-center overflow-hidden rounded-[28px] border border-[#e7ded2] bg-[#f5efe6]/70 py-5 active:cursor-grabbing"
            >
              <EventVisualFrame visual={draftVisualOption} crop={draftVisualCrop} variant="tool" shape="wave" />
              <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[#fffdf8]/70 bg-[#fffdf8]/80 px-3 py-2 text-xs font-bold text-[#6f665d] shadow-[0_10px_24px_rgba(52,44,35,0.10)]">
                Тащите фото внутри формы
              </span>
            </div>
            <label className="mt-3 block text-sm font-semibold text-[#6f665d]">
              Масштаб
              <input type="range" min="100" max="220" step="5" value={draftScale} onChange={(event) => setDraftScale(Number(event.target.value))} className="mt-2 w-full accent-[#7e8466]" />
            </label>
            {uploadError && <div className="mt-3 rounded-2xl border border-[#efd0ca] bg-[#fff4f1] px-4 py-3 text-sm font-semibold text-[#d94a38]">{uploadError}</div>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button disabled={isUploadingImage} onClick={cancelCrop} className="sobralis-button-secondary disabled:opacity-60">
                Отменить
              </button>
              <button disabled={isUploadingImage} onClick={confirmCrop} className="sobralis-button-primary disabled:opacity-60">
                {isUploadingImage ? "Загружаю..." : "Готово"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RequiredHint({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="mt-2 text-xs font-semibold text-[#d94a38]">Заполните это поле</div>;
}

function EventPage(props: {
  event: EventRecord;
  visual: EventVisual;
  customImagePreview: string;
  imagePositionX: number;
  imagePositionY: number;
  imageScale: number;
  isOrganizerPreview: boolean;
  needsTelegramAuth: boolean;
  eventAuthLoading: boolean;
  participants: Participant[];
  waitlist: WaitlistEntry[];
  seatsLeft: number;
  isFull: boolean;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  guestName: string;
  setGuestName: (value: string) => void;
  guestComment: string;
  setGuestComment: (value: string) => void;
  guestReservation: GuestReservation | null;
  activeInvitation: WaitlistEntry | null;
  notice: string;
  setNotice: (value: string) => void;
  error: string;
  startTelegramLoginForEvent: (eventId: string) => void;
  joinEvent: () => void;
  acceptPersonalInvitation: () => void;
  cancelParticipant: (participant: Participant) => void;
  exportText: string;
  exportCopied: boolean;
  copyExport: () => void;
  shareCopied: boolean;
  copyShareLink: () => void;
  goDashboard: () => void;
  goEdit: () => void;
}) {
  const joinedAlready = props.guestReservation?.eventId === props.event.id;
  const links = calendarLinks(props.event);
  const mapHref = normalizeExternalUrl(props.event.mapUrl);
  const publicVisual = toPublicEventVisual(props.event, props.visual, props.customImagePreview);
  const publicVisualCrop: EventVisualCrop = {
    x: props.imagePositionX,
    y: props.imagePositionY,
    scale: Math.max(props.imageScale / 100, 1),
  };
  const guestAvatars = props.participants.slice(0, 6).map((participant, index) => ({
    name: participant.name,
    initials: guestInitials(participant.name),
    tone: guestAvatarTones[index % guestAvatarTones.length],
  }));
  const guestsMore = Math.max(props.participants.length - guestAvatars.length, 0);
  const statusLabel = props.participants.length >= Math.max(props.event.minGuests, 1) ? "Событие собрано" : "Собираем гостей";
  const currentGuestStatus = joinedAlready ? props.guestReservation?.status ?? null : null;

  return (
    <section className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto mb-5 flex max-w-6xl flex-col justify-between gap-3 rounded-[28px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/70 p-2 shadow-[0_18px_48px_rgba(52,44,35,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-2.5">
        <button onClick={props.goDashboard} className="inline-flex items-center justify-center rounded-[20px] px-4 py-3 text-sm font-semibold text-[#596047] transition hover:bg-[#f5efe6] hover:text-[#2b2a27] sm:justify-start">
          ← В кабинет
        </button>
        <div className="grid rounded-[22px] border border-[rgba(43,42,39,0.10)] bg-[#f5efe6]/70 p-1 sm:grid-cols-2">
          <button onClick={() => props.setViewMode("guest")} className={`rounded-[17px] px-4 py-2.5 text-sm font-semibold transition ${props.viewMode === "guest" ? "bg-[#7e8466] text-[#fffdf8] shadow-[0_10px_22px_rgba(89,96,71,0.20)]" : "text-[#7c746a] hover:text-[#2b2a27]"}`}>Вид гостя</button>
          <button onClick={() => props.setViewMode("organizer")} className={`rounded-[17px] px-4 py-2.5 text-sm font-semibold transition ${props.viewMode === "organizer" ? "bg-[#7e8466] text-[#fffdf8] shadow-[0_10px_22px_rgba(89,96,71,0.20)]" : "text-[#7c746a] hover:text-[#2b2a27]"}`}>Организатор</button>
        </div>
      </div>

      {props.viewMode === "guest" ? (
        <div className="mx-auto max-w-6xl">
          <PublicEventInvitationCard
            title={props.event.title}
            eventType={publicEventKindLabels[props.event.kind]}
            dateLabel={formatEventDateLabel(props.event.date)}
            timeLabel={formatEventTimeRange(props.event.date, props.event.time)}
            placeLabel={props.event.venue || "Место уточняется"}
            addressLabel={props.event.mapUrl ? "Ссылка на точку есть" : undefined}
            mapHref={mapHref}
            seatsTaken={props.participants.length}
            seatsTotal={props.event.maxGuests}
            seatsLeft={props.seatsLeft}
            waitlistCount={props.waitlist.length}
            guests={guestAvatars}
            guestsMore={guestsMore}
            visual={publicVisual}
            visualCrop={publicVisualCrop}
            statusLabel={statusLabel}
            isFull={props.isFull}
            isOrganizerPreview={props.isOrganizerPreview}
            needsTelegramAuth={props.needsTelegramAuth}
            isEventAuthLoading={props.eventAuthLoading}
            currentGuestStatus={currentGuestStatus}
            activeInvitation={props.activeInvitation}
            guestName={props.guestName}
            guestComment={props.guestComment}
            paymentMode={props.event.paymentMode}
            calendarLinks={links}
            notice={props.notice}
            error={props.error}
            shareCopied={props.shareCopied}
            onGuestNameChange={props.setGuestName}
            onGuestCommentChange={props.setGuestComment}
            onJoin={props.joinEvent}
            onAcceptInvitation={props.acceptPersonalInvitation}
            onStartTelegramLogin={() => props.startTelegramLoginForEvent(props.event.id)}
            onCopyShareLink={props.copyShareLink}
            onOrganizerJoinBlocked={() => props.setNotice("Организатор не может занять место в своём событии. Для проверки откройте ссылку как гость.")}
            onAddDescription={props.goEdit}
          />
        </div>
      ) : (
        <OrganizerView
          event={props.event}
          participants={props.participants}
          waitlist={props.waitlist}
          cancelParticipant={props.cancelParticipant}
          exportText={props.exportText}
          exportCopied={props.exportCopied}
          copyExport={props.copyExport}
          shareCopied={props.shareCopied}
          copyShareLink={props.copyShareLink}
          goEdit={props.goEdit}
          notice={props.notice.startsWith("Готово, место") ? "" : props.notice}
        />
      )}
    </section>
  );
}

function OrganizerView(props: {
  event: EventRecord;
  participants: Participant[];
  waitlist: WaitlistEntry[];
  cancelParticipant: (participant: Participant) => void;
  exportText: string;
  exportCopied: boolean;
  copyExport: () => void;
  shareCopied: boolean;
  copyShareLink: () => void;
  goEdit: () => void;
  notice: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.78fr] sm:gap-6">
      <Card>
        <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-[28px] border border-[rgba(43,42,39,0.12)] bg-[#efe7da] shadow-[0_14px_34px_rgba(52,44,35,0.10)]">
            <EventThumb event={props.event} />
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div>
              <span className="sobralis-chip">организаторский слой</span>
              <h1 className="sobralis-display mt-4 text-[2.6rem] leading-none sm:text-[4rem]">{props.event.title}</h1>
              <p className="mt-3 text-sm leading-6 text-[#7c746a] sm:text-base">{formatDate(props.event.date, props.event.time)} · {props.event.venue || "место не указано"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={props.copyShareLink} className="sobralis-button-primary min-h-11 px-5 py-2.5 text-sm">
                {props.shareCopied ? "Ссылка скопирована" : "Пригласить гостей"}
              </button>
              <button onClick={props.goEdit} className="sobralis-button-secondary min-h-11 px-5 py-2.5 text-sm">Редактировать</button>
            </div>
          </div>
        </div>
        {props.notice && <Alert type="success">{props.notice}</Alert>}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6">
          <Metric label="Мест всего" value={String(props.event.maxGuests)} />
          <Metric label="Участники" value={String(props.participants.length)} />
          <Metric label="Лист ожидания" value={String(props.waitlist.length)} />
        </div>
        <Panel title="Участники">
          {props.participants.length === 0 && <div className="rounded-[22px] border border-dashed border-[#d8cdbf] bg-[#fffdf8]/70 px-4 py-4 text-sm leading-6 text-[#7c746a]">Пока мест никто не занял. Отправьте ссылку гостям — первые участники появятся здесь.</div>}
          {props.participants.map((participant) => (
            <div key={participant.id} className="mb-2 rounded-[22px] border border-[rgba(43,42,39,0.10)] bg-[#fffdf8]/82 px-3.5 py-3 shadow-[0_8px_22px_rgba(52,44,35,0.05)] last:mb-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{participant.name}</div>
                  <div className="truncate text-sm text-[#6f665d]">{participant.comment ? `Комментарий: ${participant.comment}` : "Комментария нет"}</div>
                </div>
                <details className="relative shrink-0">
                  <summary className="list-none rounded-full border border-[#e7ded2] bg-[#fffdf8] px-3 py-1.5 text-lg leading-none marker:hidden">...</summary>
                  <div className="absolute right-0 z-20 mt-2 w-36 rounded-2xl border border-[#e7ded2] bg-[#fffdf8] p-1 shadow-lg">
                    <button onClick={() => props.cancelParticipant(participant)} className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#d94a38] hover:bg-[#fff4f1]">Удалить</button>
                  </div>
                </details>
              </div>
            </div>
          ))}
        </Panel>
      </Card>
      <Card>
        <Panel title="Лист ожидания">
          {props.waitlist.length === 0 && <div className="rounded-[22px] border border-dashed border-[#d8cdbf] bg-[#fffdf8]/70 px-4 py-4 text-sm leading-6 text-[#7c746a]">Лист ожидания пуст. Если места закончатся, новые гости попадут сюда.</div>}
          {props.waitlist.map((entry) => (
            <div key={entry.id} className="mb-2.5 rounded-[22px] border border-[rgba(43,42,39,0.10)] bg-[#fffdf8]/82 p-3.5 shadow-[0_8px_22px_rgba(52,44,35,0.05)] last:mb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{entry.name}</div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.status === "invited" ? "bg-[#ffe7a8] text-[#5f4517]" : "bg-[#fffdf8] text-[#6f665d]"}`}>
                  {entry.status === "invited" ? "приглашена" : "ожидает"}
                </span>
              </div>
              <div className="mt-1 text-sm text-[#6f665d]">{entry.comment || "Комментария нет"}</div>
            </div>
          ))}
        </Panel>
        <Panel title="Комментарии для ресторана или организатора">
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-[24px] border border-[rgba(43,42,39,0.10)] bg-[#f5efe6]/72 p-4 text-sm leading-6 text-[#2b2a27] sm:max-h-72">{props.exportText}</pre>
          <button onClick={props.copyExport} className="sobralis-button-secondary mt-3 w-full text-sm">
            {props.exportCopied ? "Комментарии скопированы" : "Выгрузить комментарии"}
          </button>
        </Panel>
      </Card>
    </div>
  );
}

function EventThumb({ event }: { event: EventRecord }) {
  const visual = getVisual(event.coverImageSource || defaultVisualByKind[event.kind], event.kind);
  const image = event.coverImageUrl || visual.imageSrc;

  return (
    <div
      className={`h-36 bg-gradient-to-br ${visual.tone} bg-cover sm:h-full sm:min-h-36`}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(23,19,15,.04), rgba(23,19,15,.18)), url(${image})`,
        backgroundPosition: `${event.coverImagePositionX}% ${event.coverImagePositionY}%`,
        backgroundSize: event.coverImageScale === 100 ? "cover" : `${event.coverImageScale}%`,
        backgroundRepeat: "no-repeat",
      }}
      aria-label="Обложка события"
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-[#5f564f]">{label}</div>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[rgba(43,42,39,0.10)] bg-[#fffdf8]/76 p-4 shadow-[0_10px_30px_rgba(52,44,35,0.04)] sm:p-5">
      <h2 className="mb-4 text-lg font-semibold text-[#2b2a27] sm:text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[32px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/88 p-4 shadow-[0_24px_70px_rgba(52,44,35,0.11)] backdrop-blur sm:rounded-[38px] sm:p-6 ${className}`}>{children}</div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-lg font-semibold sm:text-xl">{title}</h3>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(43,42,39,0.10)] bg-[#fffdf8]/78 px-3 py-3 shadow-[0_8px_22px_rgba(52,44,35,0.05)]">
      <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#596047] sm:text-xs">{label}</div>
      <div className="sobralis-display mt-1 text-2xl leading-none sm:text-3xl">{value}</div>
    </div>
  );
}

function Alert({ type, children }: { type: "success" | "info" | "error"; children: ReactNode }) {
  const classes = {
    success: "bg-[#e8f8ef] text-emerald-800 border-emerald-100",
    info: "bg-[#eaf4ff] text-sky-800 border-sky-100",
    error: "bg-[#fff4f1] text-[#d94a38] border-[#efd0ca]",
  };
  return <div className={`mt-3 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold ${classes[type]}`}>{children}</div>;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-dashed border-[#d8cdbf] bg-[#fffdf8]/70 p-6 text-center shadow-[0_14px_34px_rgba(52,44,35,0.06)] sm:p-7">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-[#d8cdbf] bg-[#f5efe6]" aria-hidden="true" />
      <h3 className="sobralis-display text-2xl leading-none">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f665d]">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function StepBack({ onClick, label = "Назад" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="mb-4 inline-flex rounded-full px-1 py-2 text-sm font-semibold text-[#596047] transition hover:text-[#2b2a27]">
      ← {label}
    </button>
  );
}
