import DatabaseConstructor from "better-sqlite3";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { env } from "@/lib/env";
import type { IdeaTagSource, StoreShape } from "@/lib/types";

type SqliteDatabase = InstanceType<typeof DatabaseConstructor>;

const defaultStore: StoreShape = {
  ideas: [],
  fires: [],
  views: [],
  postAttempts: []
};

let mutationQueue: Promise<unknown> = Promise.resolve();

const globalDatabase = globalThis as {
  __litboardDatabase?: SqliteDatabase;
  __litboardDatabasePath?: string;
};

function ensureParentDirectory(filePath: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureTemplateFile() {
  ensureParentDirectory(env.storeTemplatePath);

  if (!existsSync(env.storeTemplatePath)) {
    writeFileSync(env.storeTemplatePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

function normalizeTagSource(value: unknown): IdeaTagSource | null {
  return value === "ai" ||
    value === "fallback" ||
    value === "mixed" ||
    value === "seed"
    ? value
    : null;
}

function normalizeStore(store: StoreShape): StoreShape {
  return {
    ...store,
    ideas: (store.ideas ?? []).map((idea) => ({
      ...idea,
      heat:
        typeof idea.heat === "number" && Number.isFinite(idea.heat) ? idea.heat : 0,
      heatDate:
        typeof idea.heatDate === "string" && idea.heatDate ? idea.heatDate : null,
      externalLink:
        typeof idea.externalLink === "string" && idea.externalLink
          ? idea.externalLink
          : null,
      kind: typeof idea.kind === "string" && idea.kind ? idea.kind : null,
      topic: typeof idea.topic === "string" && idea.topic ? idea.topic : null,
      tagSource: normalizeTagSource(idea.tagSource),
      taggedAt:
        typeof idea.taggedAt === "string" && idea.taggedAt ? idea.taggedAt : null
    })),
    fires: store.fires ?? [],
    views: store.views ?? [],
    postAttempts: store.postAttempts ?? []
  };
}

function readTemplateStore() {
  ensureTemplateFile();

  try {
    const raw = readFileSync(env.storeTemplatePath, "utf8");
    return normalizeStore(JSON.parse(raw) as StoreShape);
  } catch {
    return defaultStore;
  }
}

function applySchema(database: SqliteDatabase) {
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

function getDatabase() {
  if (
    globalDatabase.__litboardDatabase &&
    globalDatabase.__litboardDatabasePath === env.storePath
  ) {
    return globalDatabase.__litboardDatabase;
  }

  ensureParentDirectory(env.storePath);

  const database = new DatabaseConstructor(env.storePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  applySchema(database);

  globalDatabase.__litboardDatabase = database;
  globalDatabase.__litboardDatabasePath = env.storePath;
  return database;
}

function replaceStoreContents(database: SqliteDatabase, store: StoreShape) {
  const normalizedStore = normalizeStore(store);

  const replace = database.transaction((nextStore: StoreShape) => {
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

  replace(normalizedStore);
}

function seedDatabaseIfEmpty(database: SqliteDatabase) {
  const row = database
    .prepare(
      `
        SELECT
          (SELECT COUNT(*) FROM ideas) AS ideas_count,
          (SELECT COUNT(*) FROM fires) AS fires_count,
          (SELECT COUNT(*) FROM views) AS views_count,
          (SELECT COUNT(*) FROM post_attempts) AS attempts_count
      `
    )
    .get() as {
    ideas_count: number;
    fires_count: number;
    views_count: number;
    attempts_count: number;
  };

  if (
    row.ideas_count > 0 ||
    row.fires_count > 0 ||
    row.views_count > 0 ||
    row.attempts_count > 0
  ) {
    return;
  }

  replaceStoreContents(database, readTemplateStore());
}

function readStoreFromDatabase(database: SqliteDatabase): StoreShape {
  const ideas = database
    .prepare(
      `
        SELECT
          id,
          idea,
          details,
          external_link AS externalLink,
          kind,
          topic,
          tag_source AS tagSource,
          tagged_at AS taggedAt,
          heat,
          heat_date AS heatDate,
          fire_count AS fireCount,
          submit_key AS submitKey,
          content_hash AS contentHash,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM ideas
        ORDER BY created_at ASC, id ASC
      `
    )
    .all() as StoreShape["ideas"];
  const fires = database
    .prepare(
      `
        SELECT
          id,
          idea_id AS ideaId,
          user_fingerprint AS userFingerprint,
          created_at AS createdAt
        FROM fires
        ORDER BY created_at ASC, id ASC
      `
    )
    .all() as StoreShape["fires"];
  const views = database
    .prepare(
      `
        SELECT
          id,
          idea_id AS ideaId,
          user_fingerprint AS userFingerprint,
          created_at AS createdAt
        FROM views
        ORDER BY created_at ASC, id ASC
      `
    )
    .all() as StoreShape["views"];
  const postAttempts = database
    .prepare(
      `
        SELECT
          id,
          submit_key AS submitKey,
          content_hash AS contentHash,
          outcome,
          created_at AS createdAt
        FROM post_attempts
        ORDER BY created_at ASC, id ASC
      `
    )
    .all() as StoreShape["postAttempts"];

  return normalizeStore({
    ideas,
    fires,
    views,
    postAttempts
  });
}

export async function readStore(): Promise<StoreShape> {
  const database = getDatabase();
  seedDatabaseIfEmpty(database);
  return readStoreFromDatabase(database);
}

export async function resetStoreFromTemplate() {
  const database = getDatabase();
  replaceStoreContents(database, readTemplateStore());
}

export async function withStoreMutation<T>(
  mutate: (store: StoreShape) => Promise<T> | T
): Promise<T> {
  const run = async () => {
    const database = getDatabase();
    seedDatabaseIfEmpty(database);
    const store = readStoreFromDatabase(database);
    const result = await mutate(store);
    replaceStoreContents(database, store);
    return result;
  };

  const resultPromise = mutationQueue.then(run, run);
  mutationQueue = resultPromise.then(
    () => undefined,
    () => undefined
  );

  return resultPromise;
}
