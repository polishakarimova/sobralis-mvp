import type { EventDraft, EventStage } from "@/types/event";

type EventLifecyclePanelProps = {
  eventStage: EventStage;
  event: EventDraft;
  minGuestsReached: boolean;
  compositionFixed: boolean;
  paymentsOpen: boolean;
};

export default function EventLifecyclePanel({ eventStage, event, minGuestsReached, compositionFixed, paymentsOpen }: EventLifecyclePanelProps) {
  const steps = [{ title: "Сбор интереса", done: minGuestsReached, detail: `минимум ${event.minGuests} участников` }, { title: "Фиксация состава", done: compositionFixed, detail: `набор до ${event.joinDeadline}` }, { title: "Открытие оплаты", done: paymentsOpen, detail: `оплатить до ${event.paymentDeadline}` }, { title: "Подтверждение события", done: eventStage.title === "событие подтверждено", detail: "после оплат" }];
  return <div className={`mt-5 rounded-2xl p-5 ${eventStage.className}`}><div><div className="text-xs font-black uppercase tracking-wide opacity-80">Жизненный цикл события</div><h3 className="mt-1 text-xl font-black">Сейчас: {eventStage.title}</h3><p className="mt-1 text-sm leading-6 opacity-90">{eventStage.description}</p></div><div className="mt-4 grid gap-2 md:grid-cols-4">{steps.map((step, index) => <div key={step.title} className={`rounded-2xl bg-white/75 px-3 py-3 text-sm font-bold ${step.done ? "ring-1 ring-emerald-200" : "opacity-80"}`}><div className="text-xs opacity-70">Шаг {index + 1}</div><div>{step.done ? "✓ " : "○ "}{step.title}</div><div className="mt-1 text-xs font-semibold opacity-70">{step.detail}</div></div>)}</div></div>;
}
