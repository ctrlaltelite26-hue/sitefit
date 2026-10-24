import type { Preset } from "@/lib/presets";
import { drivenByLine, pickWinner, scoreConcept, type ConceptScore } from "@/lib/scoring";
import type { HopEntity, Memo, Reason } from "@/types/deal";

function isPlace(type: string) {
  return type === "place" || type.endsWith(":place");
}

function isBrand(type: string) {
  return type === "brand" || type.endsWith(":brand");
}

function entitiesFor(preset: Preset, conceptId: string) {
  return preset.hops.flatMap((hop) => hop.entities.filter((entity) => entity.conceptId === conceptId));
}

function explainReasons(hopId: string, entities: HopEntity[]): Reason[] {
  const reasons: Reason[] = [];
  for (const entity of entities) {
    for (const row of entity.explain ?? []) {
      if (!row.inputName) continue;
      reasons.push({
        text: drivenByLine(row.inputName, row.weight),
        hopId,
        entityName: row.inputName,
        affinity: row.weight,
      });
    }
  }
  return reasons;
}

export function scoreStoredPreset(preset: Preset): { insufficient: true } | { insufficient: false; memo: Memo } {
  const scored = preset.memo.concepts.map((concept) => {
    const entities = entitiesFor(preset, concept.id);
    const score = scoreConcept({
      conceptId: concept.id,
      placeAffinities: entities.filter((entity) => isPlace(entity.type)).map((entity) => entity.affinity),
      brandAffinities: entities.filter((entity) => isBrand(entity.type)).map((entity) => entity.affinity),
      explainWeights: entities.flatMap((entity) => (entity.explain ?? []).map((row) => row.weight)),
    });
    return { concept, entities, score };
  });

  if (scored.some((row) => row.score.status === "insufficient")) {
    return { insufficient: true };
  }

  const ready = scored as Array<{
    concept: Preset["memo"]["concepts"][number];
    entities: HopEntity[];
    score: Extract<ConceptScore, { status: "scored" }>;
  }>;
  const winnerConceptId = pickWinner(ready.map((row) => row.score));
  const concepts = ready.map((row) => {
    const hopId = row.concept.reasons[0]?.hopId ?? `${row.concept.id}-score`;
    const extra = explainReasons(hopId, row.entities).filter(
      (reason) => !row.concept.reasons.some((existing) => existing.text === reason.text),
    );
    return {
      ...row.concept,
      fitScore: row.score.fitScore,
      verdict: row.score.verdict,
      reasons: [...row.concept.reasons, ...extra],
    };
  });
  const [first, second] = concepts;

  return {
    insufficient: false,
    memo: {
      winnerConceptId: winnerConceptId ?? "",
      summary: `${first.label} scores ${first.fitScore}. ${second.label} scores ${second.fitScore}.`,
      concepts,
      landlordPitch: preset.memo.landlordPitch,
    },
  };
}
