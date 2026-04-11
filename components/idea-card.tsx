import { DevTagMeta } from "@/components/dev-tag-meta";
import Link from "next/link";
import { joinClasses } from "@/lib/format";
import { formatRelativeTime } from "@/lib/format";
import type { FireLevel, IdeaSummary } from "@/lib/types";

const heatMeta: Record<FireLevel | "ash", { icon: string; label: string; className: string }> = {
  ash: {
    icon: "🪵",
    label: "",
    className: "bg-[rgba(156,163,175,0.12)] text-[#9ca3af]"
  },
  0: {
    icon: "",
    label: "",
    className: ""
  },
  1: {
    icon: "",
    label: "Ember",
    className: "bg-[rgba(217,119,6,0.1)] text-[#d97706]"
  },
  2: {
    icon: "",
    label: "Spark",
    className: "bg-[rgba(234,88,12,0.12)] text-[#ea580c]"
  },
  3: {
    icon: "",
    label: "Flame",
    className: "bg-[rgba(220,38,38,0.1)] text-[#dc2626]"
  },
  4: {
    icon: "",
    label: "Blaze",
    className: "bg-[rgba(185,28,28,0.12)] text-[#b91c1c]"
  },
  5: {
    icon: "💥",
    label: "Supernova",
    className: "bg-[rgba(127,29,29,0.15)] text-[#7f1d1d]"
  }
};

function getHeatMeta(idea: IdeaSummary) {
  if (idea.fireLevel === 0) {
    return idea.heat > 0 ? heatMeta.ash : null;
  }

  return heatMeta[idea.fireLevel];
}

export function IdeaCard({
  idea,
  showDevTags = false
}: {
  idea: IdeaSummary;
  showDevTags?: boolean;
}) {
  const heat = getHeatMeta(idea);
  const tags = [idea.kind, idea.topic].filter(Boolean);

  return (
    <article className="mb-4 break-inside-avoid bg-[#f5f0e8] p-6">
      <Link href={`/ideas/${idea.id}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#9ca3af]">
            {formatRelativeTime(idea.createdAt)}
          </p>
          {heat ? (
            <span
              className={joinClasses(
                "inline-flex items-center gap-1 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.06em]",
                heat.className
              )}
            >
              {heat.icon ? (
                <span aria-hidden="true" className="text-[0.8rem] leading-none">
                  {heat.icon}
                </span>
              ) : null}
              {heat.label ? <span>{heat.label}</span> : null}
            </span>
          ) : null}
        </div>
        <div className="mt-3 space-y-2">
          <h2 className="font-display text-[1.15rem] font-normal leading-snug tracking-[-0.01em] text-[#1a1a1a]">
            {idea.idea}
          </h2>
          {idea.excerpt ? (
            <p className="line-clamp-3 font-mono text-[13px] font-light leading-6 text-[#6b6b6b]">
              {idea.excerpt}
            </p>
          ) : null}
        </div>
      </Link>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="font-mono text-[10px] tracking-[0.03em] text-[#9ca3af]">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      {showDevTags ? (
        <div className="mt-3">
          <DevTagMeta
            kind={idea.kind}
            topic={idea.topic}
            tagSource={idea.tagSource}
            compact
            showSourceLabel
            showEmptyState={false}
          />
        </div>
      ) : null}
      <div>
        {showDevTags ? (
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">dev view</p>
        ) : null}
      </div>
    </article>
  );
}
