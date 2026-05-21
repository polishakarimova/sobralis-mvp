"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";

import Header from "@/components/Header";
import PlaceCard from "@/components/PlaceCard";
import Field from "@/components/Field";
import InfoCard from "@/components/InfoCard";
import AlternativesPanel from "@/components/AlternativesPanel";
import GuestSummaryPanel from "@/components/GuestSummaryPanel";
import PriceSensitivityPanel from "@/components/PriceSensitivityPanel";
import ViewModeSwitcher from "@/components/ViewModeSwitcher";
import EventLifecyclePanel from "@/components/EventLifecyclePanel";
import OrganizerPaymentControl from "@/components/OrganizerPaymentControl";
import CancellationReplacementPanel from "@/components/CancellationReplacementPanel";
import WaitlistPanel from "@/components/WaitlistPanel";
import CancelRulesPanel from "@/components/CancelRulesPanel";
import PaymentSplitPanel from "@/components/PaymentSplitPanel";
import PaymentConfirmationDemo from "@/components/PaymentConfirmationDemo";
import OnSiteAddOnsPanel from "@/components/OnSiteAddOnsPanel";
import ParticipantsPanel from "@/components/ParticipantsPanel";
import ShareInvitePanel from "@/components/ShareInvitePanel";
import AuthJoinPanel from "@/components/AuthJoinPanel";
import TelegramRequestDemo from "@/components/TelegramRequestDemo";
import BookingTracker from "@/components/BookingTracker";
import AudiencePage from "@/components/AudiencePage";

import { demoParticipants, demoWaitlist } from "@/data/demoParticipants";
import { places } from "@/data/places";
import { scenarios } from "@/data/scenarios";
import { getAddOnsTotal } from "@/lib/addons";
import { availabilityLabels, bookingModeLabels, bookingStepsByAvailability, getAvailability } from "@/lib/availability";
import { calculateDurationHours, formatDuration, isBeforeDate } from "@/lib/dates";
import { getEventStage } from "@/lib/eventStage";
import { calculateEventPricing, money } from "@/lib/pricing";
import type { EventDraft, OwnerReply, ViewerRole } from "@/types/event";
import type { PaymentStatus } from "@/types/payment";
import type { Place } from "@/types/place";
import type { AuthMethod, AuthUser } from "@/types/user";

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [event, setEvent] = useState<EventDraft>({
    title: "Банный вечер для своих",
    date: "2026-06-14",
    startTime: "17:00",
    endTime: "21:00",
    guests: 8,
    targetBudget: 3500,
    extras: ["чан", "чайный стол"],
    organizer: "Полина",
    minGuests: 6,
    joinDeadline: "2026-06-10",
    paymentDeadline: "2026-06-12",
    paymentMode: "Сначала собираем интерес, потом открываем оплату",
  });
  const [joined, setJoined] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [cancelledParticipant, setCancelledParticipant] = useState<string | null>(null);
  const [waitlistInvited, setWaitlistInvited] = useState(false);
  const [compositionFixed, setCompositionFixed] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [selfPaymentStatus, setSelfPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [paymentNoticeSent, setPaymentNoticeSent] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState(["tea"]);
  const [selectedOnSiteAddOns, setSelectedOnSiteAddOns] = useState<string[]>([]);
  const [paidOnSiteAddOns, setPaidOnSiteAddOns] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [ownerReply, setOwnerReply] = useState<OwnerReply | null>(null);
  const [ownerPaymentReply, setOwnerPaymentReply] = useState<"seen" | "not_seen" | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authWarning, setAuthWarning] = useState("");
  const [consents, setConsents] = useState({ marketingOffers: false });
  const [viewerRole, setViewerRole] = useState<ViewerRole>("guest");

  const filteredPlaces = useMemo(() => {
    if (!selectedScenario) return places;
    return places.filter((place) => place.scenarios.includes(selectedScenario));
  }, [selectedScenario]);

  const activeScenario = scenarios.find((item) => item.id === selectedScenario);
  const activePlace = selectedPlace || places[0];
  const activeAddOns = useMemo(() => activePlace.addOns || [], [activePlace]);
  const activeOnSiteAddOns = useMemo(() => activePlace.onSiteAddOns || [], [activePlace]);

  const normalizedDemoParticipants = useMemo(() => {
    const availableAddOnIds = activeAddOns.map((item: any) => item.id);
    return demoParticipants.map((participant) => {
      const validAddOns = participant.addons.filter((id) => availableAddOnIds.includes(id));
      if (validAddOns.length || participant.addons.length === 0) {
        return { ...participant, addons: validAddOns };
      }
      return {
        ...participant,
        addons: availableAddOnIds.slice(0, Math.min(participant.addons.length, availableAddOnIds.length)),
      };
    });
  }, [activeAddOns]);

  const alternativePlaces = useMemo(() => {
    const currentPlaceId = selectedPlace?.id || places[0].id;
    return places.filter((place) => place.id !== currentPlaceId).slice(0, 3);
  }, [selectedPlace?.id]);

  const durationHours = calculateDurationHours(event.startTime, event.endTime);
  const pricing = calculateEventPricing(activePlace, event.guests, durationHours, event.targetBudget);
  const availability = getAvailability(activePlace, event);
  const availabilityInfo = availabilityLabels[availability];
  const selectedAddOnsTotal = getAddOnsTotal(selectedAddOns, activeAddOns);
  const selectedOnSiteAddOnsTotal = getAddOnsTotal(selectedOnSiteAddOns, activeOnSiteAddOns);
  const personalTotal = pricing.perPerson + selectedAddOnsTotal;
  const paidSelf = selfPaymentStatus === "confirmed";
  const paymentMarked = selfPaymentStatus === "marked" || selfPaymentStatus === "confirmed" || selfPaymentStatus === "rejected";
  const visibleDemoParticipants = normalizedDemoParticipants.filter((participant) => participant.name !== cancelledParticipant);
  const confirmedParticipantsCount = visibleDemoParticipants.filter((item) => item.paid).length + (paidSelf ? 1 : 0);
  const joinedParticipantsCount = Math.max(normalizedDemoParticipants.length - (cancelledParticipant ? 1 : 0), 0) + (waitlistInvited ? 1 : 0) + (joined ? 1 : 0);
  const eventLimit = Math.max(Number(event.guests) || 1, 1);
  const seatsLeft = Math.max(eventLimit - joinedParticipantsCount, 0);
  const isFull = seatsLeft <= 0 && !joined;
  const slotDeclined = availability === "busy" || ownerReply === "busy";
  const baseBookingConfirmed = availability === "available" || ownerReply === "confirmed";
  const deadlineValid = isBeforeDate(event.paymentDeadline, event.date);
  const joinDeadlineValid = isBeforeDate(event.joinDeadline, event.paymentDeadline) || event.joinDeadline === event.paymentDeadline;
  const eventLimitValid = eventLimit <= activePlace.capacity;
  const minGuestsTarget = Math.max(Number(event.minGuests) || 1, 1);
  const minGuestsValid = minGuestsTarget <= eventLimit;
  const minGuestsReached = joinedParticipantsCount >= minGuestsTarget;
  const canOpenPayments = baseBookingConfirmed && deadlineValid && joinDeadlineValid && eventLimitValid && minGuestsValid && minGuestsReached && compositionFixed && !slotDeclined;
  const canSeeParticipantAddOns = viewerRole === "organizer" || viewerRole === "owner";
  const isOrganizerView = viewerRole === "organizer";
  const isOwnerView = viewerRole === "owner";
  const paymentCode = `SOB-123-${authUser?.method === "telegram" ? "TG" : authUser?.method === "yandex" ? "YA" : authUser?.method === "phone" ? "PH" : "GUEST"}`;
  const eventStage = getEventStage({ slotDeclined, baseBookingConfirmed, minGuestsReached, compositionFixed, paymentsOpen, confirmedParticipantsCount, joinedParticipantsCount });
  const waitlistCount = Math.max(demoWaitlist.length - (waitlistInvited ? 1 : 0), 0) + (waitlisted ? 1 : 0);
  const collectedTotal = visibleDemoParticipants.reduce((sum, participant) => {
    if (!participant.paid) return sum;
    const addonsTotal = getAddOnsTotal(participant.addons, activeAddOns);
    return sum + pricing.perPerson + addonsTotal;
  }, 0) + (paidSelf ? personalTotal : 0) + (paidOnSiteAddOns ? selectedOnSiteAddOnsTotal : 0);
  const eventLink = "https://sobralis.demo/event/123";
  const inviteText = `Собрались на ${event.title}: ${event.date}, ${event.startTime}-${event.endTime}, ${activePlace.title}. Присоединиться: ${eventLink}`;

  function fixComposition() {
    if (!baseBookingConfirmed || !minGuestsReached) return;
    setCompositionFixed(true);
  }

  function cancelDemoParticipant(name: string) {
    setCancelledParticipant(name);
    setWaitlistInvited(false);
  }

  function inviteFromWaitlist() {
    if (!cancelledParticipant) return;
    setWaitlistInvited(true);
  }

  function uploadReceipt() {
    setReceiptUploaded(true);
  }

  const bookingSteps = useMemo(() => {
    if (slotDeclined) return bookingStepsByAvailability.busy;
    if (availability === "available") return bookingStepsByAvailability.available;
    if (ownerReply === "confirmed") {
      return [
        { title: "Заявка создана", status: "done" },
        { title: "Владелец подтвердил", status: "done" },
        { title: paymentsOpen ? "Оплата открыта" : "Можно открыть оплату", status: paymentsOpen ? "done" : "active" },
        { title: "Ждём оплаты участников", status: "wait" },
      ];
    }
    return bookingStepsByAvailability.request;
  }, [availability, ownerReply, paymentsOpen, slotDeclined]);

  function shareEvent() {
    setInviteCopied(true);
    if (navigator.share) {
      navigator.share({ title: event.title, text: inviteText, url: eventLink }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(inviteText);
    }
  }

  function quickAuth(method: AuthMethod) {
    const names: Record<string, string> = {
      telegram: "Пользователь Telegram",
      yandex: "Пользователь Яндекс ID",
      phone: "Пользователь по телефону",
      guest: "Гость",
    };
    setAuthWarning("");
    setAuthUser({ name: names[method] || "Пользователь", method });
  }

  function joinEvent() {
    if (!authUser) quickAuth("guest");
    if (isFull) {
      setWaitlisted(true);
      return;
    }
    setJoined(true);
  }

  function toggleAddOn(addonId: string) {
    setSelectedAddOns((prev) => (prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]));
  }

  function clearAddOns() {
    setSelectedAddOns([]);
  }

  function toggleOnSiteAddOn(addonId: string) {
    setSelectedOnSiteAddOns((prev) => (prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]));
  }

  function launchPayments() {
    if (!canOpenPayments) return;
    setPaymentsOpen(true);
    setPaymentNoticeSent(true);
  }

  function payPersonalShare() {
    if (!joined) joinEvent();
    if (!paymentsOpen || waitlisted) return;
    if (!authUser || authUser.method === "guest") {
      setAuthWarning("Для оплаты нужен подтверждённый вход: Telegram, Яндекс ID или телефон. Гостевой вход подходит только для просмотра и предварительного участия.");
      return;
    }
    setSelfPaymentStatus("marked");
    setOwnerPaymentReply(null);
  }

  function confirmOwnerPayment(status: "seen" | "not_seen") {
    if (!paymentMarked) return;
    setOwnerPaymentReply(status);
    if (status === "seen") setSelfPaymentStatus("confirmed");
    if (status === "not_seen") {
      setSelfPaymentStatus("rejected");
      setReceiptUploaded(false);
    }
  }

  function payOnSiteAddOns() {
    if (!joined || waitlisted) return;
    if (selectedOnSiteAddOns.length === 0) return;
    setPaidOnSiteAddOns(true);
  }

  function goBrowse(scenarioId: string | null = null) {
    setSelectedScenario(scenarioId);
    setScreen("browse");
  }

  function openPlace(place: Place) {
    setSelectedPlace(place);
    setSelectedAddOns((place.addOns || [])[0]?.id ? [(place.addOns || [])[0].id] : []);
    setSelectedOnSiteAddOns([]);
    setScreen("place");
  }

  function createHere(place: Place) {
    setSelectedPlace(place);
    setSelectedAddOns((place.addOns || [])[0]?.id ? [(place.addOns || [])[0].id] : []);
    setSelectedOnSiteAddOns([]);
    setEvent((prev: any) => {
      const guests = Math.min(place.capacity, Number(prev.guests) || place.capacity);
      return { ...prev, guests, minGuests: Math.min(Number(prev.minGuests) || guests, guests), targetBudget: Math.ceil(place.price / guests) };
    });
    setOwnerReply(null);
    setPaymentsOpen(false);
    setPaymentNoticeSent(false);
    setCompositionFixed(false);
    setCancelledParticipant(null);
    setWaitlistInvited(false);
    setReceiptUploaded(false);
    setSelfPaymentStatus("idle");
    setOwnerPaymentReply(null);
    setJoined(false);
    setWaitlisted(false);
    setScreen("builder");
  }

  function createEventFromBuilder() {
    if (slotDeclined || !deadlineValid || !joinDeadlineValid || !eventLimitValid || !minGuestsValid) return;
    setScreen("event");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <Header setScreen={setScreen} goBrowse={goBrowse} />

      {screen === "home" && (
        <main>
          <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">Первый тест в Калининграде и области</div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">Собрались в баню, домик или за город?</h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-stone-600">Организуйте отдых для компании без хаоса в чатах: выберите место, создайте событие, пригласите людей и посчитайте оплату на каждого.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setScreen("builder")} className="rounded-2xl bg-stone-950 px-7 py-4 text-base font-black text-white shadow-lg shadow-stone-300 hover:bg-stone-800">Создать отдых</button>
                <button onClick={() => goBrowse()} className="rounded-2xl border border-stone-300 bg-white px-7 py-4 text-base font-black text-stone-950 hover:border-stone-950">Посмотреть демо-места</button>
              </div>
              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {["место", "участники", "оплата"].map((item, index) => (
                  <div key={item} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-black">0{index + 1}</div>
                    <div className="mt-1 text-sm font-semibold text-stone-600">{item} в одном сценарии</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-200">
              <div className="overflow-hidden rounded-[1.5rem]"><img src={places[0].image} alt="Баня у залива" className="h-72 w-full object-cover" /></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Банный вечер для своих</h2>
                    <p className="mt-1 text-stone-600">8 гостей · чан · чайный стол · Калининградская область</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">готово на 72%</div>
                </div>
                <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                  <div className="flex justify-between text-sm"><span>Место</span><b>18 000 ₽</b></div>
                  <div className="mt-2 flex justify-between text-sm"><span>На человека</span><b>≈ 2 250 ₽</b></div>
                  <div className="mt-2 flex justify-between text-sm"><span>Оплатили</span><b>3 из 8</b></div>
                  <div className="mt-2 flex justify-between text-sm"><span>Организатору</span><b>0 ₽ собирать вручную</b></div>
                </div>
                <button onClick={() => setScreen("event")} className="mt-4 w-full rounded-2xl bg-stone-950 px-5 py-4 font-black text-white">Посмотреть страницу события</button>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight">С чего начнём?</h2>
                <p className="mt-2 text-stone-600">Выберите сценарий — дальше сервис предложит места и соберёт страницу события.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {scenarios.map((scenario) => (
                <button key={scenario.id} onClick={() => goBrowse(scenario.id)} className="group rounded-[1.5rem] border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-4 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{scenario.tag}</div>
                  <h3 className="text-2xl font-black group-hover:text-amber-700">{scenario.title}</h3>
                  <p className="mt-3 leading-7 text-stone-600">{scenario.subtitle}</p>
                  <div className="mt-5 font-black">Выбрать →</div>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}

      {screen === "browse" && (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <button onClick={() => setScreen("home")} className="mb-4 text-sm font-bold text-stone-500 hover:text-stone-950">← На главную</button>
              <h1 className="text-4xl font-black tracking-tight">{activeScenario ? activeScenario.title : "Места для отдыха"}</h1>
              <p className="mt-2 max-w-2xl text-stone-600">Демо-подборка, чтобы показать механику будущего сервиса. В настоящем MVP здесь будут реальные объекты Калининграда и области.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedScenario(null)} className={`rounded-full px-4 py-2 text-sm font-bold ${!selectedScenario ? "bg-stone-950 text-white" : "bg-white text-stone-700 border border-stone-200"}`}>Все</button>
              {scenarios.map((scenario) => (
                <button key={scenario.id} onClick={() => setSelectedScenario(scenario.id)} className={`rounded-full px-4 py-2 text-sm font-bold ${selectedScenario === scenario.id ? "bg-stone-950 text-white" : "bg-white text-stone-700 border border-stone-200"}`}>{scenario.title}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {filteredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} openPlace={openPlace} />
            ))}
          </div>
        </main>
      )}

      {screen === "place" && selectedPlace && (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <button onClick={() => setScreen("browse")} className="mb-6 text-sm font-bold text-stone-500 hover:text-stone-950">← Назад к местам</button>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <img src={selectedPlace.image} alt={selectedPlace.title} className="h-[420px] w-full rounded-[2rem] object-cover shadow-xl shadow-stone-200" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard label="Формат" value={selectedPlace.type} />
                <InfoCard label="Вместимость" value={`до ${selectedPlace.capacity} гостей`} />
                <InfoCard label="Цена" value={selectedPlace.perHour} />
                <InfoCard label="Правила цены" value={selectedPlace.pricingTitle} />
                <InfoCard label="Бронь" value={bookingModeLabels[selectedPlace.bookingMode]} />
                <InfoCard label="На человека" value={`≈ ${money.format(Math.ceil(selectedPlace.price / selectedPlace.capacity))} ₽`} />
              </div>
            </div>
            <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">демо-объект</span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${availabilityLabels[selectedPlace.availabilityStatus || "request"].className}`}>{availabilityLabels[selectedPlace.availabilityStatus || "request"].title}</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">{selectedPlace.title}</h1>
              <p className="mt-3 text-lg leading-8 text-stone-600">{selectedPlace.vibe}</p>
              <p className="mt-3 text-stone-500">{selectedPlace.location}</p>

              <div className="mt-7"><h3 className="font-black">Что включено</h3><div className="mt-3 flex flex-wrap gap-2">{selectedPlace.includes.map((item: string) => <span key={item} className="rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold">{item}</span>)}</div></div>
              <div className="mt-7"><h3 className="font-black">Можно добавить</h3><div className="mt-3 flex flex-wrap gap-2">{selectedPlace.addOns.map((item: any) => <span key={item.id} className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">+ {item.title}</span>)}</div></div>
              <div className="mt-7 rounded-2xl bg-stone-50 p-5">
                <div className="flex justify-between"><span>Пакет</span><b>{money.format(selectedPlace.price)} ₽</b></div>
                <div className="mt-2 flex justify-between"><span>Если собрать {selectedPlace.capacity} гостей</span><b>≈ {money.format(Math.ceil(selectedPlace.price / selectedPlace.capacity))} ₽/чел.</b></div>
                <div className="mt-2 flex justify-between"><span>Подтверждение</span><b>{selectedPlace.confirmationTime}</b></div>
              </div>
              <button onClick={() => createHere(selectedPlace)} className="mt-6 w-full rounded-2xl bg-stone-950 px-6 py-4 text-base font-black text-white">Создать событие здесь</button>
            </div>
          </div>
        </main>
      )}

      {screen === "builder" && (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <button onClick={() => setScreen(selectedPlace ? "place" : "home")} className="mb-6 text-sm font-bold text-stone-500 hover:text-stone-950">← Назад</button>
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-7"><h1 className="text-4xl font-black tracking-tight">Создать отдых</h1><p className="mt-2 text-stone-600">Заполните базовые детали — сервис соберёт страницу события для гостей.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Название события"><input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} className="input" /></Field>
              <Field label="Формат"><select value={selectedScenario || "girls"} onChange={(e) => setSelectedScenario(e.target.value)} className="input">{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.title}</option>)}</select></Field>
              <Field label="Дата"><input type="date" value={event.date} onChange={(e) => setEvent({ ...event, date: e.target.value })} className="input" /></Field>
              <Field label="Если дата гибкая"><select value={event.dateFlex || "exact"} onChange={(e) => setEvent({ ...event, dateFlex: e.target.value })} className="input"><option value="exact">Дата точная</option><option value="weekend">Можно в ближайшие выходные</option><option value="month">Можно в течение месяца</option><option value="help">Пока не знаю, помогите подобрать</option></select></Field>
              <Field label="С какого времени"><input type="time" value={event.startTime} onChange={(e) => setEvent({ ...event, startTime: e.target.value })} className="input" /></Field>
              <Field label="До какого времени"><input type="time" value={event.endTime} onChange={(e) => setEvent({ ...event, endTime: e.target.value })} className="input" /></Field>
              <Field label="Количество мест"><input type="number" min="2" max={activePlace.capacity} value={event.guests} onChange={(e) => setEvent({ ...event, guests: e.target.value })} className="input" /></Field>
              <Field label="Минимум участников"><input type="number" min="2" max={event.guests} value={event.minGuests} onChange={(e) => setEvent({ ...event, minGuests: e.target.value })} className="input" /></Field>
              <Field label="Желаемый бюджет на человека"><input type="number" value={event.targetBudget} onChange={(e) => setEvent({ ...event, targetBudget: e.target.value })} className="input" /></Field>
              <Field label="Как собираем оплату"><select value={event.paymentMode} onChange={(e) => setEvent({ ...event, paymentMode: e.target.value })} className="input"><option>Сначала собираем интерес, потом открываем оплату</option><option>Участники сразу оплачивают свои места</option><option>Организатор оплачивает бронь</option><option>Пока только собрать заявки</option></select></Field>
              <Field label="Набрать участников до"><input type="date" value={event.joinDeadline} onChange={(e) => setEvent({ ...event, joinDeadline: e.target.value })} className="input" /></Field>
              <Field label="Оплатить до"><input type="date" value={event.paymentDeadline} onChange={(e) => setEvent({ ...event, paymentDeadline: e.target.value })} className="input" /></Field>
              <Field label="Контакт организатора"><input value={event.organizer} onChange={(e) => setEvent({ ...event, organizer: e.target.value })} className="input" /></Field>
            </div>

            <div className="mt-7 rounded-2xl bg-stone-50 p-5">
              <h3 className="font-black">Предпросмотр расчёта</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <InfoCard label="Место" value={activePlace.title} compact />
                <InfoCard label="Длительность" value={formatDuration(pricing.durationHours)} compact />
                <InfoCard label="К оплате места" value={`${money.format(pricing.placeTotal)} ₽`} compact />
                <InfoCard label="Стоимость участия" value={`≈ ${money.format(pricing.perPerson)} ₽`} compact />
                <InfoCard label="Мест" value={`${event.guests}`} compact />
              </div>
              {!deadlineValid && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">Дедлайн оплаты должен быть раньше даты события.</div>}
              {!joinDeadlineValid && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">Дедлайн набора участников должен быть раньше или в день дедлайна оплаты.</div>}
              {!eventLimitValid && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">Количество мест не может быть больше вместимости объекта: максимум {activePlace.capacity}.</div>}
              {!minGuestsValid && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">Минимум участников не может быть больше общего количества мест.</div>}
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${slotDeclined ? availabilityLabels.busy.className : availabilityInfo.className}`}>{slotDeclined ? "Этот слот занят или владелец отказал. Покажем это честно и предложим другое время." : availability === "available" ? "Слот выглядит свободным: можно сразу создать событие и отправить бронь." : `Слот требует подтверждения: ${activePlace.confirmationTime}. Пользователь видит контроль, но без ложного обещания мгновенной брони.`}</div>
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${pricing.fitsBudget ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{pricing.fitsBudget ? `Укладываемся в желаемый бюджет: до ${money.format(pricing.target || pricing.perPerson)} ₽ на человека.` : `Выше желаемого бюджета примерно на ${money.format(pricing.difference)} ₽ с человека. Можно сократить время, увеличить гостей или выбрать другое место.`}</div>
              <BookingTracker steps={bookingSteps} />
              {availability !== "available" && !slotDeclined && <TelegramRequestDemo place={activePlace} event={event} pricing={pricing} ownerReply={ownerReply} setOwnerReply={setOwnerReply} />}
              {slotDeclined && <AlternativesPanel alternativePlaces={alternativePlaces} createHere={createHere} />}
            </div>

            <button disabled={slotDeclined || !deadlineValid || !joinDeadlineValid || !eventLimitValid || !minGuestsValid} onClick={createEventFromBuilder} className={`mt-7 w-full rounded-2xl px-6 py-4 text-base font-black text-white ${(slotDeclined || !deadlineValid || !joinDeadlineValid || !eventLimitValid || !minGuestsValid) ? "cursor-not-allowed bg-stone-400" : "bg-stone-950 hover:bg-stone-800"}`}>{slotDeclined ? "Создать событие нельзя — слот занят" : (!deadlineValid || !joinDeadlineValid || !eventLimitValid || !minGuestsValid) ? "Исправьте ошибки" : "Создать демо-страницу события"}</button>
          </div>
        </main>
      )}

      {screen === "event" && (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <button onClick={() => setScreen("builder")} className="mb-6 text-sm font-bold text-stone-500 hover:text-stone-950">← Редактировать событие</button>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
              <img src={activePlace.image} alt={activePlace.title} className="h-72 w-full object-cover" />
              <div className="p-6">
                <div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">страница события</div>
                <h1 className="text-4xl font-black tracking-tight">{event.title}</h1>
                <p className="mt-3 text-lg text-stone-600">{activePlace.title}</p>
                <p className="mt-1 text-stone-500">{activePlace.location}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Дата и время" value={`${event.date} · ${event.startTime}-${event.endTime}`} />
                <InfoCard label="Места" value={`${eventLimit} всего · ${joinedParticipantsCount} занято · ${seatsLeft} свободно`} />
                <InfoCard label="Минимум" value={`${Math.max(Number(event.minGuests) || 1, 1)} участников · ${minGuestsReached ? "достигнут" : "ещё собираем"}`} />
                <InfoCard label="Базовое участие" value={`≈ ${money.format(pricing.perPerson)} ₽`} />
                <InfoCard label="Оплата" value={event.paymentMode} />
                <InfoCard label="Длительность" value={formatDuration(pricing.durationHours)} />
                <InfoCard label="Статус брони" value={baseBookingConfirmed ? "слот подтверждён" : slotDeclined ? "слот занят" : `ожидает подтверждения · ${activePlace.confirmationTime}`} />
                <InfoCard label="База гостей" value={`${joinedParticipantsCount} участников · лист ожидания ${waitlistCount}`} />
                <InfoCard label="Собрано" value={`${money.format(collectedTotal)} ₽ · ${confirmedParticipantsCount}/${joinedParticipantsCount} подтверждено`} />
                <InfoCard label="Этап" value={eventStage.title} />
              </div>

              <EventLifecyclePanel eventStage={eventStage} event={event} minGuestsReached={minGuestsReached} compositionFixed={compositionFixed} paymentsOpen={paymentsOpen} />
              <GuestSummaryPanel activePlace={activePlace} event={event} pricing={pricing} seatsLeft={seatsLeft} isFull={isFull} paymentsOpen={paymentsOpen} />
              <PriceSensitivityPanel activePlace={activePlace} event={event} durationHours={durationHours} joinedParticipantsCount={joinedParticipantsCount} />
              <BookingTracker steps={bookingSteps} />
              <ViewModeSwitcher viewerRole={viewerRole} setViewerRole={setViewerRole} />

              {isOrganizerView && <OrganizerPaymentControl paymentsOpen={paymentsOpen} paymentNoticeSent={paymentNoticeSent} launchPayments={launchPayments} event={event} pricing={pricing} joinedParticipantsCount={joinedParticipantsCount} paidParticipantsCount={confirmedParticipantsCount} canOpenPayments={canOpenPayments} baseBookingConfirmed={baseBookingConfirmed} deadlineValid={deadlineValid} joinDeadlineValid={joinDeadlineValid} minGuestsReached={minGuestsReached} compositionFixed={compositionFixed} fixComposition={fixComposition} />}
              {isOrganizerView && <CancellationReplacementPanel cancelledParticipant={cancelledParticipant} cancelDemoParticipant={cancelDemoParticipant} inviteFromWaitlist={inviteFromWaitlist} waitlistInvited={waitlistInvited} demoWaitlist={demoWaitlist} />}
              {isOwnerView && availability !== "available" && <TelegramRequestDemo place={activePlace} event={event} pricing={pricing} ownerReply={ownerReply} setOwnerReply={setOwnerReply} />}
              <WaitlistPanel eventLimit={eventLimit} joinedParticipantsCount={joinedParticipantsCount} seatsLeft={seatsLeft} waitlistCount={waitlistCount} waitlisted={waitlisted} />
              <PaymentSplitPanel pricing={pricing} addOns={activeAddOns} selectedAddOns={selectedAddOns} toggleAddOn={toggleAddOn} clearAddOns={clearAddOns} personalTotal={personalTotal} selectedAddOnsTotal={selectedAddOnsTotal} selfPaymentStatus={selfPaymentStatus} payPersonalShare={payPersonalShare} collectedTotal={collectedTotal} paidParticipantsCount={confirmedParticipantsCount} joinedParticipantsCount={joinedParticipantsCount} paymentsOpen={paymentsOpen} paymentDeadline={event.paymentDeadline} paymentCode={paymentCode} authWarning={authWarning} waitlisted={waitlisted} />
              <CancelRulesPanel paymentsOpen={paymentsOpen} paymentDeadline={event.paymentDeadline} />
              {isOwnerView && <PaymentConfirmationDemo personalTotal={personalTotal} paymentMarked={paymentMarked} selfPaymentStatus={selfPaymentStatus} ownerPaymentReply={ownerPaymentReply} confirmOwnerPayment={confirmOwnerPayment} paymentCode={paymentCode} receiptUploaded={receiptUploaded} uploadReceipt={uploadReceipt} />}
              <OnSiteAddOnsPanel onSiteAddOns={activeOnSiteAddOns} selectedOnSiteAddOns={selectedOnSiteAddOns} toggleOnSiteAddOn={toggleOnSiteAddOn} selectedOnSiteAddOnsTotal={selectedOnSiteAddOnsTotal} paidOnSiteAddOns={paidOnSiteAddOns} payOnSiteAddOns={payOnSiteAddOns} joined={joined} waitlisted={waitlisted} />

              <div className="mt-7"><h3 className="text-xl font-black">Что включено</h3><div className="mt-3 flex flex-wrap gap-2">{[...activePlace.includes, ...event.extras].slice(0, 8).map((item) => <span key={item} className="rounded-full bg-stone-100 px-3 py-2 text-sm font-semibold">{item}</span>)}</div></div>
              <ParticipantsPanel demoParticipants={visibleDemoParticipants} activeAddOns={activeAddOns} pricing={pricing} joined={joined} paidSelf={paidSelf} selfPaymentStatus={selfPaymentStatus} personalTotal={personalTotal} selectedAddOnsTotal={selectedAddOnsTotal} selectedAddOns={selectedAddOns} consents={consents} canSeeParticipantAddOns={canSeeParticipantAddOns} waitlisted={waitlisted} demoWaitlist={demoWaitlist} waitlistInvited={waitlistInvited} />
              <ShareInvitePanel eventLink={eventLink} inviteText={inviteText} inviteCopied={inviteCopied} shareEvent={shareEvent} />
              <AuthJoinPanel authUser={authUser} quickAuth={quickAuth} joined={joined} joinEvent={joinEvent} consents={consents} setConsents={setConsents} isFull={isFull} waitlisted={waitlisted} seatsLeft={seatsLeft} />
            </div>
          </div>
        </main>
      )}

      {screen === "partners" && <AudiencePage title="Для владельцев мест" subtitle="Получайте не просмотры в каталоге, а тёплые заявки на групповой отдых: с датой, количеством гостей, форматом и бюджетом." bullets={["одна бронь = не один контакт, а вся компания гостей в базе сервиса", "заявки на девичники, дни рождения и weekend", "загрузка пустых окон", "повторные касания с гостями через Собрались: акции, свободные окна, дни рождения, сезонные предложения", "продвижение сценариев, а не просто объекта", "можно начать без сложной админки: менеджер сам занесёт условия", "дальше — простой календарь или подтверждение заявок в Telegram", "комиссия только за результат в первой версии"]} button="Добавить своё место" leadSent={leadSent} setLeadSent={setLeadSent} />}
      {screen === "organizers" && <AudiencePage title="Для организаторов" subtitle="Создавайте банные встречи, девичники, ретриты и камерные мероприятия без ручного хаоса в переписках." bullets={["создание страницы события", "сначала сбор интереса, потом запуск оплаты одной кнопкой", "участники сами оплачивают свою часть", "автоматический лист ожидания, если мест больше нет", "допы можно добавить и оплатить отдельно", "подбор локации под формат", "возможность продавать места на свои мероприятия"]} button="Хочу протестировать" leadSent={leadSent} setLeadSent={setLeadSent} />}

      <style>{`
        .input { width: 100%; border-radius: 1rem; border: 1px solid rgb(214 211 209); background: white; padding: 0.9rem 1rem; font-weight: 700; outline: none; }
        .input:focus { border-color: rgb(28 25 23); box-shadow: 0 0 0 4px rgba(28,25,23,0.08); }
      `}</style>
    </div>
  );
}

export default App;
