import { z } from "zod";

import { badRequest, notFound, ok, readJson, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const replySchema = z.object({
  status: z.enum(["confirmed", "busy", "another_time"]),
  ownerReply: z.string().optional(),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = replySchema.parse(await readJson(request));
    const bookingRequest = await prisma.bookingRequest.findUnique({ where: { id } });

    if (!bookingRequest) return notFound("Booking request not found");

    const [updatedRequest, event] = await prisma.$transaction([
      prisma.bookingRequest.update({
        where: { id },
        data: {
          status: input.status,
          ownerReply: input.ownerReply ?? input.status,
        },
      }),
      prisma.event.update({
        where: { id: bookingRequest.eventId },
        data: {
          status: input.status === "confirmed" ? "place_confirmed" : "awaiting_place_confirmation",
        },
      }),
    ]);

    return ok({ bookingRequest: updatedRequest, event });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) return badRequest(error);
    return serverError(error);
  }
}
