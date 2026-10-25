"use client";

import { useEffect, useState } from "react";
import { AblationBanner } from "@/components/ablation-banner";
import { AgentTrace } from "@/components/agent-trace";
import { MemoView } from "@/components/memo-view";
import { RunningMemo, type RunningStep } from "@/components/running-memo";
import { Button } from "@/components/ui/button";
import type { ProgressStepId, RunProgress } from "@/lib/agent/progress";
import type { Deal } from "@/types/deal";

function planSteps(deal: Deal): RunningStep[] {
  const locality = deal.localityQuery;
  const waiting = { status: "waiting" as const, detail: "—", duration: "—" };
  if (deal.ungrounded) {
    return [{ id: "memo", label: "Write memo", meta: "document · —", ...waiting }];
  }
  const scores = deal.concepts.slice(0, 2).map((concept, index) => ({
    id: (index === 0 ? "score-a" : "score-b") as ProgressStepId,
    label: index === 0 ? "Score concept A" : "Score concept B",
    meta: `place, brand · ${locality}`,
    ...waiting,
  }));
  return [
    { id: "site", label: "Resolve site", meta: `place · ${locality}`, ...waiting },
    { id: "concepts", label: "Resolve concepts", meta: "place, brand · anchors", ...waiting },
    { id: "brands", label: "Neighborhood taste", meta: `brand · ${locality}`, ...waiting },
    { id: "artists", label: "Neighborhood taste", meta: `artist · ${locality}`, ...waiting },
    ...scores,
    { id: "memo", label: "Write memo", meta: "document · —", ...waiting },
  ];
}

function eyebrow(deal: Deal) {
  const concepts = deal.concepts.map((concept) => concept.label).join(" vs ");
  return concepts ? `${deal.localityQuery} · ${concepts}` : deal.localityQuery;
}

async function readRun(
  id: string,
  rerun: boolean,
  onProgress: (event: RunProgress) => void,
): Promise<Deal> {
  const response = await fetch(`/api/deals/${id}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rerun ? { rerun: true } : {}),
  });
  if (!response.ok || !response.body) throw new Error("failed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let deal: Deal | null = null;
  while (true) {
    const chunk = await reader.read();
    buffer += decoder.decode(chunk.value, { stream: !chunk.done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as
        | ({ type: "progress" } & RunProgress)
        | { type: "done"; deal: Deal }
        | { type: "error"; message: string };
      if (event.type === "progress") onProgress(event);
      if (event.type === "done") deal = event.deal;
      if (event.type === "error") throw new Error(event.message);
    }
    if (chunk.done) break;
  }
  if (!deal) throw new Error("failed");
  return deal;
}

export function DealRun({ initial }: { initial: Deal }) {
  const [deal, setDeal] = useState(initial);
  const [steps, setSteps] = useState<RunningStep[]>(() => planSteps(initial));
  const [running, setRunning] = useState(false);
  const [showLive, setShowLive] = useState(!initial.memo && !initial.insufficient);
  const [error, setError] = useState<string | null>(null);

  function applyProgress(event: RunProgress) {
    setSteps((current) =>
      current.map((step) =>
        step.id === event.id
          ? {
              ...step,
              status: event.status,
              detail: event.detail ?? step.detail,
              duration: event.duration ?? step.duration,
            }
          : step,
      ),
    );
  }

  useEffect(() => {
    if (initial.memo || initial.insufficient) return;
    let cancelled = false;
    setRunning(true);
    setShowLive(true);
    setSteps(planSteps(initial));
    readRun(initial.id, false, (event) => {
      if (!cancelled) applyProgress(event);
    })
      .then((next) => {
        if (!cancelled) {
          setDeal(next);
          setShowLive(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError("The memo run failed.");
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  async function rerun() {
    setRunning(true);
    setShowLive(true);
    setError(null);
    setSteps(planSteps(deal));
    try {
      setDeal(await readRun(deal.id, true, applyProgress));
      setShowLive(false);
    } catch {
      setError("The memo run failed.");
    } finally {
      setRunning(false);
    }
  }

  const showRun = showLive || (!deal.memo && !deal.insufficient);

  return (
    <article className="mx-auto w-full max-w-[1120px] border border-border bg-card px-8 py-12 shadow-[0_1px_2px_rgba(28,25,21,0.04),0_4px_12px_rgba(28,25,21,0.03)] sm:px-12 md:px-16">
      {showRun ? (
        <>
          <RunningMemo eyebrow={eyebrow(deal)} steps={steps} />
          {error ? <p className="mt-6 text-[#8C2F2F]">{error}</p> : null}
          {error ? (
            <Button type="button" variant="outline" className="mt-4 rounded-none" disabled={running} onClick={rerun}>
              Re-run
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
              {deal.localityQuery.toUpperCase()} · {deal.siteLabel.toUpperCase()}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              disabled={running}
              onClick={rerun}
            >
              Re-run
            </Button>
          </div>
          {error ? <p className="mb-6 text-[#8C2F2F]">{error}</p> : null}
          {deal.ungrounded ? <AblationBanner /> : null}
          <AgentTrace hops={deal.hops} source={deal.qlooSource} />
          <MemoView deal={deal} />
        </>
      )}
    </article>
  );
}
