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
      },
    });

    if (!event) return notFound("Event not found");
    if (event.participants.length < event.minGuests) return conflict("Minimum participants target is not reached");

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: "composition_fixed" },
    });

    return ok(updatedEvent);
  } catch (error) {
    return serverError(error);
  }
}
