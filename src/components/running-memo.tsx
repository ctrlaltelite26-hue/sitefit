import { Building2, Disc3, FileText, MapPin, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressStepId } from "@/lib/agent/progress";

export type RunningStep = {
  id: ProgressStepId;
  label: string;
  meta: string;
  status: "waiting" | "running" | "done";
  detail: string;
  duration: string;
};

const icons: Record<ProgressStepId, LucideIcon> = {
  site: MapPin,
  concepts: Building2,
  brands: Tag,
  artists: Disc3,
  "score-a": MapPin,
  "score-b": MapPin,
  memo: FileText,
};

export function RunningMemo({ eyebrow, steps }: { eyebrow: string; steps: RunningStep[] }) {
  const filled = steps.filter((step) => step.status !== "waiting").length;
  const width = steps.length === 0 ? 0 : (filled / steps.length) * 100;

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{eyebrow}</p>
      <h1 className="mt-2 font-heading text-4xl font-normal tracking-tight">Running the memo</h1>
      <div className="mt-5 flex items-center gap-6 border-b border-border pb-6">
        <div className="h-[2px] flex-1 bg-border">
          <div className="h-full bg-[#6B2D3C]" style={{ width: `${width}%` }} />
        </div>
        <span className="font-mono text-sm text-muted-foreground">
          {filled} / {steps.length} hops
        </span>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-0 flex items-center justify-between border-b border-foreground pb-2">
            <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">TRACE</span>
            <span className="hidden font-mono text-[11px] tracking-[0.12em] text-muted-foreground sm:inline">
              EXECUTION LOG
            </span>
          </div>
          <ol>
            {steps.map((step) => {
              const Icon = icons[step.id];
              const running = step.status === "running";
              return (
                <li
                  key={step.id}
                  className={cn(
                    "grid grid-cols-[1.3fr_1fr_auto_3.5rem_4.5rem] items-center gap-3 border-b border-border px-2 py-3 text-sm",
                    running && "border-l-2 border-l-[#6B2D3C] bg-[#F3EEE4]",
                    step.status === "waiting" && "opacity-60",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-foreground" strokeWidth={1.5} />
                    <span className={running ? "font-semibold" : undefined}>{step.label}</span>
                  </span>
                  <span className="text-muted-foreground">{step.meta}</span>
                  <span className="text-right font-mono">{step.detail}</span>
                  <span
                    className={cn(
                      "text-right font-mono text-muted-foreground",
                      running && "text-[#6B2D3C]",
                    )}
                  >
                    {step.duration}
                  </span>
                  <span
                    className={cn(
                      "text-right font-mono text-[11px] tracking-wider",
                      step.status === "done" && "text-[#1E6B48]",
                      running && "animate-pulse font-semibold text-[#6B2D3C]",
                      step.status === "waiting" && "text-muted-foreground",
                    )}
                  >
                    {step.status === "done" ? "DONE" : step.status === "running" ? "RUNNING" : "WAITING"}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="pt-8 text-[13px] text-muted-foreground">
            Scores are computed in code from affinities. The model only writes the sentences.
          </p>
        </div>
        <div className="border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <div className="flex min-h-[440px] flex-col justify-between border border-border p-8">
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">DRAFT RECORD</p>
              <h2 className="mt-3 font-heading text-xl font-normal">Memo</h2>
              <p className="mt-2 text-[13px] text-muted-foreground">
                The verdict lands here when the run finishes.
              </p>
            </div>
            <p className="py-16 text-center font-mono text-[11px] tracking-[0.16em] text-muted-foreground/70 uppercase">
              Awaiting final tool output
            </p>
            <div className="flex justify-between border-t border-border pt-3 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
              <span>CONFIDENTIAL</span>
              <span>SITEFIT MEMO DESK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
