/* eslint-disable @typescript-eslint/no-explicit-any */
export default function BookingTracker({ steps }: any) {
  return <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-stone-200"><div className="mb-3 font-black">Статус бронирования</div><div className="grid gap-2 md:grid-cols-4">{steps.map((step: any, index: number) => <div key={step.title} className={`rounded-2xl px-3 py-3 text-sm font-bold ${step.status === "done" ? "bg-emerald-50 text-emerald-800" : step.status === "active" ? "bg-amber-50 text-amber-800" : step.status === "blocked" ? "bg-rose-50 text-rose-800" : "bg-stone-50 text-stone-500"}`}><div className="text-xs opacity-70">Шаг {index + 1}</div><div>{step.title}</div></div>)}</div></div>;
}
