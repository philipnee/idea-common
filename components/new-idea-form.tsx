"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { joinClasses } from "@/lib/format";

export function NewIdeaForm({
  initialPostToken,
  initialRequiresChallenge,
  turnstileSiteKey
}: {
  initialPostToken: string;
  initialRequiresChallenge: boolean;
  turnstileSiteKey: string;
}) {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [requiresChallenge, setRequiresChallenge] = useState(
    initialRequiresChallenge
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idea,
          details,
          postToken: initialPostToken,
          website: "",
          turnstile_token: turnstileToken
        })
      });

      const payload = (await response.json()) as {
        id?: string;
        message?: string;
        challengeRequired?: boolean;
      };

      if (!response.ok) {
        setError(payload.message || "Could not post right now.");
        setRequiresChallenge(Boolean(payload.challengeRequired));
        return;
      }

      if (!payload.id) {
        setError("Post created, but the response was incomplete.");
        return;
      }

      router.push(`/idea/${payload.id}?posted=true`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[28px] border border-line bg-card px-5 py-5 shadow-card sm:px-7 sm:py-7"
    >
      <div className="space-y-2">
        <label htmlFor="idea" className="block font-medium tracking-tight">
          Your idea
        </label>
        <textarea
          id="idea"
          name="idea"
          rows={3}
          maxLength={100}
          required
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="A startup idea in 100 characters"
          className="w-full rounded-[20px] border border-line bg-[#fffcf7] px-4 py-3 text-base leading-7 text-ink outline-none transition placeholder:text-muted focus:border-ink/40 focus:ring-4 focus:ring-orange-100"
        />
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>Keep it short. Add details only if they matter.</span>
          <span>{idea.length}/100</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="details" className="block text-sm font-medium text-ink">
          Details
          <span className="ml-2 font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="details"
          name="details"
          rows={6}
          maxLength={2000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Problem, customer, angle, or anything else that helps."
          className="w-full rounded-[20px] border border-line bg-[#fffcf7] px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-muted focus:border-ink/40 focus:ring-4 focus:ring-orange-100"
        />
        <div className="text-right font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {details.length}/2000
        </div>
      </div>

      <input type="hidden" name="post_token" value={initialPostToken} />
      <input
        type="text"
        name="website"
        value=""
        onChange={() => undefined}
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
      />

      {requiresChallenge && turnstileSiteKey ? (
        <div className="space-y-3 rounded-[20px] border border-line bg-[#fff7ef] px-4 py-4">
          <p className="text-sm text-muted">
            This submitter looks unusual. Complete the anti-bot check to keep
            posting.
          </p>
          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onToken={setTurnstileToken}
          />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          Everything you post is public. Skip contact info unless you want it
          scraped.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className={joinClasses(
            "inline-flex items-center justify-center rounded-full border border-ink bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-black",
            isPending && "cursor-wait opacity-80"
          )}
        >
          {isPending ? "Posting..." : "Post Idea"}
        </button>
      </div>
    </form>
  );
}

