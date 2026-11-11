---
name: v3-hr-leaveatt
description: HR-26/27/28/29/30 built as one five-tab file — the vacation-staff rule rendered as ABSENCE, the ledger identity computed, and two different kinds of payroll lock
metadata:
  type: project
---

`design/v3/pages/hr-leaveatt.jsx` → `window.Pages3.HRLeaveAtt`. One component, five `Tabs`/`TabPanel` screens (HR-26 policy, HR-27 balances, HR-28 requests, HR-29 shifts/rosters, HR-30 exceptions), persona Meera Iyer (HR Operator, Indiranagar), clock 11 Aug 2026.

**Why:** the five screens share one dataset — a leave type defined on HR-26 is the column on HR-27, the chip on HR-28 and the reason a day is paid on HR-30 — so splitting them across files would have meant five copies of the same 20 people and guaranteed drift (the mistake `feedback_cross_screen_mock_constants` records).

**How to apply — the four patterns worth reusing:**

1. **A rule the system refuses to apply is rendered as ABSENCE, with the count and the reason.** Pick "Earned leave" on HR-27 and eleven teaching staff *are not on the list at all* — plus a callout saying so and a button that opens the policy tab where the switch lives. A zero would have read as "spent"; there is nothing to spend. Same idea as `feedback_absent_vs_disabled_capability`, but applied to DATA, not to a control.
2. **An identity is computed, never authored.** `ledgerOf()` returns `{opening, accrued, taken, balance: o+a-t}` and is the only source of a balance number on the screen, so the per-row arithmetic, the totals row and the side panel cannot disagree. An adjustment applies its delta to `accrued` (credit) or `taken` (debit) so the identity survives an edit made in-session.
3. **Two different payroll locks, said differently.** July sits inside run PR-2026-07 (approved + disbursed) → correction VISIBLE + DISABLED, naming the run, offering arrears. August's run PR-2026-08 is with its checker and PY-08's paid-day snapshot was taken 8 Aug → correction is OFFERED, lands immediately on the attendance record, and the panel states that pay does not move until the snapshot is retaken. Conflating the two would have disabled the whole current month.
4. **Health-adjacent data is fenced by the data layer, not by discipline.** `awayOn(reqs, iso)` returns *people*, never the leave type — so the campus day-view and the roster grid physically cannot leak "Medical leave" even if someone later edits the JSX. Type appears only where the spec's own "must contain" list demands it (the request console, the per-type ledger); free-text reason only inside one opened record.

Local promotion candidates (kit untouched): `TextArea` (4th build), `ReasonField`, `ConfirmDialog` (3rd), `Callout` (3rd), `Trail` (4th), `RowCheck`/bulk bar (2nd), `ChoiceList` (native radio group with a per-option consequence note — 1st build, and every "choose how this behaves" panel in the product has so far faked it with buttons).

Where the spec was silent and I chose: see `feedback_spec_silent_choices_hr_leaveatt`.
