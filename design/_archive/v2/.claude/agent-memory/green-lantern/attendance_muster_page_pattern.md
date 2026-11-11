---
name: attendance-muster-page-pattern
description: design/v2/pages/attendance.jsx — calendar-grid-as-Register-rows for single-employee musters, the recurring MetricFigure/CountFigure duplication, and cross-page employee-identity drift
metadata:
  type: project
---

Built `design/v2/pages/attendance.jsx` (`window.Pages2.Attendance`), a
single-employee "My Attendance" monthly muster ported from
`design/mockups/AttendanceMuster.dc.html` (which musters 214 staff
across 3 groups, one row per STAFF member, 31 narrow day columns).
For a single employee there's only one identity row, which breaks
`Register`'s "hairline rows + numbered gutter" grammar (rule 2) if you
render literally one row. **Fix pattern: turn the 31 days into a real
calendar grid — one Register ROW per calendar WEEK (Mon..Sun columns),
each cell a day-number+`MusterMark` button.** This keeps the
day-1-through-31 left-to-right skim of the source mockup while giving
the register genuine multi-row content (6 rows for a 31-day month with
Aug-1-on-a-Saturday), a real double-rule totals footer, and a natural
place to put a `flagged`/exception indicator per DAY (not per row —
see below). Reuse this pattern for any other single-subject
day-by-day register (e.g. a single class's daily register, a single
device's uptime log).

**Per-cell exception marking beats per-row `flagged`.** `Register`'s
`row.flagged` draws an inset accent ring around the WHOLE row, but an
attendance exception (missing punch, half-day pending approval) is a
property of one DAY, not the week it falls in. Flagging the row over-
applies grammar rule 6 ("one open field") to six other unaffected
cells. Instead, built a small local absolute-positioned dot (`c.late`)
inside the day's own cell/button — precise, and doesn't require a kit
change since it's just page-local JSX composed around `MusterMark`.

**The `CountFigure`/`MetricFigure` local component is now duplicated
across 3+ pages** (`docsprofile.jsx`'s `CountFigure`, this page's
`MetricFigure`, likely others) — every page that needs Masthead's
`right` slot to show a plain non-money mono figure (a percentage, a
count) re-implements the same ~15-line block (kicker + 34px JetBrains
Mono value w/ tabular figures + optional muted sub-line) because
`Masthead`'s built-in `figureValue` path always routes through
`Figure`/`inr()` and prepends `₹`. **This belongs in kit.jsx as a
named export** (e.g. `MetricFigure` or a `Masthead` prop like
`figureRaw`/`figureFormatter`) next time kit.jsx gets a pass — flag it
rather than re-copy a 4th time.

**Cross-page employee-identity drift is real and unresolved as of
2026-08-11.** `pages/docsprofile.jsx` uses `EMPLOYEE = { name: "Priya
Sharma", id: "NAV-0142", role: "PGT · Chemistry", campus: "Sunrise
Public School" }`; `pages/payslips.jsx` independently uses "Ananya
Rao" / `NAV-0234` / "PGT — Mathematics"; `pages/dashboard.jsx` greets
"Ananya" but tags her `NAV-0142` (Priya's ID) with a bare "PGT" role —
three sibling pages, three inconsistent identities, because each
agent picked realistic-but-independent data without a shared fixture.
This page reused docsprofile's `Priya Sharma` / `NAV-0142` / `PGT ·
Chemistry` / `Sunrise Public School` verbatim to reduce the drift by
one page. **Recommendation for whoever wires these pages into one
session (or for the next content page dispatched): grep
`pages/*.jsx` for `EMPLOYEE = {` / `NAV-0` first and reuse whatever's
already there, and eventually hoist ONE shared demo-employee fixture
into kit.jsx or a `pages/_fixtures.js`-equivalent** so this stops
compounding.

Verified via a hand brace/paren/bracket-balance check (no `@babel/*`
available in the scratchpad `node_modules` for a real JSX parse, and
per this dispatch's own instructions this page was NOT to be
browser-verified — that's the wiring agent's job) plus a careful
manual re-read against `kit.jsx`'s actual exported prop shapes
(`Register` columns/rows/totals, `Mark` tone-key fallback via
`c[tone]`, `MusterMark`'s exact `"·"` U+00B7 codepoint — confirmed by
diffing codepoints against kit.jsx's own muster-mark map, since a
mismatched dot character would silently fall through to the "not
scheduled" default styling instead of erroring).
