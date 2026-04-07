import Link from "next/link";
import { IdeaFeed } from "@/components/idea-feed";
import { SiteShell } from "@/components/site-shell";
import { listIdeas } from "@/lib/ideas";
import { joinClasses } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams?: {
    sort?: string;
    page?: string;
  };
}) {
  const sort = searchParams?.sort === "new" ? "new" : "hot";
  const page = Number(searchParams?.page ?? "1");
  const feed = await listIdeas({
    sort,
    page: Number.isFinite(page) ? page : 1,
    offset: 0,
    limit: 20
  });

  return (
    <SiteShell
      current={sort}
      title="Go Frieda"
      description="Public ideas worth passing around. Post one fast, then back the ones that deserve more attention."
    >
      <section className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
        <div className="inline-flex w-fit border border-[#ddd0bf] bg-[#ebe2d4] p-1 shadow-card">
          {(["hot", "new"] as const).map((tab) => (
            <Link
              key={tab}
              href={tab === "hot" ? "/" : "/?sort=new"}
              className={joinClasses(
                "px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition",
                sort === tab
                  ? "bg-[#111111] text-white"
                  : "text-muted hover:text-ink"
              )}
            >
              {tab}
            </Link>
          ))}
        </div>
      </section>

      {feed.ideas.length ? (
        <IdeaFeed
          initialIdeas={feed.ideas}
          initialHasMore={feed.hasMore}
          sort={sort}
        />
      ) : (
        <section className="border border-dashed border-[#d7cab8] bg-card px-6 py-12 text-center shadow-card">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Empty feed
          </p>
          <h2 className="mt-3 font-display text-4xl italic tracking-tight">
            The first idea is still up for grabs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-mono text-[12px] leading-6 text-muted">
            Post one short idea and it lands in the public feed immediately.
          </p>
          <Link
            href="/new"
            className="mt-6 inline-flex border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
          >
            POST
          </Link>
        </section>
      )}
    </SiteShell>
  );
}
