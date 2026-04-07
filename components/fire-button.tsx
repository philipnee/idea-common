"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinClasses } from "@/lib/format";
import type { FireState } from "@/lib/types";

function formatNextFire(nextFireAt: string | null) {
  if (!nextFireAt) {
    return null;
  }

  return new Date(nextFireAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

export function FireButton({
  ideaId,
  initialCanFire,
  initialFireState,
  initialNextFireAt
}: {
  ideaId: string;
  initialCanFire: boolean;
  initialFireState: FireState;
  initialNextFireAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [canFire, setCanFire] = useState(initialCanFire);
  const [fireState, setFireState] = useState(initialFireState);
  const [nextFireAt, setNextFireAt] = useState(initialNextFireAt);
  const [error, setError] = useState("");

  const label = !canFire ? "🔥 Cooling" : isPending ? "🔥 ..." : "🔥 Fire";

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
        fire_state?: FireState;
        next_fire_at?: string | null;
      };

      if (!response.ok) {
        setError("Could not fire this idea right now.");
        return;
      }

      setCanFire(false);
      setNextFireAt(payload.next_fire_at ?? null);
      if (payload.fire_state) {
        setFireState(payload.fire_state);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleFire}
        disabled={!canFire || isPending}
        className={joinClasses(
          "inline-flex min-w-48 items-center justify-center border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] transition",
          !canFire
            ? "border-[#d4c3ac] bg-[#e7dcca] text-[#8b6c43]"
            : "border-[#111111] bg-[#111111] text-white hover:bg-black",
          isPending && "cursor-wait opacity-80"
        )}
      >
        {label}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {!error && !canFire && nextFireAt ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Back at {formatNextFire(nextFireAt)}
        </p>
      ) : null}
      {!error && canFire && fireState !== "none" ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Current state: {fireState.replaceAll("_", " ")}
        </p>
      ) : null}
    </div>
  );
}
