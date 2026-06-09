import { isAdminRequest } from "@/lib/admin";
import { notFound, ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromRequest } from "@/lib/session";
import { inviteNextWaitlistEntry } from "@/lib/waitlist";

type RouteContext = {
  params: Promise<{ id: string; participantId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id, participantId } = await context.params;
    const sessionUserId = getSessionUserIdFromRequest(request);
    const isAdmin = isAdminRequest(request);
    if (!sessionUserId && !isAdmin) return Response.json({ ok: false, error: "Organizer authorization required" }, { status: 401 });

    const event = await prisma.event.findUnique({ where: { id }, select: { organizerId: true } });
    if (!event) return notFound("Event not found");
    if (!isAdmin && event.organizerId !== sessionUserId) {
      return Response.json({ ok: false, error: "Only event organizer can cancel participants" }, { status: 403 });
    }

    const participant = await prisma.eventParticipant.findFirst({
      where: { id: participantId, eventId: id },
    });

    if (!participant) return notFound("Participant not found");

    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: { status: "cancelled" },
    });

    const invited = await inviteNextWaitlistEntry(id);

    return ok({
      cancelledParticipant: participant,
      invitedWaitlistEntry: invited,
    });
  } catch (error) {
    return serverError(error);
  }
}
