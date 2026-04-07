import { appConfig, isGeminiVerificationConfigured } from "@/lib/config";

const JUNK_MESSAGE =
  "Make it more concrete. Use a short real idea, not placeholder or gibberish text.";

const PLACEHOLDER_PHRASES = new Set([
  "asdf",
  "asdf asdf",
  "hello world",
  "idea idea",
  "lorem ipsum",
  "my idea",
  "placeholder",
  "qwerty",
  "startup idea",
  "test",
  "test idea"
]);

function getWords(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9'-]/g, ""))
    .filter(Boolean);
}

function looksLikePlaceholder(idea: string, words: string[]) {
  const normalized = idea
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (PLACEHOLDER_PHRASES.has(normalized)) {
    return true;
  }

  return words.length >= 2 && new Set(words).size === 1;
}

function hasTooManySymbols(idea: string) {
  const compact = idea.replace(/\s+/g, "");

  if (!compact) {
    return false;
  }

  const allowedLength = compact.replace(/[a-z0-9.,!?'"():/&-]/gi, "").length;
  return allowedLength / compact.length > 0.2;
}

function looksLikeGibberishWord(word: string) {
  const letters = word.replace(/[^a-z]/g, "");

  if (letters.length < 6) {
    return false;
  }

  const vowels = letters.match(/[aeiou]/g)?.length ?? 0;
  const hasLongConsonantRun = /[^aeiou]{5,}/.test(letters);

  return vowels / letters.length < 0.25 && hasLongConsonantRun;
}

export function runDeterministicIdeaChecks(idea: string) {
  const words = getWords(idea);

  if (words.length < 2) {
    return JUNK_MESSAGE;
  }

  if (hasTooManySymbols(idea)) {
    return JUNK_MESSAGE;
  }

  if (/(.)\1{4,}/i.test(idea)) {
    return JUNK_MESSAGE;
  }

  if (looksLikePlaceholder(idea, words)) {
    return JUNK_MESSAGE;
  }

  const substantiveWords = words.filter((word) => word.length >= 4);

  if (
    substantiveWords.length >= 2 &&
    substantiveWords.every((word) => looksLikeGibberishWord(word))
  ) {
    return JUNK_MESSAGE;
  }

  return null;
}

function extractGeminiText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidates = (payload as { candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }> }).candidates;

  return candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function runGeminiIdeaCheck(idea: string) {
  if (!isGeminiVerificationConfigured()) {
    return "skipped" as const;
  }

  const { apiKey, endpointBase, model } = appConfig.aiVerification;
  const endpoint = `${endpointBase.replace(/\/$/, "")}/models/${model}:generateContent?key=${apiKey}`;

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
                  "You classify short public idea submissions.",
                  'Return JSON only: {"isJunk": boolean}.',
                  "Mark true only when the text is obvious gibberish, keyboard mash, placeholder text, or meaningless filler.",
                  "Mark false for terse, rough, unusual, or imperfect but plausible ideas.",
                  `Submission: ${idea}`
                ].join("\n")
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 32,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              isJunk: {
                type: "BOOLEAN"
              }
            },
            required: ["isJunk"]
          }
        }
      }),
      signal: AbortSignal.timeout(4_000)
    });

    if (!response.ok) {
      return "skipped" as const;
    }

    const payload = (await response.json()) as unknown;
    const text = extractGeminiText(payload);

    if (!text) {
      return "skipped" as const;
    }

    const parsed = JSON.parse(text) as { isJunk?: boolean };
    return parsed.isJunk ? ("rejected" as const) : ("accepted" as const);
  } catch {
    return "skipped" as const;
  }
}

export async function verifyIdeaInput(idea: string) {
  const deterministicMessage = runDeterministicIdeaChecks(idea);

  if (deterministicMessage) {
    return deterministicMessage;
  }

  const aiResult = await runGeminiIdeaCheck(idea);

  if (aiResult === "rejected") {
    return JUNK_MESSAGE;
  }

  return null;
}
