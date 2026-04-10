# Idea Commons — Build Specification
# Version: v1.31
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.31 — 2026-04-10
- Tightened posting verification so submissions must be concrete ideas
- Clarified that throwaway reactions, profanity-only phrases, insults, and meta comments should be rejected
- Updated Gemini verification intent from only detecting gibberish to detecting whether the submission is a buildable proposal
- Added deterministic rejection for obvious low-effort phrases such as `this is bullshit` and variants
- Added deterministic rejection for submissions containing profanity

### v1.30 — 2026-04-10
- Documented the production deployment path for Litboard on the local PC tower
- Clarified that the deployed app runs as a Docker Compose service beside the existing `pnee.uk` stack
- Clarified that the existing token-based Cloudflare Tunnel routes `litboard.net` and `www.litboard.net` to `litboard:3000`
- Captured the deployment fixes discovered during launch: Debian Node image, named `node_modules` volume, dev dependency install during build, higher build memory, and SQLite initialization before start
- Added the deployment runbook at `docs/deploy-cloudflare-docker.md`
- Added launch notes for apex DNS, Cloudflare Tunnel public hostnames, and verification commands

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Posting Verification

V1 posting should stay low friction, but the required `idea` field must describe a concrete idea.

Reject:

- Gibberish
- Keyboard mash
- Placeholder text
- Meaningless filler
- Profanity-only phrases
- Profanity words
- Throwaway reactions
- Insults
- Meta comments that do not propose anything

Examples that should be rejected:

- `this is bullshit`
- `this is dog shit`
- `lol`
- `nice idea`
- `asdf asdf qwerty`
- `test idea`

Allow:

- Terse ideas
- Rough ideas
- Weird ideas
- Imperfectly worded ideas
- Any short proposal that contains a real product, service, tool, project, workflow, community, marketplace, or other buildable concept

Validation copy:

```text
Post a concrete idea, not a reaction, placeholder, or throwaway phrase.
```

---

## 3. Gemini Verification

Gemini verification should classify whether the submission is a concrete idea, not only whether it is gibberish.

- Run only when `GEMINI_MODEL` and `GEMINI_API_KEY` are configured
- Return JSON only
- Reject reactions and meaningless opinions
- Accept terse but real proposals
- If Gemini is missing, down, or invalid, keep deterministic checks and do not block posting only because Gemini failed

---

## 4. Deployment Reference

Production deployment remains documented in `docs/deploy-cloudflare-docker.md`.

---

*End of build specification v1.31. Next amendment will be `build-v1-32.md`.*
