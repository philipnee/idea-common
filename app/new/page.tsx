import { headers } from "next/headers";
import { NewIdeaForm } from "@/components/new-idea-form";
import { SiteShell } from "@/components/site-shell";
import { env } from "@/lib/env";
import { getPostingContext } from "@/lib/ideas";
import { issuePostToken, getRequestKey } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function NewIdeaPage() {
  const headerBag = headers();
  const submitKey = getRequestKey(headerBag);
  const postToken = issuePostToken();
  const postingContext = await getPostingContext(submitKey);

  return (
    <SiteShell current="post">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <NewIdeaForm
          initialPostToken={postToken}
          initialRequiresChallenge={postingContext.requiresChallenge}
          turnstileSiteKey={env.turnstileSiteKey}
        />
        <aside className="rounded-[28px] border border-line bg-card px-5 py-5 shadow-card sm:px-6 sm:py-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Post Rules
          </p>
          <div className="mt-4 space-y-4 text-sm leading-6 text-muted">
            <p>One short idea is enough. Details are optional.</p>
            <p>No preview. No email. No profile. The idea goes live immediately.</p>
            <p>
              Low-friction anti-abuse is active in the background: signed token,
              timing check, rate limits, and duplicate rejection.
            </p>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}

