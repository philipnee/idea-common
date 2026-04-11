import Link from "next/link";
import { headers } from "next/headers";
import { IdeaFeed } from "@/components/idea-feed";
import { NewIdeaForm } from "@/components/new-idea-form";
import { SiteShell } from "@/components/site-shell";
import { env, isDevAppMode } from "@/lib/env";
import { getPostingContext, listIdeas } from "@/lib/ideas";
import { joinClasses } from "@/lib/format";
import { getRequestKey, issuePostToken } from "@/lib/security";
import type { IdeaSort } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams?: {
    sort?: string;
    page?: string;
  };
}) {
  const headerBag = headers();
  const submitKey = getRequestKey(headerBag);
  const rawSort = searchParams?.sort ?? null;
  const sort: IdeaSort =
    rawSort === "new" ? "new" : rawSort === "lit" || rawSort === "hot" ? "hot" : "all";
  const page = Number(searchParams?.page ?? "1");
  const showDevTags = isDevAppMode();
  const postToken = issuePostToken();
  const postingContext = await getPostingContext(submitKey);
  const feed = await listIdeas({
    sort,
    page: Number.isFinite(page) ? page : 1,
    offset: 0,
    limit: 20
  });

  return (
    <SiteShell
      current={sort}
      title="Litboard"
      description="Post an idea. See if it catches fire."
    >
      <NewIdeaForm
        initialPostToken={postToken}
        initialRequiresChallenge={postingContext.requiresChallenge}
        turnstileSiteKey={env.turnstileSiteKey}
      />

      <section>
        <div className="inline-flex">
          {([
            { value: "all", label: "All", href: "/" },
            { value: "hot", label: "Lit", href: "/?sort=lit" },
            { value: "new", label: "New", href: "/?sort=new" }
          ] as const).map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={joinClasses(
                "px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.08em] transition",
                sort === tab.value
                  ? "bg-[#1a1a1a] text-[#fdfbf7]"
                  : "text-[#9ca3af] hover:text-[#1a1a1a]"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>

      {feed.ideas.length ? (
        <IdeaFeed
          initialIdeas={feed.ideas}
          initialHasMore={feed.hasMore}
          initialSeed={feed.seed}
          sort={sort}
          showDevTags={showDevTags}
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
          <a
            href="#post"
            className="mt-6 inline-flex border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
          >
            Post
          </a>
        </section>
      )}
    </SiteShell>
  );
}
