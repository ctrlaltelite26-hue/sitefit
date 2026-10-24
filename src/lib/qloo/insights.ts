import { qlooGet } from "@/lib/qloo/client";
import { normalizeEntities, type QlooEntity } from "@/lib/qloo/normalize";

export async function insights(params: Record<string, string>): Promise<QlooEntity[]> {
  const body = await qlooGet("/v2/insights", params);
  return normalizeEntities(body);
}

export async function insightsPlacesByLocality(locality: string, take = 8): Promise<QlooEntity[]> {
  return insights({
    "filter.type": "urn:entity:place",
    "filter.location.query": locality,
    take: String(Math.min(take, 50)),
  });
}
