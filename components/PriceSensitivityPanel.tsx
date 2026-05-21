import { calculateEventPricing, money } from "@/lib/pricing";
import type { EventDraft } from "@/types/event";
import type { Place } from "@/types/place";

type PriceSensitivityPanelProps = {
  activePlace: Place;
  event: EventDraft;
  durationHours: number;
  joinedParticipantsCount: number;
};

export default function PriceSensitivityPanel({ activePlace, event, durationHours, joinedParticipantsCount }: PriceSensitivityPanelProps) {
  const guestsLimit = Math.max(Number(event.guests) || 1, 1);
  const minGuests = Math.max(Number(event.minGuests) || 1, 1);
  const variants = Array.from(new Set([minGuests, joinedParticipantsCount, guestsLimit].filter((value) => value > 0 && value <= activePlace.capacity))).sort((a, b) => a - b);
  return <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div><div className="text-xs font-black uppercase tracking-wide text-stone-500">Цена зависит от состава</div><h3 className="mt-1 text-xl font-black">Чем больше участников, тем ниже базовая сумма</h3><p className="mt-1 text-sm leading-6 text-stone-600">Это помогает организатору честно показать: если людей будет меньше, участие может стать дороже.</p></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{variants.map((guests) => { const variant = calculateEventPricing(activePlace, guests, durationHours, event.targetBudget); return <div key={guests} className={`rounded-2xl px-4 py-3 text-sm font-bold ${guests === joinedParticipantsCount ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "bg-stone-50 text-stone-700"}`}><div>{guests} участников</div><div className="mt-1 text-lg font-black">≈ {money.format(variant.perPerson)} ₽/чел.</div>{guests === minGuests && <div className="mt-1 text-xs opacity-75">минимум для события</div>}{guests === guestsLimit && <div className="mt-1 text-xs opacity-75">если заполнить все места</div>}</div>; })}</div></div>;
}
