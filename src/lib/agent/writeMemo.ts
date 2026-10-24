import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI, openai } from "@ai-sdk/openai";
import type { z } from "zod";
import { memoDraftSchema, type MemoDraft } from "@/lib/agent/memoSchema";
import { loadLocalEnv } from "@/lib/load-env";
import { MEMO_SYSTEM } from "@/lib/agent/prompts";
import { drivenByLine, pickWinner, type ConceptScore } from "@/lib/scoring";
import type { HopExplain, Memo, Reason, Verdict } from "@/types/deal";

export type PacketEntity = {
  hopId: string;
  name: string;
  affinity: number;
  explain?: HopExplain[];
};

export type PacketConcept = {
  id: string;
  label: string;
  role: "challenger" | "control";
  score: Extract<ConceptScore, { status: "scored" }> | null;
  entities: PacketEntity[];
};

export type MemoPacket = {
  locality: string;
  concepts: PacketConcept[];
  warnings: string[];
};

export type MemoCompleter = (packet: MemoPacket) => Promise<unknown>;

function qwenSettings() {
  loadLocalEnv();
  const apiKey = process.env.QWEN_CLOUD_API_KEY?.trim();
  const baseURL = process.env.QWEN_CLOUD_BASE_URL?.trim();
  const model = process.env.QWEN_MODEL?.trim();
  if (!apiKey || !baseURL || !model) return null;
  const url = new URL(baseURL);
  const pathname = url.pathname.replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
  return { apiKey, baseURL: `${url.origin}${pathname}`, model };
}

export function hasModelKey() {
  loadLocalEnv();
  return Boolean(qwenSettings() || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

function knownNumbers(packet: MemoPacket) {
  const rows: Array<{ name: string; hopId: string; affinity: number }> = [];
  for (const concept of packet.concepts) {
    for (const entity of concept.entities) {
      rows.push({ name: entity.name, hopId: entity.hopId, affinity: entity.affinity });
      for (const explain of entity.explain ?? []) {
        if (!explain.inputName) continue;
        rows.push({ name: explain.inputName, hopId: entity.hopId, affinity: explain.weight });
      }
    }
  }
  return rows;
}

function sameNumber(left: number, right: number) {
  return Math.abs(left - right) < 0.001;
}

export function draftAgrees(packet: MemoPacket, draft: MemoDraft) {
  const scored = packet.concepts.filter((concept) => concept.score);
  if (scored.length === 0) return false;
  const winner =
    scored.length === packet.concepts.length
      ? pickWinner(scored.map((concept) => ({ conceptId: concept.id, fitScore: concept.score!.fitScore })))
      : null;
  if (draft.winnerConceptId !== (winner ?? "")) return false;
  if (draft.concepts.length !== scored.length) return false;

  const known = knownNumbers(packet);
  const blob = `${draft.summary}\n${draft.landlordPitch}\n${(draft.risks ?? []).join("\n")}`;
  if (/urn:|census|foot traffic|income|crime/i.test(blob)) return false;

  for (const concept of draft.concepts) {
    const source = packet.concepts.find((row) => row.id === concept.conceptId);
    if (!source?.score || source.score.verdict !== concept.verdict) return false;
    if (!draft.summary.includes(String(source.score.fitScore))) return false;
    for (const reason of concept.reasons) {
      const match = known.some(
        (row) =>
          row.name === reason.entityName &&
          row.hopId === reason.hopId &&
          sameNumber(row.affinity, reason.affinity),
      );
      if (!match) return false;
      const printed = reason.affinity.toFixed(2);
      if (!reason.text.includes(reason.entityName) && !reason.text.includes(printed)) return false;
    }
  }
  return true;
}

function reasonsFor(concept: PacketConcept): Reason[] {
  const reasons: Reason[] = [];
  const ranked = [...concept.entities].sort((a, b) => b.affinity - a.affinity);
  for (const entity of ranked) {
    reasons.push({
      text: `${entity.name} affinity ${entity.affinity.toFixed(2)}.`,
      hopId: entity.hopId,
      entityName: entity.name,
      affinity: entity.affinity,
    });
    for (const explain of entity.explain ?? []) {
      if (!explain.inputName) continue;
      reasons.push({
        text: drivenByLine(explain.inputName, explain.weight),
        hopId: entity.hopId,
        entityName: explain.inputName,
        affinity: explain.weight,
      });
    }
  }
  return reasons.slice(0, 4);
}

function headline(label: string, verdict: Verdict) {
  if (verdict === "go") return `${label} clears this block.`;
  if (verdict === "caution") return `${label} is a mixed signal.`;
  return `${label} does not clear this block.`;
}

export function templateMemo(packet: MemoPacket): Memo | null {
  const scored = packet.concepts.filter((concept) => concept.score);
  if (scored.length === 0) return null;
  const winner =
    scored.length === packet.concepts.length
      ? pickWinner(scored.map((concept) => ({ conceptId: concept.id, fitScore: concept.score!.fitScore })))
      : null;
  const concepts = scored.map((concept) => ({
    id: concept.id,
    label: concept.label,
    role: concept.role,
    verdict: concept.score!.verdict,
    fitScore: concept.score!.fitScore,
    headline: headline(concept.label, concept.score!.verdict),
    reasons: reasonsFor(concept),
  }));
  const summary = packet.concepts
    .map((concept) =>
      concept.score ? `${concept.label} scores ${concept.score.fitScore}` : `${concept.label} has no score`,
    )
    .join(". ")
    .concat(".");
  const lead = concepts.find((concept) => concept.id === winner) ?? concepts[0];
  const top = lead.reasons[0];
  const landlordPitch = top
    ? `${summary} The lead citation is ${top.entityName} at ${top.affinity.toFixed(2)}.`
    : summary;
  const risks = [
    ...packet.concepts.filter((concept) => !concept.score).map((concept) => `${concept.label} has no score.`),
    ...packet.warnings,
  ].slice(0, 3);

  return {
    winnerConceptId: winner ?? "",
    summary,
    concepts,
    landlordPitch,
    risks,
  };
}

function memoFromDraft(packet: MemoPacket, draft: MemoDraft): Memo {
  const concepts = draft.concepts.map((concept) => {
    const source = packet.concepts.find((row) => row.id === concept.conceptId);
    return {
      id: concept.conceptId,
      label: source?.label ?? concept.conceptId,
      role: source?.role ?? "challenger",
      verdict: concept.verdict,
      fitScore: source?.score?.fitScore ?? 0,
      headline: concept.headline,
      reasons: concept.reasons,
    };
  });
  return {
    winnerConceptId: draft.winnerConceptId,
    summary: draft.summary,
    concepts,
    landlordPitch: draft.landlordPitch,
    risks: draft.risks,
  };
}

export async function completeWithModel(system: string, prompt: string, schema: z.ZodType) {
  loadLocalEnv();
  if (!hasModelKey()) return null;
  const qwen = qwenSettings();
  const model = qwen
    ? createOpenAI({
        baseURL: qwen.baseURL,
        apiKey: qwen.apiKey,
        fetch: async (input, init) => {
          if (init?.body && typeof init.body === "string") {
            try {
              const body = JSON.parse(init.body) as Record<string, unknown>;
              body.enable_thinking = false;
              init = { ...init, body: JSON.stringify(body) };
            } catch {
              // Keep the original body when it is not JSON.
            }
          }
          return fetch(input, init);
        },
      }).chat(qwen.model)
    : process.env.OPENAI_API_KEY
      ? openai(process.env.MEMO_MODEL ?? "gpt-4o-mini")
      : anthropic(process.env.MEMO_MODEL ?? "claude-haiku-4-5");
  const { object } = await generateObject({
    model,
    schema,
    system,
    prompt,
    providerOptions: {
      openai: { strictJsonSchema: false },
    },
  });
  return object;
}

async function liveComplete(packet: MemoPacket): Promise<unknown> {
  const object = await completeWithModel(MEMO_SYSTEM, JSON.stringify(packet), memoDraftSchema);
  if (!object) throw new Error("no model");
  return object;
}

export async function writeMemo(packet: MemoPacket, complete?: MemoCompleter | null): Promise<Memo | null> {
  const fallback = templateMemo(packet);
  const writer = complete === null ? null : (complete ?? (hasModelKey() ? liveComplete : null));
  if (!writer) return fallback;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const parsed = memoDraftSchema.safeParse(await writer(packet));
      if (parsed.success && draftAgrees(packet, parsed.data)) return memoFromDraft(packet, parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "model error";
      const secret = process.env.QWEN_CLOUD_API_KEY ?? "";
      console.error(secret ? message.replaceAll(secret, "[redacted]") : message);
    }
  }
  return fallback;
}
