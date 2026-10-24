import type { Deal } from "@/types/deal";

const globalStore = globalThis as unknown as {
  __sitefitDeals?: Map<string, Deal>;
};

const deals = globalStore.__sitefitDeals ?? new Map<string, Deal>();
globalStore.__sitefitDeals = deals;

export function saveDeal(deal: Deal) {
  deals.set(deal.id, deal);
}

export function getDeal(id: string) {
  return deals.get(id);
}
