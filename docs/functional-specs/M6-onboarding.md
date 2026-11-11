# M6 — Onboarding · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M6 Onboarding (build-plan Sprint 4) · **Epic:** NA-20 lane B · **Author:** tn-alfred ·
> **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` **M6 in full**, §6.3, §6.4, §4.3, §7, §12 ·
> `docs/functionality-blueprint.md` §8 and **PART C item 7** + PART B "Employee Lifecycle States" ·
> `docs/ui-compliance-requirements.md` O1, O2, O3, O4, O6, O7, **O8**, O11, O12, **O18** ·
> `docs/screen-inventory.md` HR-22, HR-23, HR-24, HR-25, PUB-03, HR-21 (the handover point) ·
> `docs/decisions-to-finalize.md` D1, D3.
>
> **Built design screens are the agreed UX.** `design/v3/pages/hr-lifecycle.jsx` (HR-22/23/24/25) and
> `design/v3/pages/public.jsx` (PUB-03) already exist. The backend must serve what they promise.

---

## 1 · Intent

A school hires in waves. In the four weeks before a session opens, thirty people arrive at once — a few
through the pipeline in [[M5-recruitment-ats]], most through a spreadsheet the trust office has kept since
March — and each of them needs a contract, an ID, a set of certificates on file, a leave balance, a login
and a desk, before the first bell. M6 is the module that gets a name on a list to a teacher who can be
paid, without anyone holding the whole checklist in their head.

Two things make school onboarding structurally different from the corporate kind. The first is **volume in
a burst**: a bulk import that silently creates three hundred duplicate teachers because someone uploaded the
file twice is not an inconvenience, it is a payroll incident. The second is **the contract that ends by
design** — guest faculty, visiting lecturers and academic-year appointments expire at a date the school
chose, and at session end somebody must decide, person by person, whether they are coming back. A contract
that quietly expires while the person keeps teaching is the compliance exposure that HR-25 is built to lead
with. M6 also owns the moment nobody thinks about until it goes wrong: the joiner who is not yet a `User`,
holding a link, sending in their police verification the week before they walk into a classroom of children
(**O8**).

---

## 2 · Scope & surfaces

### In scope

| Area | What M6 delivers |
|---|---|
| Onboarding checklist | `OnboardingTask` + `OnboardingChecklistTemplate` per staff category; tasks generated relative to DOJ; owner per task (HR, IT, department, employee); dependencies and blocking; "joiner ready" gate |
| Pre-boarding | Issuing the document requests and the **PUB-03** bearer grant, both owned by [[M4-document-governance]]; M6 orchestrates *when* and *what* |
| Bulk / seasonal onboarding | `POST …/employees:bulk` — template, column mapping, per-row validation preview, idempotent commit, error report, resumable partial commit |
| Fixed-term contracts | Academic-year contracts with `contract_end_date`, the scheduled **auto-expiry**, and the renewal queue it surfaces in |
| Renewal / non-renewal | Session-end recommendation → decision → contract supersession or exit initiation; the **mass** decision path |
| Probation & confirmation | The confirmation queue reading `EmploymentContract.confirmation_date`; confirm or extend by supersession |
| Lifecycle states | Pre-boarding → Onboarding → Probation → Confirmed → Active, and the fixed-term branch (blueprint PART B) |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| `Employee`, `EmploymentContract`, `ServiceRecord` semantics and their creation path | **[[M3-core-hr-people]]** — M6 drives them, M3 defines them |
| The document request, its state machine, verification, and the bearer grant primitive | **[[M4-document-governance]]** |
| Offer acceptance and the conversion transaction | **[[M5-recruitment-ats]]** — conversion *ends* by raising M6's tasks |
| Leave-balance initialisation | **[[M8-leave]]** (Sprint 5) — M6 requests it; see OQ-M6-06 |
| Academic-year and term definitions that renewal dates align to | **[[M7-academic-calendar]]** |
| F&F computation on non-renewal | **[[M12-full-and-final]]** — non-renewal *routes* there |
| Salary assignment for the new joiner | **[[M10-payroll-core]]** — its absence appears here as a blocking checklist task |
| User invite, credentials, first login | **[[M2-identity-access]]** |
| Notifications, reminders, nudges, expiry lead times | **[[M14-notifications]]** |
| Exit clearance checklist and exit interview | **Phase 2** (blueprint §8); only **exit initiation** is MVP (inventory C3) |
| Asset management / allocation | **Phase 2** (blueprint §1) — an asset task may exist on a checklist as a *task*, with no asset register behind it |
| Inter-branch transfer with service continuity | **Phase 2** (blueprint §8, D-log) |

### API surfaces

- **GraphQL (primary):** `onboardingTasks`, `onboardingChecklistTemplates`, `renewalQueue`,
  `confirmationQueue`, and action mutations `onboardingTaskComplete`, `onboardingTaskAssign`,
  `checklistTemplateApply`, `joinerMarkReady`, `contractRenew`, `contractDoNotRenew`, `contractExtend`,
  `probationConfirm`, `probationExtend`.
- **REST edge:** `POST /api/v1/employees:bulk` (multipart upload → job), `GET …/bulk-imports/{id}` (status),
  `GET …/bulk-imports/{id}/errors` (CSV), `GET …/bulk-imports/template` — file work over REST per §7.
  Public: `GET/POST /api/v1/preboarding/{grant}` served by [[M4-document-governance]].
- **Scheduled:** a daily contract-expiry job (Celery beat, tenant-scoped per M0-AC-10) that transitions
  expired contracts and populates the renewal queue.

### Client surfaces

Web (green-lantern): **HR-22** checklists, **HR-23** bulk onboarding, **HR-24** probation/confirmation,
**HR-25** renewal queue (HR's recommend + execute half). The **decision** half of HR-25 belongs to the
Principal and lives on a Principal-route surface — the built HR file deliberately renders no renew/non-renew
control at all, because a capability a role never holds is *absent*, not disabled.
Public/token: **PUB-03**. Mobile: none in MVP.

---

## 3 · Data model

Every table below is tenant-owned: NOT-NULL `tenant_id` + RLS `ENABLE`+`FORCE`+policy in the **same
migration** as the model (`guard-rls-policy`, [[M0-foundations]] AC-03).

### 3.1 `OnboardingChecklistTemplate` + `OnboardingTaskTemplate` (**new, proposed**)

`M6 §API` names `…/onboarding-tasks` but **§6 has no onboarding entity at all** — the module's central
object is absent from the entity catalog (OQ-M6-01). Proposed:

| Entity | Fields |
|---|---|
| `OnboardingChecklistTemplate` | `name`, `staff_category_id` (nullable = applies to all), `campus_id` (nullable = tenant-wide), `is_active` |
| `OnboardingTaskTemplate` | `template_id`, `title_key` (i18n), `owner_role`, `offset_days_from_doj` (may be negative — pre-boarding), `is_mandatory`, `depends_on_task_template_id`, `task_kind` `(document/asset/induction/system/payroll/other)` |

### 3.2 `OnboardingTask` (**new, proposed**)

`employee_id` → [[M3-core-hr-people]], `template_task_id` (nullable for ad-hoc), `title`, `owner_user_id` /
`owner_role`, `due_date`, `status` `(not_started/in_progress/blocked/complete/cancelled)`, `blocked_by_task_id`,
`is_mandatory`, `completed_by_user_id`, `completed_at`, `evidence_ref` (nullable), `note`,
`linked_entity_type` / `linked_entity_id` (e.g. a `DocumentUpdateRequest`, so the checklist reflects M4's
real state instead of keeping its own copy of it).

### 3.3 `BulkImportJob` + `BulkImportRow` (**new, proposed**)

HR-23's states — *validating*, *errors present (blocking vs warning distinguished)*, *ready to commit*,
*committing*, *committed with a summary*, *partially committed (must be resumable)* — cannot be represented
without a job record.

| Entity | Fields |
|---|---|
| `BulkImportJob` | `kind` `(employees)`, `file_ref`, `column_mapping` (JSON), `mode` `(create_only/create_or_update)` default **create_only**, `status` `(uploaded/mapping/validating/validated/committing/committed/partially_committed/failed)`, `idempotency_key`, `created_by_user_id`, `counts` (JSON), `send_invites` default **false** for bulk |
| `BulkImportRow` | `job_id`, `row_number`, `raw` (JSON), `verdict` `(valid/warning/blocking_error)`, `messages` (JSON), `created_employee_id` (nullable), `committed_at` |

### 3.4 Fields read but not owned

From `EmploymentContract` ([[M3-core-hr-people]], §6.3): `employment_type`, `is_vacation_staff`, `doj`,
`confirmation_date`, `contract_end_date`, `notice_period`, `status`. M6 supersedes contracts (§4.3, **O18**)
— it never edits one in place. Renewal, non-renewal, confirmation and probation extension each write a new
dated contract row and a `ServiceRecord`.

**Proposed addition to `EmploymentContract.status`:** a terminal `did_not_report` value, for the joiner who
accepted and never arrived (OQ-M6-05).

---

## 4 · Behaviour walk-through

### 4.1 Happy path — one joiner

1. Conversion completes in [[M5-recruitment-ats]] (or HR adds a joiner directly in [[M3-core-hr-people]]).
   The checklist template for the staff category is applied: tasks are generated with due dates relative to
   the DOJ, including negative offsets — the pre-boarding ones.
2. The pre-boarding task issues `DocumentUpdateRequest`s and a `DocumentAccessGrant`
   ([[M4-document-governance]]); the joiner receives a link.
3. **PUB-03.** The joiner uploads PAN, Aadhaar, degree and police verification against the named requests.
   Each lands as a **response**, never a live document, and the surface shows no staff record at all,
   because the token is bearer and can be forwarded to a stranger.
4. HR verifies each in [[M4-document-governance]] (HR-09/HR-10). The linked checklist task closes off M4's
   real state rather than a duplicate flag.
5. **HR-22.** IT closes the account task, the department closes induction, payroll setup appears as a
   blocking task until [[M10-payroll-core]] has a salary assigned.
6. When every mandatory task is complete, HR marks the joiner **ready** — and only then is payroll inclusion
   valid.

### 4.2 Happy path — a season

1. **HR-23.** HR downloads the template (which includes `is_vacation_staff` and `contract_end_date` as
   columns, because they are the two fields that change everything downstream), fills it for 34 guest
   faculty, uploads, maps columns, and validates.
2. Validation returns a per-row verdict: required fields, category exists, pay group exists, duplicate
   detection against existing staff, **blocking errors distinguished from warnings**.
3. Commit is confirmed with a dialog stating how many will be created, how many skipped, **and that this
   cannot be undone in bulk**, carrying an idempotency key.
4. Each valid row creates `Employee` + `EmploymentContract` + `ServiceRecord(joined)`; invites default
   **off** for bulk; leave-balance initialisation is requested ([[M8-leave]]).
5. Failures are downloadable as a CSV with reasons, fixable, and re-uploadable — and the same file uploaded
   twice is a **no-op**, not 300 duplicate teachers.

### 4.3 Happy path — session end

1. The nightly job transitions contracts reaching `contract_end_date`, writes a `ServiceRecord`, and
   surfaces each in the renewal queue.
2. **HR-25** leads with the worst case first: contracts that **already expired while the person is still
   working**. A Dept Head recommends renew or non-renew with a reason.
3. The **Principal decides**. Renew supersedes the contract with a new `contract_end_date` defaulting to
   +1 academic year ([[M7-academic-calendar]]) and warns if the date is not aligned to the AY. Non-renew
   sets the last working day (default: the contract end date), moves the employee to notice, makes F&F
   computable ([[M12-full-and-final]]), and schedules access revocation.
4. HR executes in bulk over decided rows only, with a confirmation listing **every name** and the decision.

### 4.4 States

- **Task:** not started → in progress → complete; blocked (dependency named); overdue; cancelled. Reopen is
  possible with a reason and is audited.
- **Joiner:** pre-boarding → onboarding → ready → active; probation → confirmed (or extended); fixed-term →
  expiring → renewed | not renewed → notice; and the proposed `did_not_report`.
- **Import job:** upload → mapping → validating → validated → committing → committed | partially committed.

### 4.5 Edge cases and error paths

| Case | Behaviour |
|---|---|
| The same import file uploaded twice | Idempotency key + duplicate detection make the second run a no-op; the summary says so explicitly |
| Import partially fails | Committed rows stand; failures download with reasons; the job is resumable. **No silent partial import** |
| A row's staff category or pay group does not exist | Blocking error naming the missing master data and where to create it — never a half-created employee |
| A task's dependency is incomplete | The complete control is disabled **naming the blocker**, not merely greyed |
| A joiner has no `User` yet | Employee-owned tasks are held; document collection runs on the PUB-03 grant instead |
| Pre-boarding link forwarded to the wrong person | The surface is data-free by design ([[M4-document-governance]] AC-14); the grant is revocable |
| Offer withdrawn after pre-boarding uploads | Grant revoked; uploaded files retained under the retention policy (**O2**) |
| **Contract auto-expired but the person keeps working** | HR-25 leads with it. **What payroll and attendance do in that window is unspecified** — OQ-M6-04, and it is a live compliance exposure, not a cosmetic gap |
| Renewal end date not aligned to the academic year | Warned, not blocked — a mid-year contract is legitimate |
| Confirmation due but no manager recommendation | Bulk confirm excludes those rows **and names them**; a single confirm may proceed where policy allows |
| Joiner accepted and never reported | No path exists — OQ-M6-05 |
| Police verification not cleared by the joining date | **A child-safety decision, not an administrative one.** The clearance state must be visible on HR-22 as a mandatory task, and "mark joiner ready" must reflect it (**O8**) — see OQ-M6-03 |

### 4.6 Concurrency and idempotency

The bulk commit **requires** an idempotency key and is the single most dangerous non-payroll write in the
product. Row commits are individually transactional so a mid-file failure leaves valid rows created and the
job resumable. `ETag`/`If-Match` on tasks and contracts; the expiry job is safe to re-run (transitioning an
already-expired contract is a no-op) because a beat scheduler will, eventually, run it twice.

### 4.7 PII, i18n and a11y

The import file is the largest PII payload in the product: it may carry PAN, Aadhaar, bank details and DOB
for hundreds of people. It is stored encrypted, never logged (`guard-pii-logging`, **O11**), row errors
reference **row numbers and field names, never values**, and salary columns are refused unless the operator
holds the salary-PII permission (**O3**). Task titles, states, verdict words and reason codes are i18n-keyed
Hindi + English (**O12**); imported names and free-text notes are shown as captured. Task and contract state
is mark + word, never colour alone. PUB-03 is a public surface and must render in both languages.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M6-AC-01 | Applying a checklist template to a joiner generates tasks with owners and due dates computed relative to DOJ, including negative offsets for pre-boarding tasks. | `M6 §Business rules` ("checklist tasks"), HR-22 |
| M6-AC-02 | A task whose dependency is incomplete cannot be completed; the refusal names the blocking task. | HR-22 Actions |
| M6-AC-03 | A document task reflects the linked `DocumentUpdateRequest`'s real state and does not maintain a second copy of it; closing the document loop in [[M4-document-governance]] closes the task. | `M6 §Workflow` ("document capture (M4)"), **O4** |
| M6-AC-04 | "Mark the joiner ready" is refused while any mandatory task is open, listing the open tasks; payroll inclusion becomes valid only after it. | HR-22, `M6 §Purpose` ("active, paid employee") |
| M6-AC-05 | The bulk import template includes `is_vacation_staff` and `contract_end_date`; a file missing a required column is refused at mapping with the column named. | `M6 §Business rules`, HR-23, blueprint PART B |
| M6-AC-06 | Validation returns a per-row verdict distinguishing **blocking errors from warnings**, flags duplicates against existing staff, and validates that the referenced staff category and pay group exist. | HR-23 states |
| M6-AC-07 | Commit requires an idempotency key; re-uploading the same file or replaying the key creates **nothing twice** and reports a no-op. | §7 Concurrency, **O17**, HR-23 non-happy path |
| M6-AC-08 | A partial commit leaves valid rows created, produces a downloadable error CSV with reasons, and is resumable; there is **no silent partial import**. | HR-23 states |
| M6-AC-09 | Each committed row creates `Employee` + `EmploymentContract` + `ServiceRecord(joined)`; invites default **off** for bulk and the resulting login-less employees are a visible state. | `M6 §API`, `M3 §Workflow` ([[M3-core-hr-people]]) |
| M6-AC-10 | A fixed-term contract **auto-expires at `contract_end_date`** and surfaces in the renewal queue; the scheduled job is tenant-scoped and idempotent on re-run. | `M6 §Acceptance` (verbatim), M0-AC-10 ([[M0-foundations]]) |
| M6-AC-11 | Renewal supersedes the contract with a new dated row and writes a `ServiceRecord`; nothing is edited in place. The default new end date is +1 academic year from [[M7-academic-calendar]], and a non-AY-aligned date warns rather than blocks. | §4.3, **O18**, HR-25 |
| M6-AC-12 | Non-renewal sets a last working day, moves the employee to notice, makes F&F computable in [[M12-full-and-final]], and schedules access revocation; the reason is required. | `M6 §Business rules`, HR-25, `M12 §Acceptance` |
| M6-AC-13 | The renew/non-renew **decision** is authorised to the Principal-scoped permission; a user without it has **no** decision control rendered and receives 403 on the mutation. | HR-25 Scope, **O7**, `M2 §Seed roles` |
| M6-AC-14 | Bulk execution acts only on decided rows, excludes and **names** undecided ones, and confirms with every affected name listed. | HR-25 Actions |
| M6-AC-15 | Confirmation supersedes a probation contract to permanent and writes `ServiceRecord(confirmed)`; extension requires a new date and a reason. Bulk confirm excludes rows lacking a recommendation and names them. | `§6.3 confirmation_date`, `M3 §Business rules`, HR-24 |
| M6-AC-16 | The pre-boarding surface (PUB-03) is reached only by a revocable, expiring bearer grant issued by [[M4-document-governance]]; it renders the requested document list and nothing about the staff record. | `M4 §Business rules` #3, PUB-03 "must NOT contain", §8 |
| M6-AC-17 | A pre-boarding upload lands as a `DocumentUpdateRequest` **response**, never as a live `StaffDocument`, and never as `verified`. | `M4 §Business rules` #3–#4, **O4** |
| M6-AC-18 | A partial upload failure on PUB-03 preserves the other items' state — no all-or-nothing loss. | PUB-03 Actions |
| M6-AC-19 | Police/background verification appears as a **mandatory** onboarding task where the role involves student contact, and its state is visible on the joiner's checklist. | §8 Child-safety, **O8**, blueprint §11 |
| M6-AC-20 | The import file and its rows are stored encrypted; no imported PII value appears in any log or error message — errors reference row number and field name only. | `guard-pii-logging`, **O11**, **O3** |
| M6-AC-21 | Salary columns in a bulk import are refused unless the operator holds the salary-PII permission. | **O3**, HR-23 "must NOT contain" |
| M6-AC-22 | `onboarding_task`, `onboarding_checklist_template`, `bulk_import_job` and `bulk_import_row` each carry NOT-NULL `tenant_id` with an RLS policy in the same migration; a cross-tenant read returns zero rows by ORM and by raw SQL. | §3, `guard-rls-policy`, M0-AC-03/05 |
| M6-AC-23 | Campus scoping applies to the checklist, renewal and confirmation queues **and to their counts and exports**. | `M6 §Permissions` (`people.manage`), **O7** |
| M6-AC-24 | Every task completion, reassignment, renewal, non-renewal, confirmation, extension and bulk commit writes an `AuditLog` row with actor, reason where required, and before/after. | §4.2, **O6** |
| M6-AC-25 | Task titles, states, verdicts and reason codes are Hindi + English via i18n keys; PUB-03 renders in both languages. | `guard-i18n-strings`, **O12** |
| M6-AC-26 | Task and contract state are conveyed as mark + word, never colour alone. | `DESIGN.md` principle 8 |
| M6-AC-27 | Exit **clearance checklists and exit interviews are absent from MVP**; only exit *initiation* on non-renewal exists. | blueprint §8 (P2), inventory C3 |
| M6-AC-28 | No asset register is created; an asset task is a checklist task with evidence, nothing more. | blueprint §1 (asset management P2) |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Due-date arithmetic from DOJ incl. negative offsets and non-working days ([[M7-academic-calendar]]). The task dependency graph: blocked/unblocked resolution, cycle refusal. Contract auto-expiry date logic across time zones and an AY boundary. Import row validation rules, verdict classification (blocking vs warning), duplicate detection keys. Renewal default-date computation against a seeded academic year — asserted against the AY fixture, never a literal |
| Integration / bulk | **bane** | **The import suite**: the same file twice is a no-op; a mid-file failure leaves valid rows committed and the job resumable; the error CSV round-trips (fix → re-upload → commit); salary columns refused without the permission; no PII in any log line produced during a 300-row import |
| Integration / lifecycle | **bane** | The expiry job run twice is idempotent; an expired contract appears in the renewal queue; renew supersedes without editing in place; non-renew makes F&F computable and schedules revocation; the decision mutation is 403 for a user lacking the Principal-scoped permission |
| Integration / pre-boarding | **bane** | The PUB-03 grant reaches only its own requests, expires, revokes; an upload lands as a response and the live document is unchanged; a partial upload failure preserves siblings |
| Integration / RLS | **bane** | Cross-tenant isolation on all four new tables; cross-campus refusal on queues, counts and exports |
| A11y / UI | **two-face** | HR-22…HR-25 and PUB-03 at WCAG AA; state legible without colour; Hindi/English parity incl. the public surface |
| Compliance review | **gordon** | Every diff: import PII handling, child-safety task enforcement, retention of pre-boarding uploads after a withdrawn offer, audit completeness on bulk operations |

---

## 7 · Proposed stories

Sprint 4 (build plan §12, "Onboarding + Calendar (M6–M7)"). **[[M7-academic-calendar]] must land first
within the sprint** — renewal dates and DOJ-relative due dates read it.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M6-S01 | `OnboardingChecklistTemplate`, `OnboardingTaskTemplate`, `OnboardingTask` models + RLS | The module's central object, absent from §6 today. | oracle | 5 | M0-S04, [[M3-core-hr-people]] |
| M6-S02 | Checklist template application + task lifecycle API | Generate from DOJ, complete, assign, block, reopen, "mark ready". | cyborg | 5 | M6-S01 |
| M6-S03 | `BulkImportJob`/`BulkImportRow` + the bulk employee import pipeline | Upload, map, validate, commit idempotently, error CSV, resumable partial commit. | cyborg | 8 | M6-S01, [[M3-core-hr-people]] |
| M6-S04 | Contract auto-expiry job + renewal queue query | The tenant-scoped nightly transition and the queue that leads with already-expired contracts. | cyborg | 5 | M6-S01, [[M7-academic-calendar]] |
| M6-S05 | Renewal / non-renewal decisions + supersession + exit routing | Recommend, decide, execute in bulk; F&F becomes computable. | cyborg | 5 | M6-S04, [[M12-full-and-final]] |
| M6-S06 | Probation & confirmation queue + confirm/extend by supersession | Reading `confirmation_date`, writing `ServiceRecord(confirmed)`. | cyborg | 5 | M6-S01 |
| M6-S07 | Pre-boarding orchestration: raise requests + issue the grant | M6 decides when and what; [[M4-document-governance]] owns the mechanism. | cyborg | 3 | M4-S07, M6-S02 |
| M6-S08 | PUB-03 pre-boarding upload surface (web, Hindi + English) | Six token states; per-item upload; no staff record anywhere on it. | green-lantern | 3 | M6-S07 |
| M6-S09 | HR-22 onboarding checklists (web) | Joining-week view, owners, blockers named, "mark ready" gate. | green-lantern | 5 | M6-S02 |
| M6-S10 | HR-23 bulk / seasonal onboarding (web) | Upload → mapping → validation preview → commit ritual → error report. | green-lantern | 8 | M6-S03 |
| M6-S11 | HR-24 probation & confirmation queue (web) | Due, overdue, recommendation, confirm/extend. | green-lantern | 3 | M6-S06 |
| M6-S12 | HR-25 renewal queue (HR half) + the Principal decision surface | The decision control exists **only** on the Principal route; HR recommends and executes. | green-lantern | 5 | M6-S05 |
| M6-S13 | Unit suite: due-date arithmetic, dependency graph, expiry dates, import validation | Asserted against AY and category fixtures. | deathstroke | 5 | M6-S05 |
| M6-S14 | E2E: bulk import idempotency + expiry → renewal → F&F handoff | The two failure modes that cost real money. | bane | 5 | M6-S05, M6-S10 |

**Total: 14 stories, 70 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M6-01 | **M6 has no entities in §6.** `M6 §API` names `…/onboarding-tasks` and `M6 §Business rules` names checklists, but the entity catalog contains no onboarding object at all, and the inventory records the checklist **template** as `[proposed]`. | The module's whole surface (HR-22, HR-23) is undesignable and unbuildable against an absent data model. | Add `OnboardingChecklistTemplate`, `OnboardingTaskTemplate`, `OnboardingTask`, `BulkImportJob`, `BulkImportRow` per §3. **Blocking for Sprint 4.** |
| OQ-M6-02 | **Are checklist templates per staff category, per campus, or per tenant?** A group with a hostel and a transport department onboards a warden differently from a PGT. Mirrors inventory Q21 on category scoping. | Getting this wrong means either one template that fits nobody, or template sprawl per campus. | Category-scoped by default, campus-overridable, tenant-seeded. Needs confirming. |
| OQ-M6-03 | **Can a joiner be marked ready with police/background verification outstanding?** §8 mandates the tracking and O8 restricts the data, but **no rule names a consequence** (inventory: "the spec mandates the tracking but names no consequence"). | This is the child-safety question the product exists to answer honestly. A school needs either a hard gate or an explicit, recorded exception — silence is the one unacceptable answer. | Verification is a **mandatory** task for student-contact roles; "mark ready" is refused without it, with a recorded, reasoned override available to the Principal. **Needs a product/legal ruling.** |
| OQ-M6-04 | **What do payroll and attendance do when a fixed-term contract has auto-expired but the person keeps working?** (inventory Q5) | HR-25 leads with exactly these rows. Without a rule, the person is either paid without a contract or unpaid while working — both are live exposures. | Attendance continues to record; payroll **blocks the employee from the run with a named reason** and routes to HR-25; a backdated renewal computes arrears ([[M10c-arrears-pay-revision]]). **Blocking for Sprint 7.** |
| OQ-M6-05 | **"The joiner did not report."** (inventory Q16) An accepted offer creates an `Employee`; nothing handles non-arrival. | The only current path is an immediate exit, writing a false `ServiceRecord(exited)` and potentially an F&F for someone who never worked. | A terminal `did_not_report` contract state that closes the onboarding without an exit and leaves no service history. Mirrors OQ-M5-07. |
| OQ-M6-06 | **Sequencing: onboarding (Sprint 4) initialises leave balances owned by [[M8-leave]] (Sprint 5).** Both `M3 §Workflow` and HR-23 name balance initialisation as part of joining. | An AC that cannot be verified in its own sprint either slips the sprint or gets quietly marked done. | M6 raises a task/event; [[M8-leave]] fulfils it in Sprint 5; the balance clause of M6-AC-09 is verified then. Record the deferral explicitly. |
| OQ-M6-07 | **Is there a bulk-import size threshold above which a second pair of eyes is required?** HR-23 marks it `[proposed]`; the spec's maker-checker list does not include imports. | Creating 300 employees is a larger material act than most things the spec *does* gate — but it is not a money movement, and over-gating a seasonal intake would push HR back to spreadsheets. | A confirmation ritual naming counts (already specified) for MVP; a threshold-based second approval as a configurable option. Needs a product ruling. |
| OQ-M6-08 | **Does a mid-year joiner get a pro-rated leave balance, and does a mid-year leaver's balance close out?** Related to inventory Q11/Q12 but for joining specifically. | Bulk seasonal onboarding lands people in mid-cycle by definition. | Pro-rate on DOJ against the AY; own the rule in [[M8-leave]], but M6 must send the DOJ that drives it. Needs [[M8-leave]]'s ruling. |
| OQ-M6-09 | **Who owns the "asset" task with no asset register?** Blueprint puts asset management in Phase 2, yet `M6 §Business rules` lists assets among checklist tasks. | Someone will otherwise build a small asset register inside onboarding, and a second one arrives in Phase 2. | Asset stays a **task with evidence**, no register, no entity. Stated as M6-AC-28 so it is not re-litigated. |
| **C-M6-01** | **Blueprint §8 tags exit/offboarding (clearance checklist, exit interview) as P2** while [[M12-full-and-final]] is MVP by locked D3 and non-renewal must initiate an exit. | Non-renewal cannot route to F&F if no exit initiation exists. | Exit **initiation** (last working day, reason, notice) is MVP as an action; the clearance checklist and exit interview stay P2 — the inventory already applied this as C3. Recorded here for M6's own scope boundary. |
| **C-M6-02** | **HR-25 is described as a screen both HR and the Principal use**, but the built HR file renders no decision control at all because the Principal cannot reach that route. | Read carelessly, this looks like a missing feature rather than a correct absent-vs-disabled decision. | Keep the split: HR recommends and executes, the Principal decides on a Principal-route surface. M6-AC-13 makes it a server-side authorisation fact, not a rendering choice. **Resolved here** — recorded so nobody re-opens it. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
