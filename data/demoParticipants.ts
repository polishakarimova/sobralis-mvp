import type { Participant, WaitlistParticipant } from "@/types/participant";

export const demoParticipants: Participant[] = [
  { name: "Аня", status: "Оплатила", paid: true, addons: ["tea"] },
  { name: "Марина", status: "Оплатила", paid: true, addons: ["parmaster", "tea"] },
  { name: "Катя", status: "Ждём оплату", paid: false, addons: ["photo"] },
  { name: "Оля", status: "Оплатила", paid: true, addons: [] },
  { name: "Лена", status: "Ждём оплату", paid: false, addons: ["tea", "transfer"] },
];

export const demoWaitlist: WaitlistParticipant[] = ["Ника", "Саша"];
