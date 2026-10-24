/**
 * Hand-authored playback for when QLOO_API_KEY is absent.
 * Ids are invented. This is not a saved Qloo response.
 */

type CatalogExplain = {
  entityId: string;
  name: string;
  weight: number;
};

type CatalogEntity = {
  entityId: string;
  name: string;
  type: string;
  affinity: number | null;
  popularity: number | null;
  tags: string[];
  queries: string[];
  localities: string[];
  explain?: CatalogExplain[];
};

const CATALOG: CatalogEntity[] = [
  {
    entityId: "fixture:place:via-carota",
    name: "Via Carota",
    type: "urn:entity:place",
    affinity: 0.84,
    popularity: 0.71,
    tags: ["restaurant"],
    queries: ["via carota"],
    localities: ["west village"],
  },
  {
    entityId: "fixture:place:i-sodi",
    name: "I Sodi",
    type: "urn:entity:place",
    affinity: 0.79,
    popularity: 0.66,
    tags: ["restaurant"],
    queries: ["i sodi"],
    localities: ["west village"],
  },
  {
    entityId: "fixture:place:dante",
    name: "Dante",
    type: "urn:entity:place",
    affinity: 0.61,
    popularity: 0.7,
    tags: ["bar"],
    queries: ["dante"],
    localities: ["west village"],
  },
  {
    entityId: "fixture:place:the-windsor",
    name: "The Windsor",
    type: "urn:entity:place",
    affinity: 0.28,
    popularity: 0.4,
    tags: ["sports bar"],
    queries: ["the windsor"],
    localities: ["west village"],
  },
  {
    entityId: "fixture:place:west-village-sports-bar",
    name: "West Village sports bar",
    type: "urn:entity:place",
    affinity: 0.22,
    popularity: 0.33,
    tags: ["sports bar"],
    queries: ["west village sports bar"],
    localities: ["west village"],
  },
  {
    entityId: "fixture:brand:natural-wine-label",
    name: "Natural wine label",
    type: "urn:entity:brand",
    affinity: 0.71,
    popularity: 0.44,
    tags: ["wine"],
    queries: ["natural wine label"],
    localities: ["west village"],
    explain: [{ entityId: "fixture:place:via-carota", name: "Via Carota", weight: 0.64 }],
  },
  {
    entityId: "fixture:artist:neighborhood-artist",
    name: "Neighborhood artist",
    type: "urn:entity:artist",
    affinity: 0.48,
    popularity: 0.36,
    tags: ["artist"],
    queries: ["neighborhood artist"],
    localities: ["west village"],
    explain: [{ entityId: "fixture:place:via-carota", name: "Via Carota", weight: 0.51 }],
  },
  {
    entityId: "fixture:movie:chamber-film",
    name: "Chamber film",
    type: "urn:entity:movie",
    affinity: 0.44,
    popularity: 0.3,
    tags: ["film"],
    queries: ["chamber film"],
    localities: ["west village"],
  },
  {
    entityId: "fixture:brand:madewell",
    name: "Madewell",
    type: "urn:entity:brand",
    affinity: 0.77,
    popularity: 0.62,
    tags: ["apparel"],
    queries: ["madewell"],
    localities: ["williamsburg"],
  },
  {
    entityId: "fixture:brand:lululemon",
    name: "Lululemon",
    type: "urn:entity:brand",
    affinity: 0.74,
    popularity: 0.8,
    tags: ["athleisure"],
    queries: ["lululemon"],
    localities: ["williamsburg"],
  },
  {
    entityId: "fixture:brand:urban-outfitters",
    name: "Urban Outfitters",
    type: "urn:entity:brand",
    affinity: 0.36,
    popularity: 0.7,
    tags: ["apparel"],
    queries: ["urban outfitters"],
    localities: ["williamsburg"],
  },
  {
    entityId: "fixture:brand:off-price-outlet",
    name: "Off-price outlet",
    type: "urn:entity:brand",
    affinity: 0.31,
    popularity: 0.4,
    tags: ["off-price"],
    queries: ["off-price outlet"],
    localities: ["williamsburg"],
  },
  {
    entityId: "fixture:place:seco",
    name: "Seco",
    type: "urn:entity:place",
    affinity: 0.8,
    popularity: 0.5,
    tags: ["wine bar"],
    queries: ["seco"],
    localities: ["silver lake", "silver lake, los angeles"],
  },
  {
    entityId: "fixture:place:barr-seco",
    name: "Barr Seco",
    type: "urn:entity:place",
    affinity: 0.78,
    popularity: 0.48,
    tags: ["wine bar"],
    queries: ["barr seco"],
    localities: ["silver lake", "silver lake, los angeles"],
  },
  {
    entityId: "fixture:brand:shake-shack",
    name: "Shake Shack",
    type: "urn:entity:brand",
    affinity: 0.24,
    popularity: 0.9,
    tags: ["fast casual"],
    queries: ["shake shack"],
    localities: ["silver lake", "silver lake, los angeles"],
  },
  {
    entityId: "fixture:brand:national-fast-casual",
    name: "National fast casual",
    type: "urn:entity:brand",
    affinity: 0.21,
    popularity: 0.55,
    tags: ["fast casual"],
    queries: ["national fast casual"],
    localities: ["silver lake", "silver lake, los angeles"],
  },
];

function takeOf(params: Record<string, string>, fallback: number) {
  const parsed = Number(params.take);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 50);
}

function toSearchRow(entity: CatalogEntity) {
  return {
    entity_id: entity.entityId,
    name: entity.name,
    types: [entity.type],
    popularity: entity.popularity,
    tags: entity.tags.map((name) => ({ name })),
  };
}

function toInsightRow(entity: CatalogEntity, params: Record<string, string>) {
  const row: Record<string, unknown> = {
    entity_id: entity.entityId,
    name: entity.name,
    type: entity.type,
    popularity: entity.popularity,
    tags: entity.tags.map((name) => ({ name })),
    query: { affinity: entity.affinity },
  };
  if (params["feature.explainability"] === "true" && entity.explain?.length) {
    row.explainability = entity.explain.map((item) => ({
      entity_id: item.entityId,
      name: item.name,
      weight: item.weight,
    }));
  }
  return row;
}

export function playbackBody(path: string, params: Record<string, string>): unknown {
  if (path === "/search") {
    const query = (params.query ?? "").trim().toLowerCase();
    const type = params.types;
    const hits = CATALOG.filter(
      (entity) => entity.type === type && entity.queries.some((name) => name === query),
    ).slice(0, takeOf(params, 6));
    return { results: hits.map(toSearchRow) };
  }

  if (path === "/v2/insights") {
    const type = params["filter.type"];
    const locality = (params["filter.location.query"] ?? params["signal.location.query"] ?? "")
      .trim()
      .toLowerCase();
    const interestIds = (params["signal.interests.entities"] ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const hits = CATALOG.filter((entity) => {
      if (entity.type !== type) return false;
      if (locality !== "" && !entity.localities.includes(locality)) return false;
      if (interestIds.length === 0) return true;
      return (
        interestIds.includes(entity.entityId) ||
        entity.explain?.some((item) => interestIds.includes(item.entityId)) === true
      );
    }).slice(0, takeOf(params, 8));
    return { results: { entities: hits.map((entity) => toInsightRow(entity, params)) } };
  }

  if (path === "/v2/tags") {
    return { results: { tags: [] } };
  }

  return { results: [] };
}
