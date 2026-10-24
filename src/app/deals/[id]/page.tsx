import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DealRun } from "@/components/deal-run";
import { SiteHeader } from "@/components/site-header";
import { getDeal } from "@/lib/store";

export const instant = false;

export default function DealPage({ params }: PageProps<"/deals/[id]">) {
  return (
    <Suspense fallback={<p className="px-8 py-16 text-muted-foreground">Opening the memo.</p>}>
      <DealBody params={params} />
    </Suspense>
  );
}

async function DealBody({ params }: { params: PageProps<"/deals/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-12 md:py-14">
        <DealRun initial={deal} />
      </main>
    </>
  );
}
