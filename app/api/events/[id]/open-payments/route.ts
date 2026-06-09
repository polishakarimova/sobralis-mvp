import { conflict, notFound, ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          where: { status: { in: ["interested", "joined", "invited_from_waitlist"] } },
        },
        bookingRequests: true,
      },
    });

    if (!event) return notFound("Event not found");
    if (!event.bookingRequests.some((request) => request.status === "confirmed")) {
      return conflict("Place booking is not confirmed");
    }
    if (event.participants.length < event.minGuests) {
      return conflict("Minimum participants target is not reached");
    }
    if (event.status !== "composition_fixed") {
      return conflict("Composition must be fixed before opening payments");
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: "payments_open" },
    });

    return ok({ event: updatedEvent, simulatedNotifications: true });
  } catch (error) {
    return serverError(error);
  }
}
