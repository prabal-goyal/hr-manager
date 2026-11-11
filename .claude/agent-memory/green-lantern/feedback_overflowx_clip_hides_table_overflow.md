---
name: overflowx-clip-hides-table-overflow
description: main's `overflowX: clip` makes documentElement.scrollWidth a useless overflow test — a Register table 265px too wide passes the hscroll check and silently draws under the side panel
metadata:
  type: feedback
---

Measure table overflow **per table**, not via `document.documentElement.scrollWidth > window.innerWidth`:

```js
[...document.querySelectorAll('[role="tabpanel"] table')].map((t) => ({
  over: t.scrollWidth - t.parentElement.clientWidth,
})).filter((x) => x.over > 0)
```

**Why:** every v3 page sets `overflowX: "clip"` on `<main>` (it has to — `<Motif/>` bleeds, see `feedback_motif_bleed_hscroll`). `clip` does not create a scroll container, so an overflowing child produces **no** document scrollWidth at all. On HR-28 a 9-column Register was 265px wider than its card at 1440 and every hscroll assertion passed while the table visually ran under the detail panel. A full-page screenshot did not show it either, because the panel is painted after and covers the spill.

**The inverse trap (2026-09-06):** measuring `main.scrollWidth - main.clientWidth` instead is a FALSE POSITIVE generator — it reads **70px over on every v3 page ever shipped**, including `payroll.jsx` and `hr-leaveatt.jsx`, because that is exactly `<Motif/>`'s decorative bleed being clipped. The correct page-level probe is behavioural: `const x = window.scrollX; window.scrollTo(9999,0); const moved = window.scrollX; window.scrollTo(x,0);` — `moved === 0` means the page genuinely cannot scroll sideways. Pair it with the per-table check above; do not use `main.scrollWidth`. When a new page "fails" a layout metric, measure a shipped sibling with the same probe before believing it.

**How to apply:** on any page with a register + side panel, run the per-table check at 1440 *and* 1680 *and* in Hindi, and fix by taking width out rather than by widening the container. What actually worked, in order of yield: fold two columns into one (`With` + `Waiting` → one "Waiting on" cell, name over age); drop a column whose value is derivable and re-render it as a caption inside its neighbour (`Days` under `Dates`); render an id column at `G3.fig("xs")` instead of the default mono size; **shorten the chip labels** — "Inside a closed month" → "Closed month" freed ~84px on its own, more than any layout change. Dump `th.scrollWidth` per column first; the driver is usually one long chip, not the column you expect.
