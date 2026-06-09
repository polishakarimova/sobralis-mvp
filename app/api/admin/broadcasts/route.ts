import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { badRequest, ok, readJson, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(2000),
  target: z.enum(["all_users", "organizers", "participants"]).default("all_users"),
  simulateSend: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const broadcasts = await prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok(broadcasts);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const input = broadcastSchema.parse(await readJson(request));
    const broadcast = await prisma.broadcast.create({
      data: {
        title: input.title,
        message: input.message,
        target: input.target,
        status: input.simulateSend ? "simulated_sent" : "draft",
        sentAt: input.simulateSend ? new Date() : null,
      },
    });

    await prisma.adminAction.create({
      data: {
        action: input.simulateSend ? "broadcast.simulated_send" : "broadcast.create",
        entityType: "broadcast",
        entityId: broadcast.id,
        metadata: { target: input.target },
      },
    });

    return ok(broadcast, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) return badRequest(error);
    return serverError(error);
  }
}
