#!/usr/bin/env node

import DatabaseConstructor from "better-sqlite3";
import path from "node:path";

const usage = `
Usage:
  node scripts/idea-stats.mjs [database-path]
  node scripts/idea-stats.mjs <idea-url-or-id> [database-path]

Examples:
  node scripts/idea-stats.mjs data/prod-runtime-store.db
  node scripts/idea-stats.mjs https://www.litboard.net/ideas/seed_agent_native_internet data/prod-runtime-store.db
`;

const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log(usage.trim());
  process.exit(0);
}

function looksLikeDatabasePath(value) {
  try {
    new URL(value);
    return false;
  } catch {
    return value.endsWith(".db") || value.includes("/") || value.startsWith(".");
  }
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

let ideaId = null;
let databasePath =
  process.env.LITBOARD_STORE_PATH ||
  path.join(process.cwd(), "data", "prod-runtime-store.db");

if (args.length === 1) {
  if (looksLikeDatabasePath(args[0])) {
    databasePath = args[0];
  } else {
    ideaId = extractIdeaId(args[0]);
  }
} else if (args.length >= 2) {
  ideaId = extractIdeaId(args[0]);
  databasePath = args[1];
}

const database = new DatabaseConstructor(databasePath, { readonly: true });

function getAllIdeaStats() {
  return database
    .prepare(
      `
        SELECT
          i.id,
          i.idea,
          i.heat,
          i.fire_count AS storedFireCount,
          i.created_at AS createdAt,
          COUNT(DISTINCT v.id) AS totalViews,
          COUNT(DISTINCT v.user_fingerprint) AS uniqueViewers,
          COUNT(DISTINCT f.id) AS totalFires,
          COUNT(DISTINCT f.user_fingerprint) AS uniqueFireUsers
        FROM ideas i
        LEFT JOIN views v ON v.idea_id = i.id
        LEFT JOIN fires f ON f.idea_id = i.id
        GROUP BY i.id
        ORDER BY i.created_at DESC
      `
    )
    .all();
}

function getSingleIdeaStats(id) {
  return database
    .prepare(
      `
        SELECT
          i.id,
          i.idea,
          i.details,
          i.external_link AS externalLink,
          i.kind,
          i.topic,
          i.tag_source AS tagSource,
          i.heat,
          i.fire_count AS storedFireCount,
          i.created_at AS createdAt,
          i.updated_at AS updatedAt,
          COUNT(DISTINCT v.id) AS totalViews,
          COUNT(DISTINCT v.user_fingerprint) AS uniqueViewers,
          COUNT(DISTINCT f.id) AS totalFires,
          COUNT(DISTINCT f.user_fingerprint) AS uniqueFireUsers
        FROM ideas i
        LEFT JOIN views v ON v.idea_id = i.id
        LEFT JOIN fires f ON f.idea_id = i.id
        WHERE i.id = ?
        GROUP BY i.id
      `
    )
    .get(id);
}

function printTable(rows) {
  console.log(
    [
      "id",
      "views",
      "unique_views",
      "fires",
      "unique_fires",
      "heat",
      "idea"
    ].join("\t")
  );

  for (const row of rows) {
    console.log(
      [
        row.id,
        row.totalViews,
        row.uniqueViewers,
        row.totalFires,
        row.uniqueFireUsers,
        Number(row.heat).toFixed(2),
        row.idea
      ].join("\t")
    );
  }
}

function printSingle(row) {
  console.log(`id: ${row.id}`);
  console.log(`idea: ${row.idea}`);
  console.log(`views: ${row.totalViews}`);
  console.log(`unique_views: ${row.uniqueViewers}`);
  console.log(`fires: ${row.totalFires}`);
  console.log(`unique_fires: ${row.uniqueFireUsers}`);
  console.log(`stored_fire_count: ${row.storedFireCount}`);
  console.log(`heat: ${Number(row.heat).toFixed(2)}`);
  console.log(`kind: ${row.kind ?? ""}`);
  console.log(`topic: ${row.topic ?? ""}`);
  console.log(`tag_source: ${row.tagSource ?? ""}`);
  console.log(`external_link: ${row.externalLink ?? ""}`);
  console.log(`created_at: ${row.createdAt}`);
  console.log(`updated_at: ${row.updatedAt}`);
}

if (ideaId) {
  const row = getSingleIdeaStats(ideaId);

  if (!row) {
    console.error(`No idea found for id: ${ideaId}`);
    database.close();
    process.exit(1);
  }

  printSingle(row);
} else {
  printTable(getAllIdeaStats());
}

database.close();
