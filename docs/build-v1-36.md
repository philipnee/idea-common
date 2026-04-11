# Idea Commons — Build Specification
# Version: v1.36
# Created: 2026-04-10
# Status: ACTIVE

---

## Changelog

### v1.36 — 2026-04-10
- Changed heat so the first unique fire on an idea is treated as a baseline starter signal instead of immediate public heat
- Added `HEAT_FIRE_STARTER_COUNT`, default `1`, so the number of ignored starter fires can be tuned without code changes
- Recalibrated fire emoji thresholds for the new scale so one self-like does not render as one fire
- Added `.env.example` entries for the heat and fire-display tuning knobs
- Updated about-page language to explain that one tap is smoke, not visible momentum

### v1.35 — 2026-04-10
- Added an admin stats utility for idea view and fire counts
- Added `scripts/admin.sh stats` to list all ideas with total views, unique views, total fires, unique fires, heat, and idea text
- Added `scripts/admin.sh stats <idea-url-or-id>` to inspect one idea by share URL or id
- Kept the stats utility readonly so it can be safely used against the production SQLite database

---

## 1. Product Overview

**Litboard** is a public feed of ideas where people can post, browse, and signal interest.

`Idea Commons` remains the internal code name only.

---

## 2. Heat Algorithm

One fire should not immediately show as one visible fire emoji.

Reason:

- most posters will fire their own idea
- a single self-like should not create visible momentum
- visible heat should represent at least one additional person showing interest

The daily formula is now:

```text
counted_fires_today = max(0, unique_fires_today - fire_starter_count)

heat(today) = carry_factor × heat(yesterday)
            + log2(1 + counted_fires_today)
            + view_weight × log2(1 + unique_views_today)
```

Defaults:

```text
carry_factor = 0.3
view_weight = 0.2
fire_starter_count = 1
```

With the default `fire_starter_count = 1`:

- 0 unique fires contributes `0`
- 1 unique fire contributes `0`
- 2 unique fires contributes `1`
- 3 unique fires contributes about `1.58`

Views still contribute, but at low weight. A post that only gets a self-fire and a few views should remain ash-level.

---

## 3. Fire Display Thresholds

The default emoji thresholds should be:

```text
1 fire emoji:  1.00
2 fire emoji:  2.25
3 fire emoji:  3.50
4 fire emoji:  5.00
Supernova:     7.00
```

These remain configurable with:

```bash
FIRE_EMOJI_THRESHOLD_1
FIRE_EMOJI_THRESHOLD_2
FIRE_EMOJI_THRESHOLD_3
FIRE_EMOJI_THRESHOLD_4
FIRE_EMOJI_THRESHOLD_5
```

The product should not show raw fire counts in the public UI.

---

*End of build specification v1.36. Next amendment will be `build-v1-37.md`.*
