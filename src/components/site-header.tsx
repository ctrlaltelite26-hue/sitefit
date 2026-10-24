import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-b border-border bg-card px-8 py-3">
      <Link href="/" className="font-heading text-2xl tracking-tight border-b border-primary pb-0.5">
        Sitefit
      </Link>
      <Link href="/" className="text-base underline-offset-4 hover:underline">
        Deal desk
      </Link>
    </header>
  );
}
