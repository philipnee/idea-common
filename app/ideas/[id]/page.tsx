import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FireButton } from "@/components/fire-button";
import { FirePill } from "@/components/fire-pill";
import { ShareLinkBar } from "@/components/share-link-bar";
import { SiteShell } from "@/components/site-shell";
import { formatRelativeTime } from "@/lib/format";
import { getPublicIdeaUrl } from "@/lib/config";
import { getIdeaById } from "@/lib/ideas";
import { getRequestKey } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { posted?: string };
}) {
  const headerBag = headers();
  const viewerKey = getRequestKey(headerBag);
  const idea = await getIdeaById(params.id, viewerKey);

  if (!idea) {
    notFound();
  }

  const wasJustPosted = searchParams?.posted === "true";
  const shareUrl = getPublicIdeaUrl(idea.id, headerBag);

  return (
    <SiteShell
      title="Idea"
      description="A single public idea. Share it around, then come back later and fire it again."
    >
      <div className="flex">
        <Link
          href="/"
          className="inline-flex border border-[#ddd0bf] bg-[#ebe2d4] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:text-ink"
        >
          Back to feed
        </Link>
      </div>

      {wasJustPosted ? <ShareLinkBar shareUrl={shareUrl} /> : null}

      <article className="border border-[#e1d5c5] bg-card px-5 py-6 shadow-card sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <FirePill fireLevel={idea.fireLevel} />
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {formatRelativeTime(idea.createdAt)}
              </p>
              {idea.externalLink ? (
                <a
                  href={idea.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex border border-[#d8ccb9] bg-[#f7f0e6] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition hover:text-ink"
                >
                  External Link
                </a>
              ) : null}
            </div>
            <FireButton
              ideaId={idea.id}
              initialCanFire={idea.viewerCanFire}
              initialNextFireAt={idea.nextFireAt}
            />
          </div>

          <div className="space-y-4">
            <h2 className="max-w-3xl font-mono text-[26px] leading-tight tracking-[-0.01em] sm:text-[31px]">
              {idea.idea}
            </h2>
            {idea.details ? (
              <div className="max-w-3xl whitespace-pre-wrap text-[15px] leading-8 text-muted">
                {idea.details}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
