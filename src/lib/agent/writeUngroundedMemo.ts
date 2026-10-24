import { z } from "zod";
import { completeWithModel, hasModelKey } from "@/lib/agent/writeMemo";
import type { Deal, Memo } from "@/types/deal";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export const UNGROUNDED_SYSTEM = `You write a lease note from a neighborhood name and two concept labels.
You have no cultural graph, no tool results, no affinities, and no scores.
Pick one concept id and argue for it in prose. Sound sure. You may use general knowledge and name places you associate with the neighborhood.
Do not invent affinity numbers, fit scores, or a go, caution, or no-go verdict.
Do not mention census, foot traffic, income, crime, or URNs.
Nothing you write is cited. The page stamps the note ungrounded.
winnerConceptId must be one of the concept ids. Include both concepts.`;

const ungroundedDraftSchema = z.object({
  winnerConceptId: z.string(),
  summary: z.string().refine((value) => wordCount(value) <= 80, "Summary is over 80 words."),
  concepts: z
    .array(
      z.object({
        conceptId: z.string(),
        headline: z.string().refine((value) => wordCount(value) <= 20, "Headline is over 20 words."),
      }),
    )
    .length(2),
  landlordPitch: z.string().refine((value) => wordCount(value) <= 120, "Landlord pitch is over 120 words."),
  risks: z.array(z.string()).max(3).optional(),
});

export type UngroundedDraft = z.infer<typeof ungroundedDraftSchema>;

export type UngroundedPacket = {
  locality: string;
  siteLabel: string;
  concepts: Array<{ id: string; label: string; role: "challenger" | "control" }>;
};

export type UngroundedCompleter = (packet: UngroundedPacket) => Promise<unknown>;

const inventedNumber = /\d+\.\d+|\baffinity\b|\bfit score\b|\bno-go\b|\bcaution\b|\bverdict\b|urn:|census|foot traffic|\bincome\b|\bcrime\b|\bscore[sd]?\s+\d+/i;

export function guessAgrees(packet: UngroundedPacket, draft: UngroundedDraft) {
  const ids = packet.concepts.map((concept) => concept.id).sort();
  const draftIds = draft.concepts.map((concept) => concept.conceptId).sort();
  if (ids.join() !== draftIds.join()) return false;
  if (!ids.includes(draft.winnerConceptId)) return false;
  const blob = [
    draft.summary,
    draft.landlordPitch,
    ...draft.concepts.map((concept) => concept.headline),
    ...(draft.risks ?? []),
  ].join("\n");
  return !inventedNumber.test(blob);
}

function packetFor(deal: Deal): UngroundedPacket {
  return {
    locality: deal.localityQuery,
    siteLabel: deal.siteLabel,
    concepts: deal.concepts.map((concept) => ({
      id: concept.id,
      label: concept.label,
      role: concept.role,
    })),
  };
}

function fallbackMemo(deal: Deal): Memo {
  return {
    winnerConceptId: "",
    summary: deal.ungroundedCopy,
    concepts: deal.concepts.map((concept) => ({
      id: concept.id,
      label: concept.label,
      role: concept.role,
      verdict: null,
      fitScore: null,
      headline: "No cited affinity.",
      reasons: [],
    })),
    landlordPitch: deal.ungroundedCopy,
    risks: ["No Qloo call was made."],
  };
}

function memoFromGuess(deal: Deal, draft: UngroundedDraft): Memo {
  return {
    winnerConceptId: draft.winnerConceptId,
    summary: draft.summary,
    concepts: deal.concepts.map((concept) => {
      const row = draft.concepts.find((item) => item.conceptId === concept.id);
      return {
        id: concept.id,
        label: concept.label,
        role: concept.role,
        verdict: null,
        fitScore: null,
        headline: row?.headline ?? "No cited affinity.",
        reasons: [],
      };
    }),
    landlordPitch: draft.landlordPitch,
    risks: ["No Qloo call was made.", ...(draft.risks ?? [])].slice(0, 3),
  };
}

async function liveUngrounded(packet: UngroundedPacket) {
  const object = await completeWithModel(UNGROUNDED_SYSTEM, JSON.stringify(packet), ungroundedDraftSchema);
  if (!object) throw new Error("no model");
  return object;
}

export async function writeUngroundedMemo(deal: Deal, complete?: UngroundedCompleter | null): Promise<Memo> {
  const packet = packetFor(deal);
  const fallback = fallbackMemo(deal);
  if (complete === null || (complete === undefined && !hasModelKey())) return fallback;
  const writer = complete ?? liveUngrounded;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const parsed = ungroundedDraftSchema.safeParse(await writer(packet));
      if (parsed.success && guessAgrees(packet, parsed.data)) return memoFromGuess(deal, parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "model error";
      const secret = process.env.QWEN_CLOUD_API_KEY ?? "";
      console.error(secret ? message.replaceAll(secret, "[redacted]") : message);
    }
  }
  return fallback;
}
