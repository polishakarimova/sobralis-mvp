import { z } from "zod";

import { badRequest, dateFromInput, makeShareSlug, ok, readJson, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/session";

const createEventSchema = z.object({
  title: z.string().min(1),
  kind: z.string().min(1).default("other"),
  placeId: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  mapUrl: z.string().optional(),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1).optional(),
  guestsLimit: z.coerce.number().int().positive(),
  minGuests: z.coerce.number().int().positive().optional().default(1),
  targetBudget: z.coerce.number().int().nonnegative().default(0),
  joinDeadline: z.string().min(1).optional(),
  paymentDeadline: z.string().min(1).optional(),
  paymentMode: z.string().min(1),
  organizerId: z.string().min(1).optional(),
  coverImageUrl: z.string().min(1).optional(),
  coverImageKey: z.string().min(1).optional(),
  coverImageSource: z.string().min(1).optional(),
  coverImagePositionX: z.coerce.number().int().min(0).max(100).optional().default(50),
  coverImagePositionY: z.coerce.number().int().min(0).max(100).optional().default(50),
  coverImageScale: z.coerce.number().int().min(100).max(220).optional().default(100),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionUserId = getSessionUserIdFromRequest(request);
    const organizerId = sessionUserId || searchParams.get("organizerId") || undefined;
    const events = await prisma.event.findMany({
      where: organizerId ? { organizerId } : undefined,
      include: {
        organizer: true,
        place: true,
        participants: { orderBy: { createdAt: "asc" } },
        waitlistEntries: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(events);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createEventSchema.parse(await readJson(request));
    const sessionUserId = getSessionUserIdFromRequest(request);
    const inputOrganizerId =
      input.organizerId && !input.organizerId.startsWith("local-")
        ? (await prisma.user.findUnique({ where: { id: input.organizerId }, select: { id: true } }))?.id
        : undefined;

    const place = input.placeId
      ? await prisma.place.findUnique({ where: { id: input.placeId } })
      : await prisma.place.create({
          data: {
            title: input.venue || input.title,
            location: input.mapUrl || "",
            type: input.kind,
            capacity: input.guestsLimit,
            hourlyRate: 0,
            minHours: 1,
            price: input.targetBudget,
            extraHourRate: 0,
            bookingMode: "manager",
            availabilityStatus: "available",
            confirmationTime: "не требуется",
            pricingTitle: input.paymentMode === "manual" ? "оплата по реквизитам организатора" : "без оплаты",
            perHour: input.targetBudget ? `${input.targetBudget} ₽` : "без оплаты",
            image: "",
            vibe: input.title,
          },
        });

    if (!place) return Response.json({ ok: false, error: "Place not found" }, { status: 404 });

    const event = await prisma.event.create({
      data: {
        title: input.title,
        kind: input.kind,
        mapUrl: input.mapUrl,
        placeId: place.id,
        organizerId: sessionUserId || inputOrganizerId,
        date: dateFromInput(input.date),
        startTime: input.startTime,
        endTime: input.endTime ?? input.startTime,
        guestsLimit: input.guestsLimit,
        minGuests: input.minGuests,
        targetBudget: input.targetBudget,
        joinDeadline: dateFromInput(input.joinDeadline ?? input.date),
        paymentDeadline: dateFromInput(input.paymentDeadline ?? input.date),
        paymentMode: input.paymentMode,
        coverImageUrl: input.coverImageUrl,
        coverImageKey: input.coverImageKey,
        coverImageSource: input.coverImageSource,
        coverImagePositionX: input.coverImagePositionX,
        coverImagePositionY: input.coverImagePositionY,
        coverImageScale: input.coverImageScale,
        status: "collecting_interest",
        shareSlug: makeShareSlug(input.title),
        bookingRequests: {
          create: {
            placeId: place.id,
            status: input.paymentMode === "none" ? "confirmed" : "pending",
          },
        },
      },
      include: {
        place: true,
        participants: true,
        waitlistEntries: true,
        bookingRequests: true,
      },
    });

    return ok(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) return badRequest(error);
    return serverError(error);
  }
}
