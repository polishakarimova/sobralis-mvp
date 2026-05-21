import { money } from "@/lib/pricing";
import type { EventDraft } from "@/types/event";
import type { EventPricing } from "@/types/payment";
import type { Place } from "@/types/place";

type GuestSummaryPanelProps = {
  activePlace: Place;
  event: EventDraft;
  pricing: EventPricing;
  seatsLeft: number;
  isFull: boolean;
  paymentsOpen: boolean;
};

export default function GuestSummaryPanel({ activePlace, event, pricing, seatsLeft, isFull, paymentsOpen }: GuestSummaryPanelProps) {
  return <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="text-xs font-black uppercase tracking-wide text-stone-500">Коротко для гостя</div><h3 className="mt-1 text-xl font-black">{activePlace.title}</h3><p className="mt-1 text-sm leading-6 text-stone-600">{event.date} · {event.startTime}-{event.endTime}. Базовое участие ≈ <b>{money.format(pricing.perPerson)} ₽</b>. Личные допы можно добавить отдельно.</p></div><div className={`rounded-2xl px-4 py-3 text-sm font-black ${isFull ? "bg-orange-50 text-orange-800" : "bg-emerald-50 text-emerald-800"}`}>{isFull ? "мест нет · лист ожидания" : `свободно мест: ${seatsLeft}`}<br />{paymentsOpen ? "оплата открыта" : "пока сбор интереса"}</div></div></div>;
}
