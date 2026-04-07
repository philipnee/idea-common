import Link from "next/link";
import { IdeaCard } from "@/components/idea-card";
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
    limit: 18
  });

  return (
    <SiteShell current={sort}>
      <section className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
        <div className="inline-flex w-fit rounded-full border border-line bg-card p-1 shadow-card">
          {(["hot", "new"] as const).map((tab) => (
            <Link
              key={tab}
              href={tab === "hot" ? "/" : "/?sort=new"}
              className={joinClasses(
                "rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition",
                sort === tab
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              )}
            >
              {tab}
            </Link>
          ))}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {feed.ideas.length} loaded
        </p>
      </section>

      {feed.ideas.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {feed.ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </section>
      ) : (
        <section className="rounded-[28px] border border-dashed border-line bg-card/75 px-6 py-12 text-center shadow-card">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Empty feed
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            The first idea is still up for grabs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
            Post one short idea and it lands in the public feed immediately.
          </p>
          <Link
            href="/new"
            className="mt-6 inline-flex rounded-full border border-ink bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
          >
            Post the first one
          </Link>
        </section>
      )}

      {feed.hasMore ? (
        <div className="flex justify-center">
          <Link
            href={sort === "hot" ? `/?page=${feed.page + 1}` : `/?sort=new&page=${feed.page + 1}`}
            className="inline-flex rounded-full border border-line bg-card px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Load more
          </Link>
        </div>
      ) : null}
    </SiteShell>
  );
}

