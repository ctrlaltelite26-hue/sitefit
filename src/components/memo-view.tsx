import { EvidenceDrawer } from "@/components/evidence-drawer";
import { VerdictBadge } from "@/components/verdict-badge";
import { SCORE_FORMULA_LABEL, VERDICT_CAUTION, VERDICT_GO } from "@/lib/scoring";
import type { Deal } from "@/types/deal";

export function MemoView({ deal }: { deal: Deal }) {
  if (deal.ungrounded && deal.memo) {
    const memo = deal.memo;
    const winner = memo.concepts.find((concept) => concept.id === memo.winnerConceptId);
    return (
      <article>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          LEASE MEMO · {deal.localityQuery.toUpperCase()}
        </p>
        <h1 className="mt-6 font-heading text-4xl font-normal tracking-tight">
          {winner ? `${winner.label} is the guess.` : `Ungrounded note for ${deal.siteLabel}.`}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed">{memo.summary}</p>
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          {memo.concepts.map((concept) => (
            <section key={concept.id}>
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
                {concept.role === "challenger" ? "CONCEPT A" : "CONCEPT B"}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-normal">{concept.label}</h2>
              <p className="mt-3 font-heading text-lg italic">{concept.headline}</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">No affinity cited.</p>
            </section>
          ))}
        </div>
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
            FOR THE LANDLORD
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed">{memo.landlordPitch}</p>
        </section>
        {memo.risks && memo.risks.length > 0 ? (
          <section className="mt-8 border-t border-border pt-4">
            <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">RISKS</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {memo.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    );
  }

  if (!deal.memo) {
    if (!deal.insufficient) return null;

    return (
      <article>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          LEASE MEMO · {deal.localityQuery.toUpperCase()}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-normal tracking-tight">
          Insufficient cultural signal.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {deal.siteLabel} did not return enough affinity to score. No verdict is written.
        </p>
      </article>
    );
  }

  const memo = deal.memo;
  const winner = memo.concepts.find((concept) => concept.id === memo.winnerConceptId);

  return (
    <article>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          LEASE MEMO · {deal.localityQuery.toUpperCase()}
        </p>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">GROUNDED</p>
      </div>
      <h1 className="mt-6 font-heading text-4xl font-normal tracking-tight">
        {winner ? `${winner.label} leads.` : "Lease memo."}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed">{memo.summary}</p>
      {winner ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-3">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
              WINNER
            </span>
            <span className="font-heading text-xl">{winner.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-2xl font-medium text-primary">{winner.fitScore}</span>
            {winner.verdict ? <VerdictBadge verdict={winner.verdict} /> : null}
          </div>
        </div>
      ) : null}
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        {memo.concepts.map((concept) => (
          <section key={concept.id} className="border-t border-border pt-4 md:border-t-0 md:pt-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
                {concept.role === "challenger" ? "CONCEPT A" : "CONCEPT B"}
              </span>
              {concept.verdict ? <VerdictBadge verdict={concept.verdict} /> : null}
            </div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-heading text-2xl font-normal">{concept.label}</h2>
              <span
                className={
                  concept.id === memo.winnerConceptId
                    ? "font-mono text-2xl font-medium text-primary"
                    : "font-mono text-2xl font-medium"
                }
              >
                {concept.fitScore}
              </span>
            </div>
            <p className="mb-5 font-heading text-lg italic">{concept.headline}</p>
            <ul className="space-y-4">
              {concept.reasons.map((reason) => (
                <li key={`${reason.hopId}-${reason.text}`}>
                  <p>{reason.text}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {reason.entityName} · {reason.affinity.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-10 border-t border-border pt-6">
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          FOR THE LANDLORD
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed">{memo.landlordPitch}</p>
      </section>
      {memo.risks && memo.risks.length > 0 ? (
        <section className="mt-8 border-t border-border pt-4">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">RISKS</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {memo.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mt-8 border-t border-border pt-4">
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          HOW THIS WAS SCORED
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{SCORE_FORMULA_LABEL}</span>. Go at{" "}
          <span className="font-mono text-foreground">{VERDICT_GO}</span> or above. Caution from{" "}
          <span className="font-mono text-foreground">{VERDICT_CAUTION}</span>. No-go below that.
          Computed from {deal.qlooSource === "live" ? "live Qloo affinities." : "fixture playback affinities. Not a live Qloo call."}
        </p>
      </section>
      <div className="mt-8 border-t border-border pt-6">
        <EvidenceDrawer locality={deal.localityQuery} hops={deal.hops} source={deal.qlooSource} />
      </div>
    </article>
  );
}
