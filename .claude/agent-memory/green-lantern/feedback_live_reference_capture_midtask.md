---
name: feedback-live-reference-capture-midtask
description: coordinator injected a live competitor UI capture mid-dispatch to refine (not replace) an in-progress design brief
metadata:
  type: feedback
---

Mid-way through the STAFFROOM v2 build (2026-08-10), BATMAN sent a mid-task message with concrete findings from a live Keka capture, explicitly framed as "refines, not replaces" the original brief. Findings changed several component decisions I'd already drafted in `tokens.jsx`/partway into `kit.jsx`:
- Character glyphs: switch from filled solid-circle+white-linework to **thin-stroke OUTLINE** (~2px, state colour, unfilled) — lighter/friendlier than a filled badge.
- Leave balances: render as a **colour donut per leave TYPE** (own palette, distinct from attendance-state colours) instead of ruled ledger rows or plain tiles.
- Attendance rows: **tint the whole row** by state + a small uppercase pill (not just a status cell/badge).
- WeekStrip: a **bar chart** ("Weekly pattern"), not a dense ruled grid.
- Empty states: **warm/celebratory copy** ("Hurray! No pending leave requests"), not "No data."

**Why this matters:** the fix was cheap because only `tokens.jsx` was fully written and `kit.jsx`/`screens.jsx` were still in-progress — reworking the Glyph/LeaveDonut/WeekStrip/EmptyState shapes before they were used anywhere else cost nothing structural. Had screens.jsx already been built against the old (filled/tile/grid) component shapes, the same fix would have meant touching every call site.

**How to apply:** when a coordinator sends "concrete findings from a live capture" mid-dispatch, treat it as authoritative refinement of the SAME task (not a new task) — pause, re-plan the affected component APIs before writing more call sites against the old shape, then continue. Don't finish the original plan first and patch after; that's strictly more rework.
