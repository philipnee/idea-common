"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { joinClasses } from "@/lib/format";

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
        setError("Could not back this idea right now.");
        return;
      }

      setCanFire(false);
      setNextFireAt(payload.next_fire_at ?? null);
      router.refresh();
    });
  }

  if (!canFire && !error) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleFire}
        disabled={!canFire || isPending}
        aria-label={canFire ? "Back this idea" : "Reaction cooling down"}
        title={
          canFire
            ? "Back this idea"
            : `Available again at ${formatNextFire(nextFireAt) ?? "later"}`
        }
        className={joinClasses(
          "inline-flex h-14 w-14 items-center justify-center border text-2xl transition",
          !canFire
            ? "border-[#d4c3ac] bg-[#e7dcca] text-[#8b6c43]"
            : "border-[#111111] bg-[#111111] text-white hover:bg-black",
          isPending && "cursor-wait opacity-80"
        )}
      >
        <span aria-hidden="true">🐶</span>
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
