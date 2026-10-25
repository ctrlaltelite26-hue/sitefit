import assert from "node:assert/strict";
import { test } from "node:test";
import { retryWaitMs } from "./client";

test("a 429 waits for the second-window reset", () => {
  assert.equal(retryWaitMs("0.29"), 290);
  assert.equal(retryWaitMs(null), 1000);
  assert.equal(retryWaitMs("0.01"), 250);
  assert.equal(retryWaitMs("9"), 2000);
});
