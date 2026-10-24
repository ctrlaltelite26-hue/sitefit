"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Hop } from "@/types/deal";

export function EvidenceDrawer({
  locality,
  hops,
  source,
}: {
  locality: string;
  hops: Hop[];
  source: "fixture" | "live" | "none";
}) {
  const cited = hops.filter((hop) => hop.entities.length > 0);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" className="rounded-none border-foreground" />
        }
      >
        View evidence
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[440px] bg-card sm:max-w-[440px] data-[side=right]:sm:max-w-[440px]"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-heading text-xl font-normal">Evidence</SheetTitle>
          <SheetDescription>
            {locality} · {cited.length} hops
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {cited.map((hop) => (
            <section key={hop.id} className="border-b border-border py-4">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 className="font-mono text-[11px] tracking-[0.12em]">{hop.purpose}</h3>
                <p className="text-sm text-muted-foreground">
                  {hop.filterType} · {hop.location}
                </p>
              </div>
              <ul>
                {hop.entities.map((entity) => (
                  <li
                    key={`${hop.id}-${entity.name}`}
                    className="flex items-baseline justify-between gap-3 border-b border-border/70 py-1.5 text-sm last:border-0"
                  >
                    <span>
                      {entity.name}
                      {entity.explain?.map((row) =>
                        row.inputName ? (
                          <span key={row.inputId} className="mt-0.5 block text-xs text-muted-foreground">
                            driven by {row.inputName} ({row.weight.toFixed(2)})
                          </span>
                        ) : null,
                      )}
                    </span>
                    <span className="flex items-baseline gap-4">
                      <span className="text-muted-foreground">{entity.type}</span>
                      <span className="w-10 text-right font-mono">
                        {entity.affinity === null ? "—" : entity.affinity.toFixed(2)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="pt-4 text-sm text-muted-foreground">
            Affinity is the hop value. The memo quotes these numbers and does not invent them.{" "}
            {source === "live" ? "This run called Qloo." : "These rows are fixture playback."}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
