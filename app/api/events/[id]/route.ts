import { z } from "zod";

import { isAdminRequest } from "@/lib/admin";
import { badRequest, dateFromInput, notFound, ok, readJson, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  kind: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  mapUrl: z.string().optional(),
  date: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  guestsLimit: z.coerce.number().int().positive().optional(),
  minGuests: z.coerce.number().int().positive().optional(),
  targetBudget: z.coerce.number().int().nonnegative().optional(),
  joinDeadline: z.string().min(1).optional(),
  paymentDeadline: z.string().min(1).optional(),
  paymentMode: z.string().min(1).optional(),
  coverImageUrl: z.string().optional(),
  coverImageKey: z.string().optional(),
  coverImageSource: z.string().optional(),
  coverImagePositionX: z.coerce.number().int().min(0).max(100).optional(),
  coverImagePositionY: z.coerce.number().int().min(0).max(100).optional(),
  coverImageScale: z.coerce.number().int().min(100).max(220).optional(),
});

async function requireEventManager(request: Request, event: { id: string; organizerId: string | null }) {
  if (isAdminRequest(request)) return null;

  const sessionUserId = getSessionUserIdFromRequest(request);
  if (!sessionUserId) return Response.json({ ok: false, error: "Authorization required" }, { status: 401 });
  if (event.organizerId !== sessionUserId) {
    return Response.json({ ok: false, error: "Only event organizer can manage this event" }, { status: 403 });
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        place: {
          include: {
            includes: true,
            addOns: true,
            paymentMethods: true,
          },
        },
        participants: {
          include: {
            addOns: {
              include: { addOn: true },
            },
            charges: true,
            user: true,
          },
          orderBy: { createdAt: "asc" },
        },
        waitlistEntries: {
          orderBy: { createdAt: "asc" },
        },
        charges: {
          include: { participant: true },
          orderBy: { createdAt: "asc" },
        },
        bookingRequests: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) return notFound("Event not found");

    return ok(event);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) return notFound("Event not found");

    const unauthorized = await requireEventManager(request, event);
    if (unauthorized) return unauthorized;

    const input = updateEventSchema.parse(await readJson(request));
    const data = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.mapUrl !== undefined ? { mapUrl: input.mapUrl } : {}),
      ...(input.date !== undefined ? { date: dateFromInput(input.date) } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
      ...(input.guestsLimit !== undefined ? { guestsLimit: input.guestsLimit } : {}),
      ...(input.minGuests !== undefined ? { minGuests: input.minGuests } : {}),
      ...(input.targetBudget !== undefined ? { targetBudget: input.targetBudget } : {}),
      ...(input.joinDeadline !== undefined ? { joinDeadline: dateFromInput(input.joinDeadline) } : {}),
      ...(input.paymentDeadline !== undefined ? { paymentDeadline: dateFromInput(input.paymentDeadline) } : {}),
      ...(input.paymentMode !== undefined ? { paymentMode: input.paymentMode } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl || null } : {}),
      ...(input.coverImageKey !== undefined ? { coverImageKey: input.coverImageKey || null } : {}),
      ...(input.coverImageSource !== undefined ? { coverImageSource: input.coverImageSource || null } : {}),
      ...(input.coverImagePositionX !== undefined ? { coverImagePositionX: input.coverImagePositionX } : {}),
      ...(input.coverImagePositionY !== undefined ? { coverImagePositionY: input.coverImagePositionY } : {}),
      ...(input.coverImageScale !== undefined ? { coverImageScale: input.coverImageScale } : {}),
    };

    const placeUpdates = {
      ...(input.venue !== undefined ? { title: input.venue } : {}),
      ...(input.mapUrl !== undefined ? { location: input.mapUrl } : {}),
      ...(input.kind !== undefined ? { type: input.kind } : {}),
      ...(input.guestsLimit !== undefined ? { capacity: input.guestsLimit } : {}),
      ...(input.targetBudget !== undefined
        ? { price: input.targetBudget, perHour: input.targetBudget ? `${input.targetBudget} ₽` : "без оплаты" }
        : {}),
    };

    if (Object.keys(placeUpdates).length > 0) {
      const eventsOnPlace = await prisma.event.count({ where: { placeId: event.placeId } });
      if (eventsOnPlace === 1) {
        await prisma.place.update({
          where: { id: event.placeId },
          data: placeUpdates,
        });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data,
      include: {
        place: {
          include: {
            includes: true,
            addOns: true,
            paymentMethods: true,
          },
        },
        participants: {
          include: {
            addOns: {
              include: { addOn: true },
            },
            charges: true,
            user: true,
          },
          orderBy: { createdAt: "asc" },
        },
        waitlistEntries: {
          orderBy: { createdAt: "asc" },
        },
        charges: {
          include: { participant: true },
          orderBy: { createdAt: "asc" },
        },
        bookingRequests: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (isAdminRequest(request)) {
      await prisma.adminAction.create({
        data: {
          action: "event.update",
          entityType: "event",
          entityId: id,
        },
      });
    }

    return ok(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) return badRequest(error);
    return serverError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) return notFound("Event not found");

    const unauthorized = await requireEventManager(request, event);
    if (unauthorized) return unauthorized;

    await prisma.event.delete({ where: { id } });
    if (isAdminRequest(request)) {
      await prisma.adminAction.create({
        data: {
          action: "event.delete",
          entityType: "event",
          entityId: id,
        },
      });
    }

    return ok({ deleted: true });
  } catch (error) {
    return serverError(error);
  }
}
