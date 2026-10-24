import { qlooGet } from "@/lib/qloo/client";
import { normalizeEntities, type QlooEntity } from "@/lib/qloo/normalize";

function exactName(query: string, entities: QlooEntity[]) {
  const wanted = query.trim().toLowerCase();
  return entities.filter((entity) => entity.name.trim().toLowerCase() === wanted);
}

export async function searchEntities(query: string, types: string, take = 6): Promise<QlooEntity[]> {
  const body = await qlooGet("/search", {
    query,
    types,
    take: String(Math.min(take, 50)),
  });
  return exactName(query, normalizeEntities(body));
}
