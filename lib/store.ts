import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoreShape } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

const defaultStore: StoreShape = {
  ideas: [],
  fires: [],
  postAttempts: []
};

let mutationQueue: Promise<unknown> = Promise.resolve();

async function ensureStoreFile() {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(defaultStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");

  return JSON.parse(raw) as StoreShape;
}

async function writeStore(store: StoreShape) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
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

