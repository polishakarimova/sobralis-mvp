import { ok, serverError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      include: {
        includes: true,
        addOns: {
          where: { type: "pre_event" },
        },
        paymentMethods: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const data = await Promise.all(
      places.map(async (place) => ({
        ...place,
        onSiteAddOns: await prisma.placeAddOn.findMany({
          where: { placeId: place.id, type: "on_site" },
          orderBy: { createdAt: "asc" },
        }),
      })),
    );

    return ok(data);
  } catch (error) {
    return serverError(error);
  }
}
