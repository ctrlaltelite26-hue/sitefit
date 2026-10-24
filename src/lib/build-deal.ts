import { conceptsForPreset, getPreset } from "@/lib/presets";
import type { Deal, DealConcept } from "@/types/deal";

export function buildPresetDeal(id: string, presetId: string, ungrounded: boolean): Deal | null {
  const preset = getPreset(presetId);
  const concepts = conceptsForPreset(presetId);
  if (!preset || !concepts) return null;
  return {
    id,
    presetId: preset.id,
    siteLabel: preset.siteLabel,
    localityQuery: preset.localityQuery,
    createdAt: new Date().toISOString(),
    ungrounded,
    insufficient: false,
    concepts,
    hops: [],
    memo: null,
    ungroundedCopy: preset.ungroundedCopy,
    qlooSource: "none",
  };
}

function customConcept(id: string, label: string, role: DealConcept["role"]): DealConcept {
  return {
    id,
    label,
    role,
    anchorQueries: [
      { query: label, type: "urn:entity:place" },
      { query: label, type: "urn:entity:brand" },
    ],
  };
}

export function buildCustomDeal(
  id: string,
  input: { locality: string; conceptA: string; conceptB: string; ungrounded: boolean },
): Deal | null {
  const locality = input.locality.trim();
  const conceptA = input.conceptA.trim();
  const conceptB = input.conceptB.trim();
  if (!locality || !conceptA || !conceptB) return null;
  return {
    id,
    siteLabel: locality,
    localityQuery: locality,
    createdAt: new Date().toISOString(),
    ungrounded: input.ungrounded,
    insufficient: false,
    concepts: [
      customConcept("custom-a", conceptA, "challenger"),
      customConcept("custom-b", conceptB, "control"),
    ],
    hops: [],
    memo: null,
    ungroundedCopy: `${conceptA} might fit ${locality} better than ${conceptB}. This is a guess. No affinity was cited.`,
    qlooSource: "none",
  };
}
