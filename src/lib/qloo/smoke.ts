import { qlooMode } from "@/lib/qloo/client";
import { insightsPlacesByLocality } from "@/lib/qloo/insights";
import { searchEntities } from "@/lib/qloo/search";
import { PRESET_ANCHORS } from "@/lib/presets";

function safeLog(line: string) {
  const key = process.env.QLOO_API_KEY;
  if (key && line.includes(key)) {
    throw new Error("Refusing to print the Qloo API key.");
  }
  console.log(line);
}

async function main() {
  const mode = qlooMode();
  safeLog(`mode=${mode}`);

  const viaCarota = await searchEntities("Via Carota", "urn:entity:place");
  safeLog("search Via Carota");
  if (viaCarota.length === 0) {
    throw new Error("Search for Via Carota returned no places.");
  }
  for (const entity of viaCarota) {
    safeLog(`  ${entity.name}  id=${entity.entityId}`);
  }

  const places = await insightsPlacesByLocality("West Village", 8);
  safeLog("insights filter.type=urn:entity:place filter.location.query=West Village take=8");
  if (places.length === 0) {
    throw new Error("West Village place insights returned no entities.");
  }
  for (const entity of places) {
    safeLog(`  ${entity.name}  affinity=${entity.affinity ?? "null"}`);
  }

  safeLog("preset anchors");
  for (const [presetId, anchors] of Object.entries(PRESET_ANCHORS)) {
    const byConcept = new Map<string, number>();
    for (const anchor of anchors) {
      const found = await searchEntities(anchor.query, anchor.type, 4);
      const hit = found[0];
      if (!hit) {
        safeLog(`  ${presetId}  ${anchor.conceptId}  ${anchor.query}  unresolved`);
        continue;
      }
      byConcept.set(anchor.conceptId, (byConcept.get(anchor.conceptId) ?? 0) + 1);
      safeLog(`  ${presetId}  ${anchor.conceptId}  ${hit.name}  id=${hit.entityId}`);
    }
    for (const [conceptId, count] of byConcept) {
      if (count >= 2) continue;
      if (presetId === "silver-lake-natural-vs-chain" && conceptId === "sl-a") {
        safeLog(`  ${presetId}  ${conceptId}  Seco has no exact-name place on the hackathon host`);
        continue;
      }
      throw new Error(`${presetId} ${conceptId} resolved fewer than 2 anchors.`);
    }
  }

  if (mode !== "live") {
    safeLog("No live Insights call. QLOO_API_KEY is not set. This run is fixture playback.");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Qloo smoke failed.";
  console.error(message);
  process.exitCode = 1;
});
