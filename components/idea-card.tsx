import Link from "next/link";
import { FirePill } from "@/components/fire-pill";
import { joinClasses } from "@/lib/format";
import { formatRelativeTime } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";

export function IdeaCard({ idea }: { idea: IdeaSummary }) {
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className={joinClasses(
        "group flex min-h-40 flex-col justify-between border px-4 py-4 shadow-card transition hover:border-[#cdbca7]",
        idea.fireLevel === 0 && "border-line bg-card",
        idea.fireLevel === 1 && "border-[#e2d0b8] bg-[#f6eee1]",
        idea.fireLevel === 2 && "border-[#e0c4a5] bg-[#f4e4d3]",
        idea.fireLevel === 3 && "border-[#ddb38b] bg-[#f0ddca]",
        idea.fireLevel === 4 && "border-[#d6a27a] bg-[#ecd2c0]",
        idea.fireLevel === 5 && "border-[#cf8f69] bg-[#e7c4b5]"
      )}
    >
      <div className="space-y-4">
        <FirePill fireLevel={idea.fireLevel} small />
        <p className="font-mono text-[18px] leading-8 tracking-[-0.01em] text-ink">
          {idea.idea}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          idea
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {formatRelativeTime(idea.createdAt)}
        </p>
      </div>
    </Link>
  );
}
