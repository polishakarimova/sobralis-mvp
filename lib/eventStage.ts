import type { EventStage } from "@/types/event";

type EventStageInput = {
  slotDeclined: boolean;
  baseBookingConfirmed: boolean;
  minGuestsReached: boolean;
  compositionFixed: boolean;
  paymentsOpen: boolean;
  confirmedParticipantsCount: number;
  joinedParticipantsCount: number;
};

export function getEventStage({ slotDeclined, baseBookingConfirmed, minGuestsReached, compositionFixed, paymentsOpen, confirmedParticipantsCount, joinedParticipantsCount }: EventStageInput): EventStage {
  if (slotDeclined) return { title: "слот занят", description: "Нужно выбрать другое время или место.", className: "bg-rose-50 text-rose-800" };
  if (!baseBookingConfirmed) return { title: "ждём подтверждение места", description: "Слот ещё не финальный, оплату открывать нельзя.", className: "bg-amber-50 text-amber-800" };
  if (!minGuestsReached) return { title: "собираем интерес", description: "Нужно добрать минимум участников, чтобы событие точно состоялось.", className: "bg-orange-50 text-orange-800" };
  if (!compositionFixed) return { title: "готово к фиксации", description: "Минимум собран. Организатор может зафиксировать состав и открыть оплату.", className: "bg-violet-50 text-violet-800" };
  if (!paymentsOpen) return { title: "состав зафиксирован", description: "Осталось открыть оплату участникам.", className: "bg-violet-50 text-violet-800" };
  if (confirmedParticipantsCount < joinedParticipantsCount) return { title: "идёт оплата", description: "Участники оплачивают свои места и личные допы.", className: "bg-emerald-50 text-emerald-800" };
  return { title: "событие подтверждено", description: "Все участники оплатили, можно готовиться к встрече.", className: "bg-emerald-50 text-emerald-800" };
}
