"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinClasses } from "@/lib/format";
import type { FireState } from "@/lib/types";

export function FireButton({
  ideaId,
  initiallyFired,
  initialFireState
}: {
  ideaId: string;
  initiallyFired: boolean;
  initialFireState: FireState;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasFired, setHasFired] = useState(initiallyFired);
  const [fireState, setFireState] = useState(initialFireState);
  const [error, setError] = useState("");

  const label = hasFired ? "Fired" : isPending ? "Firing..." : "Fire this idea";

  async function handleFire() {
    if (hasFired || isPending) {
      return;
    }

    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/ideas/${ideaId}/fire`, {
        method: "POST"
      });

      const payload = (await response.json()) as {
        already_fired?: boolean;
        fire_state?: FireState;
      };

      if (!response.ok) {
        setError("Could not fire this idea right now.");
        return;
      }

      setHasFired(true);
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
        disabled={hasFired || isPending}
        className={joinClasses(
          "inline-flex min-w-48 items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition",
          hasFired
            ? "border-orange-300 bg-orange-100 text-orange-800"
            : "border-ink bg-ink text-white hover:bg-black",
          isPending && "cursor-wait opacity-80"
        )}
      >
        {label}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {!error && fireState !== "none" ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Current state: {fireState.replaceAll("_", " ")}
        </p>
      ) : null}
    </div>
  );
}

