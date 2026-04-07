import { readFile } from "node:fs/promises";
import path from "node:path";
import Image from "next/image";
import friedaImage from "@/frieda.png";
import { SiteShell } from "@/components/site-shell";

async function getAboutCopy() {
  const filePath = path.join(process.cwd(), "content", "about.txt");
  const raw = await readFile(filePath, "utf8");
  const sections = raw
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter(Boolean);

  return {
    headline: sections[0] ?? "About Frieda",
    paragraphs: sections.slice(1)
  };
}

export default async function AboutPage() {
  const copy = await getAboutCopy();

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
