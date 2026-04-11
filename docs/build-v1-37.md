# Idea Commons — Build Specification
# Version: v1.37
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.37 — 2026-04-10
- Clarified that heat should be recomputed from source fire and view rows on reads and writes
- Avoided trusting stale same-day cached heat when the heat algorithm changes
- Ensured existing ideas adopt the starter-fire algorithm immediately after deploy
- Added client-side whitespace cleanup for the post form fields before submit

### v1.36 — 2026-04-10
- Changed heat so the first unique fire on an idea is treated as a baseline starter signal instead of immediate public heat
- Added `HEAT_FIRE_STARTER_COUNT`, default `1`, so the number of ignored starter fires can be tuned without code changes
- Recalibrated fire emoji thresholds for the new scale so one self-like does not render as one fire
- Added `.env.example` entries for the heat and fire-display tuning knobs
- Updated about-page language to explain that one tap is smoke, not visible momentum

---

## 1. Heat Recalculation

Heat should be derived from source rows:

- `fires`
- `views`
- idea creation date
- current heat config

The app may persist `ideas.heat` and `ideas.heat_date` as a cache, but the cache must not override source-row recomputation when the algorithm changes.

For the current lean V1 scale, recomputing from scratch on reads and writes is acceptable. This keeps behavior simple and ensures config changes apply immediately after deploy.

---

## 2. Input Cleanup

The post form should trim leading and trailing whitespace before submit.

Fields:

- idea
- details
- external link

The server should continue trimming input before saving, so client cleanup is a UI convenience, not the source of truth.

---

*End of build specification v1.37. Next amendment will be `build-v1-38.md`.*
