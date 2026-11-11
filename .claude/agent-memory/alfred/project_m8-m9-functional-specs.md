---
name: m8-m9-functional-specs
description: NA-21 session — decomposing M8 Leave + M9 Attendance into functional specs; what the differentiator pair actually needs and the schema gaps it exposed
metadata:
  type: project
---

# M8 Leave + M9 Attendance functional specs (NA-21, 2026-09-07)

Wrote `docs/functional-specs/M8-leave.md` (41 ACs, 29 stories, 16 OQs, 7 conflicts) and
`M9-attendance.md` (43 ACs, 30 stories, 12 OQs, 6 conflicts). KB mirrors:
M8 `feb00921-ab01-44bc-9059-fe938c7649b1`, M9 `d25c41b8-9095-45e9-9da4-109d1a031002`.

**Why:** this pair is the product thesis — exec-summary differentiators 1 and 2, and the column of ✕
down the competitor matrix. Generic HRMS models neither.

**How to apply:** reuse these patterns on the remaining lanes; do not re-derive the rulings below.

## What worked in the decomposition

- **State the vacation/non-vacation case TWICE, in a two-column table, every time** — accrual,
  carry-forward, encashment, F&F, forced vacation. Writing "the general case plus a footnote" is how a
  vacation-staff bug gets built. Four tables took ten extra minutes and closed the whole class.
- **Naming the OWNER of a cross-module number is worth more than describing it.** "M8 owns the LOP
  cause · M9 is the single writer of paid days · M10 is a pure reader of the frozen snapshot and refuses
  to compute without one" — one table killed an ambiguity that becomes a wrong salary.
- **Writing the invariant, not the formula.** M9's spec formula is
  `paid = present + leave + holidays + offs − LOP`; the *testable* thing is
  `present + leave + holidays + offs + lop = days_in_service` and `paid = days_in_service − lop`.
  Writing it that way immediately exposed that `AttendanceRecord.status` has no `not_in_service` value.
- **Resolving a spec SILENCE explicitly, with the reason.** Blackout-declared-over-approved-leave was
  unspecified; ruling it ("never auto-revoke — an approval is a promise someone arranged their life
  around") plus the conflict-record mechanism is more useful than another open question.
- **Reading the built design as a source of committed decisions, not decoration.** `hr-leaveatt.jsx`
  and `payroll.jsx` had already fixed `DAY_DIVISOR = 30`, a 90-day comp-off lapse, and a sixth
  paid-days code `N — Not in service`. Each was a spec gap the prose never showed.

## What I nearly missed

**The ShriConnect deck surfaced an MVP behaviour no markdown doc gave a heading to:** *forced
vacation-leave during breaks + vacation-period pay*. It is one line in blueprint §3 and one card on
deck slide 08, and I had written the whole vacation-staff section without it. **Skim the PDFs before
writing, not after** — they carry MVP behaviours that never got a spec section.

## Rulings I proposed (all awaiting BATMAN/user)

Day-rate divisor (gross÷30 is in five built screens, spec silent — blocking payroll core) ·
vacation pay for a teacher who resigns before a vacation · out-of-geofence block-vs-flag (my
recommendation *differs* from the built EMP-03) · second approver on HR bulk attendance correction ·
geo/selfie retention · `ExtraDutyLog` as the answer to "where do honorarium units come from" (Q1).

## Scheduling findings the build plan does not survive without

1. **M9-S03 (`AttendanceRecord`) must move into Sprint 5** — M8's approval stamps a day's status, so M8
   (Sprint 5) depends on an M9 (Sprint 6) model. As written, M8-S11 cannot be scheduled.
2. **Biometric adapters are martian's Sprint-11 work needed in Sprint 6.**
3. **`ServiceToken` has no owner** (only M0's OQ-04) and M9 ingest is its first consumer.

See also [[naveya-spec-gaps-and-open-questions]], [[screen-inventory-decomposition]].
