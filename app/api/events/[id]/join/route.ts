import { z } from "zod";

import { badRequest, makePaymentCode, notFound, ok, readJson, serverError } from "@/lib/api";
import { lockEventForUpdate, withEventQueue } from "@/lib/event-lock";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const joinSchema = z.object({
  name: z.string().min(1),
  comment: z.string().optional(),
  userId: z.string().min(1).optional(),
  status: z.enum(["interested", "joined"]).default("joined"),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = joinSchema.parse(await readJson(request));
    const sessionUserId = getSessionUserIdFromRequest(request);
    const userId = sessionUserId || input.userId;

    const result = await withEventQueue(id, () =>
      prisma.$transaction(
      async (tx) => {
        await lockEventForUpdate(tx, id);

        const event = await tx.event.findUnique({
          where: { id },
          include: {
            place: true,
            participants: {
              where: { status: { in: ["interested", "joined", "invited_from_waitlist"] } },
            },
            waitlistEntries: {
              where: { status: { in: ["waiting", "invited"] } },
            },
          },
        });

        if (!event) return { kind: "notFound" as const };

        if (userId) {
          const existingParticipant = await tx.eventParticipant.findFirst({
            where: {
              eventId: event.id,
              userId,
              status: { in: ["interested", "joined", "invited_from_waitlist"] },
            },
          });
          if (existingParticipant) {
            return {
              kind: "ok" as const,
              status: 200,
              data: { waitlisted: false, participant: existingParticipant, alreadyJoined: true },
            };
          }

          const existingWaitlist = await tx.waitlistEntry.findFirst({
            where: {
              eventId: event.id,
              userId,
              status: { in: ["waiting", "invited"] },
            },
          });
          if (existingWaitlist) {
            return {
              kind: "ok" as const,
              status: 200,
              data: { waitlisted: true, waitlistEntry: existingWaitlist, alreadyWaitlisted: true },
            };
          }
        }

        const seatsLeft = Math.max(event.guestsLimit - event.participants.length - event.waitlistEntries.length, 0);
        if (seatsLeft <= 0) {
          const waitlistEntry = await tx.waitlistEntry.create({
            data: {
              eventId: event.id,
              userId,
              name: input.name,
              comment: input.comment,
              status: "waiting",
            },
          });

          return { kind: "ok" as const, status: 201, data: { waitlisted: true, waitlistEntry } };
        }

        const participant = await tx.eventParticipant.create({
          data: {
            eventId: event.id,
            userId,
            name: input.name,
            comment: input.comment,
            status: input.status,
            paymentStatus: "idle",
          },
        });

        const baseAmount = Math.ceil(event.place.price / Math.max(event.guestsLimit, 1));
        const charge = await tx.participantCharge.create({
          data: {
            eventId: event.id,
            participantId: participant.id,
            baseAmount,
            addOnsAmount: 0,
            totalAmount: baseAmount,
            paymentCode: makePaymentCode(),
            status: "waiting",
          },
        });

        return { kind: "ok" as const, status: 201, data: { waitlisted: false, participant, charge } };
      },
        { maxWait: 10000, timeout: 15000 },
      ),
    );

    if (result.kind === "notFound") return notFound("Event not found");
    return ok(result.data, { status: result.status });
  } catch (error) {
    if (error instanceof z.ZodError) return badRequest(error);
    return serverError(error);
  }
}
