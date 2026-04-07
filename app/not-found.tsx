import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function NotFoundPage() {
  return (
    <SiteShell
      title="Missing"
      description="The idea link does not point to anything in the current store."
    >
      <section className="border border-[#e1d5c5] bg-card px-6 py-12 text-center shadow-card">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          404
        </p>
        <h2 className="mt-3 font-display text-4xl italic tracking-tight">
          That idea does not exist.
        </h2>
        <p className="mx-auto mt-3 max-w-lg font-mono text-[12px] leading-6 text-muted">
          It may have been removed from the local store, or the link is wrong.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
        >
          Back to feed
        </Link>
      </section>
    </SiteShell>
  );
}
