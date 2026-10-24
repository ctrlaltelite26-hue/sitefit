import { insights } from "@/lib/qloo/insights";
import { QlooHttpError } from "@/lib/qloo/errors";
import type { QlooEntity } from "@/lib/qloo/normalize";
import { searchEntities } from "@/lib/qloo/search";
import { scoreConcept, type ConceptScore } from "@/lib/scoring";
import { BACKTEST_CASES, toAgentInput, type AgentBacktestInput } from "@/lib/backtest/cases";

type InsightFn = (params: Record<string, string>) => Promise<QlooEntity[]>;
type SearchFn = (query: string, types: string, take?: number) => Promise<QlooEntity[]>;

export type BacktestDeps = {
  search: SearchFn;
  insights: InsightFn;
};

export type BacktestRow = {
  id: string;
  dropped: boolean;
  survivorScore: number | null;
  closedScore: number | null;
  picked: boolean | null;
  note: string;
};

const SEARCH_TYPES = ["urn:entity:place", "urn:entity:brand"];

async function resolveIds(queries: string[], search: SearchFn) {
  const ids: string[] = [];
  const missed: string[] = [];
  for (const query of queries) {
    let found = false;
    for (const type of SEARCH_TYPES) {
      const hits = await search(query, type, 1);
      if (hits[0]) {
        ids.push(hits[0].entityId);
        found = true;
        break;
      }
    }
    if (!found) missed.push(query);
  }
  return { ids, missed };
}

function sameQueries(left: string[], right: string[]) {
  return left.length === right.length && left.every((query, index) => query === right[index]);
}

async function scoreSignaled(
  locality: string,
  anchorQueries: string[],
  deps: BacktestDeps,
): Promise<{ score: ConceptScore; missed: string[] }> {
  const resolved = await resolveIds(anchorQueries, deps.search);
  const conceptId = anchorQueries.join("|");
  if (resolved.ids.length === 0) {
    return { score: { status: "insufficient", conceptId }, missed: resolved.missed };
  }
  const interest = resolved.ids.join(",");
  const places = await deps.insights({
    "filter.type": "urn:entity:place",
    "filter.location.query": locality,
    "signal.interests.entities": interest,
    "feature.explainability": "true",
    take: "10",
  });
  let brands = await deps.insights({
    "filter.type": "urn:entity:brand",
    "signal.location.query": locality,
    "signal.interests.entities": interest,
    "feature.explainability": "true",
    take: "10",
  });
  if (brands.length === 0) {
    brands = await deps.insights({
      "filter.type": "urn:entity:brand",
      "signal.interests.entities": interest,
      "feature.explainability": "true",
      take: "10",
    });
  }
  return {
    score: scoreConcept({
      conceptId,
      placeAffinities: places.filter((entity) => entity.type.endsWith(":place")).map((entity) => entity.affinity),
      brandAffinities: brands.filter((entity) => entity.type.endsWith(":brand")).map((entity) => entity.affinity),
      explainWeights: [...places, ...brands].flatMap((entity) => (entity.explain ?? []).map((row) => row.weight)),
    }),
    missed: resolved.missed,
  };
}

async function scoreQueries(
  locality: string,
  anchorQueries: string[],
  deps: BacktestDeps,
  cache: Map<string, { places: QlooEntity[]; brands: QlooEntity[] }>,
): Promise<{ score: ConceptScore; missed: string[] }> {
  let localityRows = cache.get(locality);
  if (!localityRows) {
    const [places, brands] = await Promise.all([
      deps.insights({
        "filter.type": "urn:entity:place",
        "filter.location.query": locality,
        take: "50",
      }),
      deps.insights({
        "filter.type": "urn:entity:brand",
        "signal.location.query": locality,
        take: "50",
      }),
    ]);
    localityRows = { places, brands };
    cache.set(locality, localityRows);
  }

  const resolved = await resolveIds(anchorQueries, deps.search);
  const matched = [...localityRows.places, ...localityRows.brands].filter((entity) =>
    resolved.ids.includes(entity.entityId),
  );
  const score = scoreConcept({
    conceptId: anchorQueries.join("|"),
    placeAffinities: matched
      .filter((entity) => entity.type.endsWith(":place"))
      .map((entity) => entity.affinity),
    brandAffinities: matched
      .filter((entity) => entity.type.endsWith(":brand"))
      .map((entity) => entity.affinity),
    explainWeights: matched.flatMap((entity) => (entity.explain ?? []).map((row) => row.weight)),
  });
  return { score, missed: resolved.missed };
}

/** Scores locality + anchor queries only. Outcome is joined after the scores exist. */
async function scoreInput(input: AgentBacktestInput, deps: BacktestDeps, source: "fixture" | "live") {
  const cache = new Map<string, { places: QlooEntity[]; brands: QlooEntity[] }>();
  const scored = [];
  for (const concept of input.concepts) {
    const result =
      source === "live"
        ? await scoreSignaled(input.locality, concept.anchorQueries, deps)
        : await scoreQueries(input.locality, concept.anchorQueries, deps, cache);
    scored.push({ queries: concept.anchorQueries, ...result });
  }
  return scored;
}

export async function runBacktest(
  deps: BacktestDeps = { search: searchEntities, insights },
  source: "fixture" | "live" = "fixture",
): Promise<BacktestRow[]> {
  const rows: BacktestRow[] = [];

  for (const testCase of BACKTEST_CASES) {
    let scored;
    try {
      scored = await scoreInput(toAgentInput(testCase), deps, source);
    } catch (error) {
      if (error instanceof QlooHttpError && error.status === 400) {
        rows.push({
          id: testCase.id,
          dropped: true,
          survivorScore: null,
          closedScore: null,
          picked: null,
          note: "Qloo rejected the insights query (400).",
        });
        continue;
      }
      throw error;
    }
    const survivor = scored.find((row) => sameQueries(row.queries, testCase.survivor.anchorQueries));
    const closed = scored.find((row) => sameQueries(row.queries, testCase.closed.anchorQueries));
    const survivorScore = survivor?.score.status === "scored" ? survivor.score : null;
    const closedScore = closed?.score.status === "scored" ? closed.score : null;

    if (!survivorScore || !closedScore) {
      const missed = [...(survivor?.missed ?? []), ...(closed?.missed ?? [])];
      rows.push({
        id: testCase.id,
        dropped: true,
        survivorScore: null,
        closedScore: null,
        picked: null,
        note:
          missed.length > 0
            ? `Unresolved on ${source === "live" ? "the hackathon host" : "fixture playback"}: ${missed.join(", ")}`
            : "Insufficient cultural signal",
      });
      continue;
    }

    rows.push({
      id: testCase.id,
      dropped: false,
      survivorScore: survivorScore.fitScore,
      closedScore: closedScore.fitScore,
      picked: survivorScore.fitScore > closedScore.fitScore,
      note:
        source === "live"
          ? "Live Qloo. Weights were not changed after this run."
          : "Fixture playback. This hit rate is a pipeline check, not the live back-test.",
    });
  }

  return rows;
}

export function hitRate(rows: BacktestRow[]) {
  const scored = rows.filter((row) => !row.dropped);
  return {
    hits: scored.filter((row) => row.picked).length,
    scored: scored.length,
    dropped: rows.length - scored.length,
  };
}
