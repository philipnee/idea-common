"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { joinClasses } from "@/lib/format";

export function FireButton({
  ideaId,
  initialCanFire,
  initialNextFireAt
}: {
  ideaId: string;
  initialCanFire: boolean;
  initialNextFireAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [canFire, setCanFire] = useState(initialCanFire);
  const [nextFireAt, setNextFireAt] = useState(initialNextFireAt);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!nextFireAt) {
      return;
    }

    const delay = Date.parse(nextFireAt) - Date.now();

    if (delay <= 0) {
      setCanFire(true);
      setNextFireAt(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setCanFire(true);
      setNextFireAt(null);
      router.refresh();
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [nextFireAt, router]);

  async function handleFire() {
    if (!canFire || isPending) {
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/ideas/${ideaId}/fire`, {
        method: "POST"
      });

      const payload = (await response.json()) as {
        cooldown_active?: boolean;
        next_fire_at?: string | null;
      };

      if (!response.ok) {
        setError("Could not add fire right now.");
        return;
      }

      setCanFire(false);
      setNextFireAt(payload.next_fire_at ?? null);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleFire}
        disabled={!canFire || isPending}
        aria-label={canFire ? "Lit this idea" : "Lit"}
        title={canFire ? "Lit this idea" : "Lit"}
        className={joinClasses(
          "group inline-flex w-full max-w-[20rem] items-center justify-center gap-2 border-2 px-8 py-4 font-mono text-[14px] font-medium uppercase tracking-[0.08em] transition active:scale-[0.97]",
          !canFire
            ? "cursor-not-allowed border-[#ea580c] bg-[#ea580c] text-[#fdfbf7]"
            : "border-[#ea580c] bg-transparent text-[#ea580c] hover:-translate-y-px hover:bg-[#ea580c] hover:text-[#fdfbf7] hover:shadow-[0_4px_12px_rgba(234,88,12,0.25)]",
          isPending && "cursor-wait opacity-80"
        )}
      >
        <span
          aria-hidden="true"
          className="text-[1.3rem] leading-none transition-transform group-hover:scale-125"
        >
          🔥
        </span>
        <span>{canFire ? "Lit this idea" : "LIT"}</span>
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
