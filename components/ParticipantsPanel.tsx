/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAddOnTitles, getAddOnsTotal } from "@/lib/addons";
import { money } from "@/lib/pricing";
import type { Participant as EventParticipant, WaitlistParticipant } from "@/types/participant";
import type { EventPricing } from "@/types/payment";
import type { AddOn } from "@/types/place";

type ParticipantsPanelProps = {
  demoParticipants: EventParticipant[];
  activeAddOns: AddOn[];
  pricing: EventPricing;
  joined: boolean;
  paidSelf: boolean;
  selfPaymentStatus: string;
  personalTotal: number;
  selectedAddOnsTotal: number;
  selectedAddOns: string[];
  consents: { marketingOffers: boolean };
  canSeeParticipantAddOns: boolean;
  waitlisted: boolean;
  demoWaitlist: WaitlistParticipant[];
  waitlistInvited: boolean;
};

export default function ParticipantsPanel({ demoParticipants, activeAddOns, pricing, joined, paidSelf, selfPaymentStatus, personalTotal, selectedAddOnsTotal, selectedAddOns, consents, canSeeParticipantAddOns, waitlisted, demoWaitlist, waitlistInvited }: ParticipantsPanelProps) {
  const visibleWaitlist = waitlistInvited ? demoWaitlist.slice(1) : demoWaitlist;
  const invitedFromWaitlist = waitlistInvited ? demoWaitlist[0] : null;
  return <div className="mt-7 rounded-2xl bg-stone-50 p-5"><div className="mb-4 flex items-center justify-between gap-4"><div><h3 className="font-black">Участники</h3><p className="mt-1 text-xs font-semibold text-stone-500">{canSeeParticipantAddOns ? "Вы видите детализацию по допам, потому что вы организатор или представитель места." : "Гости видят только базовое участие и статусы — личные допы скрыты."}</p></div></div>{demoParticipants.map((participant: any) => { const addonsTotal = getAddOnsTotal(participant.addons, activeAddOns); const total = pricing.perPerson + addonsTotal; const addonTitles = getAddOnTitles(participant.addons, activeAddOns); return <Participant key={participant.name} name={participant.name} status={participant.status} paid={participant.paid} details={canSeeParticipantAddOns ? `${money.format(total)} ₽ · база ${money.format(pricing.perPerson)} ₽${addonsTotal ? ` + допы ${money.format(addonsTotal)} ₽` : ""}` : `${participant.paid ? "участие оплачено" : "ожидает оплату"} · база ${money.format(pricing.perPerson)} ₽`} addOnsText={canSeeParticipantAddOns ? (addonTitles.length ? addonTitles.join(", ") : "допы не нужны") : "личные допы скрыты"} />; })}{invitedFromWaitlist && <Participant name={invitedFromWaitlist} status="Приглашена из листа" details="освободилось место · ждём подтверждение" addOnsText="может подтвердить участие" />}{joined && <Participant name="Вы" status={paidSelf ? "Оплата подтверждена" : selfPaymentStatus === "marked" ? "Ждём сверку" : selfPaymentStatus === "rejected" ? "Оплату не нашли" : "Вы присоединились"} paid={paidSelf} details={`${money.format(personalTotal)} ₽ · база ${money.format(pricing.perPerson)} ₽${selectedAddOnsTotal ? ` + допы ${money.format(selectedAddOnsTotal)} ₽` : ""}${consents.marketingOffers ? " · в базе для предложений" : " · только событие"}`} addOnsText={getAddOnTitles(selectedAddOns, activeAddOns).length ? getAddOnTitles(selectedAddOns, activeAddOns).join(", ") : "допы не нужны"} />}{waitlisted && <Participant name="Вы" status="В листе ожидания" details="оплата недоступна до приглашения" addOnsText="ожидаем свободное место" />}{(visibleWaitlist.length > 0 || waitlisted) && <div className="mt-4 rounded-2xl bg-orange-50 p-4"><div className="text-sm font-black text-orange-800">Лист ожидания</div><div className="mt-2 flex flex-wrap gap-2">{visibleWaitlist.map((name: string) => <span key={name} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-800 ring-1 ring-orange-100">{name}</span>)}{waitlisted && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-800 ring-1 ring-orange-100">Вы</span>}</div></div>}</div>;
}

function Participant({ name, status, paid = false, details, addOnsText }: any) {
  const statusClassName = paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";

  return (
    <div className="mb-2 rounded-2xl bg-white px-4 py-3 last:mb-0">
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="block font-bold">{name}</span>
          {details && <span className="mt-1 block text-xs font-semibold text-stone-500">{details}</span>}
        </span>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusClassName}`}>{status}</span>
      </div>
      {addOnsText && <div className="mt-2 inline-flex rounded-full bg-stone-50 px-3 py-1 text-xs font-bold text-stone-600">{addOnsText}</div>}
    </div>
  );
}
