export type PaymentStatus = "idle" | "marked" | "confirmed" | "rejected";

export type EventPricing = {
  durationHours: number;
  billableHours: number;
  extraHours: number;
  placeTotal: number;
  perPerson: number;
  target: number;
  fitsBudget: boolean;
  difference: number;
};
