export type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
};

export type AddOn = {
  id: string;
  title: string;
  price: number;
};

export type BookingMode = "instant" | "request" | "manager";

export type AvailabilityStatus = "available" | "request" | "busy";

export type Place = {
  id: string;
  title: string;
  location: string;
  type: string;
  capacity: number;
  hourlyRate: number;
  minHours: number;
  price: number;
  extraHourRate: number;
  bookingMode: BookingMode;
  pricingTitle: string;
  confirmationTime: string;
  availabilityStatus: AvailabilityStatus;
  perHour: string;
  image: string;
  vibe: string;
  includes: string[];
  addOns: AddOn[];
  onSiteAddOns: AddOn[];
  scenarios: string[];
};
