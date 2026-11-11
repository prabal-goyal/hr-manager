---
name: feedback-grid-row-sync-gap
description: CSS Grid with grid-template-areas syncs row height to the tallest cell in that row — pairing two unrelated-height cards in the same grid row leaves a visible dead gap under the shorter one, caught via puppeteer full-page screenshot on home-c.jsx
metadata:
  type: feedback
---

When composing a dashboard as CSS Grid with named `grid-template-areas`
(e.g. `"recent leave" "pay upcoming"`), every cell placed in the same grid
row is stretched to the row's tallest cell — if the two cells hold
genuinely unrelated content (a 3-row list vs. a card with donuts that wrap
to 2 lines), the shorter cell leaves a visible dead gap before the *next*
row's content starts, breaking the "impeccable" vertical rhythm mid-page.

**Why:** caught on `design/v2/variants/home-c.jsx` — `grid-template-areas`
paired `"recent"` (a 3-row `RecentDays` list, ~200px) against `"leave"` (4
`LeaveDonut`s that wrapped to 2 rows in a narrow 1fr column, ~340px). Not
visible in the first-viewport screenshot; only showed up in a full-page
puppeteer capture scrolled to the bottom. First fix attempt (shrinking
donut size) treated the symptom; the real fix was structural.

**How to apply:** for a dashboard-grid layout, only put items that should
share the SAME visual row-height budget into the same `grid-template-areas`
row (e.g. three independent full-width hero cards stacked, each getting
its own row). For a genuine two-column split where the two columns' content
lengths are unrelated and can't be predicted (e.g. a data list vs. a stack
of unrelated cards), use a plain flex row instead (`display:flex` with
`flex: X X Ypx` per column) so each column's height flows independently —
any mismatch just leaves whitespace at the very bottom of the page (harmless)
instead of a gap in the middle (very visible). Verify any multi-section
dashboard composition with a full-page (not just first-viewport) screenshot
before calling it done.
