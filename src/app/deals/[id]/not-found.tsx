import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function DealNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-8 py-16">
        <h1 className="font-heading text-3xl">This deal is not on the desk.</h1>
        <p className="text-muted-foreground">
          Fixture deals live in memory for this process. Open one from the desk again.
        </p>
        <Link href="/" className="underline underline-offset-4">
          Deal desk
        </Link>
      </main>
    </>
  );
}
