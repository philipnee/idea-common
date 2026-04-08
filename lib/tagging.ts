import { readFile } from "node:fs/promises";
import { appConfig, isGeminiVerificationConfigured } from "@/lib/config";
import { readStore, withStoreMutation } from "@/lib/store";
import type { IdeaRecord, IdeaTagSource } from "@/lib/types";

type TaxonomySectionName = "kind" | "topic";

interface TaxonomyEntry {
  label: string;
  keywords: string[];
}

interface TagTaxonomy {
  kind: TaxonomyEntry[];
  topic: TaxonomyEntry[];
}

interface IdeaTagAssignment {
  kind: string | null;
  topic: string | null;
  tagSource: IdeaTagSource | null;
}

function normalizePhrase(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeHaystack(value: string) {
  return ` ${normalizePhrase(value).replace(/[^a-z0-9]+/g, " ")} `;
}

function parseTagTaxonomy(text: string): TagTaxonomy {
  const taxonomy: TagTaxonomy = {
    kind: [],
    topic: []
  };
  let section: TaxonomySectionName | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const headerMatch = line.match(/^\[(kind|topic)\]$/i);

    if (headerMatch) {
      section = headerMatch[1].toLowerCase() as TaxonomySectionName;
      continue;
    }

    if (!section) {
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) {
      continue;
    }

    const label = normalizePhrase(line.slice(0, separatorIndex));
    const keywords = line
      .slice(separatorIndex + 1)
      .split(",")
      .map((keyword) => normalizePhrase(keyword))
      .filter(Boolean);

    if (!label) {
      continue;
    }

    taxonomy[section].push({
      label,
      keywords: Array.from(new Set([label, ...keywords]))
    });
  }

  return taxonomy;
}

async function loadTagTaxonomy() {
  try {
    const text = await readFile(appConfig.tagging.taxonomyPath, "utf8");
    return parseTagTaxonomy(text);
  } catch {
    return {
      kind: [],
      topic: []
    } satisfies TagTaxonomy;
  }
}

function countKeywordHits(haystack: string, keywords: string[]) {
  let score = 0;

  for (const keyword of keywords) {
    const needle = ` ${normalizePhrase(keyword).replace(/[^a-z0-9]+/g, " ")} `;

    if (needle.trim().length < 2) {
      continue;
    }

    if (haystack.includes(needle)) {
      score += keyword.includes(" ") ? 2 : 1;
    }
  }

  return score;
}

function pickFallbackLabel(haystack: string, entries: TaxonomyEntry[]) {
  let bestLabel: string | null = null;
  let bestScore = 0;
  let tied = false;

  for (const entry of entries) {
    if (entry.label === "other") {
      continue;
    }

    const score = countKeywordHits(haystack, entry.keywords);

    if (score > bestScore) {
      bestLabel = entry.label;
      bestScore = score;
      tied = false;
      continue;
    }

    if (score > 0 && score === bestScore) {
      tied = true;
    }
  }

  if (!bestLabel || tied || bestScore <= 0) {
    return null;
  }

  return bestLabel;
}

function runKeywordTagger(
  input: { idea: string; details?: string | null },
  taxonomy: TagTaxonomy
) {
  const haystack = normalizeHaystack(
    [input.idea, input.details ?? ""].filter(Boolean).join(" ")
  );

  return {
    kind: pickFallbackLabel(haystack, taxonomy.kind),
    topic: pickFallbackLabel(haystack, taxonomy.topic)
  };
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidates = (payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }).candidates;

  return candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function runGeminiTagger(
  input: { idea: string; details?: string | null },
  taxonomy: TagTaxonomy
) {
  if (!isGeminiVerificationConfigured()) {
    return {
      kind: null,
      topic: null
    };
  }

  const kindLabels = taxonomy.kind.map((entry) => entry.label);
  const topicLabels = taxonomy.topic.map((entry) => entry.label);

  if (!kindLabels.length || !topicLabels.length) {
    return {
      kind: null,
      topic: null
    };
  }

  const { apiKey, endpointBase, model } = appConfig.aiVerification;
  const endpoint = `${endpointBase.replace(/\/$/, "")}/models/${model}:generateContent?key=${apiKey}`;
  const ideaText = [input.idea, input.details ?? ""].filter(Boolean).join("\n\n");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You assign hidden metadata tags to short public idea posts.",
                  'Return JSON only: {"kind": string, "topic": string}.',
                  "Choose exactly one label from each allowed list.",
                  `Allowed kind labels: ${kindLabels.join(", ")}`,
                  `Allowed topic labels: ${topicLabels.join(", ")}`,
                  `Idea:\n${ideaText}`
                ].join("\n")
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 96,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              kind: { type: "STRING" },
              topic: { type: "STRING" }
            },
            required: ["kind", "topic"]
          }
        }
      }),
      signal: AbortSignal.timeout(appConfig.tagging.timeoutMs)
    });

    if (!response.ok) {
      return {
        kind: null,
        topic: null
      };
    }

    const payload = (await response.json()) as unknown;
    const text = extractGeminiText(payload);

    if (!text) {
      return {
        kind: null,
        topic: null
      };
    }

    const parsed = JSON.parse(text) as {
      kind?: string;
      topic?: string;
    };
    const kind = normalizePhrase(parsed.kind ?? "");
    const topic = normalizePhrase(parsed.topic ?? "");

    return {
      kind: kindLabels.includes(kind) ? kind : null,
      topic: topicLabels.includes(topic) ? topic : null
    };
  } catch {
    return {
      kind: null,
      topic: null
    };
  }
}

async function classifyIdeaTags(input: { idea: string; details?: string | null }) {
  const taxonomy = await loadTagTaxonomy();
  const ai = await runGeminiTagger(input, taxonomy);
  const fallback = appConfig.tagging.keywordFallbackEnabled
    ? runKeywordTagger(input, taxonomy)
    : { kind: null, topic: null };
  const kind = ai.kind ?? fallback.kind;
  const topic = ai.topic ?? fallback.topic;
  const usedAi = Boolean(ai.kind || ai.topic);
  const usedFallback = Boolean(
    (kind && kind === fallback.kind && kind !== ai.kind) ||
      (topic && topic === fallback.topic && topic !== ai.topic)
  );

  return {
    kind,
    topic,
    tagSource:
      kind || topic
        ? usedAi && usedFallback
          ? "mixed"
          : usedAi
            ? "ai"
            : usedFallback
              ? "fallback"
              : null
        : null
  } satisfies IdeaTagAssignment;
}

function needsTags(idea: IdeaRecord) {
  return !idea.kind || !idea.topic;
}

export async function tagIdeaById(id: string) {
  const store = await readStore();
  const current = store.ideas.find((idea) => idea.id === id);

  if (!current || !needsTags(current)) {
    return {
      updated: false
    };
  }

  const assignment = await classifyIdeaTags({
    idea: current.idea,
    details: current.details
  });

  if (!assignment.kind && !assignment.topic) {
    return {
      updated: false
    };
  }

  return withStoreMutation((mutableStore) => {
    const idea = mutableStore.ideas.find((entry) => entry.id === id);

    if (!idea) {
      return {
        updated: false
      };
    }

    let changed = false;

    if (!idea.kind && assignment.kind) {
      idea.kind = assignment.kind;
      changed = true;
    }

    if (!idea.topic && assignment.topic) {
      idea.topic = assignment.topic;
      changed = true;
    }

    if (changed) {
      idea.tagSource = assignment.tagSource;
      idea.taggedAt = new Date().toISOString();
    }

    return {
      updated: changed
    };
  });
}

export async function backfillIdeaTags() {
  const store = await readStore();
  const ids = store.ideas.filter(needsTags).map((idea) => idea.id);
  let updated = 0;

  for (const id of ids) {
    const result = await tagIdeaById(id);

    if (result.updated) {
      updated += 1;
    }
  }

  return {
    checked: ids.length,
    updated
  };
}
