import type { AvailabilityLabels, BookingStep } from "@/types/event";
import type { AvailabilityStatus, BookingMode, Place } from "@/types/place";
import type { EventDraft } from "@/types/event";

export const bookingModeLabels: Record<BookingMode, string> = {
  instant: "Мгновенная бронь",
  request: "Подтверждение владельцем",
  manager: "Подтвердим через менеджера",
};

export const availabilityLabels: AvailabilityLabels = {
  available: { title: "Свободно", className: "bg-emerald-50 text-emerald-800" },
  request: { title: "Нужно подтвердить", className: "bg-amber-50 text-amber-800" },
  busy: { title: "Занято", className: "bg-rose-50 text-rose-800" },
};

export const bookingStepsByAvailability: Record<AvailabilityStatus, BookingStep[]> = {
  available: [
    { title: "Слот выбран", status: "done" },
    { title: "Можно бронировать", status: "done" },
    { title: "Ожидаем оплату", status: "active" },
    { title: "Бронь подтвердится после оплаты", status: "wait" },
  ],
  request: [
    { title: "Заявка создана", status: "done" },
    { title: "Проверяем доступность", status: "active" },
    { title: "Ждём ответ владельца", status: "wait" },
    { title: "Закрепим слот после подтверждения", status: "wait" },
  ],
  busy: [
    { title: "Слот выбран", status: "done" },
    { title: "Время занято", status: "blocked" },
    { title: "Нужно выбрать другое время", status: "wait" },
    { title: "Или посмотреть похожие места", status: "wait" },
  ],
};

export function getAvailability(place: Place, event: EventDraft): AvailabilityStatus {
  if (place.id === "city-complex" && event.date === "2026-06-14" && event.startTime >= "18:00") {
    return "busy";
  }
  return place.availabilityStatus || "request";
}
