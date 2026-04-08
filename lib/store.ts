import path from "node:path";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { env } from "@/lib/env";
import type { StoreShape } from "@/lib/types";

const defaultStore: StoreShape = {
  ideas: [],
  fires: [],
  views: [],
  postAttempts: []
};

let mutationQueue: Promise<unknown> = Promise.resolve();

function getStorePaths() {
  return {
    storePath: env.storePath,
    templatePath: env.storeTemplatePath
  };
}

async function ensureTemplateFile() {
  const { templatePath } = getStorePaths();
  await mkdir(path.dirname(env.storePath), { recursive: true });
  await mkdir(path.dirname(templatePath), { recursive: true });

  try {
    await readFile(templatePath, "utf8");
  } catch {
    await writeFile(templatePath, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

async function ensureStoreFile() {
  const { storePath, templatePath } = getStorePaths();
  await mkdir(path.dirname(storePath), { recursive: true });
  await ensureTemplateFile();

  try {
    await readFile(storePath, "utf8");
  } catch {
    try {
      const template = await readFile(templatePath, "utf8");
      await writeFile(storePath, template, "utf8");
    } catch {
      await writeFile(storePath, JSON.stringify(defaultStore, null, 2), "utf8");
    }
  }
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
      tagSource:
        idea.tagSource === "ai" ||
        idea.tagSource === "fallback" ||
        idea.tagSource === "mixed" ||
        idea.tagSource === "seed"
          ? idea.tagSource
          : null,
      taggedAt:
        typeof idea.taggedAt === "string" && idea.taggedAt ? idea.taggedAt : null
    })),
    fires: store.fires ?? [],
    views: store.views ?? [],
    postAttempts: store.postAttempts ?? []
  };
}

export async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const { storePath } = getStorePaths();
  const raw = await readFile(storePath, "utf8");

  return normalizeStore(JSON.parse(raw) as StoreShape);
}

async function writeStore(store: StoreShape) {
  const { storePath } = getStorePaths();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function resetStoreFromTemplate() {
  const { storePath, templatePath } = getStorePaths();
  await ensureTemplateFile();
  await mkdir(path.dirname(storePath), { recursive: true });

  try {
    await copyFile(templatePath, storePath);
  } catch {
    await writeStore(defaultStore);
  }
}

export async function withStoreMutation<T>(
  mutate: (store: StoreShape) => Promise<T> | T
): Promise<T> {
  const run = async () => {
    const store = await readStore();
    const result = await mutate(store);
    await writeStore(store);
    return result;
  };

  const resultPromise = mutationQueue.then(run, run);
  mutationQueue = resultPromise.then(
    () => undefined,
    () => undefined
  );

  return resultPromise;
}
