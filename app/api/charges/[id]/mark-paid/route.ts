import { notFound, ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const charge = await prisma.participantCharge.findUnique({ where: { id } });

    if (!charge) return notFound("Charge not found");

    const [updatedCharge, participant] = await prisma.$transaction([
      prisma.participantCharge.update({
        where: { id },
        data: { status: "marked_paid" },
      }),
      prisma.eventParticipant.update({
        where: { id: charge.participantId },
        data: { paymentStatus: "marked" },
      }),
    ]);

    return ok({ charge: updatedCharge, participant });
  } catch (error) {
    return serverError(error);
  }
}
