"use client";

import { useEffect, useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import type { IdeaSort, IdeaSummary } from "@/lib/types";

export function IdeaFeed({
  initialIdeas,
  initialHasMore,
  initialSeed,
  sort,
  showDevTags
}: {
  initialIdeas: IdeaSummary[];
  initialHasMore: boolean;
  initialSeed?: string | null;
  sort: IdeaSort;
  showDevTags: boolean;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setIdeas(initialIdeas);
    setHasMore(initialHasMore);
    setIsLoading(false);
    setLoadError("");
  }, [initialHasMore, initialIdeas, initialSeed, sort]);

  async function loadMore() {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const search = new URLSearchParams({
        sort,
        offset: String(ideas.length),
        limit: "5"
      });

      if (sort === "all" && initialSeed) {
        search.set("seed", initialSeed);
      }

      const response = await fetch(`/api/ideas?${search.toString()}`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("load failed");
      }

      const payload = (await response.json()) as {
        ideas?: IdeaSummary[];
        hasMore?: boolean;
      };
      const nextIdeas = payload.ideas ?? [];

      setIdeas((current) => {
        const seen = new Set(current.map((idea) => idea.id));
        const uniqueNext = nextIdeas.filter((idea) => !seen.has(idea.id));
        return current.concat(uniqueNext);
      });
      setHasMore(Boolean(payload.hasMore && nextIdeas.length));
    } catch {
      setLoadError("Could not load more ideas.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {showDevTags ? (
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {ideas.length} loaded
        </p>
      ) : null}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} showDevTags={showDevTags} />
        ))}
      </section>
      {hasMore ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {loadError ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-red-700">
              {loadError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void loadMore();
            }}
            disabled={isLoading}
            className="border border-[#1a1a1a] bg-transparent px-8 py-3 font-mono text-[12px] uppercase tracking-[0.08em] text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-[#fdfbf7] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? "Loading" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
