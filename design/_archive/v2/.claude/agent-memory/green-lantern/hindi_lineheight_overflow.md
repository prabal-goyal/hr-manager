---
name: hindi-lineheight-overflow
description: Devanagari line-heights (~+25%) overflow fixed-height flex columns — verify HI render, clamp flex-none regions with overflow hidden + a maxHeight budget
metadata:
  type: project
---

Found while building `design/v2/experiments/payroll-run-console.jsx` (the
payroll-run-console experiment, entry `design/v2-x.html`): a layout that
was perfect in EN silently broke in Hindi — G2's Devanagari line-heights
are ~25% taller (`lhDeva`), so a `flex: "none"` region (the exception
queue) outgrew its fixed-height parent column and, with no overflow
clipping on the column, PAINTED OVER the gate footer below it.

**Why:** `overflow: visible` is the default; a flex child with
`flex: "none"` never shrinks, and the overflowing content isn't clipped
by the parent row (`flex:1; minHeight:0`) unless the column itself sets
`overflow: hidden`. Text-on-text overlap is the symptom.

**How to apply:** in any 100vh no-scroll composition (console/dashboard
shells): (1) every intermediate flex column that can host tall content
gets `minHeight: 0` AND `overflow: hidden`; (2) a scrollable list that
shares a column with a must-stay-visible surface gets
`flex: "0 1 auto"` + an explicit height budget (e.g. `maxHeight: "46%"`)
so the sibling keeps working room in BOTH scripts; (3) never sign off on
a screen from the EN screenshot alone — the हिंदी render is the
stress test. Related: [[register-grammar-kit]] (fonts must come from
local consts, not stale `G2.sans/deva`).
