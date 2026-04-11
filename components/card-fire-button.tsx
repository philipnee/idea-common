"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState, useTransition } from "react";
import { joinClasses } from "@/lib/format";

export function CardFireButton({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFired, setIsFired] = useState(false);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isFired || isPending) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/ideas/${ideaId}/fire`, {
        method: "POST"
      });

      if (!response.ok) {
        return;
      }

      setIsFired(true);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isFired || isPending}
      className={joinClasses(
        "inline-flex shrink-0 items-center gap-1 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] transition",
        isFired
          ? "border-[#ea580c] bg-[#ea580c] text-[#fdfbf7]"
          : "border-[#ea580c] bg-transparent text-[#ea580c] hover:bg-[#ea580c] hover:text-[#fdfbf7]",
        isPending && "cursor-wait opacity-80"
      )}
    >
      <span aria-hidden="true" className="text-[0.85rem] leading-none">
        🔥
      </span>
      <span>{isFired ? "fired" : "fire"}</span>
    </button>
  );
}
