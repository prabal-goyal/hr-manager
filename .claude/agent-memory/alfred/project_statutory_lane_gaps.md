---
name: statutory-lane-gaps
description: Data-model gaps, sequencing conflict and unowned scope found decomposing M11/M11a/M11b/M12 (NA-23, 2026-09-07) — reusable when any statutory or exit story is planned
metadata:
  type: project
---

Decomposing the statutory lane (M11 compliance, M11a config versioning, M11b bonus, M12 F&F) surfaced
five **data-model gaps**, one **sequencing conflict**, and one piece of **unowned MVP scope**. All are
recorded as OQ rows in `docs/functional-specs/M11*.md` and `M12-full-and-final.md`; this is the index.

**Why:** these are places where `docs/development-specification.md` §6 (entity catalog) is thinner than
its own module text and than the built design, so an implementer following §6 alone builds something the
screens cannot use. They recur every time someone plans a statutory or exit story.

**How to apply:** when planning anything downstream of a payroll run, check these before writing ACs.

### Data-model gaps (entity catalog vs module text / built design)
- **`BonusRun` does not exist.** M11 §API exposes `…/bonus-runs` and §Acceptance describes its approval,
  but §6.10 has only `StatutoryContribution(kind=bonus)` — a per-payslip output row. AC-06 is unbuildable
  as specified. Proposed `BonusRun` + `BonusRunLine` + `BonusApplicability`.
- **`FinalSettlementLine` does not exist.** §6.11 has flat columns; PY-17 (built) needs *named, sourced
  lines* with overrides recorded alongside computed values and the §10(10AA)/§10(10) exempt/taxable split.
- **`StatutoryPayment` does not exist**, so AC-03's "payable vs paid" is literally uncomputable — nothing
  can hold a challan number, date, amount and mode.
- **`EmployeeStatutoryProfile` does not exist.** §6.3 carries statutory *identifiers* (PAN/UAN/ESIC) but no
  *electives* (PF ceiling applied?, VPF rate, international worker, PT state override, regime).
- **Config pins missing on three tables**: `StatutoryFiling`, `FinalSettlement` and (for arrears-originated
  rows) `StatutoryContribution` all lack `statutory_config_id`, though NA-23 AC7 and O9 require it.
  `PayrollRun` and `ArrearAdjustment` already have theirs.

### Sequencing conflict (constrains sprint order)
The build plan (§12) puts versioned StatutoryConfig in **Sprint 8**, but payroll core in **Sprint 7**
already "pins `StatutoryConfig`", and §12's own critical-path risk #3 says it must be *"data-versioned from
first use."* **M11a must land at the start of Sprint 7.** A Sprint-7 run that pins nothing is
unreproducible, makes arrears against those months uncomputable, and leaves the golden-file regression
with no baseline. M11a has no dependency on payroll; payroll has a hard dependency on it.

### Unowned MVP scope
**Maternity benefit** (26 weeks, 12 from the 3rd child, 80-day eligibility, crèche flag at 50+ staff) is
tagged MVP in `functionality-blueprint.md` §5, listed in PART C item 5, and promised on slide 13 of the
ShriConnect deck — and appears in **neither** dev-spec M11 **nor** M8. It has real arithmetic, an ESI
interaction (an ESI-covered employee draws the benefit from ESIC, not the employer) and a headcount
trigger. It is in nobody's sprint.

### Scope-tag conflicts still awaiting a ruling
- Blueprint §5 tags **gratuity, LWF and minimum wages `[P2]`** while D3 and PART C make them MVP (the
  long-standing C5/Q30 conflict, still unruled).
- Blueprint §5 tags **digitally signed Form 16/12BA `[P2]`** while PART C item 5, dev-spec M11
  ("Form 12BA (signed)"), `competitor-analysis.md`'s greytHR parity bar and the deck all say MVP.
- The **2026-07-22 deck (slides 09, 13) and PART C item 4 still promise a "single-click run … then NEFT
  bank file and payslips"**, which amendment B (2026-08-11) corrected. Collateral shown to school
  leadership contradicts a binding rule. See [[amendment-b-single-click]] context in MEMORY.md.

Related: [[statutory-spec-authoring-conventions]].
