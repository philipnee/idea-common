#!/usr/bin/env node

import DatabaseConstructor from "better-sqlite3";
import path from "node:path";

const usage = `
Usage:
  node scripts/delete-idea.mjs <idea-url-or-id> [database-path]
  node scripts/delete-idea.mjs --dry-run <idea-url-or-id> [database-path]

Examples:
  node scripts/delete-idea.mjs https://www.litboard.net/ideas/seed_agent_native_internet
  node scripts/delete-idea.mjs seed_agent_native_internet data/prod-runtime-store.db
`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positionalArgs = args.filter((arg) => arg !== "--dry-run");
const input = positionalArgs[0];
const databasePath =
  positionalArgs[1] ||
  process.env.LITBOARD_STORE_PATH ||
  path.join(process.cwd(), "data", "prod-runtime-store.db");

if (!input) {
  console.error(usage.trim());
  process.exit(1);
}

function extractIdeaId(value) {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const ideaIndex = segments.findIndex(
      (segment) => segment === "ideas" || segment === "idea"
    );

    if (ideaIndex >= 0 && segments[ideaIndex + 1]) {
      return decodeURIComponent(segments[ideaIndex + 1]);
    }
  } catch {
    // Treat non-URL input as a raw idea id.
  }

  return trimmed.replace(/^\/+|\/+$/g, "");
}

const ideaId = extractIdeaId(input);
const database = new DatabaseConstructor(databasePath);

database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

const idea = database
  .prepare(
    `
      SELECT id, idea, content_hash AS contentHash
      FROM ideas
      WHERE id = ?
    `
  )
  .get(ideaId);

if (!idea) {
  console.error(`No idea found for id: ${ideaId}`);
  database.close();
  process.exit(1);
}

const counts = {
  fires: database.prepare("SELECT COUNT(*) AS count FROM fires WHERE idea_id = ?").get(ideaId)
    .count,
  views: database.prepare("SELECT COUNT(*) AS count FROM views WHERE idea_id = ?").get(ideaId)
    .count,
  attempts: database
    .prepare("SELECT COUNT(*) AS count FROM post_attempts WHERE content_hash = ?")
    .get(idea.contentHash).count
};

if (dryRun) {
  console.log(`Would delete idea: ${idea.id}`);
  console.log(`Title: ${idea.idea}`);
  console.log(`Related rows: ${counts.fires} fires, ${counts.views} views, ${counts.attempts} post attempts`);
  database.close();
  process.exit(0);
}

const deleteIdea = database.transaction(() => {
  database.prepare("DELETE FROM fires WHERE idea_id = ?").run(ideaId);
  database.prepare("DELETE FROM views WHERE idea_id = ?").run(ideaId);
  database.prepare("DELETE FROM post_attempts WHERE content_hash = ?").run(idea.contentHash);
  database.prepare("DELETE FROM ideas WHERE id = ?").run(ideaId);
});

deleteIdea();
database.close();

console.log(`Deleted idea: ${idea.id}`);
console.log(`Title: ${idea.idea}`);
console.log(`Deleted related rows: ${counts.fires} fires, ${counts.views} views, ${counts.attempts} post attempts`);
