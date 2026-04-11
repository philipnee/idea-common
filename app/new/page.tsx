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
      description="Got an idea? Just type it. Add a description only if it helps."
    >
      <section className="mx-auto max-w-2xl">
        <NewIdeaForm
          initialPostToken={postToken}
          initialRequiresChallenge={postingContext.requiresChallenge}
          turnstileSiteKey={env.turnstileSiteKey}
        />
      </section>
    </SiteShell>
  );
}
