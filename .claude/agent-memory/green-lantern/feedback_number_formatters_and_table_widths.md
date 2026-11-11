---
name: number-formatters-and-table-widths
description: two dense-table traps — never pass a year/identifier through num(), and never put a one-off explanatory sentence inside a table cell
metadata:
  type: feedback
---

Two things that only show up once a v3 screen gets genuinely dense, both caught by reading a
full-page screenshot rather than the code.

**1. `UI3.num()` is for counts, not for years or identifiers.** It applies Indian
lakh-crore grouping, so `num(2026)` renders `2,026`. It shipped into every "Settled 6 August
2,026 by Kavita Sharma" line on PY-08 before a screenshot caught it. Concatenate the year as a
plain literal (`" 2026"`); reserve `num()` for things a reader would actually want grouped
(headcount, days, claims) and `inr()` for money.

**2. A long explanatory sentence inside a table cell starves the auto-laid-out columns.**
On PY-01 the September row's disabled "Start the run" button carried its own reason ("August
is not approved yet. Starting September now would corrupt August's arrears.") in the action
cell. `UI3.Register` uses default table layout, so that one cell pushed past its declared
`width` and squeezed the un-widthed first column down to a vertical stack of single words —
in both languages, worse in Hindi. **Why:** disabled-with-reason is mandatory, but the reason
does not have to live in the cell. **How to apply:** keep the control in the row and move the
one-off explanation to the `Register` `footer` (with a lock glyph). Same for a totals label
that is longer than the first column: pass it as `cells.<wide-column>` and set
`cells.<first-column>` to `""` so the label fallback does not fire.

Related: [[v3-payroll-operator-screens]], [[devanagari-slice-truncation]].
