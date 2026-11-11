---
name: legend-that-counts
description: don't ship a legend AND a summary line — fold them into one row where each swatch carries its own count, so the decoder earns its place
metadata:
  type: feedback
---

When a data view encodes state as **letters on tinted cells** (the v3 Home month calendar: `P` present · `W` week off · `L` leave · `H` holiday), the letters need a decoder — but a standalone legend is on the user's cut-on-sight list ("legends restating adjacent values", DESIGN.md principle 1). **Merge the legend into the summary**: one row of `[P] 7 present · [L] 1 leave · [W] 2 week offs · [H] 1 holiday ahead`, where each swatch shows the letter in its own tint and the label carries the count.

**Why:** the user's standing rule is *every element earns its place*, and a legend plus a "So far: 7 present · 1 leave · 2 week offs" sub-line say the same four words twice. One row does both jobs, so neither can be cut. It also satisfies "never state by colour alone" — the letter is the primary channel and survives greyscale (verified by screenshotting with `filter: grayscale(1)`).

**How to apply:** any list/grid that abbreviates state. Two traps worth remembering:
- **Counts must be honest about time.** Elapsed-day counts come from the "what happened" map; a future holiday the school calendar already knows about gets its own qualifier ("1 holiday **ahead**") instead of being silently added to a "so far" total — see [[elapsed-vs-future-summary-leak]].
- **The letters need authored i18n keys per language**, never a slice of the translated word — Hindi uses उ / सा / छु / अव, and column heads र सो मं बु गु शु श, all as dedicated keys (see [[devanagari-slice-truncation]]).
