import "dotenv/config";

import { prisma } from "@/lib/prisma";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sobralis_mvp?schema=public";

let createdEventId: string | undefined;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function paymentCode() {
  return `SOB-CHECK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function cleanup() {
  if (!createdEventId) return;
  await prisma.event.deleteMany({ where: { id: createdEventId } });
}

async function main() {
  const places = await prisma.place.findMany({
    include: {
      includes: true,
      addOns: { where: { type: "pre_event" } },
    },
    orderBy: { createdAt: "asc" },
  });

  assert(places.length > 0, "No places found. Run `npm run prisma:seed` first.");

  const placesWithOnSiteAddOns = await Promise.all(
    places.map(async (place) => ({
      ...place,
      onSiteAddOns: await prisma.placeAddOn.findMany({ where: { placeId: place.id, type: "on_site" } }),
    })),
  );

  console.log(`GET /api/places equivalent: ${placesWithOnSiteAddOns.length} places`);

  const place = places[0];
  const shareSlug = `check-api-flow-${Date.now()}`;

  const event = await prisma.event.create({
    data: {
      title: "API check event",
      placeId: place.id,
      date: toDate("2026-07-01"),
      startTime: "17:00",
      endTime: "21:00",
      guestsLimit: 1,
      minGuests: 1,
      targetBudget: 3500,
      joinDeadline: toDate("2026-06-28"),
      paymentDeadline: toDate("2026-06-30"),
      paymentMode: "manual",
      status: "collecting_interest",
      shareSlug,
      bookingRequests: {
        create: { placeId: place.id, status: "pending" },
      },
    },
    include: { bookingRequests: true, place: true, participants: true, waitlistEntries: true, charges: true },
  });
  createdEventId = event.id;

  const fetchedEvent = await prisma.event.findUnique({
    where: { id: event.id },
    include: {
      place: true,
      participants: { include: { charges: true, addOns: { include: { addOn: true } } } },
      waitlistEntries: true,
      charges: true,
    },
  });
  assert(fetchedEvent, "Created event must be readable");
  console.log(`GET /api/events/[id] equivalent: ${fetchedEvent.id}`);
  console.log(`POST /api/events equivalent: ${event.id}`);

  const participant = await prisma.eventParticipant.create({
    data: {
      eventId: event.id,
      name: "API participant",
      status: "joined",
      paymentStatus: "idle",
    },
  });

  const baseAmount = Math.ceil(place.price / event.guestsLimit);
  const charge = await prisma.participantCharge.create({
    data: {
      eventId: event.id,
      participantId: participant.id,
      baseAmount,
      addOnsAmount: 0,
      totalAmount: baseAmount,
      paymentCode: paymentCode(),
      status: "waiting",
    },
  });

  console.log(`POST /api/events/[id]/join equivalent: ${participant.id}`);

  const occupiedSeats = await prisma.eventParticipant.count({
    where: { eventId: event.id, status: { in: ["interested", "joined", "invited_from_waitlist"] } },
  });
  assert(occupiedSeats >= event.guestsLimit, "Expected event to be full after first participant");

  const waitlistEntry = await prisma.waitlistEntry.create({
    data: {
      eventId: event.id,
      name: "API waitlist",
      status: "waiting",
    },
  });

  console.log(`POST /api/events/[id]/waitlist equivalent: ${waitlistEntry.id}`);

  const bookingRequest = event.bookingRequests[0];
  assert(bookingRequest, "Expected created event to have a booking request");

  await prisma.bookingRequest.update({
    where: { id: bookingRequest.id },
    data: { status: "confirmed", ownerReply: "confirmed" },
  });

  await prisma.event.update({
    where: { id: event.id },
    data: { status: "place_confirmed" },
  });

  const fixedEvent = await prisma.event.update({
    where: { id: event.id },
    data: { status: "composition_fixed" },
  });

  console.log(`POST /api/events/[id]/fix-composition equivalent: ${fixedEvent.status}`);

  const openedEvent = await prisma.event.update({
    where: { id: event.id },
    data: { status: "payments_open" },
  });

  console.log(`POST /api/events/[id]/open-payments equivalent: ${openedEvent.status}, simulatedNotifications=true`);

  const markedCharge = await prisma.participantCharge.update({
    where: { id: charge.id },
    data: { status: "marked_paid" },
  });
  await prisma.eventParticipant.update({
    where: { id: participant.id },
    data: { paymentStatus: "marked" },
  });

  console.log(`POST /api/charges/[id]/mark-paid equivalent: ${markedCharge.status}`);

  const confirmedCharge = await prisma.participantCharge.update({
    where: { id: charge.id },
    data: { status: "confirmed_by_owner" },
  });
  const confirmedParticipant = await prisma.eventParticipant.update({
    where: { id: participant.id },
    data: { paymentStatus: "confirmed" },
  });

  console.log(`POST /api/owner/charges/[id]/confirm equivalent: ${confirmedCharge.status}/${confirmedParticipant.paymentStatus}`);
}

main()
  .catch((error) => {
    if (error && typeof error === "object" && "code" in error && (error.code === "EACCES" || error.code === "P1001")) {
      console.error("Database is not reachable.");
      console.error(`DATABASE_URL: ${connectionString}`);
      console.error("Start PostgreSQL, then run `npm run prisma:seed` and `npm run check:api-flow`.");
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
