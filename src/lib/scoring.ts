import type { Verdict } from "@/types/deal";

/** Place fit first, then brand overlap, then explainability. Chosen before any back-test result. */
export const SCORE_WEIGHTS = {
  place: 0.55,
  brand: 0.3,
  explain: 0.15,
} as const;

export const VERDICT_GO = 70;
export const VERDICT_CAUTION = 45;

export type ScoreInput = {
  conceptId: string;
  placeAffinities: Array<number | null>;
  brandAffinities: Array<number | null>;
  explainWeights: Array<number | null>;
};

export type ConceptScore =
  | {
      status: "scored";
      conceptId: string;
      fitScore: number;
      verdict: Verdict;
      placeAffinity: number | null;
      brandOverlap: number | null;
      explainBoost: number | null;
    }
  | {
      status: "insufficient";
      conceptId: string;
    };

export function scoreFormula() {
  const weights = SCORE_WEIGHTS;
  return `fit = 100 × (${weights.place.toFixed(2)} place affinity + ${weights.brand.toFixed(2)} brand overlap + ${weights.explain.toFixed(2)} explainability)`;
}

export const SCORE_FORMULA_LABEL = scoreFormula();

export function meanTop(values: Array<number | null>, take = 5): number | null {
  const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (numbers.length === 0) return null;
  const top = [...numbers].sort((a, b) => b - a).slice(0, take);
  return top.reduce((sum, value) => sum + value, 0) / top.length;
}

export function verdictFor(fitScore: number): Verdict {
  if (fitScore >= VERDICT_GO) return "go";
  if (fitScore >= VERDICT_CAUTION) return "caution";
  return "no-go";
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function scoreConcept(input: ScoreInput): ConceptScore {
  const placeAffinity = meanTop(input.placeAffinities);
  const brandOverlap = meanTop(input.brandAffinities);
  const explainBoost = meanTop(input.explainWeights);

  if (placeAffinity === null && brandOverlap === null) {
    return { status: "insufficient", conceptId: input.conceptId };
  }

  const weighted =
    SCORE_WEIGHTS.place * (placeAffinity ?? 0) +
    SCORE_WEIGHTS.brand * (brandOverlap ?? 0) +
    SCORE_WEIGHTS.explain * (explainBoost ?? 0);

  const fitScore = Math.round(100 * clamp01(weighted));
  return {
    status: "scored",
    conceptId: input.conceptId,
    fitScore,
    verdict: verdictFor(fitScore),
    placeAffinity,
    brandOverlap,
    explainBoost,
  };
}

export function pickWinner(scores: Array<{ conceptId: string; fitScore: number }>): string | null {
  if (scores.length < 2) return null;
  const ranked = [...scores].sort((a, b) => b.fitScore - a.fitScore || a.conceptId.localeCompare(b.conceptId));
  if (ranked[0].fitScore === ranked[1].fitScore) return null;
  return ranked[0].conceptId;
}

export function drivenByLine(inputName: string, weight: number) {
  return `driven by ${inputName} (${weight.toFixed(2)})`;
}
