import "dotenv/config";

import { POST as joinEvent } from "@/app/api/events/[id]/join/route";
import { prisma } from "@/lib/prisma";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function cleanup(ids: { eventId?: string; placeId?: string }) {
  if (ids.eventId) await prisma.event.deleteMany({ where: { id: ids.eventId } });
  if (ids.placeId) await prisma.place.deleteMany({ where: { id: ids.placeId } });
}

async function main() {
  const timestamp = Date.now();
  const guestsLimit = 12;
  const requestsCount = 30;
  let eventId: string | undefined;
  let placeId: string | undefined;

  try {
    const place = await prisma.place.create({
      data: {
        title: `Concurrent test place ${timestamp}`,
        location: "test",
        type: "breakfast",
        capacity: guestsLimit,
        hourlyRate: 0,
        minHours: 1,
        price: 0,
        extraHourRate: 0,
        bookingMode: "manager",
        availabilityStatus: "available",
        confirmationTime: "не требуется",
        pricingTitle: "без оплаты",
        perHour: "без оплаты",
        image: "",
        vibe: "test",
      },
    });
    placeId = place.id;

    const event = await prisma.event.create({
      data: {
        title: `Concurrent test event ${timestamp}`,
        kind: "breakfast",
        placeId: place.id,
        date: toDate("2026-07-01"),
        startTime: "10:00",
        endTime: "12:00",
        guestsLimit,
        minGuests: 1,
        targetBudget: 0,
        joinDeadline: toDate("2026-06-30"),
        paymentDeadline: toDate("2026-06-30"),
        paymentMode: "none",
        status: "collecting_interest",
        shareSlug: `concurrent-test-${timestamp}`,
      },
    });
    eventId = event.id;

    const responses = await Promise.all(
      Array.from({ length: requestsCount }, (_, index) =>
        joinEvent(
          new Request(`http://localhost/api/events/${event.id}/join`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: `Guest ${String(index + 1).padStart(2, "0")}`,
              comment: `Concurrent request ${index + 1}`,
              status: "joined",
            }),
          }),
          { params: Promise.resolve({ id: event.id }) },
        ),
      ),
    );

    const payloads = await Promise.all(responses.map((response) => response.json()));
    const failed = payloads.filter((payload) => !payload.ok);
    assert(failed.length === 0, `All concurrent join requests must return JSON ok=true. Failed: ${JSON.stringify(failed)}`);

    const [participantsCount, waitlistCount, chargesCount] = await Promise.all([
      prisma.eventParticipant.count({
        where: {
          eventId: event.id,
          status: { in: ["interested", "joined", "invited_from_waitlist"] },
        },
      }),
      prisma.waitlistEntry.count({
        where: {
          eventId: event.id,
          status: { in: ["waiting", "invited"] },
        },
      }),
      prisma.participantCharge.count({ where: { eventId: event.id } }),
    ]);

    assert(participantsCount === guestsLimit, `Expected ${guestsLimit} participants, got ${participantsCount}`);
    assert(waitlistCount === requestsCount - guestsLimit, `Expected ${requestsCount - guestsLimit} waitlist entries, got ${waitlistCount}`);
    assert(chargesCount === guestsLimit, `Expected ${guestsLimit} participant charges, got ${chargesCount}`);

    console.log("Concurrent join flow OK:", {
      eventId: event.id,
      requestsCount,
      guestsLimit,
      participantsCount,
      waitlistCount,
      chargesCount,
    });
  } finally {
    await cleanup({ eventId, placeId });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
