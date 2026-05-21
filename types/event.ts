import type { AvailabilityStatus } from "./place";

export type ViewerRole = "guest" | "organizer" | "owner";

export type OwnerReply = "confirmed" | "busy" | "another";

export type EventDraft = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number | string;
  targetBudget: number | string;
  extras: string[];
  organizer: string;
  minGuests: number | string;
  joinDeadline: string;
  paymentDeadline: string;
  paymentMode: string;
  dateFlex?: "exact" | "weekend" | "month" | "help" | string;
};

export type BookingStepStatus = "done" | "active" | "wait" | "blocked";

export type BookingStep = {
  title: string;
  status: BookingStepStatus;
};

export type EventStage = {
  title: string;
  description: string;
  className: string;
};

export type AvailabilityLabels = Record<AvailabilityStatus, { title: string; className: string }>;
