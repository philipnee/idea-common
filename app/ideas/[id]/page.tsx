import { DevTagMeta } from "@/components/dev-tag-meta";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FireButton } from "@/components/fire-button";
import { ShareLinkBar } from "@/components/share-link-bar";
import { ShareLinkButton } from "@/components/share-link-button";
import { SiteShell } from "@/components/site-shell";
import { isDevAppMode } from "@/lib/env";
import {
  formatExternalLinkLabel,
  formatRelativeTime,
  splitIdeaDetails
} from "@/lib/format";
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
  const idea = await getIdeaById(params.id, viewerKey, { recordView: true });
  const showDevTags = isDevAppMode();

  if (!idea) {
    notFound();
  }

  const wasJustPosted = searchParams?.posted === "true";
  const shareUrl = getPublicIdeaUrl(idea.id, headerBag);
  const detailParagraphs = splitIdeaDetails(idea.details);

  return (
    <SiteShell
      title="Idea"
      description="A single public idea. Share it around, then see if it catches more fire."
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
        <div className="flex flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {formatRelativeTime(idea.createdAt)}
            </p>
            <ShareLinkButton shareUrl={shareUrl} />
          </div>

          <div className="space-y-4">
            <h2 className="max-w-3xl font-mono text-[26px] leading-tight tracking-[-0.01em] sm:text-[31px]">
              {idea.idea}
            </h2>
            {detailParagraphs.length ? (
              <div className="max-w-3xl space-y-5 text-[16px] leading-8 text-[#564b41]">
                {detailParagraphs.map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-4 pt-2">
            <div className="min-w-0 space-y-3">
              {showDevTags ? (
                <DevTagMeta
                  kind={idea.kind}
                  topic={idea.topic}
                  tagSource={idea.tagSource}
                  showEmptyState={false}
                />
              ) : null}
              {idea.externalLink ? (
                <a
                  href={idea.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] tracking-[0.02em] text-[#6f5645] underline decoration-[#c7a98f] underline-offset-4 transition hover:text-ink"
                >
                  Source: {formatExternalLinkLabel(idea.externalLink)}
                </a>
              ) : null}
            </div>
            <div className="shrink-0">
              <FireButton
                ideaId={idea.id}
                initialCanFire={idea.viewerCanFire}
                initialNextFireAt={idea.nextFireAt}
              />
            </div>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
