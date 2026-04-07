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
    <SiteShell
      current="post"
      title="Post"
      description="What is this idea? Keep it tight. Add details or one public link only if they help."
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <NewIdeaForm
          initialPostToken={postToken}
          initialRequiresChallenge={postingContext.requiresChallenge}
          turnstileSiteKey={env.turnstileSiteKey}
        />
        <aside className="border border-[#e1d5c5] bg-card px-5 py-5 shadow-card sm:px-6 sm:py-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Post Rules
          </p>
          <div className="mt-4 space-y-4 font-mono text-[12px] leading-6 text-muted">
            <p>One short idea is required. Details and one public link are optional.</p>
            <p>No preview. No email. No profile. The idea goes live immediately.</p>
            <p>
              Low-friction anti-abuse is active in the background: signed token,
              timing check, rate limits, duplicate rejection, and optional
              title verification.
            </p>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}
