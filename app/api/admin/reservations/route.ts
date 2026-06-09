import { requireAdmin } from "@/lib/admin";
import { ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const [participants, waitlistEntries, bookingRequests] = await Promise.all([
      prisma.eventParticipant.findMany({
        include: {
          user: { select: { id: true, name: true, telegramUsername: true } },
          event: { select: { id: true, title: true, date: true, startTime: true } },
          charges: true,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.waitlistEntry.findMany({
        include: {
          user: { select: { id: true, name: true, telegramUsername: true } },
          event: { select: { id: true, title: true, date: true, startTime: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.bookingRequest.findMany({
        include: {
          event: { select: { id: true, title: true, date: true, startTime: true } },
          place: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    return ok({ participants, waitlistEntries, bookingRequests });
  } catch (error) {
    return serverError(error);
  }
}
