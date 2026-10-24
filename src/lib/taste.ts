import { insights } from "@/lib/qloo/insights";
import type { QlooEntity } from "@/lib/qloo/normalize";
import type { Hop, HopEntity } from "@/types/deal";

export type TasteFetcher = (params: Record<string, string>) => Promise<QlooEntity[]>;

export type NeighborhoodTaste = {
  places: QlooEntity[];
  brands: QlooEntity[];
  artists: QlooEntity[];
  hops: Hop[];
};

function shortType(type: string) {
  return type.split(":").pop() ?? type;
}

function toHopEntity(entity: QlooEntity): HopEntity {
  return {
    entityId: entity.entityId,
    name: entity.name,
    type: shortType(entity.type),
    affinity: entity.affinity,
    explain: entity.explain,
  };
}

async function tasteHop(
  id: string,
  purpose: string,
  filterType: string,
  locality: string,
  params: Record<string, string>,
  fetchInsights: TasteFetcher,
): Promise<{ entities: QlooEntity[]; hop: Hop }> {
  const started = Date.now();
  const entities = await fetchInsights(params);
  return {
    entities,
    hop: {
      id,
      purpose,
      filterType,
      location: locality,
      entityCount: entities.length,
      duration: `${Date.now() - started}ms`,
      entities: entities.map(toHopEntity),
    },
  };
}

export async function neighborhoodTaste(
  locality: string,
  fetchInsights: TasteFetcher = insights,
): Promise<NeighborhoodTaste> {
  const take = "8";
  const [places, brands, artists] = await Promise.all([
    tasteHop("taste-places", "Neighborhood places", "urn:entity:place", locality, {
      "filter.type": "urn:entity:place",
      "filter.location.query": locality,
      "feature.explainability": "true",
      take,
    }, fetchInsights),
    tasteHop("taste-brands", "Neighborhood brands", "urn:entity:brand", locality, {
      "filter.type": "urn:entity:brand",
      "signal.location.query": locality,
      "feature.explainability": "true",
      take,
    }, fetchInsights),
    tasteHop("taste-artists", "Neighborhood artists", "urn:entity:artist", locality, {
      "filter.type": "urn:entity:artist",
      "signal.location.query": locality,
      "feature.explainability": "true",
      take,
    }, fetchInsights),
  ]);

  return {
    places: places.entities,
    brands: brands.entities,
    artists: artists.entities,
    hops: [places.hop, brands.hop, artists.hop],
  };
}
