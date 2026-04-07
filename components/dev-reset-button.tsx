"use client";

import { useState, useTransition } from "react";
import { joinClasses } from "@/lib/format";

export function DevResetButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleReset() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/dev/reset", {
        method: "POST"
      });

      if (!response.ok) {
        setError("Reset failed.");
        return;
      }

      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className={joinClasses(
          "inline-flex items-center justify-center border border-[#ddd0bf] bg-[#ebe2d4] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition hover:border-[#cdbca7]",
          isPending && "cursor-wait opacity-70"
        )}
      >
        {isPending ? "Resetting" : "Reset Data"}
      </button>
      {error ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
