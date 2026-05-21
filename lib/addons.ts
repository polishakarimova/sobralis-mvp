import type { AddOn } from "@/types/place";

export function getAddOnTitles(ids: string[], source: Pick<AddOn, "id" | "title">[] = []) {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => source.find((item) => item.id === id)?.title).filter(Boolean);
}

export function getAddOnsTotal(ids: string[], source: Pick<AddOn, "id" | "price">[] = []) {
  if (!ids || ids.length === 0) return 0;
  return ids.reduce((sum, id) => {
    const addon = source.find((item) => item.id === id);
    return sum + (addon?.price || 0);
  }, 0);
}
