import { get, put } from "@vercel/blob";
import type { Deal } from "@/types/deal";

const globalStore = globalThis as unknown as {
  __sitefitDeals?: Map<string, Deal>;
};

const deals = globalStore.__sitefitDeals ?? new Map<string, Deal>();
globalStore.__sitefitDeals = deals;

function blobPath(id: string) {
  return `deals/${id}.json`;
}

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveDeal(deal: Deal) {
  deals.set(deal.id, deal);
  if (!blobEnabled()) return;
  await put(blobPath(deal.id), JSON.stringify(deal), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getDeal(id: string): Promise<Deal | undefined> {
  const cached = deals.get(id);
  if (cached) return cached;
  if (!blobEnabled()) return undefined;
  const result = await get(blobPath(id), { access: "private", useCache: false });
  if (!result?.stream) return undefined;
  const deal = JSON.parse(await new Response(result.stream).text()) as Deal;
  deals.set(id, deal);
  return deal;
}
