import { notFound, ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        includes: true,
        addOns: {
          where: { type: "pre_event" },
        },
        paymentMethods: true,
      },
    });

    if (!place) return notFound("Place not found");

    const onSiteAddOns = await prisma.placeAddOn.findMany({
      where: { placeId: place.id, type: "on_site" },
      orderBy: { createdAt: "asc" },
    });

    return ok({ ...place, onSiteAddOns });
  } catch (error) {
    return serverError(error);
  }
}
