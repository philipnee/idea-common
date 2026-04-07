import Image from "next/image";
import friedaImage from "@/frieda.png";
import { SiteShell } from "@/components/site-shell";

export default function AboutPage() {
  return (
    <SiteShell
      title="About"
      description="A small note about Frieda and why this site exists."
    >
      <article className="space-y-8 border border-[#e1d5c5] bg-card px-5 py-6 shadow-card sm:px-8 sm:py-8">
        <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div className="overflow-hidden border border-[#ddd0bf] bg-[#efe4d2]">
            <Image
              src={friedaImage}
              alt="Frieda, a golden retriever"
              priority
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Frieda
            </p>
            <h2 className="font-display text-4xl italic leading-tight tracking-tight text-ink">
              This is my sister&apos;s golden retriever.
            </h2>
            <div className="space-y-4 text-[15px] leading-8 text-muted">
              <p>
                Golden retrievers are good at finding things. Balls, sticks,
                missing gloves, the exact patch of sunlight on the floor. Frieda
                feels like the same kind of energy for ideas.
              </p>
              <p>
                Go Frieda is a place to put rough ideas where other people can
                notice them. Post one line, add details if they matter, and let
                the good ones pick up a little momentum.
              </p>
              <p>
                The point is not polish. The point is to get the idea out of
                your head, into public view, and see if it starts to move.
              </p>
            </div>
          </div>
        </section>
      </article>
    </SiteShell>
  );
}
