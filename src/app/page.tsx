import { DealDesk } from "@/components/deal-desk";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-12 md:py-14">
        <article className="mx-auto w-full max-w-[1120px] border border-border bg-card px-8 py-12 shadow-[0_1px_2px_rgba(28,25,21,0.04),0_4px_12px_rgba(28,25,21,0.03)] sm:px-12 md:px-16">
          <DealDesk />
        </article>
      </main>
    </>
  );
}
