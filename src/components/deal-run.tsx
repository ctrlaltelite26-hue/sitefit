"use client";

import { useEffect, useState } from "react";
import { AblationBanner } from "@/components/ablation-banner";
import { AgentTrace } from "@/components/agent-trace";
import { MemoView } from "@/components/memo-view";
import { Button } from "@/components/ui/button";
import type { Deal } from "@/types/deal";

export function DealRun({ initial }: { initial: Deal }) {
  const [deal, setDeal] = useState(initial);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deal.memo || deal.insufficient) return;
    let cancelled = false;
    setRunning(true);
    fetch(`/api/deals/${deal.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        return response.json() as Promise<Deal>;
      })
      .then((next) => {
        if (!cancelled) setDeal(next);
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
  }, [deal.id, deal.insufficient, deal.memo]);

  async function rerun() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${deal.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rerun: true }),
      });
      if (!response.ok) throw new Error("failed");
      setDeal((await response.json()) as Deal);
    } catch {
      setError("The memo run failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className="mx-auto w-full max-w-[1120px] border border-border bg-card px-8 py-12 shadow-[0_1px_2px_rgba(28,25,21,0.04),0_4px_12px_rgba(28,25,21,0.03)] sm:px-12 md:px-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          {deal.localityQuery.toUpperCase()} · {deal.siteLabel.toUpperCase()}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          disabled={running || (!deal.memo && !deal.insufficient)}
          onClick={rerun}
        >
          Re-run
        </Button>
      </div>
      {running ? <p className="mb-6 text-muted-foreground">Writing the memo.</p> : null}
      {error ? <p className="mb-6 text-[#8C2F2F]">{error}</p> : null}
      {deal.ungrounded ? <AblationBanner /> : null}
      <AgentTrace hops={deal.hops} source={deal.qlooSource} />
      <MemoView deal={deal} />
    </article>
  );
}
