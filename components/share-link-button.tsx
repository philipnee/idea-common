"use client";

import { useState } from "react";
import { joinClasses } from "@/lib/format";

export function ShareLinkButton({ shareUrl }: { shareUrl: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      aria-label="Copy share link"
      title={
        copyState === "copied"
          ? "Link copied"
          : copyState === "failed"
            ? "Copy failed"
            : "Copy share link"
      }
      className={joinClasses(
        "inline-flex items-center gap-2 border border-[#d7c2ac] bg-[#fbf5ec] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6f5645] transition hover:border-[#c8ab8e] hover:text-ink",
        copyState === "copied" && "border-[#c99d67] bg-[#f3e2c7] text-[#8c5523]",
        copyState === "failed" && "border-[#c78d84] bg-[#f7e7e4] text-[#8b3f34]"
      )}
    >
      <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
        >
          <path
            d="M6 2.75H3.75A1.25 1.25 0 0 0 2.5 4v8.25c0 .69.56 1.25 1.25 1.25H10A1.25 1.25 0 0 0 11.25 12.25V10"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.75 5.25h5.5m0 0v5.5m0-5.5-7 7"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        {copyState === "copied"
          ? "Copied"
          : copyState === "failed"
            ? "Retry"
            : "Share"}
      </span>
    </button>
  );
}
