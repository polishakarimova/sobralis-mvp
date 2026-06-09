import { z } from "zod";

import { badRequest, notFound, ok, readJson, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const confirmSchema = z.object({
  result: z.enum(["seen", "not_seen"]),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = confirmSchema.parse(await readJson(request));
    const charge = await prisma.participantCharge.findUnique({ where: { id } });

    if (!charge) return notFound("Charge not found");

    const seen = input.result === "seen";
    const [updatedCharge, participant] = await prisma.$transaction([
      prisma.participantCharge.update({
        where: { id },
        data: { status: seen ? "confirmed_by_owner" : "rejected_by_owner" },
      }),
      prisma.eventParticipant.update({
        where: { id: charge.participantId },
        data: { paymentStatus: seen ? "confirmed" : "rejected" },
      }),
    ]);

    return ok({ charge: updatedCharge, participant });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof Error) return badRequest(error);
    return serverError(error);
  }
}
