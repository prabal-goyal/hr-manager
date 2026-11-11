---
name: v3-payroll-operator-screens
description: design/v3/pages/payroll.jsx — PY-01/PY-07/PY-08 built as one dataset; how maker-checker, the run state machine, reason capture and paid-days derivation are shaped in v3
metadata:
  type: project
---

`design/v3/pages/payroll.jsx` holds all three Payroll Operator screens in ONE IIFE —
`window.Pages3.PYHome` (PY-01), `PYRun` (PY-07), `PYPaidDays` (PY-08) — because they share
one run (`PR-2026-08`, August 2026) and one set of derived money. Splitting them would mean
duplicating the figures, and a figure duplicated is a figure that drifts.

**Why one file, one dataset:** the whole point of a payroll surface is that the same rupee
reads the same everywhere. `MONTHLY_GROSS_REF = 94800` and a day priced at `gross / 30` are
copied from `pages/attendance.jsx` / `pages/leave.jsx`; the maker (Sunita Kulkarni), checker
(Rajiv Menon), run ids and pinned config versions (`v2026.2` from 1 Apr, `v2026.3` from
1 Jul) come from `pages/payslips.jsx`. Anything else contradicts a payslip a teacher has
already been shown.

**How to apply — the patterns worth copying to AC-02, arrears, bonus, F&F:**

- **The run's state machine, from the maker's seat, has exactly two positions:** with the
  checker, or back with you. Approve/disburse are *not* positions this role can move it
  into, so those controls are **absent** and the screen prints both independently sufficient
  reasons ("you prepared this run" AND "this role does not hold `payroll.approve`"). The
  inventory says the Approve control is *hidden* for the maker (PY-07) while
  `ui-compliance-requirements.md` A38 says *visible + disabled with the rule*; they only
  agree when the maker also lacks the permission, which is the case here. Note the conflict
  before drawing AC-02, where the checker DOES hold it.
- **Return-to-maker is two directions and both must exist.** The checker's return is a
  first-class, dated, attributed trail event (the run really was returned once and
  re-submitted); the maker's reverse path is a live "Recall from the checker" that refuses
  without a reason. A gate whose only recorded outcome is "approved" is a rubber stamp.
- **`ReasonPrompt`** (reason code + note + a confirm that is never hard-disabled) is the
  shape of every consequential act. `OffAction` is a control that is off with the reason in
  words. `TrailList` is append-only — recalling APPENDS an entry, never rewrites one.
- **`buildDays(person)` derives everything** on PY-08 from three authored facts (leave days,
  LOP days, joined/left) plus real `Date` objects; present/holiday/weekly-off/paid-days and
  the totals are computed, so the arithmetic on screen IS the arithmetic in the code. A
  `reconciles` flag per row and a footer verdict make the M9 identity checkable, not asserted.
- **PY-08 carries no money at all** (the inventory puts money on PY-09/PY-10). A
  post-freeze attendance correction is stated in DAYS; what a day is worth is decided on the
  run. This is why the honey card there is a two-path decision (recall + recompute vs. post
  as arrears), not a price.

Promotion candidates listed at the foot of the file: `EqRow`/Ledger (2nd independent use —
payslips.jsx has an identical local copy), `ReasonPrompt`, `OffAction`, `TrailList`,
`IdentityPanel`/SignOff, `Fact`, `DayGrid`.

Related: [[gate-threshold-from-config]], [[v3-leave-payslips]], [[v3-attendance-screen]].
