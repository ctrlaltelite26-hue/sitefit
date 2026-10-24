"use client";

import { useState } from "react";
import { openDeal } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PRESETS } from "@/lib/presets";

export function DealDesk() {
  const [ungrounded, setUngrounded] = useState(false);

  return (
    <form action={openDeal} className="bg-card">
      <input type="hidden" name="ungrounded" value={ungrounded ? "true" : "false"} />
      <header className="space-y-3 pb-8">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">LEASE MEMO</p>
        <h1 className="font-heading text-4xl font-normal tracking-tight md:text-5xl">
          Cultural fit for people about to sign a lease.
        </h1>
        <p className="text-muted-foreground">
          One address. Two concepts. A go or no-go with every claim cited.
        </p>
      </header>
      <section className="border-t border-border pt-8">
        <h2 className="mb-4 font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          PRESET DEALS
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {PRESETS.filter((preset) => preset.onDesk !== false).map((preset, index) => (
            <div
              key={preset.id}
              className={
                index === 0
                  ? "flex flex-col justify-between gap-6 border-l-2 border-l-primary px-6 py-5 md:flex-row md:items-center"
                  : "flex flex-col justify-between gap-6 px-6 py-5 md:flex-row md:items-center"
              }
            >
              <div className="max-w-2xl space-y-1">
                <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
                  {preset.eyebrow}
                </p>
                <h3 className="font-heading text-xl font-normal">{preset.title}</h3>
                <p className="text-sm">{preset.line}</p>
                <p className="text-sm text-muted-foreground">{preset.note}</p>
              </div>
              <Button
                type="submit"
                name="presetId"
                value={preset.id}
                variant={index === 0 ? "default" : "outline"}
                className="rounded-none"
              >
                Open this deal
              </Button>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-10 space-y-5 border-t border-border pt-8">
        <h2 className="font-heading text-2xl font-normal">Or write a custom deal</h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input name="locality" placeholder="Address or neighborhood" className="rounded-none" />
          <Input name="conceptA" placeholder="Concept A" className="rounded-none" />
          <Input name="conceptB" placeholder="Concept B" className="rounded-none" />
          <Button type="submit" variant="outline" className="rounded-none">
            Run custom deal
          </Button>
        </div>
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={ungrounded}
            onCheckedChange={(checked) => setUngrounded(checked)}
            className="mt-0.5 rounded-none"
          />
          <div>
            <p className="text-sm">Write this without Qloo</p>
            <p className="text-xs text-muted-foreground">
              Same memo shape. Stamped ungrounded. No cited affinities.
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}
