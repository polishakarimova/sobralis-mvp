import { money } from "@/lib/pricing";
import type { EventDraft, OwnerReply } from "@/types/event";
import type { EventPricing } from "@/types/payment";
import type { Place } from "@/types/place";

type TelegramRequestDemoProps = {
  place: Place;
  event: EventDraft;
  pricing: EventPricing;
  ownerReply: OwnerReply | null;
  setOwnerReply: (reply: OwnerReply) => void;
};

export default function TelegramRequestDemo({ place, event, pricing, ownerReply, setOwnerReply }: TelegramRequestDemoProps) {
  return <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="text-xs font-black uppercase tracking-wide text-sky-700">Telegram-подтверждение владельца</div><h3 className="mt-1 text-lg font-black text-stone-950">Заявка уйдёт владельцу в бот</h3><p className="mt-1 text-sm leading-6 text-stone-600">Это позволяет стартовать без сложной админки: владелец получает понятную заявку и отвечает одной кнопкой.</p></div><div className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-800 ring-1 ring-sky-100">без личного кабинета</div></div><div className="mt-4 rounded-2xl bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-sm font-black text-white">TG</div><div><div className="font-black">Бот “Собрались”</div><div className="text-xs text-stone-500">сообщение владельцу места</div></div></div><div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700"><b>Новая заявка на бронь</b><br />Место: {place.title}<br />Дата: {event.date}<br />Время: {event.startTime}-{event.endTime}<br />Гостей: {event.guests}<br />Формат: {event.title}<br />Сумма места: {money.format(pricing.placeTotal)} ₽</div><div className="mt-3 grid gap-2 sm:grid-cols-3"><button onClick={() => setOwnerReply("confirmed")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Свободно</button><button onClick={() => setOwnerReply("busy")} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white">Занято</button><button onClick={() => setOwnerReply("another")} className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-black text-white">Другое время</button></div></div>{ownerReply && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${ownerReply === "confirmed" ? "bg-emerald-100 text-emerald-800" : ownerReply === "busy" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{ownerReply === "confirmed" && "Владелец подтвердил: слот можно закрепить и открыть оплату."}{ownerReply === "busy" && "Владелец ответил: занято. Сервис предложит похожие места."}{ownerReply === "another" && "Владелец предложил другое время. Это можно показать пользователю как альтернативный слот."}</div>}</div>;
}
