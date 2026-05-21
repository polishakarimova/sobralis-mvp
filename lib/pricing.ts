import type { EventPricing } from "@/types/payment";
import type { Place } from "@/types/place";

export const money = new Intl.NumberFormat("ru-RU");

export function calculateEventPricing(place: Place, guests: number | string, durationHours: number, targetBudget: number | string): EventPricing {
  const normalizedGuests = Math.max(Number(guests) || 1, 1);
  const minHours = place.minHours || 1;
  const billableHours = Math.max(durationHours, minHours);
  const baseHoursCost = (place.hourlyRate || 0) * minHours;
  const extraHours = Math.max(billableHours - minHours, 0);
  const extraCost = Math.ceil(extraHours * (place.extraHourRate || place.hourlyRate || 0));
  const placeTotal = Math.ceil(baseHoursCost + extraCost);
  const perPerson = Math.ceil(placeTotal / normalizedGuests);
  const target = Number(targetBudget) || 0;

  return {
    durationHours,
    billableHours,
    extraHours,
    placeTotal,
    perPerson,
    target,
    fitsBudget: !target || perPerson <= target,
    difference: target ? Math.abs(perPerson - target) : 0,
  };
}
