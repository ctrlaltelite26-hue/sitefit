import { formatSeconds, type RunProgress } from "@/lib/agent/progress";
import { runDeal, type RunDeps } from "@/lib/agent/runDeal";
import { insights } from "@/lib/qloo/insights";
import { searchEntities } from "@/lib/qloo/search";
import { writeUngroundedMemo, type UngroundedCompleter } from "@/lib/agent/writeUngroundedMemo";
import { getDeal, saveDeal } from "@/lib/store";
import type { Deal } from "@/types/deal";

const inflight = new Map<string, Promise<Deal>>();

async function execute(deal: Deal, deps?: RunDeps, onProgress?: (event: RunProgress) => void) {
  const result = await runDeal(
    {
      locality: deal.localityQuery,
      concepts: deal.concepts,
    },
    deps ? { ...deps, onProgress } : { search: searchEntities, insights, onProgress },
  );
  const next: Deal = {
    ...deal,
    hops: result.hops,
    memo: result.memo,
    insufficient: result.insufficient,
    qlooSource: result.qlooSource,
  };
  await saveDeal(next);
  return next;
}

async function writeGuess(
  deal: Deal,
  complete?: UngroundedCompleter | null,
  onProgress?: (event: RunProgress) => void,
) {
  onProgress?.({ id: "memo", status: "running" });
  const started = Date.now();
  const memo = await writeUngroundedMemo(deal, complete);
  onProgress?.({
    id: "memo",
    status: "done",
    detail: "memo",
    duration: formatSeconds(Date.now() - started),
  });
  const next: Deal = {
    ...deal,
    hops: [],
    memo,
    insufficient: false,
    qlooSource: "none",
  };
  await saveDeal(next);
  return next;
}

export async function runSavedDeal(
  id: string,
  opts: {
    rerun?: boolean;
    deps?: RunDeps;
    complete?: UngroundedCompleter | null;
    onProgress?: (event: RunProgress) => void;
  } = {},
): Promise<Deal | null> {
  const deal = await getDeal(id);
  if (!deal) return null;
  if (deal.ungrounded) {
    if (!opts.rerun && deal.memo) return deal;
    const pending = inflight.get(id);
    if (pending && !opts.rerun) return pending;
    const promise = writeGuess(deal, opts.complete, opts.onProgress).finally(() => inflight.delete(id));
    inflight.set(id, promise);
    return promise;
  }
  if (!opts.rerun && (deal.memo || deal.insufficient)) return deal;
  const pending = inflight.get(id);
  if (pending && !opts.rerun) return pending;

  const promise = execute(deal, opts.deps, opts.onProgress).finally(() => inflight.delete(id));
  inflight.set(id, promise);
  return promise;
}
