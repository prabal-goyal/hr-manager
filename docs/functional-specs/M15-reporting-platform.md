# M15 — Reporting & Platform · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M15 Reporting & Platform (build-plan §12 Sprint 11) · **Epic:** NA-24 lane F ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Sibling document:** `[[M15a-helpdesk]]` covers M15.1 (HR Helpdesk / Ticketing) in full; it is not
> repeated here.
> **Authority:** `docs/development-specification.md` M15, §4.1, §4.2, §4.3, §6.11 `AuditLog`, §7, §8, §9
> (Localisation — "academic-year framing"), §12 · `docs/functionality-blueprint.md` §15 "HR Analytics &
> Reporting" (standard reports `[MVP]`, dashboards `[P2]`, custom builder `[P2]`), §1 (inspection-ready
> registers `[Later]`), PART C item 10 · `docs/screen-inventory.md` PR-06, HR-37, GA-09, GA-08, GA-12,
> HR-36, and the role homes (PR-01, GA-01, DH-01, HR-01, PY-01, AC-01) ·
> `docs/ui-compliance-requirements.md` **O7** (campus-scoped access incl. exports, pickers and counts),
> **O11**, **O3** (masking + audited reveal), O1, O2, O6, O9, O18, A64 (run/export a report), A65 (view
> the audit log), A66 (retention action), A67 (DPDP request) ·
> `design/v3/pages/hr-reports.jsx` (HR-36/HR-37, **built** — academic-session framing and small-cell
> suppression already demonstrated).
>
> **Implementation owner:** cyborg (report engine, audit read API, DPDP console API). **Web:**
> green-lantern. **Compliance review:** gordon. **Unit:** deathstroke. **Integration/leak testing:** bane.
>
> **Cross-module links** — `[[M0-foundations]]` (audit substrate, RLS), `[[M2-identity-access]]`,
> `[[M3-core-hr-people]]`, `[[M4-document-governance]]`, `[[M5-recruitment-ats]]`, `[[M7-academic-calendar]]`,
> `[[M8-leave]]`, `[[M9-attendance]]`, `[[M10-payroll-core]]`, `[[M11-statutory-compliance]]`,
> `[[M12-full-and-final]]`, `[[M13-ess-mobile]]`, `[[M14-notifications]]`, `[[M15a-helpdesk]]`,
> `[[M16-integrations]]`, `[[M17-performance-appraisal]]`.

---

## 1 · Intent

A school is asked for numbers constantly — by its trust, its board, an affiliation inspector, an auditor,
a state department, and by its own Principal on a Monday morning. M15 is where those numbers come from,
and its whole value rests on two properties that are easy to lose.

**The frame must be the academic session.** Indian schools run April to March; a headcount "this year", an
attrition rate, a leave register, a joiners-and-leavers list all mean something different on a calendar
year. A report on the wrong frame is worse than no report, because it looks right — it has a title, a
total and a date range, and nobody checks. `§9 Localisation` names "academic-year framing" as a
requirement; this module makes it the default everywhere and states it on the face of the output.

**Aggregates leak.** A report is the one place in the product where the careful, per-record scoping of
`§4.1` can be defeated arithmetically. A Principal who can see a group total and their own campus total
learns the other campus's total (O7 calls a total an inference channel). A department-wise appraisal
distribution over three people points at three people. A "leave taken by reason" breakdown in a small
department identifies whose medical leave that was. So M15 carries a **minimum-cell rule** and an absolute
prohibition on sensitive columns, and it **audits every export** — because an export is data leaving our
access controls permanently (A64).

M15 also owns the two surfaces that make the rest of the product's promises verifiable: the **audit log
viewer** (`§4.2` mandates the trail; without a viewer it is a claim) and the **data-protection console**
(`§8` mandates consent, retention, subject requests and PII access logging; the screen inventory found no
surface for any of it — its largest single compliance gap, G2).

---

## 2 · Scope & surfaces

### In scope

| Area | What M15 delivers | Screens |
|---|---|---|
| Report engine | Definitions, parameters, scope binding, permission trimming, generation, artefacts, expiry | shared runner |
| Standard report library | Attendance, leave, headcount and demographics, joiners/leavers/attrition, document compliance, contract expiry, probation/confirmation, recruitment funnel | PR-06, HR-37 |
| Payroll and statutory registers | Payroll register, statutory contributions and liability, reconciliation (payable vs paid) — **rendered by the same runner, owned by** `[[M10-payroll-core]]` / `[[M11-statutory-compliance]]` | PY-20, AC-03, AC-08, AC-09 |
| Group consolidation | Cross-campus headcount, cost, attrition, statutory liability, per-legal-entity consolidation | GA-09 |
| Appraisal reports | Completion by stage, distribution, recommendation counts — **content owned by** `[[M17-performance-appraisal]]`, suppression and export rules owned here | HR-36 |
| Role homes | Each role's landing view (MVP; *analytical* dashboards stay P2 — screen-inventory conflict C2) | PR-01, GA-01, DH-01, HR-01, PY-01, AC-01 |
| Audit log | Read-only, append-only viewer with filters and attribution | GA-08 |
| Data protection | Retention policies and countdowns, data-subject requests, consent/lawful-basis register, **PII access log** | GA-12 |
| Export governance | Scope statement, row count, audited egress, artefact expiry | every report |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| HR Helpdesk / ticketing (M15.1) | **`[[M15a-helpdesk]]`** — sibling document |
| Custom report / query builder | **Phase 2** (blueprint §15) |
| Analytical dashboards (trend, attrition curves, 9-box) | **Phase 2** (blueprint §15; screen-inventory C2) |
| PTR, teaching-hour-norm, sanctioned-post reports | **Phase 2** (blueprint §15) |
| Affiliation-inspection and trust 12A/10(23C) exports | **Later / P2** (blueprint §1, §13) |
| The computation behind payroll and statutory figures | `[[M10-payroll-core]]`, `[[M11-statutory-compliance]]` — M15 renders, never recomputes |
| The audit **write** path and append-only enforcement | `[[M0-foundations]]` — M15 owns the read surface |
| Notification delivery of a scheduled report | `[[M14-notifications]]`; scheduling itself is `[proposed]` (OQ-M15-08) |

### API surfaces

- **GraphQL** — `reportDefinitions`, `reportRuns`, `runReport` (mutation), `auditLogs` (read, cursor),
  `retentionQueue`, `dataSubjectRequests`, `piiAccessLog`.
- **REST edge** — artefact download by short-lived signed URL (`[[M0-foundations]]`), because a report file
  is a file (`§7` "REST for files").
- `…/audit-logs` is **read-only by construction**: no create, update or delete operation exists in the
  schema (`M15 §API`, `M15 §Acceptance`).

---

## 3 · Data model

Tenant-owned; `tenant_id` NOT NULL plus RLS `ENABLE` + `FORCE` + policy **in the same migration**
(`guard-rls-policy`). Owner: oracle; policy content: wonder-woman.

### 3.1 `ReportDefinition` (new — the library is data, not code)

| Field | Type | Notes |
|---|---|---|
| `code`, `name_en`, `name_hi` | text | catalogue identity, both languages (O12) |
| `category` | enum `hr/attendance/leave/payroll/statutory/recruitment/appraisal/compliance` | drives which role sees it |
| `params_schema` | JSON | declared parameters and their types; **range defaults to the academic session** |
| `required_permissions` | JSON | what the caller must hold to run it at all |
| `sensitive_columns` | JSON | columns gated by a **field-level** PII permission (`§4.1`) |
| `forbidden_columns` | JSON | columns that exist in **no** version of this report (§4.5) |
| `min_cell_size` | int | default 5; the minimum-cell rule (§4.4) |
| `supports_formats` | JSON | `pdf`, `csv` |
| `is_active` | bool | |

### 3.2 `ReportRun` (new — an export is an event, not a click)

| Field | Type | Notes |
|---|---|---|
| `definition_id`, `tenant_id` | | |
| `requested_by_user_id` | FK User | the actor on the audit row |
| `params` | JSON | including the resolved **academic session** and date range |
| `scope_snapshot` | JSON | the scope the caller held **at run time** — a later role change never re-explains an old export |
| `columns_included` / `columns_withheld` | JSON | what was trimmed and why (stated on the artefact) |
| `row_count` | int | stated to the user and recorded (A64) |
| `suppressed_cells` | int | how many breakdowns the minimum-cell rule withheld |
| `status` | enum `queued/generating/ready/failed/expired` | |
| `artifact_ref`, `artifact_expires_at` | | short-lived signed URL, per-tenant key namespace |
| `format`, `generated_at`, `downloaded_at[]` | | each download is itself audited |

### 3.3 Data-protection entities (GA-12 — `§8` mandates these and no entity exists)

| Entity | Key fields | Notes |
|---|---|---|
| **`RetentionPolicy`** | data_class, retention_months, statutory_hold (bool), basis_text_en/hi, effective_from | Effective-dated; statutory-hold classes cannot be purged (`§8`) |
| **`ConsentRecord`** | subject (employee or candidate), purpose, lawful_basis, given_at, withdrawn_at, notice_version | DPDP lawful-basis register (O1) |
| **`DataSubjectRequest`** | subject, type `access/correction/erasure`, received_at, statutory_due_at, status, outcome_ref, fulfilled_by | The clock is visible end-to-end to the subject (A67) |
| **`RetentionAction`** | data_class, scope, action `anonymise/delete`, record_count, basis, approved_by, executed_at | Irreversible; **the log survives the data** (A66) |
| **`PIIAccessLog`** | viewer_user_id, subject_employee_id, field_class, context, viewed_at | `§8` says PII access is "access-logged"; this is where that lands and how GA-12 reads it |

`AuditLog` (§6.11) is **not** redefined here — it is `[[M0-foundations]]`'s table with a DB-level
append-only guarantee. M15 provides its read surface only.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a Principal runs a leave register

Meera opens PR-06. The library shows only the reports her permissions allow, in her language. She picks
*Leave register*; the range **defaults to the current academic session** (1 April 2026 onward, not
1 January) with the session named on screen. Her campus is fixed and stated — there is no "All campuses"
option in her filter, because she does not hold group scope (O7). She runs it. The engine resolves her
scope, drops the columns she has no field-permission for and **says which and why on the artefact header**,
applies the minimum-cell rule to any breakdown, and produces a PDF. The screen states: *"This export
contains 118 staff from Indiranagar campus — the scope you hold. This download is recorded."* The
`ReportRun` row and an `AuditLog` entry are written before the file is offered.

### 4.2 The academic-session frame

- Every date-ranged report takes its default range from the **current `AcademicYear`**
  (`[[M7-academic-calendar]]`, §6.6), not from `now().year`.
- The session is **named on the screen and printed on the artefact** ("Session 2026–27, 1 Apr 2026 –
  31 Mar 2027"), so an exported PDF can never be misread later.
- Where a report is genuinely statutory and therefore **financial-year** framed (Form 16, 24Q, PF/ESI
  returns), it says *financial year* explicitly and uses the FY — the two frames happen to coincide in
  India, but the label must not lie, and a future state or board with a different session must not silently
  inherit an FY assumption (`[[M11-statutory-compliance]]`).
- Where a report is genuinely **calendar-month** framed (a payroll register for August), it says so.
- Cross-session comparisons name both sessions. A range spanning a session boundary is allowed but is
  **labelled as spanning**, because leave balances reset per session (`[[M8-leave]]`).

### 4.3 States

| State | Behaviour |
|---|---|
| Empty (no data in range) | A designed empty state naming the range and scope — **never zeros**, which read as a fact |
| Generating / queued | Progress with the row estimate; large runs are queued and notified on completion (`[[M14-notifications]]`) |
| Ready | Artefact with a stated expiry; re-download is re-audited |
| Expired | The link is dead; regenerate — the previous run's parameters and row count remain readable |
| Permission-trimmed | Columns absent, with a header stating what was withheld and why (never a silently different number) |
| Suppressed cells | Breakdowns below `min_cell_size` withheld **with the reason in words** |
| Failed | The reason, and no partial artefact |

### 4.4 The aggregate-leak rule (the module's hardest requirement)

Three layers, applied in order:

1. **Scope.** Every query runs inside the caller's `RoleAssignment` union. A campus-scoped user has no
   "All campuses" option, receives no group total, and cannot reach a group total by summing (O7). Filter
   option lists, pickers and parameter dropdowns are scoped too — a filter that lists all departments
   leaks the org chart.
2. **Forbidden columns.** No report, in any format, at any permission level, contains **salary or CTC
   figures per person, PAN, Aadhaar, UAN, ESIC number, bank account or IFSC, medical detail, a leave
   *reason*, a BGV outcome, a grievance subject or body, or an appraisal comment**. These are
   `forbidden_columns` — they are not a permission away, they are absent (`§8`, O11, O13, O14,
   `§8 Child-safety`, `ui-compliance-requirements.md` §3). Money that *is* legitimately reportable is
   entity-level or aggregate (a payroll register at legal-entity level for the Accountant), or is gated by
   the field-level salary permission for the roles that hold it (`§4.1`).
3. **Minimum cell size.** Any breakdown along a **sensitive dimension** (leave type, appraisal score,
   grievance category, health-related absence, BGV state) is suppressed where the cell count is below
   `min_cell_size` (default **5**, per-tenant configurable) — and where suppressing one cell would allow it
   to be recovered by subtraction, the complementary cell is suppressed too. Suppression is stated in
   words, never rendered as a zero or a dash. The built `design/v3/pages/hr-reports.jsx` already
   demonstrates this on HR-36: a cycle with 4 finalized reviews suppresses its distribution with a stated
   reason; a cycle with 6 renders in full.

Non-sensitive operational counts (how many staff, how many present today, completion by stage) are **not**
suppressed — an operational fact for a two-person department is still an operational fact, and suppressing
it would make small departments unmanageable. The distinction is *evaluative or health-related data about
identifiable people* versus *operational counts*.

### 4.5 Exports

- Every run and every download writes an `AuditLog` entry with actor, definition, parameters, scope and
  row count (A64, `§4.2`).
- The artefact carries a header stating scope, session/range, row count, generation time, the generating
  user, and any withheld columns — so a PDF that leaves the building explains itself.
- Artefacts live under a per-tenant object-storage prefix behind short-lived signed URLs
  (`[[M0-foundations]]`); a URL minted for one tenant cannot be redeemed by another.
- **Bulk export of grievance tickets is refused** (O13), as is any export whose column set intersects
  `forbidden_columns`.
- CSV output is quoted and escaped so that a name beginning `=` cannot become a spreadsheet formula.

### 4.6 The audit log viewer (GA-08)

Read-only in the strongest sense: the GraphQL schema exposes no mutation, the DB refuses `UPDATE` and
`DELETE`, and the screen offers **no controls at all** beyond filter and export (A65). It shows actor,
action, entity, timestamp and a **change summary that never reveals a sensitive value** — a diff records
*that* a PAN changed, never the old or new value (`[[M0-foundations]]` AC-15, O6). Viewing the audit log is
itself logged. Retention and partitioning are open (`[[M0-foundations]]` OQ-M0-01).

### 4.7 The data-protection console (GA-12)

Retention countdowns per data class; the subject-request register with its statutory clock; the
consent/lawful-basis register; and the **PII access log** that makes `§8`'s "access-logged" real. Rules:

- A retention action inside a **statutory hold** (payroll, filings, service records) is **blocked with the
  reason**, never merely warned (O2, `§8`).
- Erasure is **anonymisation by default**; the audit entry and the `RetentionAction` record survive the
  data (A66).
- A correction is a **supersession**, never an in-place rewrite (`§4.3`, O6, O18).
- A data-subject access request produces the same pack as the employee's own *Download my record*
  (EMP-18), so the two cannot diverge.

### 4.8 Concurrency and performance

Report generation is a Celery job carrying tenant context; a run is idempotent per (definition, params,
requester, minute) so a double-click yields one artefact (`§7`, O17). Large runs are queued and notified.
Queries must use the `(tenant_id, …)` indexes — an RLS predicate that degrades to a sequential scan on a
2,000-staff group is a performance bug that shows up first here (`§9 Performance`).

### 4.9 i18n and a11y

Report names, column headers, parameter labels, empty states, suppression reasons and export banners are
EN + हिन्दी (O12, `guard-i18n-strings`). Money and dates use the same canonical Indian form in both
languages; a figure never differs between languages. Suppression, permission-trimming and queued states
are conveyed **in words**, not by colour or a dash. Tables are screen-reader navigable with header
association; charts always have a table equivalent (a distribution that exists only as a shape is
inaccessible, `DESIGN.md` principle 3 notwithstanding — shape first, but never shape only).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Citation |
|---|---|---|
| AC-M15-01 | **A payroll register reconciles to the sum of its payslips**, and the reconciliation statement is printed on the report. | **`M15 §Acceptance`** |
| AC-M15-02 | **The audit log is append-only and the read API exposes no create, update or delete**; GA-08 offers no controls beyond filter and export. | **`M15 §Acceptance`**, `§4.2`, A65 |
| AC-M15-03 | Viewing the audit log is itself written to the audit log. | A65, `§8` |
| AC-M15-04 | An audit entry for a sensitive field records **that** it changed, never the old or new value. | `§8`, O6, `[[M0-foundations]]` |
| AC-M15-05 | **Every date-ranged report defaults to the current academic session (1 April onward), not a calendar year**, and the session is named on screen and printed on the artefact. | **`§9 Localisation`**, `[[M7-academic-calendar]]`, HR-37 (built) |
| AC-M15-06 | A report that is genuinely financial-year or calendar-month framed says so explicitly; no report displays a range whose frame is ambiguous. | `§9`, `[[M11-statutory-compliance]]` |
| AC-M15-07 | A range spanning an academic-session boundary is labelled as spanning, because leave balances reset per session. | `[[M8-leave]]`, `§6.7 LeaveBalance` |
| AC-M15-08 | Every report runs inside the caller's scope union; a campus-scoped user is offered **no "All campuses" option** and receives **no group total**. | **O7**, `M2 §Acceptance` |
| AC-M15-09 | Parameter dropdowns, filters and pickers are scope-filtered — an option list never reveals a department, campus or person outside scope. | **O7** |
| AC-M15-10 | **No report, in any format, at any permission level, contains** per-person salary or CTC, PAN, Aadhaar, UAN, ESIC, bank account, IFSC, medical detail, leave reason, BGV outcome, grievance subject or body, or an appraisal comment. These columns are absent, not permission-gated. | **`§8`**, **O11**, O13, O14, `§8 Child-safety`, §3 "never build" |
| AC-M15-11 | Columns requiring a field-level PII permission are **absent** for a caller without it, and the artefact header states which columns were withheld and why — never a silently different number. | `§4.1`, **O3**, PR-06 non-happy paths |
| AC-M15-12 | **A breakdown along a sensitive dimension is suppressed where the cell count is below `min_cell_size` (default 5)**, and the complementary cell is suppressed where subtraction would recover it. | **O7** (a total is an inference channel), HR-36 (built) |
| AC-M15-13 | Suppression is stated in words with the reason; a suppressed cell is never rendered as a zero, a dash or an empty cell. | O7, `§9 Accessibility` |
| AC-M15-14 | Operational counts (headcount, present today, completion by stage) are **not** suppressed; the rule applies to evaluative and health-related breakdowns about identifiable people. | HR-36 (built precedent) |
| AC-M15-15 | **Every report run and every download is audited** with actor, definition, parameters, scope snapshot and row count. | **A64**, `§4.2`, `§8` |
| AC-M15-16 | The user is told, before download, the scope and row count and that the export is recorded. | A64 |
| AC-M15-17 | Artefacts are stored under a per-tenant key prefix and served by short-lived signed URL; a URL minted in one tenant cannot be redeemed in another. | `§8`, `[[M0-foundations]]` |
| AC-M15-18 | The scope recorded on a `ReportRun` is the scope held **at run time**; a later role change never alters the explanation of a past export. | `§4.2`, O6 |
| AC-M15-19 | Bulk export of grievance tickets is refused, and no export may include a `forbidden_column`. | **O13**, `§8` |
| AC-M15-20 | CSV output is escaped so a cell beginning with `=`, `+`, `-` or `@` cannot execute as a spreadsheet formula. | `§8` (defence in depth) |
| AC-M15-21 | A double-click or retry produces one artefact, not two runs. | `§7 Concurrency`, O17 |
| AC-M15-22 | The report library is **data** (`ReportDefinition`), not hardcoded screens; adding a report does not require a new screen. | `guard-hardcoded-values`, HR-37 (one shared runner) |
| AC-M15-23 | Report names, headers, empty states, suppression reasons and export banners exist in EN and हिन्दी; money and dates are identical in both. | **O12**, `guard-i18n-strings` |
| AC-M15-24 | GA-12 shows retention countdowns per data class, the data-subject request register with its statutory clock, the consent/lawful-basis register, and the PII access log. | **`§8 Consent & retention`**, O1, O2, G2 |
| AC-M15-25 | A retention or erasure action against data inside a **statutory hold** is **blocked with the reason**, not warned. | `§8`, **O2**, A66 |
| AC-M15-26 | Erasure defaults to anonymisation; the `RetentionAction` record and its audit entry survive the erased data. | A66, `§4.2` |
| AC-M15-27 | A DPDP correction is applied as a **supersession**, never an in-place edit, with the request referenced in the audit trail. | `§4.3`, **O6**, A67 |
| AC-M15-28 | A subject-access pack is generated by the same code path as the employee's own *Download my record* (EMP-18), so the two cannot diverge. | A67, `[[M13-ess-mobile]]` |
| AC-M15-29 | Every unmasking of a sensitive field anywhere in the product writes a `PIIAccessLog` row, and GA-12 can show who viewed whose data. | **`§8`**, **O3** |
| AC-M15-30 | Role homes (PR-01, GA-01, DH-01, HR-01, PY-01, AC-01) are MVP; *analytical* dashboards are not built in this release. | screen-inventory C2, blueprint §15 |
| AC-M15-31 | A large report is queued, generated asynchronously with tenant context, and its completion notified via `[[M14-notifications]]`. | `§9 Performance`, `§2` |
| AC-M15-32 | Every report reads computed figures from the owning module; M15 never recomputes payroll, statutory or appraisal values. | `M15 §Purpose`, `M10`, `M11`, `M17` |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Academic-session default resolution incl. a mid-session run, a session boundary and a tenant whose AY is not Apr–Mar; frame labelling per report; `min_cell_size` suppression including complementary-cell recovery; column trimming against a permission fixture; forbidden-column rejection; CSV formula escaping; artefact header composition; run idempotency fingerprint |
| Integration | **bane** | Scope binding for every report × role (a Principal never receives a group total; a Dept Head's option lists contain only their department); permission-trimmed columns absent, not blanked; a cross-tenant artefact URL is refused; audit rows written before the artefact is offered; audit `UPDATE`/`DELETE` refused; `PIIAccessLog` written on every reveal |
| **Leak testing** | **bane** | The differencing attack: run every pair of reports a single role can run and assert no combination reconstructs a suppressed cell or an out-of-scope total; small-department leave-by-type; two-person appraisal distribution; a grievance-category count that identifies a raiser |
| Compliance review | **gordon** | The `forbidden_columns` list against `§8`, O11, O13, O14 and the child-safety rule; retention blocks inside statutory holds; erasure leaves the audit intact |
| Performance | **bane** | A 2,000-staff group's registers within the `§9` envelope, using the `(tenant_id, …)` indexes and not degrading to a sequential scan under RLS |
| a11y and Hindi | **two-face** | Suppression and trimming stated in words; table equivalents for every chart; Devanagari headers do not truncate |

---

## 7 · Proposed stories

Sprint 11 unless noted. Owners per module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M15-S01 | `ReportDefinition` + `ReportRun` models and RLS | The library as data, and the export as a recorded event. | oracle | 5 | M0-S04 |
| M15-S02 | Report engine: scope binding, permission trimming, artefact generation, signed URLs | The shared runner every report screen reuses. | cyborg | 8 | M15-S01 |
| M15-S03 | **Academic-session framing service** | The default that stops every report being subtly wrong. | cyborg | 3 | M15-S02, M7 |
| M15-S04 | **Minimum-cell suppression + complementary-cell logic** | The rule that stops a breakdown pointing at one person. | cyborg | 5 | M15-S02 |
| M15-S05 | Export audit + artefact header + row-count statement | An export that explains itself and is on the record. | cyborg | 3 | M15-S02 |
| M15-S06 | HR report set (headcount, joiners/leavers, document compliance, contract expiry, probation) | HR-37's library. | cyborg | 5 | M15-S03 |
| M15-S07 | Attendance and leave registers | PR-06's core, on the session frame. | cyborg | 5 | M15-S03, M8, M9 |
| M15-S08 | Group consolidation reports (GA-09) | Cross-campus and per-legal-entity, for the roles that hold group scope. | cyborg | 5 | M15-S06 |
| M15-S09 | PR-06 / HR-37 / GA-09 web surfaces on one runner component | One component, per the screen inventory's own instruction. | green-lantern | 5 | M15-S02 |
| M15-S10 | **GA-08 audit log viewer** (read-only, self-logging) | The trail, made readable without becoming editable. | green-lantern | 5 | M0-S09 |
| M15-S11 | Audit read API with filters, cursor pagination and redacted diffs | The read half of `§4.2`. | cyborg | 5 | M0-S09 |
| M15-S12 | **DPDP entities**: retention policy, consent, subject request, retention action, PII access log | The tables `§8` requires and nothing has yet. | oracle | 5 | M0-S04 |
| M15-S13 | **GA-12 data-protection console** | Retention countdowns, subject requests, consent register, PII access log. | green-lantern | 8 | M15-S12 |
| M15-S14 | PII access logging hooked into every reveal, product-wide | The control that makes "access-logged" true rather than aspirational. | wonder-woman | 5 | M15-S12 |
| M15-S15 | Role homes for the six roles | A landing screen per role — MVP; analytical dashboards are not. | green-lantern | 5 | M15-S02 |
| M15-S16 | Leak-test suite (differencing, small cells, scope pairs) | The suite that decides whether the aggregate rules actually hold. | bane | 8 | M15-S04, M15-S08 |

**Total: 16 stories, 85 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M15-01 | **No `ReportDefinition` / `ReportRun` entity exists**, yet `§8` requires exports to be audited with a row count and A64 requires the scope stated. | Without a run record there is no export audit trail, only a generic audit line with no parameters. | Add both as in §3.1–3.2. |
| OQ-M15-02 | **The minimum-cell threshold has no source.** The built design uses 5 (`FINALIZE_THRESHOLD` in `hr-reports.jsx`); the spec names no rule at all. | Different screens will pick different thresholds and the guarantee becomes folklore. | One tenant-level `min_cell_size`, default 5, per-definition override; adopt the built design's precedent. **Needs a product ruling to become binding.** |
| OQ-M15-03 | **Does the aggregate rule apply to operational counts?** This spec says no (AC-M15-14) on the judgement that a two-person department must still be manageable. | If the answer is yes, small departments become invisible to their own Head. | Confirm the split: evaluative/health-related suppressed, operational not. |
| OQ-M15-04 | **`§8` requires PII access logging and nothing implements it.** No entity, no hook, no surface until GA-12. | O3's "audited reveal" and A65's audit story are both unfulfillable without it; it is also the control gordon will look for first. | `PIIAccessLog` (§3.3) plus a single reveal path all modules must call. |
| OQ-M15-05 | **Audit-log retention and partitioning are unspecified** (`[[M0-foundations]]` OQ-M0-01), and GA-08 already renders a "retention boundary reached" state. | An unpartitioned audit table becomes the largest table in the product within a year, and a retention rule invented later cannot be applied retroactively without breaking append-only. | Monthly partitioning from day one; retention as a policy record, not a delete. Legal call on the minimum. |
| OQ-M15-06 | **Who is the tenant's data-protection owner?** GA-12's actions are assigned to "Group Admin / DPO-equivalent"; `M2 §Seed roles` has no such role. | Retention execution and erasure are the most dangerous actions in the product and currently belong to the most powerful role by default. | A distinct `data_protection.manage` capability flag, grantable to one person, with a second approver on erasure (screen-inventory Q27). |
| OQ-M15-07 | **Dashboards: `M15 §Business rules` lists "campus + group dashboards" inside an MVP module; blueprint §15 tags them `[P2]`** (screen-inventory C2). | Building analytical dashboards in Sprint 11 would consume the sprint that owes reports, audit and DPDP. | The screen inventory's split stands: role **homes** MVP, analytical dashboards P2. Recorded as applied here; BATMAN to confirm. |
| OQ-M15-08 | **Report scheduling is `[proposed]`** on PR-06/HR-37 and named nowhere in M15. | Schools genuinely want a monthly register e-mailed to the trust; but a scheduled export is an unattended egress of scoped data. | Out of MVP. If it lands, the schedule inherits the requester's scope **at send time** and each delivery is audited separately. |
| OQ-M15-09 | **Statutory registers are framed by financial year while HR reports are framed by academic session.** In India both start 1 April, so the divergence is invisible today. | A tenant with a non-April session (a coaching institute, an international school on an August session) would silently mis-frame every statutory report. | Model the two frames separately from day one, as §4.2 specifies. Confirm no MVP tenant runs a non-April session. |
| OQ-M15-10 | **Is a "download my record" pack the same artefact for the subject and for a DPDP access request?** Two code paths would drift. | A subject-access response that differs from what the employee can self-serve is a compliance inconsistency. | One generator, two entry points (AC-M15-28). |
| OQ-M15-11 | **Blueprint §15 tags "Standard payroll/attendance/leave/compliance reports `[MVP]`" but `[P2]` for dashboards and the custom builder, while `M15 §Purpose` bundles "reports + audit + dashboards" together.** | Reading the module purpose as a scope list would pull P2 work into Sprint 11. | Blueprint PART C governs; M15's Purpose sentence is descriptive, not a scope list. Flagged rather than corrected. |
| OQ-M15-12 | **Inspection-ready registers (CBSE/NCTE/state board) are `[Later]`** (blueprint §1) but are the reports a school is *legally* asked for. | A school will ask on day one why an inspection register is missing. | Keep Later; make sure the report engine's definition model can express one without a new engine. |

**Conflicts with built design:** none. `design/v3/pages/hr-reports.jsx` already implements the
academic-session default and small-cell suppression with stated reasons, which this specification codifies
as AC-M15-05 and AC-M15-12. GA-08 and GA-12 are unbuilt.

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
