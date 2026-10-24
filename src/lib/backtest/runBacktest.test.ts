import assert from "node:assert/strict";
import { test } from "node:test";
import { hitRate, runBacktest } from "./runBacktest";
import { BACKTEST_CASES } from "./cases";
import { normalizeEntities } from "../qloo/normalize";
import { playbackBody } from "../qloo/playback";

test("runBacktest completes on fixture playback", async () => {
  const rows = await runBacktest({
    search: async (query, types, take = 6) =>
      normalizeEntities(playbackBody("/search", { query, types, take: String(take) })),
    insights: async (params) => normalizeEntities(playbackBody("/v2/insights", params)),
  });

  assert.equal(rows.length, BACKTEST_CASES.length);
  assert.ok(rows.every((row) => row.dropped || (row.survivorScore !== null && row.closedScore !== null)));

  const echoPark = rows.find((row) => row.id === "sl-bandini-vs-starbucks-mohawk");
  assert.equal(echoPark?.dropped, true);

  const williamsburg = rows.find((row) => row.id === "wb-madewell-vs-urban-outfitters");
  assert.equal(williamsburg?.dropped, false);
  assert.equal(williamsburg?.survivorScore, 23);
  assert.equal(williamsburg?.closedScore, 11);

  const silverLake = rows.find((row) => row.id === "sl-seco-vs-shake-shack");
  assert.equal(silverLake?.dropped, false);
  assert.equal(silverLake?.survivorScore, 43);
  assert.equal(silverLake?.closedScore, 7);

  const rate = hitRate(rows);
  assert.equal(rate.scored, 2);
  assert.equal(rate.dropped, 4);
  assert.equal(rate.hits, 2);
});
