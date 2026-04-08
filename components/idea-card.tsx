import { DevTagMeta } from "@/components/dev-tag-meta";
import Link from "next/link";
import { FirePill } from "@/components/fire-pill";
import { joinClasses } from "@/lib/format";
import { formatRelativeTime } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";

export function IdeaCard({
  idea,
  showDevTags = false
}: {
  idea: IdeaSummary;
  showDevTags?: boolean;
}) {
  const toneClass = joinClasses(
    idea.fireLevel === 0 && "border-[#ddd0bf] bg-[#f5efe5] hover:border-[#cdbca7]",
    idea.fireLevel === 1 && "border-[#e4c98f] bg-[#f7ecd5] hover:border-[#d7b477]",
    idea.fireLevel === 2 && "border-[#dfad69] bg-[#f4dfbf] hover:border-[#cf9450]",
    idea.fireLevel === 3 && "border-[#d68757] bg-[#f0c9a7] hover:border-[#c96f40]",
    idea.fireLevel === 4 && "border-[#c5653c] bg-[#ebb092] hover:border-[#b6542e] shadow-[0_12px_28px_rgba(197,101,60,0.14)]",
    idea.fireLevel === 5 && "border-[#ad4828] bg-[#e19479] hover:border-[#963a1f] shadow-[0_16px_34px_rgba(173,72,40,0.2)]"
  );

  return (
    <Link
      href={`/ideas/${idea.id}`}
      className={joinClasses(
        "group flex min-h-[15rem] flex-col justify-between border px-4 py-4 shadow-card transition duration-150 hover:-translate-y-0.5",
        toneClass
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {formatRelativeTime(idea.createdAt)}
          </p>
          <FirePill fireLevel={idea.fireLevel} small />
        </div>
        {showDevTags ? (
          <DevTagMeta
            kind={idea.kind}
            topic={idea.topic}
            tagSource={idea.tagSource}
            compact
            showSourceLabel={false}
            showEmptyState={false}
          />
        ) : null}
        <div className="space-y-3">
          <h2 className="font-mono text-[20px] leading-8 tracking-[-0.02em] text-ink">
            {idea.idea}
          </h2>
          {idea.excerpt ? (
            <p className="max-w-[34ch] text-[13px] leading-6 text-[#5d5044]">
              {idea.excerpt}
            </p>
          ) : null}
        </div>
      </div>
      <div className="pt-5">
        {showDevTags ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            dev view
          </p>
        ) : null}
      </div>
    </Link>
  );
}
