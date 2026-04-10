#!/usr/bin/env node

import DatabaseConstructor from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [, , databasePath, templatePath] = process.argv;

if (!databasePath || !templatePath) {
  console.error(
    "Usage: node scripts/init-sqlite-store.mjs <database-path> <template-path>"
  );
  process.exit(1);
}

const defaultStore = {
  ideas: [],
  fires: [],
  views: [],
  postAttempts: []
};

function ensureParentDirectory(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureTemplateFile() {
  ensureParentDirectory(templatePath);

  if (!existsSync(templatePath)) {
    writeFileSync(templatePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

function normalizeTagSource(value) {
  return value === "ai" ||
    value === "fallback" ||
    value === "mixed" ||
    value === "seed"
    ? value
    : null;
}

function normalizeStore(store) {
  return {
    ...store,
    ideas: (store.ideas ?? []).map((idea) => ({
      ...idea,
      details:
        typeof idea.details === "string" && idea.details.length > 0
          ? idea.details
          : null,
      externalLink:
        typeof idea.externalLink === "string" && idea.externalLink.length > 0
          ? idea.externalLink
          : null,
      kind: typeof idea.kind === "string" && idea.kind.length > 0 ? idea.kind : null,
      topic:
        typeof idea.topic === "string" && idea.topic.length > 0 ? idea.topic : null,
      tagSource: normalizeTagSource(idea.tagSource),
      taggedAt:
        typeof idea.taggedAt === "string" && idea.taggedAt.length > 0
          ? idea.taggedAt
          : null,
      heat: typeof idea.heat === "number" && Number.isFinite(idea.heat) ? idea.heat : 0,
      heatDate:
        typeof idea.heatDate === "string" && idea.heatDate.length > 0
          ? idea.heatDate
          : null
    })),
    fires: store.fires ?? [],
    views: store.views ?? [],
    postAttempts: store.postAttempts ?? []
  };
}

function readTemplateStore() {
  ensureTemplateFile();

  try {
    const raw = readFileSync(templatePath, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return defaultStore;
  }
}

function applySchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      idea TEXT NOT NULL,
      details TEXT,
      external_link TEXT,
      kind TEXT,
      topic TEXT,
      tag_source TEXT,
      tagged_at TEXT,
      heat REAL NOT NULL DEFAULT 0,
      heat_date TEXT,
      fire_count INTEGER NOT NULL DEFAULT 0,
      submit_key TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fires (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      user_fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS views (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL,
      user_fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_attempts (
      id TEXT PRIMARY KEY,
      submit_key TEXT NOT NULL,
      content_hash TEXT,
      outcome TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ideas_content_hash ON ideas(content_hash);
    CREATE INDEX IF NOT EXISTS idx_fires_idea_created_at ON fires(idea_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fires_viewer_created_at ON fires(user_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_views_idea_created_at ON views(idea_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_views_viewer_created_at ON views(user_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_post_attempts_submit_created_at ON post_attempts(submit_key, created_at DESC);
  `);
}

function replaceStoreContents(database, store) {
  const replace = database.transaction((nextStore) => {
    database.prepare("DELETE FROM fires").run();
    database.prepare("DELETE FROM views").run();
    database.prepare("DELETE FROM post_attempts").run();
    database.prepare("DELETE FROM ideas").run();

    const insertIdea = database.prepare(`
      INSERT INTO ideas (
        id,
        idea,
        details,
        external_link,
        kind,
        topic,
        tag_source,
        tagged_at,
        heat,
        heat_date,
        fire_count,
        submit_key,
        content_hash,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @idea,
        @details,
        @externalLink,
        @kind,
        @topic,
        @tagSource,
        @taggedAt,
        @heat,
        @heatDate,
        @fireCount,
        @submitKey,
        @contentHash,
        @createdAt,
        @updatedAt
      )
    `);
    const insertFire = database.prepare(`
      INSERT INTO fires (id, idea_id, user_fingerprint, created_at)
      VALUES (@id, @ideaId, @userFingerprint, @createdAt)
    `);
    const insertView = database.prepare(`
      INSERT INTO views (id, idea_id, user_fingerprint, created_at)
      VALUES (@id, @ideaId, @userFingerprint, @createdAt)
    `);
    const insertAttempt = database.prepare(`
      INSERT INTO post_attempts (id, submit_key, content_hash, outcome, created_at)
      VALUES (@id, @submitKey, @contentHash, @outcome, @createdAt)
    `);

    for (const idea of nextStore.ideas) {
      insertIdea.run(idea);
    }

    for (const fire of nextStore.fires) {
      insertFire.run(fire);
    }

    for (const view of nextStore.views) {
      insertView.run(view);
    }

    for (const attempt of nextStore.postAttempts) {
      insertAttempt.run(attempt);
    }
  });

  replace(store);
}

function seedDatabaseIfEmpty(database) {
  const counts = {
    ideas: database.prepare("SELECT COUNT(*) AS count FROM ideas").get().count,
    fires: database.prepare("SELECT COUNT(*) AS count FROM fires").get().count,
    views: database.prepare("SELECT COUNT(*) AS count FROM views").get().count,
    postAttempts: database
      .prepare("SELECT COUNT(*) AS count FROM post_attempts")
      .get().count
  };

  if (counts.ideas || counts.fires || counts.views || counts.postAttempts) {
    return;
  }

  replaceStoreContents(database, readTemplateStore());
}

ensureParentDirectory(databasePath);

const database = new DatabaseConstructor(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("busy_timeout = 5000");

applySchema(database);
seedDatabaseIfEmpty(database);
database.close();
