#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = process.argv[2];

if (!outputPath) {
  console.error("Usage: node scripts/seed-dev-store.mjs <output-path>");
  process.exit(1);
}

const themes = [
  "Neighborhood errand relay",
  "Apartment lobby idea board",
  "Local maker barter list",
  "Sidewalk free library map",
  "Weekly dinner rotation",
  "Parent pickup coordination",
  "Tiny office swap club",
  "Tool lending passport",
  "Freelancer referral circle",
  "Dog park bulletin",
  "Civic suggestion wall",
  "Unused food rescue alert",
  "School project mentor board",
  "Artist critique hour",
  "Sunday repair salon",
  "Block-level compost exchange",
  "Apartment storage share",
  "Pop-up reading club",
  "Rooftop event noticeboard",
  "Mutual aid delivery rota",
  "Window shopping wishlist",
  "Quiet cafe seat exchange",
  "Neighborhood skills ledger",
  "Hyperlocal lost-and-found feed",
  "Volunteer hour marketplace"
];

const angles = [
  "for rainy weekends",
  "for busy parents",
  "for remote workers",
  "for overstretched students",
  "for local shops",
  "for neighbors who just moved in",
  "for apartment buildings",
  "for curious retirees",
  "for community organizers",
  "for side-project people"
];

const setupLines = [
  "People usually handle this with a messy group chat, a spreadsheet nobody updates, or a favor that gets lost.",
  "There is demand for this, but it is still too small and too frequent for a polished product to exist yet.",
  "The need already exists in public, but it is scattered across inboxes, texts, and half-remembered conversations.",
  "This is the sort of thing everyone says should exist right after they run into the problem themselves."
];

const mvpLines = [
  "The first version could just be a lightweight public board where someone posts the need, someone else claims it, and both sides leave one short note after it is done.",
  "A practical MVP is a simple feed with a clear request, a time window, and a visible trail of which ideas actually got picked up by someone nearby.",
  "The whole product can start with short posts, one optional context paragraph, and a dead-simple way to say 'I'm taking this one.'",
  "The important thing is not profiles or gamification. It is making the first useful handoff happen without extra coordination overhead."
];
const kindLabels = [
  "community",
  "service",
  "marketplace",
  "software",
  "media",
  "physical-product",
  "hardware"
];
const topicLabels = [
  "local",
  "small-business",
  "education",
  "productivity",
  "social",
  "ops",
  "search",
  "creator-tools",
  "finance"
];

function normalizeIdeaContent(input) {
  return `${input.idea} ${input.details ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function createContentHash(input) {
  return createHash("sha256").update(normalizeIdeaContent(input)).digest("hex");
}

function isoHoursAgo(now, hoursAgo) {
  return new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();
}

function buildIdea(index, now) {
  const theme = themes[index % themes.length];
  const angle = angles[index % angles.length];
  const idea = `${theme} ${angle}`;
  const audience = angle.replace(/^for\s+/i, "");
  const detail = [
    `${theme} would help ${audience} solve a recurring coordination problem before it turns into a bigger chore. ${setupLines[index % setupLines.length]}`,
    mvpLines[index % mvpLines.length]
  ].join("\n\n");
  const createdAt = isoHoursAgo(now, index * 3 + 2);
  const id = `dev${String(index + 1).padStart(5, "0")}`;
  const contentHash = createContentHash({ idea, details: detail });

  return {
    id,
    idea,
    details: detail,
    externalLink:
      index % 4 === 0
        ? `https://example.com/ideas/${id}`
        : null,
    kind: kindLabels[index % kindLabels.length],
    topic: topicLabels[index % topicLabels.length],
    tagSource: "seed",
    taggedAt: createdAt,
    heat: 0,
    fireCount: 0,
    submitKey: `dev-seed-${(index % 7) + 1}`,
    contentHash,
    createdAt,
    updatedAt: createdAt
  };
}

function buildFires(ideas, now) {
  const fires = [];
  let fireIndex = 0;
  const recentPattern = [0, 1, 2, 3, 4, 5, 7, 9, 11, 13];

  ideas.forEach((idea, index) => {
    const totalRecent = recentPattern[index % recentPattern.length];
    const totalOlder = index % 3;

    for (let step = 0; step < totalRecent; step += 1) {
      const ageHours = 0.4 + step * 1.6 + (index % 4) * 0.25;
      fires.push({
        id: `dev-fire-${String(fireIndex + 1).padStart(5, "0")}`,
        ideaId: idea.id,
        userFingerprint: `seed-viewer-${index}-${step}`,
        createdAt: isoHoursAgo(now, ageHours)
      });
      fireIndex += 1;
    }

    for (let step = 0; step < totalOlder; step += 1) {
      const ageHours = 36 + step * 8 + index * 0.1;
      fires.push({
        id: `dev-fire-${String(fireIndex + 1).padStart(5, "0")}`,
        ideaId: idea.id,
        userFingerprint: `seed-older-${index}-${step}`,
        createdAt: isoHoursAgo(now, ageHours)
      });
      fireIndex += 1;
    }
  });

  return fires;
}

const now = Date.now();
const ideas = Array.from({ length: 50 }, (_, index) => buildIdea(index, now));
const fires = buildFires(ideas, now);
const fireCountByIdea = new Map();

for (const fire of fires) {
  fireCountByIdea.set(fire.ideaId, (fireCountByIdea.get(fire.ideaId) ?? 0) + 1);
}

for (const idea of ideas) {
  idea.fireCount = fireCountByIdea.get(idea.id) ?? 0;
}

const store = {
  ideas,
  fires,
  postAttempts: []
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(store, null, 2), "utf8");
