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
  const [externalLink, setExternalLink] = useState("");
  const [error, setError] = useState("");
  const [requiresChallenge, setRequiresChallenge] = useState(
    initialRequiresChallenge
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanedIdea = idea.trim();
    const cleanedDetails = details.trim();
    const cleanedExternalLink = externalLink.trim();

    setIdea(cleanedIdea);
    setDetails(cleanedDetails);
    setExternalLink(cleanedExternalLink);

    startTransition(async () => {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idea: cleanedIdea,
          details: cleanedDetails,
          externalLink: cleanedExternalLink,
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

      router.push(`/ideas/${payload.id}?posted=true`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 border border-[#e1d5c5] bg-card px-4 py-4 shadow-card sm:px-5 sm:py-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="idea"
          className="block font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          What is this idea?
        </label>
        <textarea
          id="idea"
          name="idea"
          rows={3}
          maxLength={100}
          required
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          onBlur={() => setIdea((current) => current.trim())}
          placeholder="Local library reciprocity pass for remote workers"
          className="w-full border border-[#d8ccb9] bg-[#fbf7f0] px-4 py-3 font-mono text-[16px] leading-7 text-ink outline-none transition placeholder:text-[#9b8c7d] focus:border-[#b99f82]"
        />
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>One short idea is required.</span>
          <span>{idea.length}/100</span>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="details"
          className="block font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          Details
          <span className="ml-2 font-normal lowercase tracking-normal text-muted">
            optional
          </span>
        </label>
        <textarea
          id="details"
          name="details"
          rows={6}
          maxLength={2000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          onBlur={() => setDetails((current) => current.trim())}
          placeholder="Problem, customer, angle, or anything else that helps."
          className="w-full border border-[#d8ccb9] bg-[#f8f2e9] px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-[#9b8c7d] focus:border-[#b99f82]"
        />
        <div className="text-right font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          {details.length}/2000
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="external-link"
          className="block font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          External Link
          <span className="ml-2 font-normal lowercase tracking-normal text-muted">
            optional
          </span>
        </label>
        <input
          id="external-link"
          name="external_link"
          type="url"
          inputMode="url"
          value={externalLink}
          onChange={(event) => setExternalLink(event.target.value)}
          onBlur={() => setExternalLink((current) => current.trim())}
          placeholder="https://reddit.com/..."
          className="w-full border border-[#d8ccb9] bg-[#fbf7f0] px-4 py-3 font-mono text-[14px] text-ink outline-none transition placeholder:text-[#9b8c7d] focus:border-[#b99f82]"
        />
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
        <div className="space-y-3 border border-[#d8ccb9] bg-[#f6eee2] px-4 py-4">
          <p className="font-mono text-[11px] leading-6 text-muted">
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
        <div className="border border-[#d8b7a6] bg-[#f2e6de] px-4 py-3 text-sm text-[#8b4c31]">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={joinClasses(
            "inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black",
            isPending && "cursor-wait opacity-80"
          )}
        >
          POST
        </button>
      </div>
    </form>
  );
}
