import Link from "next/link";
import { FreedaMark } from "@/components/freeda-mark";

export function SiteShell({
  children,
  current = "hot",
  title = "Go Frieda",
  description = "Public ideas worth passing around. Post one fast, then back the ones that deserve more attention.",
  tagline
}: {
  children: React.ReactNode;
  current?: "hot" | "new" | "post";
  title?: string;
  description?: string;
  tagline?: string | null;
}) {
  const largeBrand = current === "hot" || current === "new";

  return (
    <main className="min-h-screen px-4 py-10 text-ink sm:px-6 lg:px-8">
      <Link
        href="/about"
        aria-label="About"
        className="group fixed right-4 top-4 z-20 inline-flex items-center gap-3 sm:right-6 sm:top-6"
      >
        <span className="pointer-events-none rounded-full border border-[#ddd0bf] bg-[#f1e6d8] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:-translate-x-2">
          About
        </span>
        <span className="inline-flex h-11 w-11 flex-col items-center justify-center gap-1 border border-[#111111] bg-[#111111] shadow-card transition group-hover:bg-black group-focus-visible:bg-black">
          <span className="h-px w-4 bg-white" />
          <span className="h-px w-4 bg-white" />
          <span className="h-px w-4 bg-white" />
        </span>
      </Link>
      <div className="mx-auto flex max-w-3xl flex-col gap-7">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <Link href="/" className="inline-flex">
              <FreedaMark
                className={
                  largeBrand ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl"
                }
              />
            </Link>
            <div className="space-y-3">
              <h1 className="font-display text-5xl italic leading-none tracking-tight text-ink sm:text-[3.6rem]">
                {title}
              </h1>
              {tagline ? (
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {tagline}
                </p>
              ) : null}
              <p className="max-w-lg font-mono text-[12px] leading-6 text-muted">
                {description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={current === "post" ? "/" : "/new"}
              className="inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
            >
              {current === "post" ? "Back" : "POST"}
            </Link>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
