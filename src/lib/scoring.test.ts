import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SCORE_WEIGHTS,
  meanTop,
  pickWinner,
  scoreConcept,
  drivenByLine,
} from "./scoring";

test("weights stay the reasoned starting point", () => {
  assert.deepEqual(SCORE_WEIGHTS, { place: 0.55, brand: 0.3, explain: 0.15 });
});

test("mean uses the top five affinities", () => {
  const values = [0.1, 0.2, 0.3, 0.4, 0.5, 0.9];
  assert.equal(meanTop(values), meanTop([0.9, 0.5, 0.4, 0.3, 0.2]));
  const allSix = values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok((meanTop(values) ?? 0) > allSix);
  assert.equal(meanTop([null]), null);
});

test("forced empty fixture gives no score and no verdict", () => {
  const score = scoreConcept({
    conceptId: "empty",
    placeAffinities: [],
    brandAffinities: [null],
    explainWeights: [],
  });
  assert.equal(score.status, "insufficient");
  assert.equal("fitScore" in score, false);
  assert.equal("verdict" in score, false);
});

test("preset 1 hops produce two scores and a winner with no network", () => {
  const wine = scoreConcept({
    conceptId: "wv-a",
    placeAffinities: [0.84, 0.79],
    brandAffinities: [0.71],
    explainWeights: [0.64],
  });
  const sports = scoreConcept({
    conceptId: "wv-b",
    placeAffinities: [0.28],
    brandAffinities: [0.22],
    explainWeights: [],
  });
  assert.equal(wine.status, "scored");
  assert.equal(sports.status, "scored");
  if (wine.status !== "scored" || sports.status !== "scored") return;

  const wineWeighted = 0.55 * 0.815 + 0.3 * 0.71 + 0.15 * 0.64;
  const sportsWeighted = 0.55 * 0.28 + 0.3 * 0.22;
  assert.equal(wine.fitScore, Math.round(100 * wineWeighted));
  assert.equal(sports.fitScore, Math.round(100 * sportsWeighted));
  assert.equal(wine.verdict, "go");
  assert.equal(sports.verdict, "no-go");
  assert.equal(pickWinner([wine, sports]), "wv-a");
  assert.equal(drivenByLine("Via Carota", 0.64), "driven by Via Carota (0.64)");
});

test("the same hops always score the same", () => {
  const input = {
    conceptId: "wv-a",
    placeAffinities: [0.84, 0.79],
    brandAffinities: [0.71],
    explainWeights: [0.64],
  };
  assert.deepEqual(scoreConcept(input), scoreConcept(input));
});
