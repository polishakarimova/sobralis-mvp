import "dotenv/config";

import { places } from "@/data/places";
import { prisma } from "@/lib/prisma";

async function main() {
  await Promise.all(
    places.map((place) =>
      prisma.place.upsert({
        where: { id: place.id },
        update: {
          title: place.title,
          location: place.location,
          type: place.type,
          capacity: place.capacity,
          hourlyRate: place.hourlyRate,
          minHours: place.minHours,
          price: place.price,
          extraHourRate: place.extraHourRate,
          bookingMode: place.bookingMode,
          availabilityStatus: place.availabilityStatus,
          confirmationTime: place.confirmationTime,
          pricingTitle: place.pricingTitle,
          perHour: place.perHour,
          image: place.image,
          vibe: place.vibe,
        },
        create: {
          id: place.id,
          title: place.title,
          location: place.location,
          type: place.type,
          capacity: place.capacity,
          hourlyRate: place.hourlyRate,
          minHours: place.minHours,
          price: place.price,
          extraHourRate: place.extraHourRate,
          bookingMode: place.bookingMode,
          availabilityStatus: place.availabilityStatus,
          confirmationTime: place.confirmationTime,
          pricingTitle: place.pricingTitle,
          perHour: place.perHour,
          image: place.image,
          vibe: place.vibe,
          includes: {
            create: place.includes.map((title) => ({ title })),
          },
          addOns: {
            create: [
              ...place.addOns.map((addOn) => ({ id: `${place.id}-${addOn.id}`, title: addOn.title, price: addOn.price, type: "pre_event" as const })),
              ...place.onSiteAddOns.map((addOn) => ({ id: `${place.id}-${addOn.id}`, title: addOn.title, price: addOn.price, type: "on_site" as const })),
            ],
          },
        },
      }),
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
