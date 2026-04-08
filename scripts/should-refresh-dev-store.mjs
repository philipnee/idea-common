#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const runtimePath = process.argv[2];

if (!runtimePath) {
  process.exit(1);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

try {
  const raw = await readFile(runtimePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!isPlainObject(parsed) || !Array.isArray(parsed.ideas)) {
    process.exit(1);
  }

  const ideas = parsed.ideas;
  const isPureSeedDataset =
    ideas.length === 50 &&
    ideas.every((idea) => {
      return (
        isPlainObject(idea) &&
        typeof idea.id === "string" &&
        /^dev\d{5}$/.test(idea.id)
      );
    });
  const isMissingTags = ideas.some((idea) => {
    return !isPlainObject(idea) || !idea.kind || !idea.topic;
  });

  process.exit(isPureSeedDataset && isMissingTags ? 0 : 1);
} catch {
  process.exit(1);
}
