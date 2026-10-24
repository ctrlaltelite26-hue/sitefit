import { runDeal, type RunDeps } from "@/lib/agent/runDeal";
import { writeUngroundedMemo, type UngroundedCompleter } from "@/lib/agent/writeUngroundedMemo";
import { getDeal, saveDeal } from "@/lib/store";
import type { Deal } from "@/types/deal";

const inflight = new Map<string, Promise<Deal>>();

async function execute(deal: Deal, deps?: RunDeps) {
  const result = await runDeal(
    {
      locality: deal.localityQuery,
      concepts: deal.concepts,
    },
    deps,
  );
  const next: Deal = {
    ...deal,
    hops: result.hops,
    memo: result.memo,
    insufficient: result.insufficient,
    qlooSource: result.qlooSource,
  };
  saveDeal(next);
  return next;
}

async function writeGuess(deal: Deal, complete?: UngroundedCompleter | null) {
  const memo = await writeUngroundedMemo(deal, complete);
  const next: Deal = {
    ...deal,
    hops: [],
    memo,
    insufficient: false,
    qlooSource: "none",
  };
  saveDeal(next);
  return next;
}

export async function runSavedDeal(
  id: string,
  opts: { rerun?: boolean; deps?: RunDeps; complete?: UngroundedCompleter | null } = {},
): Promise<Deal | null> {
  const deal = getDeal(id);
  if (!deal) return null;
  if (deal.ungrounded) {
    if (!opts.rerun && deal.memo) return deal;
    const pending = inflight.get(id);
    if (pending && !opts.rerun) return pending;
    const promise = writeGuess(deal, opts.complete).finally(() => inflight.delete(id));
    inflight.set(id, promise);
    return promise;
  }
  if (!opts.rerun && (deal.memo || deal.insufficient)) return deal;
  const pending = inflight.get(id);
  if (pending && !opts.rerun) return pending;

  const promise = execute(deal, opts.deps).finally(() => inflight.delete(id));
  inflight.set(id, promise);
  return promise;
}
