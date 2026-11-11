---
name: ui-compliance-review-lens
description: How to review Naveya UI/design work for compliance — the obligation catalog lives in docs/ui-compliance-requirements.md; this records the review lens and the recurring UI defect classes
metadata:
  type: project
---

Compliance in Naveya is substantially a **UI** obligation, not only a backend one. The catalog —
obligations O1–O18, the action guardrail register (A1–A67), never-build actions, per-role summary,
top risks, designer's checklist — lives at `docs/ui-compliance-requirements.md` (authored 2026-08-11,
pre-dating the ~40-screen design pass).

**Why:** we were about to design ~40 screens across seven roles. Screens designed first and
compliance bolted on later produce affordances the system must then refuse. BATMAN commissioned the
obligations *before* the screens are drawn.

**How to apply:** review every design diff (`design/**`, `frontend/**`) against that catalog, not only
backend diffs. Use §6 (designer's checklist) as the gate. Route findings to green-lantern/nightwing/
two-face; I flag, they fix.

**Recurring UI defect classes found in the first pass** (expect these again):
1. **Session ≠ person.** Maker-checker copy that says "requires the checker's own session" is satisfied
   by the same human in a second browser. The rule must name a *different individual*, and the maker
   must see the Approve control **visible + disabled + reasoned** — hiding it reads as a bug.
2. **The checker with only an Approve button.** No "Return to maker with reason" = a rubber stamp.
   Missing in `design/v2/experiments/payroll-run-console.jsx`.
3. **Money actions with no reason capture.** Clear/Hold/Reopen on a payroll variance mutate who gets
   paid, with no reason code and no visible attribution afterwards.
4. **Silently auto-suppressed exceptions.** "7 more auto-cleared below the 15% gate — not shown" hides
   money variances from human review *and* hardcodes a policy threshold into a screen.
5. **Missing StatutoryConfig version.** Runs, payslips and filings that never say what they were
   computed against. The audit story collapses without it.
6. **Scope leaks through the side doors** — pickers, type-ahead, filter option lists, dashboard totals,
   exports and notification bodies — while the main list is correctly scoped.
7. **Named individual employment states on shared boards** (exits, notice period) and **leave type/reason
   on rosters** (medical = health data).
8. **No DPDP surface at all.** Consent, retention, "Your data", PII-access visibility are absent by
   default because they feel like backend concerns.

**Standing position (take it consistently, it was the ask):** control **absent** when the role/scope
never carries the right; **disabled + reason** when a state precondition is unmet; **visible + disabled
+ first-person rule** when the person is barred from this instance (maker≠checker). Mixing the three
leaks more than any one of them.

Related: [[design-principle-conflicts]] if that gets written; escalations to the user are listed in §9
of the catalog and are unanswered as of 2026-08-11.
