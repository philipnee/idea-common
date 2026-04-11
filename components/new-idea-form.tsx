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
  const [isComposerActive, setIsComposerActive] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");
  const [requiresChallenge, setRequiresChallenge] = useState(
    initialRequiresChallenge
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isPending, startTransition] = useTransition();
  const composerActive =
    isComposerActive ||
    idea.trim().length > 0 ||
    details.trim().length > 0 ||
    showDetails ||
    Boolean(error) ||
    requiresChallenge;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanedIdea = idea.trim();
    const cleanedDetails = details.trim();

    setIdea(cleanedIdea);
    setDetails(cleanedDetails);

    startTransition(async () => {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idea: cleanedIdea,
          details: cleanedDetails,
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
      id="post"
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[34rem] flex-col gap-3 border border-[#d8ccb9] bg-card px-3 py-3 shadow-card"
    >
      <div>
        <label htmlFor="idea" className="sr-only">
          Got an idea?
        </label>
        <input
          id="idea"
          name="idea"
          type="text"
          maxLength={100}
          required
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          onFocus={() => setIsComposerActive(true)}
          onBlur={() => setIdea((current) => current.trim())}
          placeholder="Got an idea?"
          className="h-10 w-full border border-[#d8ccb9] bg-[#fbf7f0] px-3 font-mono text-[14px] text-ink outline-none transition placeholder:text-[#9b8c7d] focus:border-[#b99f82]"
        />
      </div>

      {composerActive && !showDetails ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setIsComposerActive(true);
              setShowDetails(true);
            }}
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition hover:text-[#1a1a1a]"
          >
            + Description
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={joinClasses(
              "inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-4 py-2 font-mono text-[12px] tracking-[0.08em] text-white transition hover:bg-black",
              isPending && "cursor-wait opacity-80"
            )}
          >
            Post
          </button>
        </div>
      ) : null}

      {composerActive && showDetails ? (
        <div className="space-y-2">
          <label
            htmlFor="details"
            className="block font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
          >
            Description
          </label>
          <textarea
            id="details"
            name="details"
            rows={4}
            maxLength={2000}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            onFocus={() => setIsComposerActive(true)}
            onBlur={() => setDetails((current) => current.trim())}
            placeholder="Add context, links, examples, or why this should exist."
            className="w-full resize-none border border-[#d8ccb9] bg-[#f8f2e9] px-4 py-3 font-mono text-[13px] leading-7 text-ink outline-none transition placeholder:text-[#9b8c7d] focus:border-[#b99f82]"
          />
        </div>
      ) : null}

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

      {composerActive && requiresChallenge && turnstileSiteKey ? (
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

      {composerActive && error ? (
        <div className="border border-[#d8b7a6] bg-[#f2e6de] px-4 py-3 text-sm text-[#8b4c31]">
          {error}
        </div>
      ) : null}

      {composerActive && showDetails ? (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className={joinClasses(
              "inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[12px] tracking-[0.08em] text-white transition hover:bg-black",
              isPending && "cursor-wait opacity-80"
            )}
          >
            Post
          </button>
        </div>
      ) : null}
    </form>
  );
}
