import Link from "next/link";

export function SiteShell({
  children,
  current = "hot"
}: {
  children: React.ReactNode;
  current?: "hot" | "new" | "post";
}) {
  return (
    <main className="min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[28px] border border-line/80 bg-card/90 px-5 py-5 shadow-card backdrop-blur sm:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/"
                className="font-mono text-xs uppercase tracking-[0.28em] text-muted"
              >
                Idea Commons
              </Link>
              <div className="space-y-2">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Public startup ideas. Nothing but signal.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
                  Browse what people want built, post one fast, and fire the ideas
                  worth chasing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={current === "post" ? "/" : "/new"}
                className="inline-flex items-center justify-center rounded-full border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black"
              >
                {current === "post" ? "Back to feed" : "Post Idea"}
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

