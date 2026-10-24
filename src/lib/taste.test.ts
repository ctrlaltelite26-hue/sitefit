import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeEntities } from "./qloo/normalize";
import { playbackBody } from "./qloo/playback";
import { neighborhoodTaste } from "./taste";

test("preset 1 neighborhood taste returns at least two entity types", async () => {
  const taste = await neighborhoodTaste("West Village", async (params) =>
    normalizeEntities(playbackBody("/v2/insights", params)),
  );
  assert.ok(taste.places.length >= 1);
  assert.ok(taste.brands.length >= 1);
  const brand = taste.brands.find((entity) => entity.name === "Natural wine label");
  assert.equal(brand?.explain?.[0]?.inputName, "Via Carota");
  assert.equal(brand?.explain?.[0]?.weight, 0.64);
  const brandHop = taste.hops.find((hop) => hop.filterType === "urn:entity:brand");
  assert.equal(brandHop?.entities[0]?.explain?.[0]?.inputName, "Via Carota");
});
