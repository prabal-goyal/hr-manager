---
name: m10-payroll-decomposition
description: What worked and what I found decomposing M10 payroll (core + loans + reimbursements + arrears) into functional specs, 2026-09-07 — including six entities the spec requires but never defines
metadata:
  type: project
---

# M10 payroll decomposition (NA-22, Lane D, 2026-09-07)

Four specs written: `docs/functional-specs/M10-payroll-core.md` (48 ACs), `M10a-loans-advances.md` (21),
`M10b-reimbursements-fbp.md` (26), `M10c-arrears-pay-revision.md` (27). 75 proposed stories, 487 points.
Measured 29 minutes wall-clock.

**Why:** M10 is the crown jewel and the one module where an ambiguity becomes a wrong salary. The house
format is the eight-section one M0 established (Intent · Scope & surfaces · Data model · Behaviour ·
numbered AC table · Testing · Proposed stories · Open questions) — extend it, do not reinvent it.

**How to apply:** reuse these findings when planning any later payroll-adjacent module, and when the
rulings below come back.

## The technique that found the most
**Look for entities the spec requires but never defines.** M10 named six behaviours with no table behind
them, and each one would have been invented at implementation time by whoever hit it first:
`HonorariumUnitEntry` (rate × units × cap, no source of units), `PaidDaysSnapshot`, `ReimbursementPolicy`
("configurable policies" is blueprint-MVP with no config table), `ReimbursementPayoutBatch` (the spec
names the *concept* and gates it with maker-checker, but there is nothing to attach the gate to),
`ArrearAdjustmentSet` (a checker approves a computation, not 40 rows), and
`ArrearAdjustment.original_payroll_run_id` (without it "recompute on the *originally pinned* version" is
unverifiable from the data). Ask of every business rule: *what row does this write?*

**The second technique: cross-read the blueprint against the dev spec by scope tag.** That is how
extra-duty/overtime pay surfaced — blueprint PART A §4 tags it **[MVP]**, §6.9 has no entity at all, and
`HonorariumRule` cannot serve because it binds to an honorarium *pay group* while exam invigilators are
salaried CTC teachers.

## Ambiguities worth naming early in any payroll work
- **The proration denominator is never stated anywhere** (calendar days / working days / fixed 26). Three
  answers, three different salaries for the same absence. Ask first.
- **Which components prorate** is equally unstated; a flat allowance prorated underpays.
- **Rounding step** (per component / line / payslip / statutory head) is how a register fails to reconcile
  by a few rupees and blocks every approval.
- **Money inside JSONB** is the sneakiest float vector — `ArrearAdjustment.recompute` is specified as
  "JSON: PF/ESI/TDS deltas" and a JSON number is a float in most serialisers. Specify strings.
- **"A distinct user id" is weaker than "a distinct person"** — two accounts linked to one `Employee` is
  the case the control exists to stop and the one a user-id check misses. Write it as an AC.

## Three MVP holes that are the same hole
There is no off-cycle/supplementary run in MVP (blueprint §4 tags it P2), so: an employee excluded from the
bank file for bad bank details, an exiting employee with an approved unpaid reimbursement, and a leaver owed
arrears **all have no payment path**. Argue them together, not separately.

## Sequencing insight that generalises
A module can depend on another module's *data shape having existed since an earlier sprint*, not just on it
shipping. M10c cannot exist unless M10 core pinned `statutory_config_id` as a **foreign key** from the first
run in Sprint 7 — if Sprint 7 ships a date-resolved lookup, Sprint 9 cannot recover the history. State that
as a scheduling constraint in the dependency notes, not as a caveat in prose.

## Estimate baseline (unvalidated until built)
Payroll core came out at 32 stories / 231 pts; the three riders at 69 / 83 / 104. Compute-engine stories
took 8–13 pts each. Compare against actuals when Sprint 7 closes.

Related: [[naveya-spec-gaps-and-open-questions]], [[screen-inventory-decomposition]].
