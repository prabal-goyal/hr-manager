---
name: naveya-spec-gaps-and-open-questions
description: The 25 spec-required screens nobody had listed, the 10 conflicts, and the 31 open questions found decomposing M1-M17 into screens
metadata:
  type: project
---

# Naveya spec gaps, conflicts and open questions (found 2026-08-11)

Full detail in `docs/screen-inventory.md` §10.2 (gaps), §10.3 (conflicts), §11 (open questions).

**Why this matters:** these are holes in `development-specification.md` and `functionality-blueprint.md`,
not in the design. They will resurface as build blockers if not ruled on.

**How to apply:** before dispatching any work item in M9/M10/M11/M12/M17, check whether it depends on an
open question below; if it does, get the ruling first rather than letting an agent guess.

## The gaps that mattered most (spec-required, previously listed nowhere)

1. **Maker-checker approval gate (AC-02)** — mandated across payroll/loans/batches/arrears/bonus/F&F, and
   there was no checker screen at all. The flagship control was unimplementable.
2. **DPDP console (GA-12)** — `§8` mandates lawful-basis records, retention windows, data-subject
   access/correction requests and PII access logging. Nothing surfaced any of it. Legal obligation.
3. **Paid-days reconciliation (PY-08)** — the payroll workflow's first computational step.
4. **Proposed-revisions queue (PY-06)** — M17's advisory increment must reach payroll as a *proposal*; the
   handoff had no surface.
5. **Honorarium unit entry** — `HonorariumRule` is rate × unit × cap, but with period-level attendance
   D2-deferred **nothing in MVP produces `units`**. Guest faculty literally cannot be paid.
6. **Device/ingestion health (GA-11)** — a silent biometric device manufactures false absences → LOP →
   wrong pay. Attendance UIs must distinguish "device silent" from "absent".
7. Also missing everywhere: statutory config admin, audit-log viewer, expiry watchlist, child-safety
   verification board, probation + renewal queues, bulk onboarding, all four public/token surfaces.

## Highest-value open questions (blocking)

- **No `reports_to` field exists** on `§6.3 Employee` (only `department_id`), yet the locked role model
  defines "manager" as the reports-to relationship and M8 routes approvals by it. **Data-model gap.**
- **Who originates a loan?** `Loan` starts at `pending_approval` with no named actor.
- **Out-of-geo-fence punch: blocked or flagged?** Enforcement mode unstated.
- **Expired fixed-term contract, person still working** — payroll/attendance behaviour unspecified.
- **Post-exit access vs statutory retention** — M12 revokes access; §8 requires retention and the leaver
  needs their Form 16. Recommend a limited post-exit mode rather than a binary flip.
- **Approver-absence escalation** — M8 escalates by *policy*, not absence; regularization has none.
- **Requisition budget-authority thresholds** have no configuration surface.

## Conflicts (spec vs spec / spec vs design principle)

- Blueprint **contradicts itself**: its module tags still mark period-level attendance/leave and
  substitution linkage `[MVP]` (P2 by locked D2) and F&F/gratuity/LWF/min-wage `[P2]` (MVP by locked D3),
  while its own PART C says the opposite. Also `Profile/document self-update [MVP]` (§9) contradicts the
  M4 document-governance lock. **Ruling requested, not applied unilaterally** (scope tags are BATMAN's
  call).
- `M15` lists campus/group dashboards in an MVP module while the blueprint tags them P2 → resolved by
  splitting "role home" (MVP, every role needs a landing screen) from "analytical dashboard" (P2).
- Employee record vs "one screen, one question" → resolved with a subject shell + separate tab screens.
