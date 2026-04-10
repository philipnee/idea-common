# Idea Commons — Build Specification
# Version: v1.34
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.34 — 2026-04-10
- Moved the Gemini idea-verification prompt into editable content
- Added `LITBOARD_IDEA_VERIFICATION_PROMPT_PATH` so production can point at the prompt file inside the container
- Clarified that Litboard should allow useful shares and cool things, not only startup/product ideas
- Clarified that verification should block unconstructive junk, profanity, gibberish, and throwaway reactions without judging idea quality too aggressively

### v1.33 — 2026-04-10
- Added a Docker Compose-aware admin wrapper for production operations
- Wrapped delete-by-url and readable-id rekey commands so they run inside the Litboard container
- Added wrapper helpers for Litboard logs, Cloudflare Tunnel logs, service restart, and Compose status

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Editable Verification Prompt

The Gemini idea-verification prompt should live in:

```text
content/idea-verification-prompt.txt
```

The server should read this file at request time so prompt copy can be changed without restarting the server.

Production may point to the prompt with:

```bash
LITBOARD_IDEA_VERIFICATION_PROMPT_PATH=/app/content/idea-verification-prompt.txt
```

If the file is missing or unreadable, the app should fall back to a built-in prompt.

---

## 3. Verification Policy

Verification should use a light touch.

Allow:

- ideas
- useful proposals
- interesting things worth sharing
- links worth discussing
- rough or unfinished thoughts
- weird but constructive suggestions
- broad observations that point to a possible opportunity

Reject:

- gibberish
- keyboard mash
- placeholder text
- empty filler
- profanity
- insults
- unconstructive reactions
- meta comments that do not share or propose anything

The goal is to block junk, not to judge whether an idea is good.

---

*End of build specification v1.34. Next amendment will be `build-v1-35.md`.*
