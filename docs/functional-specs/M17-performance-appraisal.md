# M17 — Performance Appraisal / PAMS · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M17 Performance Appraisal & Management System (build-plan §12 Sprint 12) ·
> **Epic:** NA-24 lane F · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` **M17** (Purpose, Actors, Entities, Business rules,
> Workflow, API, Permissions, Acceptance), §6.12 (AppraisalCycle, Goal, AppraisalReview, AppraisalRating),
> §4.2, §4.3, §7, §8, §12 · `docs/functionality-blueprint.md` §10 "Faculty Performance Appraisal &
> Professional Development ★ — **NOW MVP** (ShriConnect scope, 2026-07-22)", PART C item 11 ·
> `docs/decisions-to-finalize.md` 2026-07-22 scope-change log · **`.claude/agent-memory/alfred/MEMORY.md`
> amendment A (2026-08-11 user ruling): student/parent 360° feedback is Later, not MVP** ·
> `docs/screen-inventory.md` HR-35, HR-36, DH-06, DH-07, DH-08, EMP-16, EMP-17, PR-05, PY-06, PUB-05 ·
> `docs/ui-compliance-requirements.md` **O14** (appraisal — append-only, advisory, scoped; binding),
> O3, O6, O7, O11, O12, O18, A58, A59, A60 · `design/v3/pages/hr-reports.jsx` (HR-35/HR-36, **built**).
>
> **Implementation owner:** cyborg (workflow, scoring, API). **Schema:** oracle. **Web:** green-lantern.
> **Mobile (EMP-16/17, DH-07):** nightwing. **Payroll handoff:** riddler / `[[M10-payroll-core]]`.
> **Compliance review:** gordon. **Unit:** deathstroke. **Integration:** bane.
>
> **Cross-module links** — `[[M0-foundations]]`, `[[M2-identity-access]]`, `[[M3-core-hr-people]]`,
> `[[M6-onboarding]]`, `[[M7-academic-calendar]]`, `[[M10-payroll-core]]`, `[[M10c-arrears-pay-revision]]`,
> `[[M12-full-and-final]]`, `[[M13-ess-mobile]]`, `[[M14-notifications]]`, `[[M15-reporting-platform]]`,
> `[[M15a-helpdesk]]`, `[[M16-integrations]]`.

---

## 1 · Intent

Corporate appraisal asks whether someone hit their targets. School appraisal asks whether a teacher taught
well — and the evidence for that lives in a classroom, in a department's collective judgement, and in what
students actually learned. Every competitor studied ships a corporate-shaped performance module
(`docs/competitor-analysis.md`); none ships classroom observation or result linkage. That is why PAMS is one
of the five ShriConnect modules pulled into MVP on 2026-07-22 and why M17 is education-shaped rather than
a KRA form with a school's logo on it.

The module has one hard architectural boundary, and it is a compliance boundary, not a preference.
**An appraisal recommends; payroll decides.** A finalized review carrying an `increment` or `promotion`
recommendation surfaces to `[[M10-payroll-core]]` as a **proposed, effective-dated salary revision** that
still passes payroll's maker-checker (`M17 §Business rules`, O14, A60). It is never auto-applied, and there
is no "Apply increment" control anywhere in the appraisal surfaces. Without that boundary, appraisal
becomes a path by which one person can move somebody's salary without a second pair of eyes — precisely
the hole every other control in this product exists to close.

The second invariant is that appraisal records are **append-only**. A submitted rating is final; a
correction is a **superseding** record with a reason, and the original stays readable (`M17 §Business
rules`, `§4.3`, O6, O14). An appraisal that can be quietly edited after the fact is worth nothing in a
dispute — and appraisal disputes are exactly what a school ends up defending.

**Scope, restated because it moved twice:** classroom observation, peer review and **student-result /
outcome linkage** are MVP. **Student/parent 360° feedback is Later** (user ruling, 2026-08-11: the product
has seven seed roles and no student or parent among them; collection would need minor-facing accounts with
verifiable parental consent under DPDP §8). **UGC-API academic self-appraisal scoring is Later** and
**CPD / in-service training-hours tracking is Phase 2** (`M17 §Business rules`).

---

## 2 · Scope & surfaces

### In scope (MVP)

| Area | What M17 delivers | Screens |
|---|---|---|
| Cycles | Configurable cycles (`term/annual/probation`) tied to an academic year, with window, population and status `draft → open → locked → closed` | HR-35 |
| Rating matrix | Per-cycle scale, labels and descriptors — **the single source every rating screen reads** | HR-35 |
| Goals / KRA-KPI | Per-employee goals with kind, weight (summing to 100), target; publish and acknowledge | DH-06, EMP-16 |
| Self-appraisal | Per-goal self rating and comments on the cycle's matrix, weighted preview, final submit | EMP-17 |
| Manager evaluation | Per-goal manager rating, comments, composite preview, advisory recommendation | DH-07 |
| 360° inputs | Manager, **peer**, **classroom observation**; `student`/`parent` sources exist in the enum but **MVP writes only `self`/`manager`/`peer`** | DH-08, DH-07 |
| Student-result linkage | An aggregate academic-outcome signal attached to a review (see OQ-M17-05 on where the data comes from) | DH-07 |
| Moderation | Campus-level distribution view, superseding moderation with a required reason, finalisation | PR-05 |
| Recommendation handoff | Finalized `increment`/`promotion` recommendations queued to payroll as **proposed** revisions | PY-06 (owned by `[[M10-payroll-core]]`) |
| Reports | Completion by stage, distribution and recommendation counts by department and staff category | HR-36 |

### Explicitly out of scope

| Out | Status |
|---|---|
| **Student / parent 360° feedback** and the public form PUB-05 | **Later** — user ruling 2026-08-11 (amendment A) |
| **UGC-API academic self-appraisal scoring** | **Later** (`M17 §Business rules`) |
| **CPD / in-service training-hours tracking** | **Phase 2** (`M17 §Business rules`) |
| Applying a salary revision | **`[[M10-payroll-core]]`**, behind maker-checker — never here (O14) |
| Succession planning, 9-box, calibration curves, forced ranking | Not specified; and the spec deliberately provides no forced ranking |
| Teaching-load, timetable or period-level inputs | Phase 2 (D2) |
| Exam/result system itself | Phase 2 (blueprint §14) — M17 consumes a signal, it does not compute results |
| Probation confirmation decisions | `[[M6-onboarding]]` — a probation cycle *informs* it |

### API surfaces

`…/appraisal-cycles` (+ `/open`, `/lock`, `/close`), `…/goals`, `…/appraisal-reviews`
(+ `/self`, `/manager`, `/moderate`, `/finalize`), `…/appraisal-ratings`, `…/appraisal-reports`
(`M17 §API`), all GraphQL except artefact export, which uses the REST edge.

---

## 3 · Data model

Tenant-owned; `tenant_id` NOT NULL plus RLS `ENABLE` + `FORCE` + policy **in the same migration**
(`guard-rls-policy`). Owner: oracle; policy content: wonder-woman — appraisal scores are access-scoped
data (`M17 §Business rules`), so the policy must express the review chain, not merely the tenant.

### 3.1 `AppraisalCycle` (§6.12, extended)

| Field | Type | Notes |
|---|---|---|
| `scope` (campus/org), `academic_year_id`, `name`, `type` (`term/annual/probation`) | | Tied to `[[M7-academic-calendar]]` |
| `rating_matrix` | JSON | scale points, labels, descriptors, and the **weighting model**; **no hardcoded 1–5 anywhere** (`guard-hardcoded-values`) |
| `window_start`, `window_end`, `status` (`draft/open/locked/closed`) | | |
| `stage_sequence` | JSON | which stages run and in what order (`self → manager → 360 → moderation`) |
| `enabled_sources` | JSON | `manager` (always), `peer`, `classroom_observation`, `student_result`; **`student`/`parent` are not selectable in MVP** |
| `source_weights` | JSON | how each source contributes to the composite — **currently unspecified in the spec** (OQ-M17-04) |
| `population_filter` | JSON | staff category, department, employment type |
| `eligibility_rule` | JSON | mid-cycle joiner/leaver handling — **absent from the spec** (OQ-M17-02) |
| `disclosure_policy` | enum `at_submission/at_moderation/at_close` | when the employee sees manager and 360 content (DH-08 default: at moderation) |
| `min_cell_size` | int | inherited from `[[M15-reporting-platform]]`, default 5, for HR-36 |

### 3.2 `Goal` (§6.12, extended)

`employee_id`, `appraisal_cycle_id`, `kind` (`kra/kpi/objective`), `description`, `weight`, `target`,
`self_rating`, `manager_rating`, `status` (`draft/published/acknowledged/superseded`), plus
`acknowledged_at`, `published_at`, `supersedes_goal_id`, `change_reason`. Weights must total exactly 100
per employee per cycle before publish (DH-06).

### 3.3 `AppraisalReview` (§6.12, extended)

`employee_id`, `appraisal_cycle_id`, `reviewer_user_id`, `stage` (`self/manager/360/moderation`),
`composite_score`, `recommendation` (`none/increment/promotion/pip`), `status`
(`pending/submitted/moderated/finalized`), plus:

| Added field | Why |
|---|---|
| `supersedes_review_id` | Append-only revision chain (`M17 §Business rules`) |
| `superseded_reason` | Required on any superseding record (O6) |
| `recommendation_justification` | Required for anything other than `none` (DH-07) |
| `recommended_effective_from` | The date the *proposal* would take effect; payroll may change it |
| `handoff_state` | `not_applicable/queued/accepted/modified/declined` — the M10 side of the advisory boundary |
| `finalized_at`, `finalized_by_user_id` | Attribution on an irreversible act |

### 3.4 `AppraisalRating` (§6.12, extended)

`review_id`, `competency_or_goal_ref`, `source` (`self/manager/peer/student/parent`), `score`, `comments`,
plus `is_anonymous`, `rater_user_id` (stored even when displayed anonymously, because an anonymous rating
still needs an audit trail), `supersedes_rating_id`, `submitted_at`. **Append-only once submitted** — no
update, no delete, at any permission level (`M17 §Business rules`, §3 "never build").

### 3.5 `ClassroomObservation` (new — DH-08 has no entity)

`cycle_id`, `observed_employee_id`, `observer_user_id`, `campus_id`, `class_section`, `subject`, `date`,
`period`, `rubric_ref` (into the cycle's matrix), `narrative` (required), `follow_up_action`,
`shared_with_teacher_at`, `review_id` (nullable — see OQ-M17-03), `supersedes_id`. Submitting produces
`AppraisalRating(source='peer')` rows plus the observation record, which carries the context a rating row
cannot.

### 3.6 `StudentOutcomeSignal` (new — "student-result/outcome linkage" has no entity and no source)

`cycle_id`, `employee_id`, `class_section`, `subject`, `term`, `metric` (`pass_rate/mean_score/
improvement_delta`), `value`, `cohort_size`, `source` (`manual/csv_import/sis`), `imported_by`,
`recorded_at`. **Aggregate only** — never a named student's mark. `cohort_size` exists so a signal from a
class of four is suppressed rather than shown (`[[M15-reporting-platform]]` minimum-cell rule).

---

## 4 · Behaviour walk-through

### 4.1 Happy path — an annual cycle

HR creates *Annual Appraisal 2026–27* for the campus, tied to the academic year, with a rating matrix
(scale points, labels, descriptors) authored on HR-35. The cycle cannot **open** until the matrix is
complete and the population resolves — the Open control is disabled with the reason, which the built design
already renders. On open, everyone in scope is notified (`[[M14-notifications]]`). Department Heads set
goals per report on DH-06; weights must total exactly 100 before publishing; each employee acknowledges on
EMP-16. Teachers self-rate on EMP-17 against the cycle's matrix and submit — **submitting is final, and a
revision supersedes rather than edits**. Managers rate on DH-07, seeing the self-ratings, and record an
advisory recommendation with a justification. The HOD's classroom observations (DH-08) and peer inputs land
as `AppraisalRating(source='peer')`. The Principal moderates on PR-05 — every moderation is a **new
superseding review with a required reason**, never an edit — and finalizes. Finalized `increment` and
`promotion` recommendations are queued to PY-06 as **proposed** salary revisions labelled *"Recommendation
— not applied"*, where payroll accepts, modifies or declines them, and any accepted revision still requires
payroll's distinct checker.

### 4.2 Stages and status

```
cycle: draft -> open -> locked -> closed
review: pending -> submitted -> moderated -> finalized     (each transition audited)
rating: submitted (terminal; a revision creates a NEW rating that supersedes)
goal:   draft -> published -> acknowledged (-> superseded)
```

### 4.3 The advisory boundary (the module's non-negotiable)

| Rule | Consequence |
|---|---|
| The appraisal surfaces contain **no "Apply increment" control** | The action lives in payroll, behind maker-checker (O14, A60, §3 "never build") |
| A recommendation is labelled *"Recommendation — not applied"* wherever it appears | Including reports, notifications and the employee's own view |
| Finalisation **queues** a proposal; it never writes `EmployeeSalary` | `handoff_state='queued'`; `[[M10-payroll-core]]` owns PY-06 |
| Payroll may accept, **modify** (with a reason) or decline | The deviation from the recommendation is recorded on both sides |
| An accepted proposal creates a **pending** effective-dated revision that still needs a distinct checker | `§8 Maker–checker`, `M17 §Acceptance` |
| A back-dated effective date inside a paid month becomes **arrears** | `[[M10c-arrears-pay-revision]]`, recomputed on that month's originally pinned config — never a payslip rewrite |
| Declining closes the recommendation and notifies HR/Principal | The appraisal record itself is untouched — it stands as what was recommended |

### 4.4 Append-only, and what "revise" means

- A submitted rating, review or observation cannot be edited or deleted by anyone, including a Group Admin
  (§3 "never build": hard delete of an appraisal rating is prohibited).
- **Revise** creates a new record with `supersedes_*` set and a **required reason**; the superseded record
  remains readable in the timeline with its original author and timestamp (O6, O18).
- Moderation is exactly this mechanism: a moderated composite is a new `stage='moderation'` review that
  supersedes the manager's, showing original score, moderated score and reason side by side (PR-05).
- Finalisation is **irreversible**. Reopening a locked or closed cycle is not specified and is not built
  (OQ-M17-06).

### 4.5 Scoping and disclosure

- A composite score is visible only inside the review chain: the employee (their own), their manager, the
  moderator, and `appraisal.manage` holders in scope (O14, O7).
- A Department Head sees their department; a Principal their campus; nobody sees another campus (O7).
- **360° sources are compartmented**: a peer rater cannot see other sources' scores or comments, and a
  manager sees peer and observation input **in aggregate**, with respondent identity hidden where anonymity
  applies (DH-07, O14).
- Disclosure of manager and 360 content to the employee follows the cycle's `disclosure_policy` (default:
  at moderation) — a teacher should not read an observation the observer has not yet contextualised.
- The employee always sees: their goals, their own ratings, the matrix they were rated on, and after
  release their composite. They never see another employee's anything.

### 4.6 Edge and error paths

| Situation | Behaviour |
|---|---|
| Rating matrix missing or incomplete | The cycle cannot open; rating screens **block with an administrator-facing error**, never a silent default 1–5 |
| Goal weights do not total 100 | Publish is disabled with the delta named (DH-06) |
| Self-appraisal not submitted when the manager stage opens | **Unspecified in the spec** (screen-inventory Q14); this document's default is *manager may proceed, with the gap shown on the review* — flagged as OQ-M17-01 |
| Window closes with a draft self-appraisal | Submission is refused, the draft is preserved, HR is notified; the manager stage proceeds with the gap recorded |
| Employee joins mid-cycle | Governed by `eligibility_rule`; absent a ruling the default is **in scope only if joined before the window opens** (OQ-M17-02) |
| Employee exits mid-cycle | The review closes as `not_applicable` with a reason rather than sitting pending forever; any queued recommendation is withdrawn |
| A manager must be appraised | Their own review routes to the Principal and **never appears in their own queue** (self-appraisal of one's own performance is fine; self-*evaluation* is not) |
| Manager changes mid-cycle | Goals stand; both managers are shown; the new manager inherits the queue |
| Two moderators act concurrently | `ETag`/`If-Match` on the review; the second gets 412 and reloads (`§7`) |
| Observation recorded outside any open cycle | `AppraisalRating` requires a `review_id`, so it currently cannot exist — but schools observe year-round (OQ-M17-03) |
| A department has fewer than `min_cell_size` finalized reviews | HR-36 suppresses the distribution and recommendation counts **with a stated reason**, and shows completion regardless (`[[M15-reporting-platform]]`) |
| Cycle closed with unfinalized reviews | They are named and may be waived **with a reason**, never silently skipped (HR-35) |

### 4.7 Concurrency and idempotency

Submissions are idempotent per (review, stage, actor, payload fingerprint) so a retry from a phone on weak
signal does not create a second submitted review (`§7`, O17, `[[M13-ess-mobile]]` K13). Finalisation is
guarded by an idempotency key because it triggers a downstream payroll proposal, and a double-fire would
queue the same increment twice.

### 4.8 PII, audit and logging

Every transition — cycle status change, goal publish, acknowledgement, rating submission, revision,
moderation, finalisation, recommendation handoff — writes an immutable `AuditLog` entry with its actor
(`M17 §Acceptance`, `§4.2`). Scores, comments and observations are **never** written to log lines
(`guard-pii-logging`, O11) and never appear in a notification body (`[[M14-notifications]]` AC-M14-13).
Appraisal comments are a `forbidden_column` in every report (`[[M15-reporting-platform]]` AC-M15-10).

### 4.9 i18n and a11y

- Matrix labels and descriptors, goal kinds, stage names, recommendation labels, refusal reasons and the
  finality confirmation are EN + हिन्दी (`M17 §Business rules`, O12, `guard-i18n-strings`). A rating scale
  a teacher cannot read in their own language is a rating scale they cannot fairly use.
- Where a tenant authors matrix descriptors, **both language fields are required** before the cycle can
  open — the same completeness rule `[[M14-notifications]]` applies to templates.
- Scores are conveyed as numbers with labels, never as colour alone; a distribution chart always has a
  table equivalent; suppression is stated in words.
- The finality of *Submit* is stated in the confirmation copy in both languages, since it is irreversible
  (`DESIGN.md` principle 10 in spirit).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| AC-M17-01 | **A configurable annual cycle with a rating matrix runs self-appraisal → manager evaluation → 360° → moderation and produces a composite score per employee.** | **`M17 §Acceptance`** |
| AC-M17-02 | Cycles are `term`, `annual` or `probation`, tied to an `AcademicYear`, with a window and a status lifecycle `draft → open → locked → closed`. | `§6.12`, `M17 §Business rules` |
| AC-M17-03 | A cycle **cannot open** until its rating matrix is complete (both languages) and its population resolves; the control is disabled with the reason stated. | HR-35, O12 |
| AC-M17-04 | **Every rating screen reads the cycle's `rating_matrix`; no scale is hardcoded anywhere.** | `§6.12`, `guard-hardcoded-values`, EMP-17 |
| AC-M17-05 | Goal weights must total exactly 100 per employee before publish; the shortfall or overage is named. | DH-06, `§6.12 Goal.weight` |
| AC-M17-06 | An employee acknowledges published goals; an unacknowledged goal at lock is recorded as unacknowledged and the manager is notified. | EMP-16, `[[M14-notifications]]` |
| AC-M17-07 | The employee **never edits a goal**; a proposed change is a comment the manager may act on. | `M17 §Permissions`, EMP-16 |
| AC-M17-08 | **A submitted rating, review or observation is append-only** — no edit and no delete exists for any role, including Group Admin. | **`M17 §Business rules`**, **O14**, §3 "never build" |
| AC-M17-09 | **Revise creates a superseding record with a required reason**; the superseded record stays readable with its original author and timestamp. | `§4.3`, **O6**, O18 |
| AC-M17-10 | Moderation is a superseding `stage='moderation'` review showing original score, moderated score and reason; it is never an edit of the manager's review. | PR-05, `M17 §Workflow` |
| AC-M17-11 | **The increment/promotion recommendation is advisory: finalisation queues a *proposed* effective-dated salary revision in `[[M10-payroll-core]]` (PY-06) and never writes a salary record itself.** | **`M17 §Acceptance`**, **O14**, A60 |
| AC-M17-12 | **No appraisal surface contains an "Apply increment" control**, and every displayed recommendation is labelled "Recommendation — not applied". | **O14**, §3 "never build" |
| AC-M17-13 | An accepted proposal still requires payroll's **distinct checker** before it becomes an effective salary revision. | **`§8 Maker–checker`**, `M17 §Acceptance` |
| AC-M17-14 | Payroll may modify a proposal with a reason or decline it; the deviation is recorded against the appraisal recommendation and the appraisal record itself is unchanged. | PY-06, O6 |
| AC-M17-15 | A recommendation with an effective date inside an already-paid month flows through **arrears** (`[[M10c-arrears-pay-revision]]`), recomputed on that month's originally pinned `StatutoryConfig` — never a payslip rewrite. | `M10 §Arrears`, `§4.4`, O9 |
| AC-M17-16 | A recommendation requires a justification for anything other than `none`. | DH-07 |
| AC-M17-17 | 360° sources in MVP are `manager`, `peer` and **classroom observation**; the enum retains `student`/`parent` but **no MVP path writes them**. | `M17 §Business rules`, **amendment A (2026-08-11)** |
| AC-M17-18 | **Student/parent 360° collection, and the public feedback form, are not built** in this release; UGC-API scoring is Later and CPD hours are Phase 2. | amendment A, `M17 §Business rules` |
| AC-M17-19 | A classroom observation records teacher, class/subject, date, period, rubric scores from the cycle's matrix and a **required narrative**, submits append-only, and is shared with the teacher per the cycle's disclosure policy. | DH-08, blueprint §10 |
| AC-M17-20 | An observer cannot observe themselves; the observed employee is excluded from the observer picker. | DH-08, §3 "never build" (no self-approval analogue) |
| AC-M17-21 | Student-result linkage is stored as an **aggregate** signal per class/subject/term with a cohort size; no named student's mark is ever stored or shown. | `M17 §Business rules`, **O11**, `§8` |
| AC-M17-22 | A composite score is visible only within the review chain and the caller's scope; a Department Head sees their department, a Principal their campus, and no one another campus. | **O7**, **O14**, `M17 §Permissions` |
| AC-M17-23 | A peer or 360 rater cannot see other sources' scores or comments; the manager sees peer and observation input in aggregate with anonymity preserved where it applies. | **O14**, DH-07 |
| AC-M17-24 | An anonymous rating still stores its rater for audit, and the identity is never exposed through any API projection or export. | `§4.2`, O14 |
| AC-M17-25 | **Department-wise performance reports reconcile to the underlying reviews**, and completion is shown for every department regardless of size. | **`M17 §Acceptance`**, HR-36 |
| AC-M17-26 | Score distributions and recommendation counts are **suppressed below the minimum cell size (default 5) with a stated reason**, and the complementary cell is suppressed where subtraction would recover it. | `[[M15-reporting-platform]]` AC-M15-12, O7 |
| AC-M17-27 | Appraisal scores and comments are absent from every report and every notification body; comments are a forbidden report column. | O11, O13-adjacent, `[[M15-reporting-platform]]`, `[[M14-notifications]]` |
| AC-M17-28 | **Every transition is in the immutable audit log** with its actor: cycle status, goal publish and acknowledgement, each submission, each supersession, moderation, finalisation and handoff. | **`M17 §Acceptance`**, `§4.2` |
| AC-M17-29 | Submission and finalisation are idempotent; a retry from a weak connection never creates a second submitted review or queues an increment twice. | `§7`, **O17**, `[[M13-ess-mobile]]` |
| AC-M17-30 | A manager's own review routes to the Principal and never appears in their own queue. | DH-07 non-happy paths, §3 "never build" |
| AC-M17-31 | An employee exiting mid-cycle closes their review as `not applicable` with a reason, and any queued recommendation is withdrawn. | DH-07, `[[M12-full-and-final]]` |
| AC-M17-32 | Closing a cycle with unfinalized reviews names them and requires an explicit waive-with-reason; nothing is silently skipped. | HR-35 |
| AC-M17-33 | Matrix labels and descriptors, stage names, recommendation labels and the finality confirmation exist in EN and हिन्दी; a cycle cannot open with a language gap. | **O12**, `guard-i18n-strings`, `M17 §Business rules` |
| AC-M17-34 | Self-appraisal, goals and manager review are usable on mobile (`[[M13-ess-mobile]]` EMP-16/17, DH-07), with submission refused rather than queued when the window has closed. | `M13 §Purpose`, `[[M13-ess-mobile]]` K13 |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Composite computation from goal weights and source weights, on a matrix fixture (never a hardcoded scale); weight-total validation; supersession chain construction and traversal; recommendation-to-proposal mapping including the effective-date and arrears branch; eligibility evaluation for a mid-cycle joiner and leaver; suppression threshold; EN/HI completeness check on a matrix |
| Integration | **bane** | **No API path updates or deletes a submitted rating** (the append-only regression test, tried as employee, manager, Principal and Group Admin); a finalized recommendation creates a *pending proposal only* and **no `EmployeeSalary` row**; the accepted proposal still requires a distinct checker; peer rater cannot read other sources; a Dept Head cannot read another department's composite; cross-tenant read returns nothing; concurrent moderation returns 412 |
| Workflow | **bane** | A full cycle on seed data: setup → goals → acknowledgement → self → manager → observation → moderation → finalisation → PY-06 → payroll checker, including a modified proposal and a declined one |
| Reporting | **bane** | HR-36 reconciles to the underlying reviews (AC-M17-25); a 4-review department suppresses distribution while still showing completion; the differencing check that a suppressed cell cannot be recovered from a sibling report |
| Compliance review | **gordon** | No score, comment or observation in any log line or notification; anonymity preserved through every projection; the advisory boundary intact end-to-end |
| a11y and Hindi | **two-face** | Matrix descriptors legible in Devanagari without truncation; distribution charts have table equivalents; finality copy unambiguous in both languages |

---

## 7 · Proposed stories

Sprint 12, sequenced after `[[M3-core-hr-people]]`, `[[M7-academic-calendar]]` and
`[[M10-payroll-core]]` (build plan §12).

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M17-S01 | `AppraisalCycle`, `Goal`, `AppraisalReview`, `AppraisalRating` models + RLS | The four spec entities with the added fields the workflow needs. | oracle | 5 | M0-S04, M7 |
| M17-S02 | `ClassroomObservation` + `StudentOutcomeSignal` models + RLS | The two education entities the spec names but does not model. | oracle | 3 | M17-S01 |
| M17-S03 | Review-chain RLS/permission content (`appraisal.manage/review/self`, 360 compartmenting) | Scoping that expresses a review chain, not just a tenant. | wonder-woman | 5 | M17-S01 |
| M17-S04 | Cycle lifecycle API (`/open`, `/lock`, `/close`) with open-gate validation | The status machine and the reasons it refuses. | cyborg | 5 | M17-S01 |
| M17-S05 | Rating-matrix authoring + EN/HI completeness gate | The single source every rating screen reads. | cyborg | 3 | M17-S04 |
| M17-S06 | Goals API: create, weight validation, publish, acknowledge, supersede | KRA/KPI with weights that must add up. | cyborg | 5 | M17-S04 |
| M17-S07 | **Append-only rating/review engine with supersession** | The invariant the whole module's credibility rests on. | cyborg | 8 | M17-S01 |
| M17-S08 | Self and manager review stages + composite computation | Two stages, one matrix, one arithmetic. | cyborg | 5 | M17-S07 |
| M17-S09 | 360 inputs: peer + classroom observation, anonymity and compartmenting | Education-shaped input that does not leak across sources. | cyborg | 5 | M17-S07, M17-S03 |
| M17-S10 | Student-outcome signal intake (manual + CSV), aggregate-only with cohort size | The MVP path for result linkage, pending the SIS decision. | cyborg | 5 | M17-S02 |
| M17-S11 | Moderation and finalisation (PR-05 API) | The superseding second look, and an irreversible close. | cyborg | 5 | M17-S08 |
| M17-S12 | **Advisory handoff to `[[M10-payroll-core]]` PY-06** | Queue a proposal; write no salary. | cyborg | 5 | M17-S11, M10 |
| M17-S13 | HR-35 cycle setup + matrix authoring (web) | Where a school decides how its appraisal runs. | green-lantern | 5 | M17-S05 |
| M17-S14 | DH-06 goal setting + DH-07 manager reviews (web) | The manager's two screens. | green-lantern | 5 | M17-S06, M17-S08 |
| M17-S15 | DH-08 classroom observation (web + tablet-friendly) | Written in a classroom, on a device that fits there. | green-lantern | 5 | M17-S09 |
| M17-S16 | EMP-16 goals + EMP-17 self-appraisal (web) | The employee's half, with finality stated. | green-lantern | 5 | M17-S06 |
| M17-S17 | PR-05 moderation (web) | Distribution, outliers, superseding moderation with reasons. | green-lantern | 5 | M17-S11 |
| M17-S18 | HR-36 progress & reports with suppression | Completion always; outcome data only above the floor. | green-lantern | 5 | M17-S11, M15-S04 |
| M17-S19 | EMP-16/17 and DH-07 on mobile | Appraisal for people who do not sit at a desk. | nightwing | 5 | M17-S08, M13-S04 |
| M17-S20 | Appraisal integration + append-only regression suite | The tests that prove advisory-only and append-only. | bane | 8 | M17-S12 |

**Total: 20 stories, 97 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M17-01 | **May the manager stage proceed when the self-appraisal was never submitted?** (screen-inventory Q14.) `M17 §Workflow` shows a sequence and says nothing about a missing stage. | The most common real-world case (a teacher on long leave during the window) has no defined behaviour, and blocking would stall an entire cycle. | Allow, with the gap shown on the review and recorded on the composite's provenance. Assumed here; **needs confirmation**. |
| OQ-M17-02 | **Mid-cycle joiners and leavers** (screen-inventory Q12). `§6.12 AppraisalCycle` has no eligibility rule. | Without one, a teacher who joined in February is either appraised on six weeks of work or silently excluded — and both will be argued about. | `eligibility_rule` on the cycle: in scope if joined before the window opens; pro-rating is out of MVP. **Ruling needed.** |
| OQ-M17-03 | **Can a classroom observation exist outside an open cycle?** (screen-inventory Q13.) `AppraisalRating` requires a `review_id`, but schools observe year-round and the observation is a developmental tool as much as an evaluative one. | Tying observation to a cycle window makes the product unusable for its most education-specific feature for most of the year. | Make `ClassroomObservation.review_id` nullable (as specified in §3.5): observations exist independently and **attach** to a review when a cycle covers their date. **Ruling needed.** |
| OQ-M17-04 | **The composite formula is unspecified.** `§6.12` says weights drive the composite; nothing says how manager, peer, observation and result-linkage scores combine into one number. | Two implementations will produce two different numbers from the same inputs, and an appraisal number that cannot be explained is indefensible in a dispute. | `source_weights` on the cycle (§3.1), authored on HR-35, shown to the employee alongside the matrix. **Blocking for M17-S08.** |
| OQ-M17-05 | **Student-result linkage has no data source.** It is MVP (`M17 §Business rules`, blueprint §10), but the exam/result system is Phase 2, SIS integration is P2 (D4, blueprint §14), and no result entity exists in `§6`. | The module's headline education differentiator currently has nowhere to get its data. | MVP path = **manual or CSV entry of aggregate signals** (§3.6), with an SIS adapter later via `[[M16-integrations]]`. **Confirm this is acceptable, or the feature is not deliverable in Sprint 12.** |
| OQ-M17-06 | **Can a locked or closed cycle be reopened?** HR-35 marks it `[proposed]` and unspecified. | Someone will need to, and an unspecified reopen will be implemented as an edit — which would break append-only. | No reopen. A correction is a new cycle or a superseding moderation with a reason. Confirm. |
| OQ-M17-07 | **Is there a goal template entity?** DH-06's "copy from a template / previous cycle" has no backing model. | Copying from the previous cycle is derivable; a template is not. | Copy-from-previous-cycle only in MVP; no template entity. |
| OQ-M17-08 | **Who appraises staff with no `reports_to`?** (screen-inventory Q6/Q31 — the field does not exist.) | Manager evaluation is unroutable for anyone whose manager is not derivable from department alone. | Add `reports_to` to `§6.3`; it now blocks M8, M13, M14 and M17. |
| OQ-M17-09 | **Are guest / per-lecture faculty in scope for appraisal?** The population filter allows it; nothing says whether a visiting lecturer paid per period gets an annual cycle. | Including them creates cycles nobody completes; excluding them silently is a fairness question. | Default: exclude honorarium pay-group staff unless explicitly included in the population filter. Confirm. |
| OQ-M17-10 | **Documentation drift on student/parent 360°.** `docs/executive-summary.md` (line 41) and `docs/competitor-analysis.md` (line 92) still list student/parent 360° as an MVP PAMS capability, contradicting the 2026-08-11 ruling that demoted it to Later. | Two customer-facing documents promise a feature the build will not contain. | Correct both to match amendment A. **Documentation correction awaiting a ruling** (I do not change scope tags unilaterally). |
| OQ-M17-11 | **The 22 July ShriConnect deck contains no PAMS slide**, and its pricing tiers (slide 18) list neither appraisal nor the helpdesk in any plan — although that meeting is the reason both are in MVP. | The artefact behind the scope change does not itself describe the scope change, so "what was promised" cannot be checked against it. | Not a build blocker; the dev spec governs. Flagged for BATMAN and the commercial owner (same finding as `[[M15a-helpdesk]]` OQ-M15a-10). |
| OQ-M17-12 | **Probation cycles and confirmation.** `type='probation'` exists, but nothing links a probation appraisal's outcome to the confirmation decision in `[[M6-onboarding]]` (HR-24). | Two records of the same decision will diverge. | The probation review's outcome surfaces on HR-24 as evidence; the confirmation action stays M6's, with its own gate. |
| OQ-M17-13 | **Is the composite released to the employee, and when?** `disclosure_policy` is proposed here; the spec says only that reports exist. | Releasing a score with no context, or never releasing it, are both real failures. | Default `at_moderation`; per-cycle configurable. Confirm. |
| OQ-M17-14 | **Does a `pip` recommendation trigger anything?** The enum includes it; no workflow consumes it. | A performance-improvement plan with no record is a conversation nobody can evidence later. | Out of MVP as a workflow; the recommendation is recorded and reported only. State it. |

**Conflicts with built design:** none. `design/v3/pages/hr-reports.jsx` implements HR-35 (matrix authored,
no hardcoded 1–5, open gated on matrix completeness) and HR-36 (completion always, distribution and
recommendation counts suppressed below 5 finalized reviews with a stated reason) exactly as specified
above. DH-06/07/08, EMP-16/17 and PR-05 are unbuilt.

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file.*
