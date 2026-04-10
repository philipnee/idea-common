#!/usr/bin/env node

import DatabaseConstructor from "better-sqlite3";
import { customAlphabet } from "nanoid";
import path from "node:path";

const usage = `
Usage:
  node scripts/rekey-readable-idea-ids.mjs [database-path]
  node scripts/rekey-readable-idea-ids.mjs --dry-run [database-path]

Notes:
  Rewrites idea ids that are not opaque 8-character lowercase/digit ids.
  Related fires and views are updated to point at the new id.
`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positionalArgs = args.filter((arg) => arg !== "--dry-run");
const databasePath =
  positionalArgs[0] ||
  process.env.LITBOARD_STORE_PATH ||
  path.join(process.cwd(), "data", "prod-runtime-store.db");
const generateIdeaId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://litboard.net").replace(
  /\/$/,
  ""
);

if (args.includes("--help")) {
  console.log(usage.trim());
  process.exit(0);
}

function isOpaqueIdeaId(value) {
  return /^[a-z0-9]{8}$/.test(value);
}

const database = new DatabaseConstructor(databasePath);

database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

const ideas = database
  .prepare("SELECT id, idea FROM ideas ORDER BY created_at ASC")
  .all();
const existingIds = new Set(ideas.map((idea) => idea.id));
const readableIdeas = ideas.filter((idea) => !isOpaqueIdeaId(idea.id));

function createUniqueIdeaId() {
  let id = generateIdeaId();

  while (existingIds.has(id)) {
    id = generateIdeaId();
  }

  existingIds.add(id);
  return id;
}

const mappings = readableIdeas.map((idea) => ({
  oldId: idea.id,
  newId: createUniqueIdeaId(),
  idea: idea.idea
}));

if (!mappings.length) {
  console.log("No readable idea ids found.");
  database.close();
  process.exit(0);
}

for (const mapping of mappings) {
  console.log(`${mapping.oldId} -> ${mapping.newId}`);
  console.log(`  ${mapping.idea}`);
  console.log(`  ${publicSiteUrl}/ideas/${mapping.newId}`);
}

if (dryRun) {
  console.log(`Dry run only. ${mappings.length} idea id(s) would be rekeyed.`);
  database.close();
  process.exit(0);
}

const rekeyIdeas = database.transaction((rows) => {
  const updateIdea = database.prepare("UPDATE ideas SET id = ? WHERE id = ?");
  const updateFires = database.prepare("UPDATE fires SET idea_id = ? WHERE idea_id = ?");
  const updateViews = database.prepare("UPDATE views SET idea_id = ? WHERE idea_id = ?");

  for (const row of rows) {
    updateFires.run(row.newId, row.oldId);
    updateViews.run(row.newId, row.oldId);
    updateIdea.run(row.newId, row.oldId);
  }
});

rekeyIdeas(mappings);
database.close();

console.log(`Rekeyed ${mappings.length} idea id(s).`);
