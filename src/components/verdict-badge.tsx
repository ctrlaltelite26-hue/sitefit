import { Badge } from "@/components/ui/badge";
import type { Verdict } from "@/types/deal";

const styles: Record<Verdict, string> = {
  go: "rounded-none border-[#1E6B48] bg-transparent font-mono text-[11px] tracking-wider text-[#1E6B48]",
  caution:
    "rounded-none border-[#8F6410] bg-transparent font-mono text-[11px] tracking-wider text-[#8F6410]",
  "no-go":
    "rounded-none border-[#8C2F2F] bg-transparent font-mono text-[11px] tracking-wider text-[#8C2F2F]",
};

const labels: Record<Verdict, string> = {
  go: "GO",
  caution: "CAUTION",
  "no-go": "NO-GO",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <Badge variant="outline" className={styles[verdict]}>
      {labels[verdict]}
    </Badge>
  );
}
