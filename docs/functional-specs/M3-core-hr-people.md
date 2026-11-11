# M3 — Core HR (People) · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M3 Core HR — People (build-plan Sprint 2) · **Epic:** NA-16 · **Author:** tn-alfred
> **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M3, §4.1, §4.2, §4.3, §6.3, §8 ·
> `docs/functionality-blueprint.md` PART A §1, **PART B §2 (lifecycle states, vacation-staff attribute)**,
> **PART C item 1** · `docs/ui-compliance-requirements.md` O3, O6, O7, O8, O11, O12, O18, §2.2 A8–A13 ·
> design screens **HR-02** (staff register, `design/v3/pages/hr.jsx`), **HR-03…HR-07**
> (`design/v3/pages/hr-record.jsx`), **HR-08** (`design/v3/pages/hr-reports.jsx`) ·
> `docs/screen-inventory.md` §6.
>
> **`is_vacation_staff` is critical-path risk #2 in the build plan (§12).** It decides whether a person
> accrues earned leave at all, and it ripples into [[M8-leave]] and [[M10-payroll-core]]. §4.3 of this
> document is the load-bearing section.

---

## 1 · Intent

This is the school's staff register — the answer to *who works here*, kept well enough that everything
downstream can trust it. It holds a person: her name and the identifiers the government requires, the
category of staff she belongs to (a PGT is not an ayah is not a guest lecturer), the terms she is employed
on, and the career she has had here since the day she joined. Two of those are quietly load-bearing.
The **contract** is the centre of gravity: it carries whether she is *vacation staff* — a teacher who
receives the school's long breaks instead of accruing earned leave — and that single answer changes both
her leave and her pay, which is exactly why the product exists and exactly why no competitor models it.
The **service book** is the immutable career timeline a settlement is computed from years later; a break
in it, or a second record opened for a returning teacher, quietly costs her gratuity. M3's job is to make
both of those hard to get wrong and impossible to get wrong silently.

---

## 2 · Scope & surfaces

### In scope (blueprint PART C item 1)

- `Employee` — the staff master, including the statutory identifiers, with **field-level PII masking and
  an audited reveal** (O3).
- `StaffCategory` — the **education staff taxonomy** (PRT/TGT/PGT, NTT, Class-IV, transport, hostel, guest
  per-lecture), `kind`, minimum-qualification norms that [[M5-recruitment-ats]] screens against.
- `EmploymentContract` — effective-dated, carrying **`is_vacation_staff`**, `employment_type`,
  `contract_end_date`, notice period and pay group; the supersession ceremony and its consequences.
- `ServiceRecord` — the append-only career timeline, corrections by later entry, and the
  **continuous-service** computation [[M12-full-and-final]] reads for gratuity.
- Employee lifecycle **states** per blueprint PART B §2.
- Employee creation (single), the duplicate/rehire check, exit initiation, and the `User` invite handoff
  to [[M2-identity-access]].
- The reads behind HR-02 (register), HR-03 (record shell), HR-04 (personal & statutory IDs), HR-05
  (contract & category), HR-06 (service book) and HR-08 (taxonomy).

### Explicitly out of scope

| Out | Owned by |
|---|---|
| Documents, `StaffDocument`, `DocumentUpdateRequest`, HR-07's actions, the expiry watch | **[[M4-document-governance]]** — M3 owns the person, M4 owns what is held about her |
| Candidate → employee conversion | **[[M5-recruitment-ats]]** — it *calls* M3's creation service |
| Bulk / seasonal onboarding (HR-23), checklists, probation & renewal **queues** (HR-24/HR-25) | **[[M6-onboarding]]** — M3 owns the contract states those queues read |
| Leave balances, accrual, the EL rule itself | **[[M8-leave]]** — M3 emits the vacation-status event, M8 acts on it |
| Attendance | **[[M9-attendance]]** |
| Salary **amounts**, pay-group definition, revisions | **[[M10-payroll-core]]** — the pay *group* is a contract term (M3), the *amount* is payroll's |
| F&F, gratuity computation | **[[M12-full-and-final]]** — M3 supplies the continuous-service basis |
| Appraisal | **[[M17-performance-appraisal]]** |
| Roles, permissions, PII **grants** | **[[M2-identity-access]]** — M3 consumes `people.pii.read`, never defines it |
| DPDP consent capture and "Your data" | **[[M15-reporting-platform]]** (GA-12) — M3 must not make it impossible (O1) |

### API surfaces

- **GraphQL — primary.** Queries: `employees` (cursor-paginated, scope-filtered, **no PII columns by
  default**), `employee(id)`, `employeeContracts`, `employeeServiceBook`, `continuousService`,
  `staffCategories`, `vacationFlipImpact(...)`. Mutations: `employeeCreate`, `employeeReviseDetails`,
  `employeeRevisePii`, `employeeInitiateExit`, `contractCreateVersion`, `contractConfirmProbation`,
  `contractRenew`, `contractTransfer`, `serviceRecordAppend`, `staffCategoryCreate`,
  `staffCategoryRevise`, `staffCategoryDeactivate`.
- **PII reveal is its own single-field, single-record operation** (`employeePiiReveal`), never a field on
  a list type — see §4.5.
- **REST edge:** the register export (a file) and the service-book PDF (HR-06's inspection artefact).
- **Client surfaces:** web (HR-02…HR-08, DH-05 at department scope, PR's read-only campus register);
  mobile ([[M13-ess-mobile]]) reads `me` profile only — EMP-18 carries **no write controls**.

---

## 3 · Data model

Every table is tenant-owned: **`tenant_id` (FK, NOT NULL) and its `ENABLE`+`FORCE ROW LEVEL SECURITY`
policy ship in the SAME migration as the model** ([[M0-foundations]] AC-03, `guard-rls-policy`).

### 3.1 `Employee` (§6.3)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `campus_id`, `department_id` | FK → [[M1-organization-tenancy]] | scope anchors for every RBAC check |
| `emp_code` | text, unique per tenant | |
| `first_name`, `last_name`, `display_name` | text | |
| `dob` | date | **sensitive** |
| `gender` | enum | |
| `personal_phone`, `personal_email`, `address` | text | **sensitive** |
| `pan` | encrypted text + `pan_last4` | **sensitive**; format-validated |
| `aadhaar_last4` | text (4 chars) | **stored masked — the full value is never persisted.** See §4.5 and OQ-M3-03 |
| `uan`, `esic_no` | encrypted text | **sensitive** |
| `bank_account`, `bank_ifsc`, `bank_name_as_per_bank` | encrypted text + `account_last4` | **sensitive**; a change is an [[M10-payroll-core]] fraud-vector event (O3, A9) |
| `photo_ref` | object-store key | |
| `status` | enum — blueprint PART B §2: `pre_boarding` \| `onboarding` \| `probation` \| `confirmed` \| `active` \| `on_long_leave` \| `transferred` \| `notice` \| `exited` \| `ff_closed` | |
| `reports_to_employee_id` | self-FK, nullable | **`[proposed]` — see OQ-M3-02**; carried on the contract so it is effective-dated |
| `dedupe_fingerprint` | text | derived; powers the rehire check (§4.7) |

`Meta.sensitive_fields` declares every field marked **sensitive** above. That declaration is what the
audit redactor and the log filter read ([[M0-foundations]] §4.5) — it is the single source of truth for
"what may never be logged or re-exposed", not a list re-typed in three places.

### 3.2 `StaffCategory` (§6.3)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `name` | text, unique per tenant | PGT, TGT, PRT, NTT, Class-IV, transport, hostel, guest faculty |
| `kind` | enum `teaching` \| `non_teaching` \| `support` \| `guest` | **no default** (HR-08) |
| `min_qualification` | JSONB | the ATS eligibility basis — TET/CTET/NET/B.Ed (M5 §Business rules) |
| `default_is_vacation_staff` | bool, nullable | **a default proposed to a new contract, never authoritative.** See §4.3 and OQ-M3-01 |
| `default_probation_months` | int, nullable | HR-08 renders it; blank = a fixed-term category with no probation |
| `is_active` | bool | deactivate, never delete; historical records keep the reference |

### 3.3 `EmploymentContract` (§6.3 — "center of gravity")

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `employee_id`, `staff_category_id` | FK | |
| `employment_type` | enum `permanent` \| `probation` \| `contract` \| `visiting` | |
| **`is_vacation_staff`** | bool, **NOT NULL, no database default** | a nullable-or-defaulted column here is how this rule gets silently wrong |
| `doj` | date | |
| `confirmation_date`, `contract_end_date` | date, nullable | `contract_end_date` drives auto-expiry ([[M6-onboarding]]) |
| `notice_period_days` | int | |
| `pay_group_id` | FK → [[M10-payroll-core]], nullable | the **group**, never the amount |
| `reports_to_employee_id` | self-FK, nullable | `[proposed]`, OQ-M3-02 |
| `effective_from` | date, not null | |
| `effective_to` | date, nullable | null = in force |
| `status` | enum `pending_approval` \| `in_force` \| `superseded` \| `expired` | |
| `leave_balance_treatment` | enum `recalculate` \| `grandfather`, nullable | **required when `is_vacation_staff` changes**; null otherwise. §4.3 |
| `supersedes_id` | self-FK | the chain HR-05 renders |
| `created_by_user_id`, `approved_by_user_id`, `change_reason` | | |

**Constraints that make the shape true rather than merely intended:**

- `EXCLUDE USING gist (employee_id WITH =, daterange(effective_from, effective_to, '[)') WITH &&)` over
  `status IN ('in_force','superseded')` — **overlapping contract versions are impossible**, not validated.
- `CHECK (is_vacation_staff IS NOT NULL)`.
- `CHECK (leave_balance_treatment IS NOT NULL)` whenever the version changes `is_vacation_staff` relative
  to the version it supersedes (enforced by a trigger, since it is a cross-row condition).
- A contract row is **never updated** except to set `effective_to`/`status` on supersession (§4.3, O18).

### 3.4 `ServiceRecord` (§6.3 — "immutable career timeline; feeds gratuity")

| Field | Type | Notes |
|---|---|---|
| `tenant_id`, `employee_id` | FK, not null | + RLS policy, same migration |
| `event_type` | enum `joined` \| `confirmed` \| `promoted` \| `transferred` \| `revised` \| `exited` | §6.3's list |
| `effective_date` | date | |
| `details` | JSONB / text | **never a salary amount** — a `revised` event records that pay changed, the figure is [[M10-payroll-core]]'s |
| `corrects_service_record_id` | self-FK, nullable | **`[proposed]`** — a mistake is put right by a later entry that names the earlier one, and both stay readable (HR-06 as built). See OQ-M3-04 |
| `recorded_by_user_id`, `recorded_at` | | HR-06 shows "written {date} by {who}" |

**Append-only in the database**, by the same trigger + revoked-privilege mechanism as `AuditLog`
([[M0-foundations]] §3.2). There is no edit path and no delete path for any actor at any privilege level.

### 3.5 `EmployeeStatusChange` (`[proposed]`)

`employee_id`, `from_status`, `to_status`, `effective_date`, `reason`, `actor`. Blueprint PART B §2 makes
the lifecycle an MVP requirement; without a transition record, "why is she on notice and since when?" is
answerable only by reading the audit log, which is a forensic tool rather than a product surface.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — onboarding a PGT (M3 §Workflow)

1. HR opens HR-02 and adds an employee. The **duplicate check** runs first (§4.7).
2. `Employee` is created at a campus and department, `status='pre_boarding'`, with the identifiers HR
   holds. PII fields are written encrypted; nothing is echoed back unmasked.
3. HR creates the **first `EmploymentContract` version**: staff category (PGT, `kind=teaching`),
   `employment_type=probation`, **`is_vacation_staff` — presented with no default**, `doj`, notice period,
   pay group. The category's `default_is_vacation_staff` is *offered* as a pre-selection with its reasoning
   stated; it is never silently applied (§4.3).
4. `ServiceRecord(joined)` is appended with the DOJ.
5. M3 emits `employee.contract.created` carrying `(employee, effective_from, is_vacation_staff,
   staff_category, campus)`. [[M8-leave]] consumes it to initialise leave balances — **and a vacation-staff
   PGT's balances exclude or reduce EL, which is M3's own acceptance criterion**.
6. HR invites the user ([[M2-identity-access]]); `Employee.user` is linked. Until then HR-02 must show
   "record created, no login yet" as a state, because the person appears nowhere else.
7. On confirmation, a new contract version supersedes with `employment_type=permanent` and
   `ServiceRecord(confirmed)` is appended.

### 4.2 Contract supersession — the interaction model (§4.3, O18)

Nothing on a contract is edited. Every change is **"Revise, effective from `<date>`"**, producing a new
row that supersedes the previous one, which stays readable because it is what the months it covered were
run on. HR-05 renders the chain; HR-06's `revised` event records that it happened.

- Overlapping effective dates are refused by the exclusion constraint, not by a service-layer check.
- A revision whose `effective_from` falls inside a **locked or filed payroll month** must state the
  consequence — an arrears recompute and possibly a revised return — and requires an explicit recorded
  acknowledgement (O18, [[M10c-arrears-pay-revision]]).
- Contract **expiry** is a state, not a deletion: `contract_end_date` passing moves the version to
  `expired` and surfaces it in [[M6-onboarding]]'s renewal queue (HR-25).

### 4.3 `is_vacation_staff` — where it lives, how it changes, and what happens to accrued balances

**Where it lives.** On the **contract** (§6.3 is explicit; the contract is the centre of gravity). It is
effective-dated by virtue of living there: the flag *in force on a date* is the flag on the contract
version in force on that date. [[M8-leave]] and [[M10-payroll-core]] must resolve it **as at the date they
are computing**, never as "the employee's current flag" — a July accrual run in September must see July's
answer. This is the single most likely way to get this wrong, and it is an AC (M3-AC-11).

**The category's role.** `StaffCategory.default_is_vacation_staff` exists because a school thinks in
categories — *teachers are vacation staff* — and HR-08 as built asks the question at category level. It is
a **proposal only**. The contract is authoritative. A category whose default flips does **not** silently
re-flag anyone: it opens the bulk ceremony below. (This reconciles HR-08 with §6.3 — see OQ-M3-01.)

**Changing it on one person** (HR-05, "Create a new contract version"):

1. HR chooses an effective date and the new value. **The flag has no default in the form** — it must be a
   deliberate choice, because it changes leave *and* pay.
2. Before commit, the server returns a **consequence preview**: what changes for her leave (EL stops or
   starts accruing from the effective date; casual and sick leave are untouched), what changes for her pay
   (declared vacations are paid days and she is not marked absent for them), and **her current EL balance
   in days**.
3. HR must choose **`recalculate` or `grandfather` — with no default** (HR-08's proven shape, and the
   design's own words: *"Choose one — recalculate or grandfather. There is no default here."*):
   - **recalculate** — re-run accrual from the effective date; the ledger moves immediately;
   - **grandfather** — the existing balance stands; only what accrues from the effective date follows the
     new rule.
4. The choice is stored on the contract version as `leave_balance_treatment`, so the decision is auditable
   **in M3 even before [[M8-leave]] exists**, and is not merely an argument that vanished into a service
   call.
5. On commit: contract superseded, `ServiceRecord` appended, audit written, and
   `employee.vacation_status_changed(employee, effective_date, from, to, treatment)` emitted for
   [[M8-leave]] to act on. M3 never writes a leave balance itself.

**Changing it on a category** (HR-08): the same ceremony at scale — the **affected headcount is stated
before commit**, one effective date, one `recalculate`/`grandfather` choice with no default, and the
result is **one new contract version per affected employee**, each carrying the treatment. It is not a
column update on a category with an implicit blast radius. Employees whose contract deliberately diverges
from the category default are listed and excluded by default, since overriding an individual decision from
a taxonomy screen is precisely the silent-harm case.

**What must never happen:** a vacation-staff flip that (a) has a default, (b) commits without showing the
affected balance or count, (c) silently deletes accrued leave, or (d) applies retroactively to a paid or
filed month without an acknowledgement. Each is an AC.

### 4.4 Employee states (blueprint PART B §2)

`pre_boarding → onboarding → probation → confirmed → active → on_long_leave → transferred → notice →
exited → ff_closed`, with `transferred` and `on_long_leave` as non-terminal excursions. Every transition
writes an `EmployeeStatusChange` and a `ServiceRecord` where §6.3's event vocabulary has a matching term.
HR-02's register filters by status and carries an **explicit** include/exclude-exited toggle rather than a
silent default.

### 4.5 PII — masking, reveal, and what is never stored

- **Masked is the default state of the field, for every role including HR** (O3). The GraphQL type returns
  `panLast4`, `aadhaarLast4`, `accountLast4` — the full value is **absent from the response**, not
  present-and-hidden.
- **Reveal is a separate, single-field, single-record operation** requiring a `PiiGrant`
  ([[M2-identity-access]]) covering that employee's scope. It writes an audit row with
  `sensitivity_class='pii_access'` naming actor, field class, subject and time, and it is surfaced to the
  **subject** as well as to an administrator (O3, A10).
- There is **no reveal-all, no bulk unmask, and no PII column in the register by default** (O3, HR-02
  must-NOT-contain). A register export's column set follows field permissions and states its scope, row
  count and that it is recorded (A12, O7).
- **Aadhaar: only the last four digits are persisted.** §6.3 says `aadhaar(masked)`; the design says there
  is no reveal for anybody because the last four is the fullest form that exists. Full-value verification
  is therefore impossible by design and the screen must say so. See OQ-M3-03 — whether Aadhaar is
  collected at all is a legal question.
- **Nothing is logged.** PAN, Aadhaar, UAN, ESIC, bank, salary, DOB and phone never reach a log line;
  subjects are opaque UUIDs (`guard-pii-logging`, O11). Nor do they reach a page title, URL, toast,
  notification body, error message or export filename.
- A **bank-detail change** is flagged: it is the classic payroll-fraud vector, the next NEFT file uses it,
  and ui-compliance A9 marks it as needing a second approver. Supported as a per-tenant configurable
  second-approval on `employeeRevisePii` for the `bank` field class (OQ-M3-05).
- A **statutory-identifier change** (PAN/UAN/ESIC) mid-year must warn about ECR/24Q/Form 16 impact
  ([[M11-statutory-compliance]]) and name the periods affected.

### 4.6 Service book and continuous service

- Entries are **appended, never changed or taken away**. A mistake is corrected by a new entry naming the
  one it corrects; both stay readable (HR-06 as built).
- Back-dating an entry before the DOJ is refused.
- **Continuous service** is computed from the timeline with breaks named explicitly — it is the single
  number [[M12-full-and-final]] computes gratuity from, and the five-year bar is read from that
  computation, never from `doj` minus today.
- The service-book PDF is the inspection-ready artefact (blueprint PART A §1 ★); its download is audited.
- **No delete or edit control exists on this screen for anyone**, in any state — the API has no such
  operation to expose.

### 4.7 Duplicate person and rehire

A returning teacher matched to a **new** `Employee` row silently loses her continuous service, and nobody
finds out until her F&F is short. The spec has no rehire or merge path (screen-inventory Q15). M3 must at
minimum make the failure loud:

- `employeeCreate` runs a duplicate check on `dedupe_fingerprint` (normalised name + DOB, plus a keyed
  hash of PAN and of UAN where present) **within the tenant**, across active *and* exited staff.
- A probable match returns `possible_duplicate_person` with the matched records' **opaque ids and
  emp_codes only** — never their PII — and the creation requires an explicit
  `acknowledged_distinct_person` flag with a reason, which is audited.
- A true rehire/merge flow is **out of MVP scope pending a ruling** (OQ-M3-06); the check exists so the
  decision is at least made by a person on the record.

### 4.8 Edge cases and error paths

| Situation | Behaviour |
|---|---|
| Employee has no PAN or Aadhaar (support staff) | The record tolerates it; the statutory engine must degrade **explicitly** with its PF/TDS consequence named, never silently (HR-04 non-happy paths) |
| Duplicate PAN or UAN within the tenant | Blocked — `[proposed]`, the spec asserts no uniqueness (HR-04). See OQ-M3-07 |
| Employee record exists with no `User` | A first-class state HR-02 renders; blocks raising a document request ([[M4-document-governance]] needs someone who can respond) |
| Contract auto-expires while the person keeps working | Surfaced in [[M6-onboarding]]'s renewal queue. **What payroll and attendance do for an expired contract is unspecified — OQ-M3-08** |
| Overlapping contract versions | Impossible (exclusion constraint), reported as `contract_period_overlap` |
| Vacation flip with no `recalculate`/`grandfather` choice | `leave_balance_treatment_required` — the mutation refuses. There is no default to fall back on |
| Category deactivated while contracts reference it | Deactivation refused with the count; historical references keep the category readable |
| Category `min_qualification` edited | Applies going forward; **existing contracts are not retro-changed**; re-flagging open applications is [[M5-recruitment-ats]]'s call (`[proposed]` in HR-08) |
| Cross-campus transfer by a campus-scoped caller | Refused — the target must be within the caller's scope ([[M2-identity-access]]) |
| Reading an employee outside scope or tenant | **404, never 403-with-a-name** (O7); the UI shows a scoped "not in your campus" state, not an error page |
| Exit initiated with a last working day in the past | Warned; already-exiting routes to the settlement |
| Attempt to delete an employee | No such operation exists. Employees are deactivated/exited, never deleted (§4.2, HR-02) |
| Employee exited | Record read-only within the retention window; statutory-retention data survives exit (O2, §8) |

### 4.9 Concurrency

- `ETag`/`If-Match` on `Employee` detail edits; a stale write returns 412.
- Contract versions never race: two concurrent revisions with the same effective date collide on the
  exclusion constraint and the loser gets `contract_period_overlap`, not a silently interleaved history.
- Service-book appends are naturally concurrent-safe (append-only) but ordering is by `effective_date`
  then `recorded_at`, so two same-day entries are deterministic.

### 4.10 i18n

- Every HR-02…HR-08 string exists in **Hindi and English at parity** (`guard-i18n-strings`, O12) —
  emphatically including the vacation-flag consequence copy and the recalculate/grandfather options,
  which are the strings a person must understand in order not to take leave away from a teacher by
  accident.
- Staff-category names are **tenant data**, entered by the school in its own language, and are not
  translated by the product; the *labels around them* are.
- Dates render in Indian format and the register frames periods by the **academic session**, not a
  calendar year (§9 Localisation).
- Names are stored and rendered in full Unicode; no transliteration and no ASCII-folding on storage.

### 4.11 a11y

- HR-02's register is a table with real headers and scope, inside a card with its totals — never a naked
  table; sorting state is announced; cursor pagination keeps row identity stable for a screen reader.
- Masked fields announce **"hidden, you have permission to reveal, every reveal is recorded"** as text, not
  as a tooltip; the reveal control is a button with an accessible name naming the field, and the revealed
  value is announced once and re-masks on navigation.
- The vacation-flip dialog: focus to the heading, the consequence read before the choice, the two options
  as a labelled radio group with **no pre-selection**, and the validation message announced on submit
  rather than the submit button being disabled into a dead end.
- Withheld PII columns are **stated, not blank** (HR-02 states) — an empty cell is indistinguishable from
  missing data to everyone, and especially to a screen reader.
- State (probation, expiring, expired, exited, verification status) carries a word plus colour (DESIGN 8).
- WCAG-AA on the core flows (§9).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| M3-AC-01 | Onboarding a PGT with `is_vacation_staff=true` initialises leave balances that **exclude or reduce EL**, via the event M3 emits to [[M8-leave]]. | **M3 §Acceptance** |
| M3-AC-02 | `Employee`, `StaffCategory`, `EmploymentContract` and `ServiceRecord` each carry `tenant_id` and their RLS policy **in the same migration as the model**. | §3, `guard-rls-policy` |
| M3-AC-03 | Creating an employee writes `Employee` + `EmploymentContract` + `ServiceRecord(joined)` in one transaction; a failure in any leaves none of them. | **M3 §Workflow** |
| M3-AC-04 | `is_vacation_staff` lives on `EmploymentContract`, is **NOT NULL with no database default**, and is presented with **no default** in any create/revise operation. | §6.3, HR-05 |
| M3-AC-05 | A contract change is a **supersession**, never an in-place edit; the superseded version remains readable with its effective window, author and reason. | §4.3, O18 |
| M3-AC-06 | Overlapping contract versions for one employee are **impossible** — enforced by a database exclusion constraint, proven by a concurrent-write test. | §4.3 |
| M3-AC-07 | A contract version that changes `is_vacation_staff` **requires** an explicit `recalculate` or `grandfather` treatment; the mutation is refused without one, and there is no default. | HR-08 as built, §4.3 |
| M3-AC-08 | Before commit, a vacation-flag change returns a consequence preview naming the leave effect, the pay effect, and **the employee's current EL balance** (single) or **the affected headcount** (category-level). | HR-05, HR-08 as built |
| M3-AC-09 | A category-level vacation-flag change produces **one new contract version per affected employee**, each carrying the treatment; it never mutates contracts implicitly. | §6.3, HR-08 |
| M3-AC-10 | A vacation flip **never deletes accrued leave**; `grandfather` leaves balances untouched and `recalculate` re-derives them from the effective date, with the outcome visible on the ledger. | §4.3, HR-05 non-happy paths |
| M3-AC-11 | [[M8-leave]] and [[M10-payroll-core]] resolve `is_vacation_staff` **as at the computation date** from the contract version in force on that date, never from "the employee's current flag" — verified by computing a past month after a later flip. | §4.3, §6.3 |
| M3-AC-12 | A contract revision effective inside a locked or filed payroll month is refused without a recorded acknowledgement, and the response names the consequence. | O18, [[M10c-arrears-pay-revision]] |
| M3-AC-13 | `StaffCategory` carries `kind` with **no default** and `min_qualification`; a duplicate name in scope is refused; a category in use cannot be deleted, only deactivated, and the refusal carries the count. | §6.3, HR-08 |
| M3-AC-14 | Editing a category does **not** retro-change existing contracts. | HR-08 actions |
| M3-AC-15 | `ServiceRecord` is **append-only in the database**: no API, admin surface or database role can update or delete an entry; a correction is a new entry naming the one it corrects, and both remain readable. | §6.3 "immutable", §4.2, O6 |
| M3-AC-16 | A service-book entry back-dated before the DOJ is refused. | HR-06 actions |
| M3-AC-17 | Continuous service is computed from the service book with breaks named, and is the value [[M12-full-and-final]] uses for gratuity — never `today − doj`. | §6.3, **M12 §Business rules** |
| M3-AC-18 | Every lifecycle change (confirm, promote, transfer, revise, exit) writes a `ServiceRecord` **and** an `AuditLog` row. | **M3 §Business rules**, §4.2 |
| M3-AC-19 | Every employee status transition follows the lifecycle in blueprint PART B §2 and records from/to, effective date, reason and actor. | blueprint PART B §2 |
| M3-AC-20 | **PII is masked by default for every role including HR**; the full value is absent from the response, not hidden in it. | §8, §4.1, O3 |
| M3-AC-21 | Reveal is a **single-field, single-record** operation gated on `people.pii.read` for that scope, audited with `sensitivity_class='pii_access'`, and **visible to the subject**. | §8 "access-logged", O3, [[M2-identity-access]] |
| M3-AC-22 | **A Department Head has no reveal control at all** and receives 403 on a direct reveal call. | **M2 §Acceptance**, O3 |
| M3-AC-23 | No reveal-all, bulk unmask, or default PII column exists in the register or any list; an export's columns follow field permissions and the export states scope, row count and that it is recorded. | O3, O7, A12 |
| M3-AC-24 | **Aadhaar is stored masked** — only the last four digits are persisted — and no surface renders a full Aadhaar number. | §6.3, O3, ui-compliance §3 |
| M3-AC-25 | No PII (PAN, Aadhaar, UAN, ESIC, bank, salary, DOB, phone) appears in any log line, page title, URL, toast, notification body, error message or export filename; subjects are opaque UUIDs. | `guard-pii-logging`, §8, O11 |
| M3-AC-26 | A PII field revision **supersedes** with the prior value retained in encrypted history, while the **audit row records only that the field changed** — no value is recoverable from `audit_log`. | §4.2, §8, O6, GA-08 must-NOT-contain |
| M3-AC-27 | A change to PAN/UAN/ESIC warns about the ECR/24Q/Form 16 periods affected; a change to bank details is flagged to the next payroll run's exception list. | **M11**, O6, A9 |
| M3-AC-28 | The staff register is scope-filtered on list, search, type-ahead, filter option lists, totals and export; an out-of-scope or out-of-tenant employee id returns **404, not 403**. | O7, **M2 §Acceptance** |
| M3-AC-29 | `people.manage` is required to write, `people.read` to read, and `people.pii.read` gates PII **separately** from record access. | **M3 §Permissions**, §4.1 |
| M3-AC-30 | An employee cannot write their own record or their own documents from any surface; EMP-18 carries no write controls and the API offers none. | **M3 §Permissions**, **M4 §Business rules #2**, O4 |
| M3-AC-31 | Employees are **never deleted** — deactivated or exited, with history retained. | §4.2, HR-02 |
| M3-AC-32 | Creating an employee runs a duplicate/rehire check and requires an explicit acknowledgement to proceed past a probable match; the match response contains **no PII**. | screen-inventory Q15, **M12** gratuity continuity |
| M3-AC-33 | The register paginates by cursor and its list query issues a bounded number of database queries regardless of page size. | §7, `guard-missing-dataloader` |
| M3-AC-34 | All HR-02…HR-08 strings, including the vacation-flag consequence and the recalculate/grandfather options, exist in Hindi and English at parity. | `guard-i18n-strings`, O12 |
| M3-AC-35 | Exited employees' statutory-retention data survives exit and the record remains readable within the retention window. | §8, O2 |

---

## 6 · Testing

| Level | Owner | Assertions that matter |
|---|---|---|
| Unit | **deathstroke** | **Contract-in-force-at-date resolution**, including the day before, the day of, and the day after an effective date, and across three stacked versions; `is_vacation_staff` as-at-date after a later flip (the M3-AC-11 case, tested directly rather than through M8); the exclusion-constraint cases as a table of overlapping ranges; `leave_balance_treatment` required-when-changed logic; continuous-service computation with zero, one and two breaks, and across a `transferred` event; the five-year gratuity bar at exactly five years; PAN/IFSC validators reading their own pattern constants; masking helpers producing format-preserving output; `dedupe_fingerprint` matching on name+DOB, on PAN hash, and not matching on a genuine namesake with a different DOB |
| Integration | **bane** | Full onboarding: employee → contract → `ServiceRecord(joined)` → the M8 event, asserting the event payload's `is_vacation_staff` against the contract, not a literal; supersession chain readable end to end; probation confirmation; renewal; transfer refused cross-scope; exit initiation; category deactivation refused with a count; duplicate-person acknowledgement path |
| **Vacation-flag suite** | **bane** | The critical-path-risk-#2 suite, run as a named job: single-employee flip with `grandfather` leaves the balance byte-identical; with `recalculate` re-derives it and the ledger shows the change; a flip with no treatment is refused; a category-level flip produces exactly N new contract versions for N affected employees and lists the deliberate divergers as excluded; a flip effective inside a filed month is refused without acknowledgement; **a July payroll recomputed in September sees July's flag** |
| **PII / RLS** | **bane** | Masked-by-default for HR, Principal and Group Admin; reveal requires the grant and writes the `pii_access` row visible to the subject; **Department Head has no reveal field in the schema response and 403 on a direct call**; no query over `audit_log` recovers a PAN, Aadhaar or bank value; no log line in a full onboarding + revision + export flow contains any sensitive value (asserted by scanning captured log output against the `sensitive_fields` registry); cross-tenant and cross-campus reads return zero rows / 404 |
| **Append-only** | **bane** | `UPDATE`/`DELETE` on `service_record` refused by the database as the application role; a correction entry preserves both rows |
| Fixtures | **deathstroke** | The realistic multi-campus group of §11: teaching, non-teaching, support and guest staff across two campuses in two states, at least one vacation-staff and one non-vacation-staff person in the same department, one exited employee and one rehire candidate. **Every later module's tests build on this fixture** |
| a11y | **two-face** | Register table semantics and stable cursor rows; masked-field announcement; the vacation dialog's unselected radio group and announced validation; withheld columns stated, not blank |

---

## 7 · Proposed stories

Target sprint **2** throughout (build plan §12: "People + Documents (M3–M4)").

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M3-S01 | `Employee` model with `tenant_id` + RLS and the sensitive-field registry | The staff master, tenant-scoped, with PII declared once for the redactor and the log filter. | oracle | 5 | [[M0-foundations]] S05/S10, [[M1-organization-tenancy]] S01 |
| M3-S02 | PII encryption at rest, masked accessors, Aadhaar last-4-only storage | The full value never leaves the database, and Aadhaar's full value never enters it. | wonder-woman | 5 | M3-S01 |
| M3-S03 | `StaffCategory` with the education taxonomy, `kind`, `min_qualification` | The staff-type vocabulary the blueprint calls a differentiator. | oracle | 3 | M3-S01 |
| M3-S04 | **`EmploymentContract` with effective-dating and the overlap exclusion constraint** | The centre of gravity, with overlapping versions made impossible rather than validated. | oracle | 8 | M3-S01, M3-S03, [[M0-foundations]] S16 |
| M3-S05 | `ServiceRecord`, append-only enforcement, correcting entries | The immutable career timeline, unrewritable by the database. | oracle | 5 | M3-S01 |
| M3-S06 | Continuous-service computation with breaks | The single number a settlement is computed from. | riddler | 5 | M3-S05 |
| M3-S07 | RLS policy content for the four M3 tables | Staff data cannot be read or written across tenants or outside scope. | wonder-woman | 3 | M3-S01…S05 |
| M3-S08 | Employee creation service + duplicate/rehire check | One transaction producing employee, contract and joined-event; a probable duplicate is a decision, not an accident. | cyborg | 5 | M3-S04, M3-S05 |
| M3-S09 | **Vacation-flag change: consequence preview, recalculate/grandfather, event emission** | Critical-path risk #2, with no default anywhere in the path. | riddler | 8 | M3-S04 |
| M3-S10 | **Category-level vacation-flag change: affected count, bulk supersession, diverger exclusion** | The HR-08 ceremony at scale, producing real contract versions. | riddler | 8 | M3-S09 |
| M3-S11 | Contract lifecycle mutations: revise, confirm probation, renew, transfer | HR-05's actions, each a supersession with a service record. | cyborg | 5 | M3-S04, M3-S05 |
| M3-S12 | Employee lifecycle states + `EmployeeStatusChange` + exit initiation | Blueprint PART B §2's state machine, with a transition record. | cyborg | 5 | M3-S08 |
| M3-S13 | HR-02 register: scoped cursor-paginated list, search, filters, export | The register HR opens first, PII-free by default and scoped everywhere. | cyborg | 5 | M3-S01, [[M2-identity-access]] S10 |
| M3-S14 | HR-03…HR-06 reads: record shell, personal, contract history, service book | The four facets behind one subject shell. | cyborg | 5 | M3-S04, M3-S05 |
| M3-S15 | **PII reveal operation with audited access and subject visibility** | A single field, a single record, always recorded, always visible to the person it is about. | wonder-woman | 5 | M3-S02, [[M2-identity-access]] S11 |
| M3-S16 | PII revision: supersession, redacted audit, statutory-impact warning, bank-change flag | Changing a PAN warns about the filings; changing a bank account is treated as the fraud vector it is. | wonder-woman | 5 | M3-S15 |
| M3-S17 | HR-08 taxonomy surface: create, revise, deactivate with in-use guard | The setup screen without which no contract can be typed correctly. | cyborg | 3 | M3-S03, M3-S10 |
| M3-S18 | Service-book PDF export (audited) | The inspection-ready artefact, with the download on the record. | cyborg | 3 | M3-S06 |
| M3-S19 | Multi-campus staff fixture factory | The fixture every later module's tests are built on. | deathstroke | 5 | M3-S08 |
| M3-S20 | M3 unit suite | Effective-dating resolution, continuous service, validators, dedupe, masking. | deathstroke | 8 | M3-S11 |
| M3-S21 | **Vacation-flag integration suite** | The named job that proves risk #2 is closed, including as-at-date resolution. | bane | 8 | M3-S10 |
| M3-S22 | **PII, RLS and append-only suite** | Masking, the DH-no-reveal case, no PII in logs or audit, cross-scope 404, immutable service book. | bane | 8 | M3-S15, M3-S07 |

**Total: 22 stories, 120 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M3-01 | **Where does `is_vacation_staff` live — contract or category?** §6.3 puts it on `EmploymentContract`. **HR-08 as built asks the question at category level** ("Does this category accrue Earned Leave?") and HR-05 also carries it per contract. Two screens, one flag. | If the category is authoritative, an individual override is impossible and a teacher on a special arrangement cannot be modelled. If both are authoritative independently, they will disagree and leave accrual becomes non-deterministic. | **Contract is authoritative; category carries a proposed default only** (§4.3). This preserves §6.3, keeps HR-08 honest by making its edit a bulk supersession with a stated blast radius, and is what this spec is written against. **Needs a ruling to become spec.** |
| OQ-M3-02 | **There is no `reports_to`.** The locked role model defines "manager" as the reports-to relationship, [[M8-leave]]'s approval routing depends on it, DH-05 "my team" needs it — and §6.3 carries only `department_id`. This is a data-model gap, not a screen gap (screen-inventory Q6/Q31). | Every manager-approval route in the product is currently "everyone in the department", which is wrong for a department with two heads and wrong for anyone reporting outside their department. | Add `reports_to_employee_id` **to `EmploymentContract`** (so it is effective-dated and moves with a transfer) with a convenience denormalisation on `Employee`. **Data-model addition — needs a ruling before [[M8-leave]] in Sprint 5.** |
| OQ-M3-03 | **Do we collect Aadhaar at all?** §6.3 says `aadhaar(masked)`; UIDAI display/storage rules are strict; our statutory set (PF/ESI/TDS) uses UAN, ESIC and PAN (ui-compliance §9-Q3). | Collecting a national identifier we do not need is a DPDP liability with no offsetting benefit, and the masked-storage design already concedes it cannot be used for verification. | Persist **last four only** as specified, or drop the field entirely. **Legal ruling required** before HR-04 ships. |
| OQ-M3-04 | **`ServiceRecord` has no `corrects_id`.** §6.3 says the timeline is immutable; HR-06 as built shows a correcting entry that names the entry it puts right. | Without the link, a correction is just a contradictory second entry and a reader cannot tell which one is operative — including the gratuity computation. | Add `corrects_service_record_id`. Small, and it makes "immutable" workable rather than merely strict. Needs a ruling. |
| OQ-M3-05 | **Do a bank-detail edit, a statutory-ID edit, and a vacation-flag flip need a second pair of eyes?** HR-04, HR-05 and ui-compliance A9 all mark them `[proposed] yes`; §8 names maker-checker only for money/statutory finalisation; **HR-05 as built already renders "Sent for a second approval. Nothing on the contract has moved yet."** | A bank change immediately before a run is the classic payroll-fraud vector, and a vacation flip moves money. The design has already committed to the interaction on at least the contract. | Support all three as **per-tenant configurable second-approval gates** on the mutation, defaulted: bank **on**, statutory-ID off, vacation-flip on. Reuses [[M2-identity-access]]'s distinct-approver machinery. Needs a ruling (screen-inventory Q27). |
| OQ-M3-06 | **Is there a rehire / duplicate-person merge path?** None in the spec (screen-inventory Q15). A second `Employee` for a returning teacher silently breaks gratuity continuity. | The failure is invisible for years and then costs the employee money at exit — the worst possible discovery point. | MVP: the loud duplicate check of §4.7. A real merge (re-parenting service records under one employee, with an audit chain) is a **post-MVP story that must be scoped before the first customer's second academic year**. Needs a ruling. |
| OQ-M3-07 | **Are PAN and UAN unique within a tenant?** The spec asserts no uniqueness; HR-04 marks a duplicate block as `[proposed]`. | Two employees sharing a PAN means one 24Q is wrong. But a genuine data-entry duplicate blocked hard also stops HR mid-onboarding. | Unique **constraint on the hash**, with an override that requires a reason and is audited — the same shape as the duplicate-person check. Needs a ruling. |
| OQ-M3-08 | **What do payroll and attendance do when a fixed-term contract auto-expires but the person keeps working?** (screen-inventory Q5.) | It is the difference between an unpaid teacher and an unauthorised payment, and it will happen every April. | M3's position: the contract state is `expired` and M3 reports it; **[[M10-payroll-core]] must refuse to pay against an expired contract and raise an exception rather than defaulting either way**. Needs a ruling on the payroll side. |
| OQ-M3-09 | **Are `StaffCategory` records tenant-level or campus-level?** §6.3 is tenant-level; two campuses in a group may want different taxonomies (screen-inventory Q21, HR-08 non-happy paths). | A group with a K-12 campus and a pre-school campus genuinely has different staff types, and a shared list becomes a long list of mostly-irrelevant options. | Keep tenant-level for MVP with an optional `campus_scope` array for filtering, rather than a structural change. Needs a ruling. |
| OQ-M3-10 | **Blueprint PART A §1 lists "Configurable custom fields and staff-data structures [MVP]"** — there is no entity for it anywhere in §6. | An MVP-tagged capability with no data model will either be silently dropped or improvised as a JSONB blob with no validation, no i18n labels and no PII classification. | Either descope it explicitly or model it (`CustomFieldDefinition` + `CustomFieldValue`, with a PII-classification flag so a custom field cannot become an unaudited PII store). **Needs a ruling — this is a scope-tag question.** |
| OQ-M3-11 | **Who may open police/background-verification records?** §8 says access-restricted and names no permission; it lands on M3's record surface via [[M4-document-governance]] (screen-inventory Q8). | Child-safety data with the widest blast radius; whether a control is absent or disabled depends on the answer. | Track under [[M2-identity-access]] OQ-M2-07 (`documents.child_safety.read`). Needs a ruling on the holder (O8). |
| OQ-M3-12 | **Post-exit read access and retention.** §8 requires statutory-retention data to survive exit and O2 requires the retention window to be stated; [[M12-full-and-final]] deactivates the login. M3 owns the record that must remain readable. | Without a stated window, "exited (read-only, retention window)" — a state HR-03 already renders — has no defined end. | Track under [[M2-identity-access]] OQ-M2-06 plus a retention policy record in [[M15-reporting-platform]] (GA-12). Legal ruling needed. |
| OQ-M3-13 | **Pitch-deck vs build contract.** `docs/Naveya-School-HRMS-Voxturrlabs.pdf` (22 July) presents **substitute arrangement and period-level attendance as first-release capabilities** (pp. 4, 6) and a **"single-click run … then NEFT bank file and payslips"** (p. 13). Locked **D2** defers substitution and period-level to Phase 2, and **Amendment B (2026-08-11)** ruled that release is never one click. | The deck is what a school has been shown. The gap between it and the build contract is a commercial exposure, not an engineering one — but it will be discovered at a demo. | Reported, not resolved: the dev spec wins as the build contract. **BATMAN/the user should decide whether the deck is reissued.** Also noted: the deck's "AI qualification screening" (p. 14) sits against blueprint's "AI resume parsing remains Phase 2" — [[M5-recruitment-ats]]'s conflict, flagged here only because it was found in the same pass. |

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
