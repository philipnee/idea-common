import Link from "next/link";
import { FirePill } from "@/components/fire-pill";
import { formatRelativeTime } from "@/lib/format";
import type { IdeaSummary } from "@/lib/types";

export function IdeaCard({ idea }: { idea: IdeaSummary }) {
  return (
    <Link
      href={`/idea/${idea.id}`}
      className="group flex min-h-40 flex-col justify-between rounded-[24px] border border-line bg-card px-5 py-5 shadow-card transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_14px_40px_rgba(24,21,17,0.12)]"
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

