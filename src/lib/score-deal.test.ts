import assert from "node:assert/strict";
import { test } from "node:test";
import { getPreset } from "./presets";
import { scoreStoredPreset } from "./score-deal";
import type { Hop, Memo } from "@/types/deal";

test("west village memo cites the explainability driver", () => {
  const preset = getPreset("west-village-wine-vs-sports");
  assert.ok(preset);
  if (!preset) return;
  const scored = scoreStoredPreset(preset);
  assert.equal(scored.insufficient, false);
  if (scored.insufficient) return;
  const wine = scored.memo.concepts.find((concept) => concept.id === "wv-a");
  const sports = scored.memo.concepts.find((concept) => concept.id === "wv-b");
  assert.equal(wine?.fitScore, 76);
  assert.equal(sports?.fitScore, 22);
  assert.equal(scored.memo.winnerConceptId, "wv-a");
  assert.ok(wine?.reasons.some((reason) => reason.text === "driven by Via Carota (0.64)"));
  assert.match(scored.memo.summary, /scores 76/);
  assert.match(scored.memo.summary, /scores 22/);
});

test("a preset with empty score hops writes no verdict", () => {
  const preset = getPreset("west-village-wine-vs-sports");
  assert.ok(preset);
  if (!preset) return;
  const hops: Hop[] = preset.hops.map((hop) => ({
    ...hop,
    entities: hop.entities.map((entity) => ({ ...entity, conceptId: undefined, affinity: null })),
  }));
  const memo: Memo = preset.memo;
  const scored = scoreStoredPreset({ ...preset, hops, memo });
  assert.equal(scored.insufficient, true);
});
