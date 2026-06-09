import { makePaymentCode } from "@/lib/api";
import { lockEventForUpdate, withEventQueue } from "@/lib/event-lock";
import { prisma } from "@/lib/prisma";
import { sendWaitlistInviteMessage } from "@/lib/telegram";

const activeParticipantStatuses = ["interested", "joined", "invited_from_waitlist"] as const;
const eventTransactionOptions = { maxWait: 10000, timeout: 15000 };

export async function inviteNextWaitlistEntry(eventId: string) {
  const invited = await withEventQueue(eventId, () =>
    prisma.$transaction(async (tx) => {
      await lockEventForUpdate(tx, eventId);

      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          participants: {
            where: { status: { in: [...activeParticipantStatuses] } },
          },
          waitlistEntries: {
            where: { status: "invited" },
          },
        },
      });

      if (!event) throw new Error("Event not found");

      const reservedSeats = event.participants.length + event.waitlistEntries.length;
      if (reservedSeats >= event.guestsLimit) return null;

      const nextEntry = await tx.waitlistEntry.findFirst({
        where: { eventId, status: "waiting" },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            include: { telegramAccount: true },
          },
        },
      });

      if (!nextEntry) return null;

      return tx.waitlistEntry.update({
        where: { id: nextEntry.id },
        data: { status: "invited" },
        include: {
          event: true,
          user: {
            include: { telegramAccount: true },
          },
        },
      });
    }, eventTransactionOptions),
  );

  if (invited?.user?.telegramAccount?.chatId) {
    try {
      await sendWaitlistInviteMessage(invited.user.telegramAccount.chatId, invited.event.title, invited.id);
    } catch (error) {
      console.error("Failed to send waitlist invite", error);
    }
  }

  return invited;
}

export async function acceptWaitlistEntry(waitlistEntryId: string, userId: string) {
  const initialEntry = await prisma.waitlistEntry.findUnique({
    where: { id: waitlistEntryId },
    select: { eventId: true },
  });

  if (!initialEntry) return { ok: false as const, status: 404, error: "Waitlist entry not found" };

  return withEventQueue(initialEntry.eventId, () =>
    prisma.$transaction(async (tx) => {
      await lockEventForUpdate(tx, initialEntry.eventId);

      const entry = await tx.waitlistEntry.findUnique({
        where: { id: waitlistEntryId },
        include: {
          event: {
            include: {
              place: true,
              participants: {
                where: { status: { in: [...activeParticipantStatuses] } },
              },
            },
          },
        },
      });

      if (!entry) return { ok: false as const, status: 404, error: "Waitlist entry not found" };
      if (entry.userId !== userId) return { ok: false as const, status: 403, error: "This invitation belongs to another user" };
      if (entry.status !== "invited") return { ok: false as const, status: 409, error: "Invitation is not active" };

      const existingParticipant = await tx.eventParticipant.findFirst({
        where: {
          eventId: entry.eventId,
          userId,
          status: { in: [...activeParticipantStatuses] },
        },
      });

      if (existingParticipant) {
        await tx.waitlistEntry.update({ where: { id: entry.id }, data: { status: "accepted" } });
        return { ok: true as const, participant: existingParticipant, alreadyJoined: true };
      }

      if (entry.event.participants.length >= entry.event.guestsLimit) {
        return { ok: false as const, status: 409, error: "No seats left" };
      }

      const participant = await tx.eventParticipant.create({
        data: {
          eventId: entry.eventId,
          userId,
          name: entry.name,
          comment: entry.comment,
          status: "invited_from_waitlist",
          paymentStatus: "idle",
        },
      });

      const baseAmount = Math.ceil(entry.event.place.price / Math.max(entry.event.guestsLimit, 1));
      const charge = await tx.participantCharge.create({
        data: {
          eventId: entry.eventId,
          participantId: participant.id,
          baseAmount,
          addOnsAmount: 0,
          totalAmount: baseAmount,
          paymentCode: makePaymentCode(),
          status: "waiting",
        },
      });

      await tx.waitlistEntry.update({ where: { id: entry.id }, data: { status: "accepted" } });

      return { ok: true as const, participant, charge, alreadyJoined: false };
    }, eventTransactionOptions),
  );
}

export async function skipWaitlistEntry(waitlistEntryId: string, userId: string) {
  const initialEntry = await prisma.waitlistEntry.findUnique({
    where: { id: waitlistEntryId },
    select: { eventId: true },
  });

  if (!initialEntry) return { ok: false as const, status: 404, error: "Waitlist entry not found" };

  const result = await withEventQueue(initialEntry.eventId, () =>
    prisma.$transaction(async (tx) => {
      await lockEventForUpdate(tx, initialEntry.eventId);

      const updated = await tx.waitlistEntry.updateMany({
        where: { id: waitlistEntryId, userId, status: "invited" },
        data: { status: "skipped" },
      });

      if (updated.count === 0) {
        return { ok: false as const, status: 409, error: "Invitation is not active" };
      }

      return { ok: true as const, eventId: initialEntry.eventId };
    }, eventTransactionOptions),
  );

  if (!result.ok) return result;
  await inviteNextWaitlistEntry(result.eventId);

  return { ok: true as const };
}
