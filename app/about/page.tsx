import { readFile } from "node:fs/promises";
import path from "node:path";
import { MatchMark } from "@/components/match-mark";
import { SiteShell } from "@/components/site-shell";

async function getAboutCopy() {
  const filePath = path.join(process.cwd(), "content", "about.md");
  const raw = await readFile(filePath, "utf8");
  const sections = raw
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  return {
    headline: sections[0] ?? "About Litboard",
    paragraphs: sections.slice(1)
  };
}

export default async function AboutPage() {
  const copy = await getAboutCopy();

  return (
    <SiteShell
      title="About"
      description="A small note about Litboard and why it exists."
    >
      <article className="space-y-8 border border-[#e1d5c5] bg-card px-5 py-6 shadow-card sm:px-8 sm:py-8">
        <section className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <div className="pt-1">
            <MatchMark className="h-24 w-16 sm:h-28 sm:w-20" />
          </div>
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Litboard
            </p>
            <h2 className="font-display text-4xl italic leading-tight tracking-tight text-ink">
              {copy.headline}
            </h2>
            <div className="space-y-4 text-[15px] leading-8 text-muted">
              {copy.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      </article>
    </SiteShell>
  );
}
