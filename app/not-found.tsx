import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function NotFoundPage() {
  return (
    <SiteShell>
      <section className="rounded-[28px] border border-line bg-card px-6 py-12 text-center shadow-card">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          404
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          That idea does not exist.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">
          It may have been removed from the local store, or the link is wrong.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-ink bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
        >
          Back to feed
        </Link>
      </section>
    </SiteShell>
  );
}
