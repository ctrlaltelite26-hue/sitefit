export type ProgressStepId = "site" | "concepts" | "brands" | "artists" | "score-a" | "score-b" | "memo";

export type RunProgress = {
  id: ProgressStepId;
  status: "running" | "done";
  detail?: string;
  duration?: string;
};

export function formatSeconds(ms: number) {
  const seconds = Math.max(ms / 1000, 0.1);
  return `${seconds.toFixed(1)}s`;
}
