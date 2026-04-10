# Idea Commons — Build Specification
# Version: v1.32
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.32 — 2026-04-10
- Added an admin script to delete an idea by full URL or raw id
- Added an admin script to rekey readable idea ids into opaque hash-like ids
- Clarified that public idea URLs should use opaque ids, not human-readable seed names
- Clarified that delete operations must remove related fire and view rows

### v1.31 — 2026-04-10
- Tightened posting verification so submissions must be concrete ideas
- Clarified that throwaway reactions, profanity-only phrases, insults, and meta comments should be rejected
- Updated Gemini verification intent from only detecting gibberish to detecting whether the submission is a buildable proposal
- Added deterministic rejection for obvious low-effort phrases such as `this is bullshit` and variants
- Added deterministic rejection for submissions containing profanity

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Public Idea URLs

- Idea detail URLs should use opaque ids
- New user-created ideas already use 8-character lowercase/digit ids
- Manually seeded ideas should not use readable ids such as `seed_agent_native_internet`
- If readable ids exist in production, use the rekey admin script to replace them with opaque ids
- Rekeying must update dependent `fires` and `views` rows

---

## 3. Admin Delete

Admin delete should support either a full idea URL or a raw idea id.

Examples:

```bash
node scripts/delete-idea.mjs https://www.litboard.net/ideas/seed_agent_native_internet
node scripts/delete-idea.mjs seed_agent_native_internet data/prod-runtime-store.db
```

The delete operation should remove:

- the `ideas` row
- related `fires` rows
- related `views` rows
- related `post_attempts` rows with the same content hash

Dry run should be available:

```bash
node scripts/delete-idea.mjs --dry-run https://www.litboard.net/ideas/seed_agent_native_internet
```

---

## 4. Admin Rekey

Readable ids can be converted to opaque ids:

```bash
node scripts/rekey-readable-idea-ids.mjs data/prod-runtime-store.db
```

Dry run:

```bash
node scripts/rekey-readable-idea-ids.mjs --dry-run data/prod-runtime-store.db
```

The script should print old id, new id, title, and new public URL.

---

*End of build specification v1.32. Next amendment will be `build-v1-33.md`.*
