"use client";

export function ShareLinkBar({ shareUrl }: { shareUrl: string }) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard can fail outside secure contexts. Keep the UI simple: the
      // visible URL is still selectable and shareable.
    }
  }

  return (
    <div className="space-y-3 border border-[#dcc8b2] bg-[#f1e6d8] px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#87572a]">
        Share your idea
      </p>
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
          className="inline-flex items-center justify-center border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
