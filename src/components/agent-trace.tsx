import type { Hop } from "@/types/deal";

export function AgentTrace({ hops, source }: { hops: Hop[]; source: "fixture" | "live" | "none" }) {
  if (hops.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-2 flex items-baseline justify-between border-b border-foreground pb-2">
        <h2 className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">TRACE</h2>
        <p className="font-mono text-sm text-muted-foreground">{hops.length} hops</p>
      </div>
      <ol>
        {hops.map((hop) => (
          <li
            key={hop.id}
            className="grid grid-cols-[1.4fr_1fr_auto_auto_auto] items-baseline gap-3 border-b border-border py-2.5 text-sm"
          >
            <span>{hop.purpose}</span>
            <span className="text-muted-foreground">
              {hop.filterType} · {hop.location}
            </span>
            <span className="font-mono text-right">
              {hop.entityCount === null ? "—" : hop.entityCount}
            </span>
            <span className="w-12 text-right font-mono text-muted-foreground">{hop.duration}</span>
            <span className="w-12 text-right font-mono text-[11px] tracking-wider text-[#1E6B48]">
              DONE
            </span>
          </li>
        ))}
      </ol>
      <p className="pt-4 text-[13px] text-muted-foreground">
        These hops are the calls from this run.{" "}
        {source === "live" ? "Live Qloo." : "Fixture playback. Not a live Qloo call."}
      </p>
    </section>
  );
}
