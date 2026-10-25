import { qlooMode } from "@/lib/qloo/client";
import { insights } from "@/lib/qloo/insights";
import type { QlooEntity } from "@/lib/qloo/normalize";
import { searchEntities } from "@/lib/qloo/search";
import { formatSeconds, type RunProgress } from "@/lib/agent/progress";
import { writeMemo, type MemoPacket, type PacketEntity } from "@/lib/agent/writeMemo";
import { scoreConcept } from "@/lib/scoring";
import type { DealConcept, Hop, HopEntity } from "@/types/deal";

const MAX_CALLS = 12;

type InsightFn = (params: Record<string, string>) => Promise<QlooEntity[]>;
type SearchFn = (query: string, types: string, take?: number) => Promise<QlooEntity[]>;

export type RunDeps = {
  search: SearchFn;
  insights: InsightFn;
  source?: "fixture" | "live";
  onProgress?: (event: RunProgress) => void;
};

export type RunInput = {
  locality: string;
  concepts: DealConcept[];
};

export type RunOutput = {
  hops: Hop[];
  memo: Awaited<ReturnType<typeof writeMemo>>;
  insufficient: boolean;
  qlooSource: "fixture" | "live";
  calls: number;
};

function shortType(type: string) {
  return type.split(":").pop() ?? type;
}

function toHopEntity(entity: QlooEntity, conceptId?: string): HopEntity {
  return {
    entityId: entity.entityId,
    name: entity.name,
    type: shortType(entity.type),
    affinity: entity.affinity,
    conceptId,
    explain: entity.explain,
  };
}

function isPlace(type: string) {
  return type === "place" || type.endsWith(":place");
}

function isBrand(type: string) {
  return type === "brand" || type.endsWith(":brand");
}

function nameDrivers(entities: HopEntity[], names: Map<string, string>) {
  for (const entity of entities) {
    if (!entity.explain) continue;
    entity.explain = entity.explain.map((item) => ({
      ...item,
      inputName: item.inputName ?? names.get(item.inputId.toUpperCase()),
    }));
  }
}

export async function runDeal(input: RunInput, deps: RunDeps = { search: searchEntities, insights }): Promise<RunOutput> {
  const hops: Hop[] = [];
  let calls = 0;
  const report = (event: RunProgress) => deps.onProgress?.(event);

  async function hop(
    id: string,
    purpose: string,
    filterType: string,
    location: string,
    load: () => Promise<QlooEntity[]>,
    conceptId?: string,
  ) {
    if (calls >= MAX_CALLS) return { id, entities: [] as HopEntity[] };
    calls += 1;
    const started = Date.now();
    const entities = await load();
    const rows = entities.map((entity) => toHopEntity(entity, conceptId));
    hops.push({
      id,
      purpose,
      filterType,
      location,
      entityCount: rows.length,
      duration: `${Date.now() - started}ms`,
      entities: rows,
      warning: rows.length === 0 ? "empty" : undefined,
    });
    return { id, entities: rows };
  }

  report({ id: "site", status: "running" });
  const siteStarted = Date.now();
  const sitePlaces = await hop("site-places", "Resolve site", "urn:entity:place", input.locality, () =>
    deps.insights({
      "filter.type": "urn:entity:place",
      "filter.location.query": input.locality,
      take: "8",
    }),
  );
  report({
    id: "site",
    status: "done",
    detail: `${sitePlaces.entities.length} entities`,
    duration: formatSeconds(Date.now() - siteStarted),
  });

  const anchors = new Map<string, string[]>();
  const anchorNames = new Map<string, string>();
  report({ id: "concepts", status: "running" });
  const searchStarted = Date.now();
  let resolvedAnchors = 0;
  for (const concept of input.concepts) {
    const ids: string[] = [];
    for (const [index, anchor] of concept.anchorQueries.entries()) {
      const found = await hop(
        `search-${concept.id}-${index}`,
        "Resolve concepts",
        anchor.type,
        anchor.query,
        () => deps.search(anchor.query, anchor.type, 8),
      );
      const preferred = anchor.entityId
        ? found.entities.find((entity) => entity.entityId?.toUpperCase() === anchor.entityId?.toUpperCase())
        : undefined;
      const hit = preferred ?? found.entities[0];
      const id = hit?.entityId ?? anchor.entityId;
      if (id) {
        resolvedAnchors += 1;
        ids.push(id);
        anchorNames.set(id.toUpperCase(), anchor.query);
      }
    }
    anchors.set(concept.id, ids);
  }
  report({
    id: "concepts",
    status: "done",
    detail: `${resolvedAnchors} anchors`,
    duration: formatSeconds(Date.now() - searchStarted),
  });

  report({ id: "brands", status: "running" });
  const brandsStarted = Date.now();
  const neighborhoodBrands = await hop("taste-brands", "Neighborhood brands", "urn:entity:brand", input.locality, () =>
    deps.insights({
      "filter.type": "urn:entity:brand",
      "signal.location.query": input.locality,
      "feature.explainability": "true",
      take: "8",
    }),
  );
  report({
    id: "brands",
    status: "done",
    detail: `${neighborhoodBrands.entities.length} entities`,
    duration: formatSeconds(Date.now() - brandsStarted),
  });

  report({ id: "artists", status: "running" });
  const artistsStarted = Date.now();
  const neighborhoodArtists = await hop("taste-artists", "Neighborhood artists", "urn:entity:artist", input.locality, () =>
    deps.insights({
      "filter.type": "urn:entity:artist",
      "signal.location.query": input.locality,
      "feature.explainability": "true",
      take: "8",
    }),
  );
  report({
    id: "artists",
    status: "done",
    detail: `${neighborhoodArtists.entities.length} entities`,
    duration: formatSeconds(Date.now() - artistsStarted),
  });

  const packetConcepts: MemoPacket["concepts"] = [];
  for (const [conceptIndex, concept] of input.concepts.entries()) {
    const step = conceptIndex === 0 ? "score-a" : "score-b";
    report({ id: step, status: "running" });
    const scoreStarted = Date.now();
    const ids = anchors.get(concept.id) ?? [];
    const interest = ids.join(",");
    let placeRows: HopEntity[] = [];
    let brandRows: HopEntity[] = [];
    if (interest) {
      const places = await hop(
        `score-places-${concept.id}`,
        "Score places",
        "urn:entity:place",
        concept.label,
        () =>
          deps.insights({
            "filter.type": "urn:entity:place",
            "filter.location.query": input.locality,
            "signal.interests.entities": interest,
            "feature.explainability": "true",
            take: "10",
          }),
        concept.id,
      );
      placeRows = places.entities;
      const brands = await hop(
        `score-brands-${concept.id}`,
        "Score brands",
        "urn:entity:brand",
        concept.label,
        () =>
          deps.insights({
            "filter.type": "urn:entity:brand",
            "signal.location.query": input.locality,
            "signal.interests.entities": interest,
            "feature.explainability": "true",
            take: "10",
          }),
        concept.id,
      );
      brandRows = brands.entities;
      if (brandRows.length === 0) {
        const retry = await hop(
          `score-brands-${concept.id}-noloc`,
          "Score brands",
          "urn:entity:brand",
          concept.label,
          () =>
            deps.insights({
              "filter.type": "urn:entity:brand",
              "signal.interests.entities": interest,
              "feature.explainability": "true",
              take: "10",
            }),
          concept.id,
        );
        brandRows = retry.entities;
      }
    }

    report({
      id: step,
      status: "done",
      detail: `${placeRows.length + brandRows.length} entities`,
      duration: formatSeconds(Date.now() - scoreStarted),
    });
    nameDrivers(placeRows, anchorNames);
    nameDrivers(brandRows, anchorNames);
    const score = scoreConcept({
      conceptId: concept.id,
      placeAffinities: placeRows.filter((entity) => isPlace(entity.type)).map((entity) => entity.affinity),
      brandAffinities: brandRows.filter((entity) => isBrand(entity.type)).map((entity) => entity.affinity),
      explainWeights: [...placeRows, ...brandRows].flatMap((entity) => (entity.explain ?? []).map((row) => row.weight)),
    });
    const entities: PacketEntity[] = [...placeRows, ...brandRows].flatMap((entity) => {
      if (entity.affinity === null) return [];
      const hopId = hops.find((row) => row.entities.some((item) => item === entity))?.id ?? concept.id;
      return [{ hopId, name: entity.name, affinity: entity.affinity, explain: entity.explain }];
    });
    packetConcepts.push({
      id: concept.id,
      label: concept.label,
      role: concept.role,
      score: score.status === "scored" ? score : null,
      entities,
    });
  }

  const warnings = sitePlaces.entities.length === 0 ? ["The site place hop returned no entities."] : [];
  report({ id: "memo", status: "running" });
  const memoStarted = Date.now();
  const memo = await writeMemo(
    { locality: input.locality, concepts: packetConcepts, warnings },
    deps.source === "fixture" ? null : undefined,
  );
  report({
    id: "memo",
    status: "done",
    detail: memo ? "memo" : "—",
    duration: formatSeconds(Date.now() - memoStarted),
  });
  return {
    hops,
    memo,
    insufficient: memo === null,
    qlooSource: deps.source ?? qlooMode(),
    calls,
  };
}
