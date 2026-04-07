"use client";

import { useEffect, useRef, useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import type { IdeaSummary } from "@/lib/types";

export function IdeaFeed({
  initialIdeas,
  initialHasMore,
  sort
}: {
  initialIdeas: IdeaSummary[];
  initialHasMore: boolean;
  sort: "hot" | "new";
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIdeas(initialIdeas);
    setHasMore(initialHasMore);
    setIsLoading(false);
    setLoadError("");
  }, [initialHasMore, initialIdeas, sort]);

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

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, ideas.length, isLoading, sort]);

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {ideas.length} loaded
      </p>
      <section className="grid gap-3 md:grid-cols-2">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </section>
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex min-h-16 items-center justify-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            {loadError ? loadError : isLoading ? "Loading more" : "Scroll for more"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
