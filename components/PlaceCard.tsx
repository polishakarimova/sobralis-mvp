/* eslint-disable @next/next/no-img-element */
import { availabilityLabels, bookingModeLabels } from "@/lib/availability";
import type { Place } from "@/types/place";

type PlaceCardProps = {
  place: Place;
  openPlace: (place: Place) => void;
};

export default function PlaceCard({ place, openPlace }: PlaceCardProps) {
  return <article className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm"><img src={place.image} alt={place.title} className="h-44 w-full object-cover" /><div className="p-5"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">{place.type}</div><h2 className="text-xl font-black">{place.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{place.location}</p><div className="mt-4 flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"><span className="text-sm text-stone-600">до {place.capacity} гостей</span><b>{place.perHour}</b></div><div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${availabilityLabels[place.availabilityStatus || "request"].className}`}>{availabilityLabels[place.availabilityStatus || "request"].title}</span><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">{bookingModeLabels[place.bookingMode]}</span></div><button onClick={() => openPlace(place)} className="mt-4 w-full rounded-2xl bg-stone-950 px-4 py-3 font-black text-white">Открыть</button></div></article>;
}
