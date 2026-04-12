import { readFile } from "node:fs/promises";
import { appConfig, isGeminiVerificationConfigured } from "@/lib/config";

const JUNK_MESSAGE =
  "Post a concrete idea, not a reaction, placeholder, or throwaway phrase.";
const CONTEXT_ACCEPTANCE_MIN_LENGTH = 10;
const DEFAULT_GEMINI_PROMPT = [
  "You classify short public submissions for Litboard.",
  "Litboard accepts ideas, useful proposals, and interesting things worth sharing.",
  'Return JSON only: {"isJunk": boolean}.',
  "Reject only clearly bad submissions: gibberish, keyboard mash, placeholder text, empty filler, profanity, insults, unconstructive reactions, or meta comments that do not share or propose anything.",
  "Accept rough, weird, terse, unfinished, or broad submissions if they contain a constructive idea, proposal, useful observation, or interesting thing to share.",
  "Use a light touch. Block unconstructive junk, not imperfect ideas."
].join("\n");

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

const THROWAWAY_PHRASES = [
  /\bthis\s+is\s+(bullshit|bs|shit|crap|trash|garbage|dumb|stupid)\b/i,
  /\b(this|that|it)\s+(sucks|blows)\b/i,
  /\b(dog|dogs|bull)\s*shit\b/i,
  /^\s*(bullshit|bs|shit|crap|trash|garbage|nope|lol|lmao)\s*$/i
];

const PROFANITY_WORDS = new Set([
  "asshole",
  "bitch",
  "bullshit",
  "crap",
  "damn",
  "dick",
  "fuck",
  "fucking",
  "shit",
  "shitty"
]);

const IDEA_ACTION_WORDS = new Set([
  "add",
  "allow",
  "automate",
  "build",
  "create",
  "design",
  "find",
  "generate",
  "help",
  "let",
  "make",
  "map",
  "match",
  "organize",
  "post",
  "recommend",
  "search",
  "share",
  "track"
]);

const IDEA_NOUN_WORDS = new Set([
  "agent",
  "agents",
  "app",
  "board",
  "bot",
  "browser",
  "city",
  "community",
  "dashboard",
  "directory",
  "exchange",
  "feed",
  "forum",
  "idea",
  "ideas",
  "list",
  "map",
  "market",
  "marketplace",
  "network",
  "platform",
  "product",
  "search",
  "service",
  "site",
  "software",
  "system",
  "tool",
  "website"
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

function looksLikeThrowawayReaction(idea: string) {
  return THROWAWAY_PHRASES.some((pattern) => pattern.test(idea));
}

function containsProfanity(words: string[]) {
  return words.some((word) => PROFANITY_WORDS.has(word));
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

function hasIdeaShape(words: string[]) {
  const hasAction = words.some((word) => IDEA_ACTION_WORDS.has(word));
  const hasIdeaNoun = words.some((word) => IDEA_NOUN_WORDS.has(word));
  const hasConnector = words.includes("for") || words.includes("to");

  return hasAction || hasIdeaNoun || hasConnector;
}

function hasNonAsciiLetterOrNumber(value: string) {
  return Array.from(value).some((character) => {
    return character.charCodeAt(0) > 127 && /[\p{Letter}\p{Number}]/u.test(character);
  });
}

function hasDetailedMultilingualContext(idea: string, details?: string | null) {
  const trimmedIdea = idea.trim();
  const trimmedDetails = details?.trim() ?? "";

  return (
    trimmedIdea.length >= CONTEXT_ACCEPTANCE_MIN_LENGTH &&
    trimmedDetails.length >= CONTEXT_ACCEPTANCE_MIN_LENGTH &&
    hasNonAsciiLetterOrNumber(`${trimmedIdea} ${trimmedDetails}`)
  );
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

  if (looksLikeThrowawayReaction(idea)) {
    return JUNK_MESSAGE;
  }

  if (containsProfanity(words)) {
    return JUNK_MESSAGE;
  }

  const substantiveWords = words.filter((word) => word.length >= 4);

  if (
    substantiveWords.length >= 2 &&
    substantiveWords.every((word) => looksLikeGibberishWord(word))
  ) {
    return JUNK_MESSAGE;
  }

  if (words.length <= 4 && !hasIdeaShape(words)) {
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

  const { apiKey, endpointBase, model, promptPath } = appConfig.aiVerification;
  const endpoint = `${endpointBase.replace(/\/$/, "")}/models/${model}:generateContent?key=${apiKey}`;
  const prompt = await readVerificationPrompt(promptPath);

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
                  prompt,
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

async function readVerificationPrompt(promptPath: string) {
  try {
    const prompt = (await readFile(promptPath, "utf8")).trim();
    return prompt || DEFAULT_GEMINI_PROMPT;
  } catch {
    return DEFAULT_GEMINI_PROMPT;
  }
}

export async function verifyIdeaInput(idea: string, details?: string | null) {
  if (hasDetailedMultilingualContext(idea, details)) {
    return null;
  }

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
