import { requireAdmin } from "@/lib/admin";
import { ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        telegramId: true,
        telegramUsername: true,
        telegramFirstName: true,
        telegramLastName: true,
        telegramLinkedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            organizedEvents: true,
            participants: true,
            waitlistEntries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok(users);
  } catch (error) {
    return serverError(error);
  }
}
