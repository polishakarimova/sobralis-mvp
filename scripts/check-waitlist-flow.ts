import "dotenv/config";

import { prisma } from "@/lib/prisma";
import { upsertTelegramUser } from "@/lib/telegram";
import { acceptWaitlistEntry, inviteNextWaitlistEntry, skipWaitlistEntry } from "@/lib/waitlist";

process.env.TELEGRAM_NOTIFICATIONS_DISABLED = "true";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function activeCounts(eventId: string) {
  const [participants, waitlist] = await Promise.all([
    prisma.eventParticipant.count({
      where: { eventId, status: { in: ["interested", "joined", "invited_from_waitlist"] } },
    }),
    prisma.waitlistEntry.count({
      where: { eventId, status: { in: ["waiting", "invited"] } },
    }),
  ]);

  return { participants, waitlist };
}

async function publicSeatsLeft(eventId: string, guestsLimit: number) {
  const counts = await activeCounts(eventId);
  return Math.max(guestsLimit - counts.participants - counts.waitlist, 0);
}

async function cleanup(ids: { eventId?: string; placeId?: string; userIds: string[]; telegramIds: string[] }) {
  try {
    if (ids.eventId) await prisma.event.deleteMany({ where: { id: ids.eventId } });
    if (ids.placeId) await prisma.place.deleteMany({ where: { id: ids.placeId } });
    if (ids.telegramIds.length) await prisma.telegramAccount.deleteMany({ where: { telegramId: { in: ids.telegramIds } } });
    if (ids.telegramIds.length) await prisma.authIdentity.deleteMany({ where: { provider: "telegram", providerUserId: { in: ids.telegramIds } } });
    if (ids.userIds.length) await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } });
  } catch (error) {
    console.warn("Waitlist flow cleanup warning:", error);
  }
}

async function main() {
  const timestamp = Date.now();
  const userIds: string[] = [];
  const telegramIds = ["910000000001", "910000000002", "910000000003", "910000000004"];
  let placeId: string | undefined;
  let eventId: string | undefined;

  try {
    const organizer = await upsertTelegramUser({ id: 910000000001, username: `waitlist_org_${timestamp}`, first_name: "Организатор" }, 910000000001);
    const firstGuest = await upsertTelegramUser({ id: 910000000002, username: `waitlist_guest_${timestamp}`, first_name: "Гость" }, 910000000002);
    const waitOne = await upsertTelegramUser({ id: 910000000003, username: `waitlist_one_${timestamp}`, first_name: "Первая" }, 910000000003);
    const waitTwo = await upsertTelegramUser({ id: 910000000004, username: `waitlist_two_${timestamp}`, first_name: "Вторая" }, 910000000004);
    userIds.push(organizer.id, firstGuest.id, waitOne.id, waitTwo.id);

    const place = await prisma.place.create({
      data: {
        title: `Waitlist test place ${timestamp}`,
        location: "test",
        type: "breakfast",
        capacity: 1,
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
        title: `Waitlist test event ${timestamp}`,
        kind: "breakfast",
        placeId: place.id,
        organizerId: organizer.id,
        date: toDate("2026-07-01"),
        startTime: "10:00",
        endTime: "12:00",
        guestsLimit: 1,
        minGuests: 1,
        targetBudget: 0,
        joinDeadline: toDate("2026-06-30"),
        paymentDeadline: toDate("2026-06-30"),
        paymentMode: "none",
        status: "collecting_interest",
        shareSlug: `waitlist-test-${timestamp}`,
      },
    });
    eventId = event.id;

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: firstGuest.id,
        name: firstGuest.name,
        status: "joined",
        paymentStatus: "idle",
      },
    });

    const waitlistOne = await prisma.waitlistEntry.create({
      data: { eventId: event.id, userId: waitOne.id, name: waitOne.name, status: "waiting" },
    });
    const waitlistTwo = await prisma.waitlistEntry.create({
      data: { eventId: event.id, userId: waitTwo.id, name: waitTwo.name, status: "waiting" },
    });

    assert((await publicSeatsLeft(event.id, event.guestsLimit)) === 0, "Public seats must be blocked while active waitlist exists");

    await prisma.eventParticipant.update({ where: { id: participant.id }, data: { status: "cancelled" } });
    const firstInvite = await inviteNextWaitlistEntry(event.id);
    assert(firstInvite?.id === waitlistOne.id, "First waiting person must be invited first");
    assert((await publicSeatsLeft(event.id, event.guestsLimit)) === 0, "Public seats must stay blocked while first invite is active");

    const wrongAccept = await acceptWaitlistEntry(waitlistOne.id, waitTwo.id);
    assert(!wrongAccept.ok && wrongAccept.status === 403, "Another user must not accept someone else's invitation");

    const skipped = await skipWaitlistEntry(waitlistOne.id, waitOne.id);
    assert(skipped.ok, "First invite should be skippable by invited user");

    const afterSkipOne = await prisma.waitlistEntry.findUnique({ where: { id: waitlistOne.id } });
    const afterSkipTwo = await prisma.waitlistEntry.findUnique({ where: { id: waitlistTwo.id } });
    assert(afterSkipOne?.status === "skipped", "First waitlist entry must be skipped");
    assert(afterSkipTwo?.status === "invited", "Second waitlist entry must be invited after first skip");
    assert((await publicSeatsLeft(event.id, event.guestsLimit)) === 0, "Public seats must stay blocked while second invite is active");

    const accepted = await acceptWaitlistEntry(waitlistTwo.id, waitTwo.id);
    assert(accepted.ok, "Second waitlist entry should be accepted");

    const finalCounts = await activeCounts(event.id);
    assert(finalCounts.participants === 1, "Accepted waitlist user must become participant");
    assert(finalCounts.waitlist === 0, "No active waitlist entries must remain after acceptance");

    const acceptedEntry = await prisma.waitlistEntry.findUnique({ where: { id: waitlistTwo.id } });
    assert(acceptedEntry?.status === "accepted", "Accepted waitlist entry must be marked accepted");

    await prisma.eventParticipant.update({ where: { id: accepted.participant.id }, data: { status: "cancelled" } });
    const noInvite = await inviteNextWaitlistEntry(event.id);
    assert(noInvite === null, "No one should be invited after waitlist is exhausted");
    assert((await publicSeatsLeft(event.id, event.guestsLimit)) === 1, "Public seat must reopen after the whole waitlist is exhausted");

    console.log("Waitlist flow OK:", {
      eventId: event.id,
      firstInvite: waitlistOne.id,
      secondInvite: waitlistTwo.id,
      publicSeatsAfterQueue: await publicSeatsLeft(event.id, event.guestsLimit),
    });
  } finally {
    await cleanup({ eventId, placeId, userIds, telegramIds });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
