import { joinClasses } from "@/lib/format";
import type { IdeaTagSource } from "@/lib/types";

export function DevTagMeta({
  kind,
  topic,
  tagSource,
  compact = false,
  showSourceLabel = true,
  showEmptyState = true
}: {
  kind: string | null;
  topic: string | null;
  tagSource: IdeaTagSource | null;
  compact?: boolean;
  showSourceLabel?: boolean;
  showEmptyState?: boolean;
}) {
  const values = [kind, topic].filter(Boolean);

  if (!values.length && !showEmptyState) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.length ? (
        values.map((value) => (
          <span
            key={value}
            className={joinClasses(
              "inline-flex items-center border border-[#d9ccb8] bg-[#f7efe3] font-mono uppercase tracking-[0.14em] text-[#7b6c5f]",
              compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1 text-[10px]"
            )}
          >
            {value}
          </span>
        ))
      ) : showEmptyState ? (
        <span
          className={joinClasses(
            "inline-flex items-center border border-dashed border-[#d9ccb8] bg-[#faf5ee] font-mono uppercase tracking-[0.14em] text-[#9b8c7d]",
            compact ? "px-2 py-1 text-[9px]" : "px-2.5 py-1 text-[10px]"
          )}
        >
          untagged
        </span>
      ) : null}
      {showSourceLabel && tagSource ? (
        <span
          className={joinClasses(
            "font-mono uppercase tracking-[0.14em] text-muted",
            compact ? "text-[9px]" : "text-[10px]"
          )}
        >
          {tagSource}
        </span>
      ) : null}
    </div>
  );
}
