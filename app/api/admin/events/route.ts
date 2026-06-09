import { requireAdmin } from "@/lib/admin";
import { ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            telegramUsername: true,
          },
        },
        place: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
          },
        },
        _count: {
          select: {
            participants: true,
            waitlistEntries: true,
            charges: true,
            bookingRequests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok(events);
  } catch (error) {
    return serverError(error);
  }
}
