import Link from "next/link";

export function SiteShell({
  children,
  current = "hot",
  title = "Ideas",
  description = "Browse what people want built. Post one fast. Fire the ones that deserve more momentum."
}: {
  children: React.ReactNode;
  current?: "hot" | "new" | "post";
  title?: string;
  description?: string;
}) {
  return (
    <main className="min-h-screen px-4 py-10 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-7">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.36em] text-muted"
            >
              Idea Commons
            </Link>
            <h1 className="font-display text-5xl italic leading-none tracking-tight text-ink sm:text-[3.6rem]">
              {title}
            </h1>
            <p className="max-w-lg font-mono text-[12px] leading-6 text-muted">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={current === "post" ? "/" : "/new"}
              className="inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
            >
              {current === "post" ? "Back" : "Post Idea"}
            </Link>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
