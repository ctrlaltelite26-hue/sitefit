import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCustomDeal, buildPresetDeal } from "../build-deal";
import { conceptsForPreset } from "../presets";
import { runDeal } from "./runDeal";
import { runSavedDeal } from "./runSavedDeal";
import { templateMemo, writeMemo, type MemoPacket } from "./writeMemo";
import { normalizeEntities } from "../qloo/normalize";
import { playbackBody } from "../qloo/playback";
import { saveDeal } from "../store";

const playbackDeps = {
  source: "fixture" as const,
  search: async (query: string, types: string, take = 6) =>
    normalizeEntities(playbackBody("/search", { query, types, take: String(take) })),
  insights: async (params: Record<string, string>) => normalizeEntities(playbackBody("/v2/insights", params)),
};

test("preset 1 runs the loop in order and stays inside the call budget", async () => {
  const concepts = conceptsForPreset("west-village-wine-vs-sports");
  assert.ok(concepts);
  if (!concepts) return;
  const result = await runDeal({ locality: "West Village", concepts }, playbackDeps);
  const purposes = result.hops.map((hop) => hop.purpose);
  assert.equal(purposes[0], "Resolve site");
  assert.ok(purposes.indexOf("Resolve concepts") > 0);
  assert.ok(purposes.indexOf("Neighborhood brands") > purposes.indexOf("Resolve concepts"));
  assert.ok(purposes.indexOf("Neighborhood artists") > purposes.indexOf("Neighborhood brands"));
  assert.ok(purposes.indexOf("Score places") > purposes.indexOf("Neighborhood artists"));
  assert.ok(result.calls <= 12);
  assert.equal(result.calls, result.hops.length);
  assert.equal(result.insufficient, false);
  const wine = result.memo?.concepts.find((concept) => concept.id === "wv-a");
  const sports = result.memo?.concepts.find((concept) => concept.id === "wv-b");
  assert.equal(wine?.fitScore, 76);
  assert.equal(sports?.fitScore, 15);
  assert.equal(result.memo?.winnerConceptId, "wv-a");
  assert.ok(wine?.reasons.some((reason) => reason.text === "driven by Via Carota (0.64)"));
});

test("a second run does not call Qloo again when a memo exists", async () => {
  const deal = buildPresetDeal("phase4-once", "west-village-wine-vs-sports", false);
  assert.ok(deal);
  if (!deal) return;
  saveDeal(deal);
  let calls = 0;
  const deps = {
    source: "fixture" as const,
    search: async (query: string, types: string, take = 6) => {
      calls += 1;
      return playbackDeps.search(query, types, take);
    },
    insights: async (params: Record<string, string>) => {
      calls += 1;
      return playbackDeps.insights(params);
    },
  };
  const first = await runSavedDeal(deal.id, { deps });
  const afterFirst = calls;
  const second = await runSavedDeal(deal.id, {
    deps: {
      source: "fixture",
      search: async () => {
        throw new Error("second search");
      },
      insights: async () => {
        throw new Error("second insights");
      },
    },
  });
  assert.equal(calls, afterFirst);
  assert.ok(afterFirst > 0);
  assert.equal(second?.memo?.summary, first?.memo?.summary);
  assert.equal(second?.hops.length, first?.hops.length);
});

const qlooThrows = {
  search: async () => {
    throw new Error("search");
  },
  insights: async () => {
    throw new Error("insights");
  },
};

test("ungrounded deals call the model and do not call Qloo", async () => {
  const deal = buildPresetDeal("phase4-ungrounded", "west-village-wine-vs-sports", true);
  assert.ok(deal);
  if (!deal) return;
  saveDeal(deal);
  let modelCalls = 0;
  const saved = await runSavedDeal(deal.id, {
    deps: qlooThrows,
    complete: async () => {
      modelCalls += 1;
      return {
        winnerConceptId: "wv-a",
        summary: "A wine room is the quieter guess for this corner.",
        concepts: [
          { conceptId: "wv-a", headline: "The quieter room." },
          { conceptId: "wv-b", headline: "The louder import." },
        ],
        landlordPitch: "Take the wine room. Nothing here is cited.",
      };
    },
  });
  const again = await runSavedDeal(deal.id, {
    deps: qlooThrows,
    complete: async () => {
      modelCalls += 1;
      throw new Error("second model call");
    },
  });
  assert.equal(modelCalls, 1);
  assert.equal(saved?.ungrounded, true);
  assert.equal(saved?.qlooSource, "none");
  assert.equal(saved?.hops.length, 0);
  assert.equal(saved?.memo?.winnerConceptId, "wv-a");
  assert.equal(saved?.memo?.summary, "A wine room is the quieter guess for this corner.");
  assert.equal(saved?.memo?.concepts.every((concept) => concept.reasons.length === 0), true);
  assert.equal(saved?.memo?.concepts.every((concept) => concept.fitScore === null), true);
  assert.equal(saved?.memo?.concepts.every((concept) => concept.verdict === null), true);
  assert.equal(again?.memo?.summary, saved?.memo?.summary);
  assert.match(saved?.ungroundedCopy ?? "", /No affinity was cited/);
});

test("an ungrounded draft that invents an affinity falls back to the stored guess", async () => {
  const deal = buildPresetDeal("phase4-ungrounded-bad", "west-village-wine-vs-sports", true);
  assert.ok(deal);
  if (!deal) return;
  saveDeal(deal);
  let attempts = 0;
  const saved = await runSavedDeal(deal.id, {
    deps: qlooThrows,
    complete: async () => {
      attempts += 1;
      return {
        winnerConceptId: "wv-a",
        summary: "Wine leads with affinity 0.90.",
        concepts: [
          { conceptId: "wv-a", headline: "Clear the block." },
          { conceptId: "wv-b", headline: "Skip the sports room." },
        ],
        landlordPitch: "Pick wine.",
      };
    },
  });
  assert.equal(attempts, 2);
  assert.equal(saved?.hops.length, 0);
  assert.equal(saved?.qlooSource, "none");
  assert.match(saved?.memo?.summary ?? "", /No affinity was cited/);
  assert.equal(saved?.memo?.winnerConceptId, "");
});

test("an unknown custom pair fails honestly", async () => {
  const deal = buildCustomDeal("phase4-custom", {
    locality: "Nowhere",
    conceptA: "Unknown room",
    conceptB: "Other room",
    ungrounded: false,
  });
  assert.ok(deal);
  if (!deal) return;
  const result = await runDeal({ locality: deal.localityQuery, concepts: deal.concepts }, playbackDeps);
  assert.equal(result.insufficient, true);
  assert.equal(result.memo, null);
});

test("invalid model output retries once and then uses the template", async () => {
  const concepts = conceptsForPreset("west-village-wine-vs-sports");
  assert.ok(concepts);
  if (!concepts) return;
  const result = await runDeal({ locality: "West Village", concepts }, playbackDeps);
  assert.ok(result.memo);
  const packet: MemoPacket = {
    locality: "West Village",
    warnings: [],
    concepts: (result.memo?.concepts ?? []).map((concept) => ({
      id: concept.id,
      label: concept.label,
      role: concept.role,
      score: {
        status: "scored" as const,
        conceptId: concept.id,
        fitScore: concept.fitScore,
        verdict: concept.verdict,
        placeAffinity: null,
        brandOverlap: null,
        explainBoost: null,
      },
      entities: concept.reasons.map((reason) => ({
        hopId: reason.hopId,
        name: reason.entityName,
        affinity: reason.affinity,
      })),
    })),
  };
  let attempts = 0;
  const memo = await writeMemo(packet, async () => {
    attempts += 1;
    return { nope: true };
  });
  assert.equal(attempts, 2);
  assert.deepEqual(memo, templateMemo(packet));
});
