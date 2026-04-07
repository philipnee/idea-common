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
        "group flex min-h-40 flex-col justify-between rounded-[24px] border px-5 py-5 shadow-card transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_14px_40px_rgba(24,21,17,0.12)]",
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
        <p className="text-lg font-medium leading-7 tracking-tight text-ink">
          {idea.idea}
        </p>
      </div>
      <p className="pt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {formatRelativeTime(idea.createdAt)}
      </p>
    </Link>
  );
}
