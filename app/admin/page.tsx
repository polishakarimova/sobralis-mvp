"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { BrandLogoApproved } from "@/components/brand/BrandLogoApproved";

type AdminTab = "users" | "events" | "reservations" | "broadcasts";
type BroadcastTarget = "all_users" | "organizers" | "participants";

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type AdminUser = {
  id: string;
  name: string;
  role: string;
  telegramId: string | null;
  telegramUsername: string | null;
  createdAt: string;
  _count: {
    organizedEvents: number;
    participants: number;
    waitlistEntries: number;
  };
};

type AdminEvent = {
  id: string;
  title: string;
  kind: string;
  date: string;
  startTime: string;
  guestsLimit: number;
  status: string;
  shareSlug: string;
  coverImageUrl: string | null;
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    telegramUsername: string | null;
  } | null;
  place: {
    id: string;
    title: string;
    location: string;
    type: string;
  };
  _count: {
    participants: number;
    waitlistEntries: number;
    charges: number;
    bookingRequests: number;
  };
};

type AdminParticipant = {
  id: string;
  name: string;
  status: string;
  paymentStatus: string;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; telegramUsername: string | null } | null;
  event: { id: string; title: string; date: string; startTime: string };
  charges: Array<{ id: string; totalAmount: number; status: string }>;
};

type AdminWaitlistEntry = {
  id: string;
  name: string;
  status: string;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string; telegramUsername: string | null } | null;
  event: { id: string; title: string; date: string; startTime: string };
};

type AdminBookingRequest = {
  id: string;
  status: string;
  ownerReply: string | null;
  createdAt: string;
  event: { id: string; title: string; date: string; startTime: string };
  place: { id: string; title: string };
};

type ReservationData = {
  participants: AdminParticipant[];
  waitlistEntries: AdminWaitlistEntry[];
  bookingRequests: AdminBookingRequest[];
};

type Broadcast = {
  id: string;
  title: string;
  message: string;
  target: BroadcastTarget;
  status: string;
  createdAt: string;
  sentAt: string | null;
};

const tabs: Array<{ id: AdminTab; title: string; description: string }> = [
  { id: "users", title: "Пользователи", description: "Telegram-профили и роли" },
  { id: "events", title: "События", description: "Карточки, статусы и места" },
  { id: "reservations", title: "Брони", description: "Участники и ожидание" },
  { id: "broadcasts", title: "Рассылки", description: "Черновики уведомлений" },
];

const targetLabels: Record<BroadcastTarget, string> = {
  all_users: "Все пользователи",
  organizers: "Организаторы",
  participants: "Участники",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function adminRequest<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiResponse<T>) : ({ ok: false, error: "Сервер вернул пустой ответ" } as ApiResponse<T>);
  if (!payload.ok || !payload.data) throw new Error(payload.error || "Не получилось получить данные");
  return payload.data;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [reservations, setReservations] = useState<ReservationData>({
    participants: [],
    waitlistEntries: [],
    bookingRequests: [],
  });
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget>("all_users");
  const [simulateSend, setSimulateSend] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(
    () => [
      { label: "Пользователи", value: users.length },
      { label: "События", value: events.length },
      { label: "Участники", value: reservations.participants.length },
      { label: "Ожидание", value: reservations.waitlistEntries.length },
    ],
    [events.length, reservations.participants.length, reservations.waitlistEntries.length, users.length],
  );

  const loadAdminData = useCallback(async (activeToken: string) => {
    if (!activeToken) return;
    setIsLoading(true);
    setError("");
    try {
      const [nextUsers, nextEvents, nextReservations, nextBroadcasts] = await Promise.all([
        adminRequest<AdminUser[]>("/api/admin/users", activeToken),
        adminRequest<AdminEvent[]>("/api/admin/events", activeToken),
        adminRequest<ReservationData>("/api/admin/reservations", activeToken),
        adminRequest<Broadcast[]>("/api/admin/broadcasts", activeToken),
      ]);
      setUsers(nextUsers);
      setEvents(nextEvents);
      setReservations(nextReservations);
      setBroadcasts(nextBroadcasts);
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Не получилось открыть админку");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get("token") || "";
      const savedToken = localStorage.getItem("sobralis:admin-token") || "";
      const nextToken = tokenFromUrl || savedToken;

      if (tokenFromUrl) {
        localStorage.setItem("sobralis:admin-token", tokenFromUrl);
        window.history.replaceState(null, "", "/admin");
      }

      setToken(nextToken);
      setTokenInput(nextToken);
      if (nextToken) void loadAdminData(nextToken);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdminData]);

  function saveToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) return;
    localStorage.setItem("sobralis:admin-token", cleanToken);
    setToken(cleanToken);
    setNotice("Токен сохранён. Загружаю служебные данные.");
    void loadAdminData(cleanToken);
  }

  function clearToken() {
    localStorage.removeItem("sobralis:admin-token");
    setToken("");
    setTokenInput("");
    setUsers([]);
    setEvents([]);
    setReservations({ participants: [], waitlistEntries: [], bookingRequests: [] });
    setBroadcasts([]);
  }

  async function createBroadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError("");
    try {
      const broadcast = await adminRequest<Broadcast>("/api/admin/broadcasts", token, {
        method: "POST",
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          target: broadcastTarget,
          simulateSend,
        }),
      });
      setBroadcasts((current) => [broadcast, ...current]);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setNotice(simulateSend ? "Рассылка сохранена как симуляция. Реальные Telegram-сообщения не отправлялись." : "Черновик рассылки сохранён.");
    } catch (broadcastError) {
      setError(broadcastError instanceof Error ? broadcastError.message : "Не получилось сохранить рассылку");
    }
  }

  async function deleteBroadcast(id: string) {
    if (!token || !window.confirm("Удалить эту рассылку?")) return;
    try {
      await adminRequest<{ deleted: true }>(`/api/admin/broadcasts/${id}`, token, { method: "DELETE" });
      setBroadcasts((current) => current.filter((broadcast) => broadcast.id !== id));
      setNotice("Рассылка удалена.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Не получилось удалить рассылку");
    }
  }

  return (
    <main className="sobralis-page px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="sobralis-surface mb-6 rounded-[34px] p-5 md:flex md:items-end md:justify-between md:gap-6 md:p-7">
          <div>
            <Link href="/" className="inline-flex rounded-[24px] transition hover:opacity-80" aria-label="На сайт Собрались">
              <BrandLogoApproved caption="служебный слой" symbolSize={46} compact />
            </Link>
            <h1 className="sobralis-display mt-6 text-[2.7rem] leading-none sm:text-[4rem]">Админка</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7c746a] sm:text-base">
              Служебный экран для проверки базы: пользователи, события, участники, лист ожидания и тестовые рассылки.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 md:mt-0">
            <button type="button" onClick={() => void loadAdminData(token)} disabled={!token || isLoading} className="sobralis-button-secondary text-sm disabled:cursor-not-allowed disabled:opacity-50">
              {isLoading ? "Обновляю..." : "Обновить"}
            </button>
            <button type="button" onClick={clearToken} className="sobralis-button-primary text-sm">
              Выйти
            </button>
          </div>
        </header>

        {!token && (
          <AdminCard>
            <h2 className="sobralis-display text-3xl leading-none">Вход по ADMIN_TOKEN</h2>
            <p className="mt-3 text-sm leading-6 text-[#7c746a]">
              Откройте страницу как <span className="font-semibold text-[#2b2a27]">/admin?token=ADMIN_TOKEN</span> или вставьте токен здесь.
            </p>
            <form onSubmit={saveToken} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
              <input value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} className="input" placeholder="ADMIN_TOKEN" type="password" />
              <button className="sobralis-button-primary">Открыть</button>
            </form>
          </AdminCard>
        )}

        {token && (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((item) => (
                <AdminMetric key={item.label} label={item.label} value={item.value} />
              ))}
            </div>

            <nav className="mb-5 grid gap-2 md:grid-cols-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-[26px] border p-4 text-left transition hover:-translate-y-0.5 ${
                    activeTab === tab.id
                      ? "border-[#7e8466] bg-[#7e8466] text-[#fffdf8] shadow-[0_16px_36px_rgba(89,96,71,0.18)]"
                      : "border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/76 text-[#2b2a27] hover:border-[#c59a55]/60"
                  }`}
                >
                  <span className="block text-sm font-bold">{tab.title}</span>
                  <span className={`mt-1 block text-xs ${activeTab === tab.id ? "text-[#fffdf8]/72" : "text-[#7c746a]"}`}>{tab.description}</span>
                </button>
              ))}
            </nav>

            {notice && <Notice type="success" text={notice} onClose={() => setNotice("")} />}
            {error && <Notice type="error" text={error} onClose={() => setError("")} />}

            {activeTab === "users" && <UsersPanel users={users} />}
            {activeTab === "events" && <EventsPanel events={events} />}
            {activeTab === "reservations" && <ReservationsPanel data={reservations} />}
            {activeTab === "broadcasts" && (
              <BroadcastsPanel
                broadcasts={broadcasts}
                broadcastTitle={broadcastTitle}
                broadcastMessage={broadcastMessage}
                broadcastTarget={broadcastTarget}
                simulateSend={simulateSend}
                setBroadcastTitle={setBroadcastTitle}
                setBroadcastMessage={setBroadcastMessage}
                setBroadcastTarget={setBroadcastTarget}
                setSimulateSend={setSimulateSend}
                createBroadcast={createBroadcast}
                deleteBroadcast={deleteBroadcast}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function AdminCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[32px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/86 p-5 shadow-[0_18px_48px_rgba(52,44,35,0.08)] backdrop-blur-xl ${className}`}>{children}</section>;
}

function Notice({ type, text, onClose }: { type: "success" | "error"; text: string; onClose: () => void }) {
  return (
    <div className={`mb-5 flex items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-sm font-semibold ${type === "success" ? "border-[#cce9d8] bg-[#e8f8ef] text-[#426c50]" : "border-[#efd0ca] bg-[#fff4f1] text-[#d94a38]"}`}>
      <span>{text}</span>
      <button type="button" onClick={onClose} className="rounded-full bg-[#fffdf8]/80 px-3 py-1 text-xs">
        Закрыть
      </button>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#d8cdbf] bg-[#fffdf8]/70 p-6 text-center">
      <div className="mx-auto h-10 w-10 rounded-full border border-[#d8cdbf] bg-[#f5efe6]" aria-hidden="true" />
      <h3 className="sobralis-display mt-3 text-2xl leading-none">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#7c746a]">{text}</p>
    </div>
  );
}

function AdminMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[28px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/82 p-4 shadow-[0_12px_30px_rgba(52,44,35,0.06)]">
      <div className="text-xs font-bold uppercase tracking-[0.13em] text-[#596047]">{label}</div>
      <div className="sobralis-display mt-2 text-4xl leading-none">{value}</div>
    </div>
  );
}

function UsersPanel({ users }: { users: AdminUser[] }) {
  if (!users.length) return <EmptyState title="Пользователей пока нет" text="После первого Telegram-входа профили появятся здесь." />;

  return (
    <AdminCard className="grid gap-3">
      {users.map((user) => (
        <article key={user.id} className="grid gap-3 rounded-[24px] border border-[rgba(43,42,39,0.10)] bg-[#fffdf8]/74 p-4 md:grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr] md:items-center">
          <div>
            <div className="font-bold">{user.name}</div>
            <div className="mt-1 text-xs text-[#7c746a]">{user.telegramUsername ? `@${user.telegramUsername}` : "Telegram username не указан"}</div>
          </div>
          <div className="text-sm text-[#7c746a]">
            <span className="font-semibold text-[#2b2a27]">{user.role}</span>
            <br />
            {user.telegramId ? "Telegram привязан" : "Telegram не привязан"}
          </div>
          <div className="text-sm text-[#7c746a]">
            {user._count.organizedEvents} событий
            <br />
            {user._count.participants} участий
          </div>
          <div className="text-sm text-[#7c746a]">{formatDate(user.createdAt)}</div>
        </article>
      ))}
    </AdminCard>
  );
}

function EventsPanel({ events }: { events: AdminEvent[] }) {
  if (!events.length) return <EmptyState title="Событий пока нет" text="Когда организатор создаст событие, оно появится в этом списке." />;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {events.map((event) => (
        <article key={event.id} className="overflow-hidden rounded-[32px] border border-[rgba(43,42,39,0.12)] bg-[#fffdf8]/86 shadow-[0_18px_48px_rgba(52,44,35,0.08)]">
          {event.coverImageUrl && <div aria-hidden="true" className="h-40 w-full bg-cover bg-center" style={{ backgroundImage: `url("${event.coverImageUrl}")` }} />}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e8f8ef] px-3 py-1 text-xs font-bold text-[#596047]">{event.status}</span>
              <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-bold text-[#8a642b]">{event.kind}</span>
            </div>
            <h2 className="sobralis-display mt-4 text-4xl leading-none">{event.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#7c746a]">
              {formatDate(event.date)}, {event.startTime} · {event.place.title}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
              <SmallMetric value={event.guestsLimit} label="мест" />
              <SmallMetric value={event._count.participants} label="участников" />
              <SmallMetric value={event._count.waitlistEntries} label="ожидание" />
            </div>
            <p className="mt-4 text-xs leading-5 text-[#7c746a]">
              Организатор: {event.organizer ? event.organizer.name : "не указан"} · slug: {event.shareSlug}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function SmallMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[20px] bg-[#f5efe6]/80 px-3 py-2">
      <b>{value}</b>
      <span className="block text-xs text-[#7c746a]">{label}</span>
    </div>
  );
}

function ReservationsPanel({ data }: { data: ReservationData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <ReservationList
        title="Участники"
        empty="Пока никто не занял место."
        items={data.participants.map((participant) => ({
          id: participant.id,
          title: participant.name,
          subtitle: `${participant.event.title} · ${participant.status} · ${participant.paymentStatus}`,
          detail: participant.comment || "без комментария",
        }))}
      />
      <ReservationList
        title="Лист ожидания"
        empty="Лист ожидания пока пуст."
        items={data.waitlistEntries.map((entry) => ({
          id: entry.id,
          title: entry.name,
          subtitle: `${entry.event.title} · ${entry.status}`,
          detail: entry.comment || "без комментария",
        }))}
      />
      <ReservationList
        title="Заявки владельцам"
        empty="Заявок на подтверждение пока нет."
        items={data.bookingRequests.map((request) => ({
          id: request.id,
          title: request.event.title,
          subtitle: `${request.place.title} · ${request.status}`,
          detail: request.ownerReply || "ответ не указан",
        }))}
      />
    </div>
  );
}

function ReservationList({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; title: string; subtitle: string; detail: string }> }) {
  return (
    <AdminCard>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="rounded-[22px] border border-[rgba(43,42,39,0.08)] bg-[#f5efe6]/70 p-3">
              <div className="font-semibold">{item.title}</div>
              <div className="mt-1 text-xs text-[#7c746a]">{item.subtitle}</div>
              <div className="mt-2 rounded-[16px] bg-[#fffdf8]/76 px-3 py-2 text-xs text-[#7c746a]">{item.detail}</div>
            </article>
          ))
        ) : (
          <p className="rounded-[22px] bg-[#f5efe6]/70 p-4 text-sm text-[#7c746a]">{empty}</p>
        )}
      </div>
    </AdminCard>
  );
}

function BroadcastsPanel({
  broadcasts,
  broadcastTitle,
  broadcastMessage,
  broadcastTarget,
  simulateSend,
  setBroadcastTitle,
  setBroadcastMessage,
  setBroadcastTarget,
  setSimulateSend,
  createBroadcast,
  deleteBroadcast,
}: {
  broadcasts: Broadcast[];
  broadcastTitle: string;
  broadcastMessage: string;
  broadcastTarget: BroadcastTarget;
  simulateSend: boolean;
  setBroadcastTitle: (value: string) => void;
  setBroadcastMessage: (value: string) => void;
  setBroadcastTarget: (value: BroadcastTarget) => void;
  setSimulateSend: (value: boolean) => void;
  createBroadcast: (event: FormEvent<HTMLFormElement>) => void;
  deleteBroadcast: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <AdminCard>
        <form onSubmit={createBroadcast}>
          <h2 className="text-lg font-semibold">Новая рассылка</h2>
          <p className="mt-2 text-sm leading-6 text-[#7c746a]">Пока это безопасная симуляция: реальные Telegram-сообщения не отправляются.</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Название
              <input value={broadcastTitle} onChange={(event) => setBroadcastTitle(event.target.value)} className="input" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Текст
              <textarea value={broadcastMessage} onChange={(event) => setBroadcastMessage(event.target.value)} className="input min-h-32" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Получатели
              <select value={broadcastTarget} onChange={(event) => setBroadcastTarget(event.target.value as BroadcastTarget)} className="input">
                {Object.entries(targetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-[22px] bg-[#f5efe6]/72 p-3 text-sm font-semibold">
              <input type="checkbox" checked={simulateSend} onChange={(event) => setSimulateSend(event.target.checked)} className="h-4 w-4 accent-[#7e8466]" />
              Сохранить как симуляцию отправки
            </label>
            <button className="sobralis-button-primary w-full">Сохранить рассылку</button>
          </div>
        </form>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold">История рассылок</h2>
        <div className="mt-4 grid gap-3">
          {broadcasts.length ? (
            broadcasts.map((broadcast) => (
              <article key={broadcast.id} className="rounded-[24px] border border-[rgba(43,42,39,0.08)] bg-[#f5efe6]/72 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{broadcast.title}</div>
                    <div className="mt-1 text-xs text-[#7c746a]">
                      {targetLabels[broadcast.target]} · {broadcast.status} · {formatDate(broadcast.createdAt)}
                    </div>
                  </div>
                  <button type="button" onClick={() => deleteBroadcast(broadcast.id)} className="rounded-full bg-[#fffdf8]/86 px-3 py-1 text-xs font-semibold text-[#d94a38]">
                    Удалить
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#7c746a]">{broadcast.message}</p>
              </article>
            ))
          ) : (
            <p className="rounded-[22px] bg-[#f5efe6]/70 p-4 text-sm text-[#7c746a]">Рассылок пока нет.</p>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
