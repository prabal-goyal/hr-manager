# alfred — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Spec analyst & phase/sprint planner. Decompose `docs/development-specification.md` modules (M1–M17) into work items with ACs, dependencies, and owner routing. Never write application code.

## Owns
Planning across all modules; requirement refinement; `docs/decisions-to-finalize.md` as the open-questions parking lot. Cross-reference `docs/functionality-blueprint.md` (MVP/P2/Later) and `docs/executive-summary.md`.

## Standing decisions (binding)
- Every MVP acceptance criterion in the spec lands in exactly one work item — no orphan ACs.
- Payroll/statutory work items MUST name the maker-checker gate and the versioned StatutoryConfig they read (never hardcoded rates) as explicit ACs; RLS-isolation and payroll-proration criteria are ACs, not notes.
- ACs cite the spec section (`M<n> §<x>`); an agent seeing an AC contradict the spec STOPS and reports.
- Route by module ownership in the spec: oracle=schema, cyborg=API, martian=integrations, wonder-woman=auth/RLS-policy, riddler=payroll/statutory, green-lantern=web, nightwing=mobile, deathstroke=unit tests, bane=E2E/chaos, two-face=UI/UX, gordon=compliance, lucius=knowledge.
- Record decomposition learnings (what split well, estimates that held) here at the end of every planning session.

## Product identity (2026-07-22)
- Product name is **Naveya** (*nava* "new" + *nāv* "vessel/navigate" → "a new vessel that carries a school's
  people forward"). Tagline: *"Naveya — AI-powered HRMS, built by schools, for schools."* Use it on the title
  line of every `docs/*.md` (first-mention gloss once). Internal repo/agent codename stays **Tenure** in
  `.claude/` and `CLAUDE.md` — do NOT rebrand those; the rename is `docs/` only.
- Built by **Voxturr Labs** in collaboration with **ShriConnect** (technology arm of The Shri Ram Schools
  group). ShriConnect is a COLLABORATION PARTNER, never a competitor — never list it in competitor-analysis.

## Scope history (locked)
- 2026-07-14: D1–D3 locked (multi-branch IN MVP; substitute-teacher + period-level + timetable + workload
  DEFERRED to P2; full statutory parity + F&F pulled INTO MVP).
- 2026-07-15: Recruitment/ATS (M5) promoted to MVP; HR-controlled document governance (M4) added.
- 2026-07-18: API layer = mixed strawberry-django GraphQL (primary) + DRF REST edge.
- **2026-07-22 "ShriConnect alignment": five items P2 → MVP.** (1) **Performance Appraisal / PAMS = new module
  M17** (module numbering ran M1–M16, so PAMS took the next number M17); baseline goal/KRA + self/manager +
  360° + cycles/rating matrix + increment/promotion rec + dept-wise reports + edu extras (classroom-obs,
  student-result linkage, student/parent 360). **UGC-API scoring stays Later; CPD/in-service hours stay P2.**
  (2) Loans & Advances, (3) Reimbursements/FBP, (4a) Arrears & retro pay-revision → folded into **M10 Payroll**;
  (4b) statutory/ex-gratia Bonus → **M11 Statutory**. (5) HR Helpdesk/ticketing → **M15** (sub-section M15.1),
  raised from ESS/mobile (**M13** gained reimbursement-claim submit + helpdesk-ticket raise).

## Decomposition learnings
- The dev spec's per-module template is **Purpose · Actors · Entities · Business rules · Workflow · API ·
  Permissions · Acceptance** — extend that structure, don't invent a new one when folding scope in.
- Folding-in pattern that worked: add sub-headed business-rule blocks tagged *(ShriConnect scope, 2026-07-22)*
  inside the existing module rather than creating micro-modules — keeps loans/reimbursements/arrears co-located
  with payroll where they compute.
- ShriConnect financial items MUST carry: money = **Decimal**; **maker-checker** on arrears runs, bonus runs,
  and reimbursement payout batches; bonus %/cap/eligibility from the **versioned StatutoryConfig** (never
  hardcoded); arrears recompute each affected month on that month's **originally pinned** config; appraisal
  ratings & arrears are **append-only**. These are the ACs graders/guards will look for.
- PAMS increment/promotion recommendation is **advisory** → surfaces to M10 as a proposed salary revision,
  never auto-applied, still passes payroll maker-checker. Avoids a compliance hole where appraisal bypasses
  payroll approval.
- New tenant-owned entities added (all carry `tenant_id` + RLS policy in the same migration): Loan,
  LoanInstallment, ReimbursementClaim, ReimbursementClaimLine, ArrearAdjustment, AppraisalCycle, Goal,
  AppraisalReview, AppraisalRating, HelpdeskTicket, TicketComment.

## Session index (detailed memories)
- [M0–M3 functional-spec decomposition](functional-spec-decomposition-m0-m3.md) — dev-start specs for sprints 0–2; enforcement-not-convention technique; the 3 critical-path data-model gaps.
- [Screen inventory decomposition](screen-inventory-decomposition.md) — 118 MVP screens per role; the splitting rules that worked; supersedes the canvas.
- [Spec gaps & open questions](naveya-spec-gaps-and-open-questions.md) — 25 missing screens, 10 conflicts, 31 open questions from M1–M17.
- [Lane B joiner-journey specs](naveya-lane-b-joiner-journey-specs.md) — NA-20 M4/M5/M6/M7 functional specs: the eight-section format, four data-model holes, two sprint-order inversions.
- [M10 payroll decomposition](project_m10_payroll_decomposition.md) — NA-22 Lane D: six entities the spec requires but never defines; proration/rounding/JSONB-float traps; the config pin must be a FK from Sprint 7.
- [M8+M9 functional specs](project_m8-m9-functional-specs.md) — the differentiator pair; vacation-staff two-column rule, paid-days ownership, schema gaps.
- [Statutory lane gaps](project_statutory_lane_gaps.md) — 5 data-model gaps, the M11a Sprint-7 sequencing conflict, maternity unowned (NA-23).
- [Spec-authoring conventions](feedback_spec_authoring_conventions.md) — 8 sections, wikilinks + KB mirroring, cite O1..O18, PART C is authoritative.
- [Lane F functional specs](lane-f-functional-specs.md) — NA-24 M13/M14/M15/M15a/M16/M17: entity-less modules, DLT + LAN-device delivery blockers, deck omits PAMS/helpdesk.

## Amendments log (user rulings, apply to all future planning)
- **2026-08-11 A — Student/parent 360° feedback: MVP → Later.** No student/parent role exists (M2 seed
  roles); collection needs minor-facing accounts + verifiable parental consent (DPDP §8). Classroom
  observation, peer review and student-**result** linkage stay MVP. `AppraisalRating.source` keeps the
  `student`/`parent` enums; **MVP writes only `self`/`manager`/`peer`**.
- **2026-08-11 B — "Single-click payroll run" is wrong.** Payroll **computation** is one action; **release
  (run approval, bank file, disbursement) always needs a distinct checker and is never one click.** Never
  write an AC or copy implying a one-click run-to-disbursement.
- **2026-08-11 C — F&F maker-checker is CONFIGURABLE per tenant.** A settlement may be completed by a
  single person where the tenant configures it so; single-person completion must be **recorded as such**.
  This is the ONLY exception — it never relaxes the distinct-checker requirement on run approval, bank
  file/disbursement, statutory filings, reimbursement payout batches, arrears posting or bonus runs.

## Decomposition learnings (2026-09-07 addendum — dev start)
- **Functional specs use eight sections:** Intent · Scope & surfaces · Data model · Behaviour walk-through ·
  numbered ACs citing `M<n> §<block>` **and** the `O1..O18` ui-compliance obligations · Testing (deathstroke
  unit vs bane integration/RLS) · Proposed stories · Open questions. Cite PART C of the blueprint as the
  authoritative in/out list — a scope disagreement with it is a conflict to report, never a judgement call.
- **Wikilink every cross-module reference** (`[[M8-leave]]`) so the specs traverse as a graph; a link to a
  sibling spec another lane has not written yet is correct, not an error.
- **zsh does not word-split unquoted variables** — `set -- $pair` in a loop hands you the whole string.

## Decomposition learnings (2026-08-11 addendum)
- Modules M1–M17 also carry **M17** now — update the Charter line's "M1–M16" when next edited.
- **Decompose to screens *with their actions*, not screens alone.** Structure is where specs are thick;
  *behaviour* is where they are thin. Writing per-action preconditions/defaults/failure/reversibility/
  second-eyes surfaced ~31 open questions that a screen list alone would have hidden until build time.
- **`must NOT contain` is as load-bearing as `must contain`** — it is where governance rules become
  screen-level constraints and where duplicate destinations get killed.
- Public/token surfaces (career site, apply, pre-boarding upload, offer acceptance) are systematically
  forgotten because they have no role and no nav. Check every module with an external actor.
- When the docs contradict each other on **scope tags**, flag and request a ruling — do not "correct" the
  blueprint unilaterally. Internal-contradiction fixes the user has explicitly ruled on are different: apply
  those to BOTH `development-specification.md` and `functionality-blueprint.md`, and note the date inline.
