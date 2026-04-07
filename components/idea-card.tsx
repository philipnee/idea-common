import Link from "next/link";
import { FirePill } from "@/components/fire-pill";
import { joinClasses } from "@/lib/format";
import { formatRelativeTime } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";

export function IdeaCard({ idea }: { idea: IdeaSummary }) {
  return (
    <Link
      href={`/idea/${idea.id}`}
      className={joinClasses(
        "group flex min-h-40 flex-col justify-between border px-4 py-4 shadow-card transition hover:border-[#cdbca7]",
        idea.fireState === "none" && "border-line bg-card",
        idea.fireState === "ember" && "border-[#e2d0b8] bg-[#f6eee1]",
        idea.fireState === "spark" && "border-[#e2c6a8] bg-[#f4e6d5]",
        idea.fireState === "flame" && "border-[#dfb992] bg-[#f0ddca]",
        idea.fireState === "blaze" && "border-[#d7aa86] bg-[#edd5c5]",
        idea.fireState === "wildfire" && "border-[#cf9c7b] bg-[#e9ccbf]"
      )}
    >
      <div className="space-y-4">
        <FirePill heat={idea.heat} fireState={idea.fireState} small />
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
