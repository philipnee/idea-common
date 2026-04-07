import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FireButton } from "@/components/fire-button";
import { FirePill } from "@/components/fire-pill";
import { SiteShell } from "@/components/site-shell";
import { formatRelativeTime } from "@/lib/format";
import { getFireState, getIdeaById } from "@/lib/ideas";
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

  return (
    <SiteShell>
      <div className="flex">
        <Link
          href="/"
          className="inline-flex rounded-full border border-line bg-card px-4 py-2 text-sm text-muted transition hover:border-ink/20 hover:text-ink"
        >
          Back to feed
        </Link>
      </div>

      {wasJustPosted ? (
        <div className="rounded-[22px] border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
          Your idea is live.
        </div>
      ) : null}

      <article className="rounded-[30px] border border-line bg-card px-5 py-6 shadow-card sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <FirePill
              heat={idea.heat}
              fireState={getFireState(idea.heat)}
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {formatRelativeTime(idea.createdAt)}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {idea.idea}
            </h2>
            {idea.details ? (
              <div className="max-w-3xl whitespace-pre-wrap text-base leading-8 text-muted">
                {idea.details}
              </div>
            ) : null}
          </div>

          <div className="pt-2">
            <FireButton
              ideaId={idea.id}
              initialCanFire={idea.viewerCanFire}
              initialFireState={getFireState(idea.heat)}
              initialNextFireAt={idea.nextFireAt}
            />
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
