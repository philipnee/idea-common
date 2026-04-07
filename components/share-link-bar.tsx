"use client";

import { useEffect, useState } from "react";
import { joinClasses } from "@/lib/format";

export function ShareLinkBar({ shareUrl }: { shareUrl: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  useEffect(() => {
    void copyLink();
  }, [shareUrl]);

  return (
    <div className="space-y-3 border border-[#dcc8b2] bg-[#f1e6d8] px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#87572a]">
          Your idea is live.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#87572a]">
          {copyState === "copied"
            ? "Link copied"
            : copyState === "failed"
              ? "Copy failed"
              : "Copying"}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          readOnly
          value={shareUrl}
          className="min-w-0 flex-1 border border-[#d7c2ac] bg-[#fbf5ec] px-4 py-3 font-mono text-[12px] text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => {
            void copyLink();
          }}
          className={joinClasses(
            "inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
          )}
        >
          Copy
        </button>
      </div>
    </div>
  );
}
