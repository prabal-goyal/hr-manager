# M8 — Leave · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M8 Leave (build-plan Sprint 5) · **Work item:** NA-21 · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M8, §6.7, §6.6, §4.2, §4.3, §7, §8, §11, §12 ·
> `docs/functionality-blueprint.md` §3 and **PART C** (the authoritative in/out list) ·
> `docs/ui-compliance-requirements.md` **O1, O2, O5, O6, O7, O11, O12, O17, O18** and the **§2.5 action
> guardrail register (A26–A29)** · `docs/decisions-to-finalize.md` **D2** (period-level leave and
> substitution deferred to Phase 2; half-day stays MVP), **D3** (F&F and leave encashment pulled into MVP) ·
> `docs/executive-summary.md` (differentiators 1 and 2) · `docs/competitor-analysis.md` (the empty column) ·
> `docs/screen-inventory.md` EMP-05, EMP-06, HR-26, HR-27, HR-28, DH-02, PR-03 ·
> built design `design/v3/pages/leave.jsx`, `hr-leaveatt.jsx`, `depthead.jsx`, `principal.jsx`.
>
> **Related specs:** [[M7-academic-calendar]] (the frame this module reads) · [[M3-core-hr-people]]
> (`is_vacation_staff`, `reports_to`) · [[M9-attendance]] (the day statuses leave writes and the paid-days
> owner) · [[M10-payroll-core]] (LOP consumer) · [[M10c-arrears-pay-revision]] (the route for a correction
> that lands after a payroll freeze) · [[M12-full-and-final]] (leave encashment at exit) ·
> [[M11a-statutory-config-versioning]] (statutory leave entitlements) · [[M13-ess-mobile]] (apply and
> approve from a phone) · [[M14-notifications]] (approval and escalation notices) ·
> [[M15-reporting-platform]] (leave register, override-frequency reporting) · [[M2-identity-access]]
> (`leave.apply`, `leave.approve`, `leave.manage`) · [[M0-foundations]] (tenancy, audit, effective-dating).

---

## 1 · Intent

A school's year is not a calendar year, and a teacher's leave is not an office worker's leave. A generic
HRMS grants a teacher 18 earned-leave days and then quietly lets her apply for them in the middle of the
board exams. Naveya does neither. Leave here is governed by the academic year and its terms
([[M7-academic-calendar]]): a teacher is **vacation staff** — she is paid through the autumn and winter
vacations and therefore accrues **no earned leave at all**, because the vacation *is* the leave; the
accounts clerk beside her is non-vacation staff on a twelve-month year and accrues EL normally. The exam
term is a **blackout window** read from the calendar, not a date somebody typed into leave settings. And an
unpaid day is not a note in a register: it is a number that reduces somebody's salary, so M8 must be exact
about what it decides, what it hands to [[M9-attendance]], and what [[M10-payroll-core]] is allowed to do
with it.

This module and [[M9-attendance]] are the pair a school buys the product for. `docs/executive-summary.md`
names academic-calendar leave and vacation-staff logic as differentiators **1 and 2** of four, and
`docs/competitor-analysis.md` records both as an unbroken column of ✕ across Keka, Zoho People, greytHR and
HROne. Everything else in Naveya has a competitor; this does not.

---

## 2 · Scope & surfaces

### In scope (MVP)

| Area | What M8 delivers |
|---|---|
| Policy configuration | `LeavePolicy` per academic year and scope; `LeaveType` with accrual rule, carry-forward cap, encashable flag, **`applies_to_vacation_staff`**, `allows_half_day`; supersession of an active type (§4.3) |
| Leave-type catalogue | The spec's codes `EL · CL · SL · COMP · DUTY · MAT · LOP` (§6.7) **plus** the education types the blueprint tags MVP — on-duty/exam duty, study, sabbatical, paternity, bereavement, marriage (blueprint §3) |
| **Vacation-staff rules** | Accrual, carry-forward, encashment and the exit interaction, each stated for vacation and non-vacation staff separately (§4.1 below) |
| **Forced vacation-leave + vacation-period pay** | During a `vacation` term, vacation staff are on a paid break requiring no application and deducting no balance; non-vacation staff are not. Blueprint §3 tags this **MVP** ("★ Forced vacation-leave during breaks and vacation-period pay handling") and the ShriConnect deck slide 08 shows it as "Vacation staff on forced break" — §4.1.5 below |
| Balances | `LeaveBalance` per employee × type × academic year (opening, accrued, used, balance); initialisation at policy activation; append-only adjustments |
| Application & approval | `LeaveRequest` with validation (balance · blackout · vacation-staff applicability · overlap), multi-level `approval_chain` with escalation, cancel, reject |
| **Blackout windows** | Binding of leave types to exam/admission windows read from [[M7-academic-calendar]]; Principal override with justification; conflict handling when a blackout is declared over already-approved leave |
| Half-day | Half-day application where `allows_half_day`, at first-half/second-half granularity |
| Comp-off | Credit earned by working a holiday or weekly-off, evidenced by an [[M9-attendance]] record |
| **LOP linkage** | The decision that a day is unpaid, published to [[M9-attendance]] for folding into paid days, and consumed by [[M10-payroll-core]] |
| Encashable balance | A frozen, per-type encashable-days figure at exit for [[M12-full-and-final]] — **days, never rupees** |
| AY close | Carry-forward computation at academic-year close, capped per type, with the excess lapsing and audited |

### Explicitly out of scope

| Out | Why / owned by |
|---|---|
| **Period-level leave** (leave for periods 3–5 of a day) | **Phase 2, decision D2.** Granularity in MVP is full-day or half-day only |
| **Leave → substitution linkage** (approved leave raising a cover requirement) | **Phase 2, decision D2** — the substitute-teacher module is deferred and this linkage went with it |
| **Timetable import** | **Phase 2, decision D2** |
| The academic year, terms, holiday calendars | [[M7-academic-calendar]] — M8 **reads** them and defines no dates of its own |
| `is_vacation_staff` on the employee; `reports_to` | [[M3-core-hr-people]] |
| The paid-days figure itself | [[M9-attendance]] — see §4.5 |
| Money: the value of an unpaid day, or of an encashed day | [[M10-payroll-core]] / [[M12-full-and-final]] |
| Notification delivery | [[M14-notifications]] |
| Probation/seniority-based accrual, sandwich-leave, restricted/floating holidays, team leave calendar | Blueprint §3 tags these **P2** |

> **D2 boundary marker.** Where a Phase-2 feature would attach, MVP leaves a named seam rather than a
> silence: `LeaveRequest` carries no period reference, and approving leave emits a domain event
> (`leave.approved`) that the Phase-2 substitution module will subscribe to without M8 changing.

### API surfaces (§7 — GraphQL primary, REST edge for files)

- **GraphQL:** `leavePolicies`, `leaveTypes`, `leaveBalances`, `leaveRequests` queries; mutations
  `leaveRequestApply`, `leaveRequestApprove`, `leaveRequestReject`, `leaveRequestCancel`,
  `leaveBalanceAdjust`, `leavePolicyActivate`, `leaveTypeSupersede`, `blackoutBindingSet`,
  `blackoutOverrideGrant`. Spec §M8 §API names `…/leave-types`, `…/leave-balances`, `…/leave-requests`
  (+ `/approve`, `/reject`, `/cancel`) — those are the REST-edge equivalents where a client needs them.
- **REST edge:** leave-statement and leave-register exports (files), medical-certificate attachment upload.
- **Consumers:** [[M13-ess-mobile]] (EMP-05, EMP-06 and the manager approval surface), the web console
  (HR-26/27/28, DH-02, PR-03), [[M9-attendance]] (day statuses), [[M10-payroll-core]] and
  [[M12-full-and-final]] (read-only contracts in §4.5 and §4.6).

### Screens

EMP-05 My leave · EMP-06 Apply for leave · HR-26 Leave policy & types · HR-27 Leave balances register ·
HR-28 Leave requests console · DH-02 Leave approvals · PR-03 Leave escalations & campus leave.
Built today: `leave.jsx` (EMP-05/06), `hr-leaveatt.jsx` (HR-26..30), `depthead.jsx` (DH-02),
`principal.jsx` (PR-03).

---

## 3 · Data model

Every table below is **tenant-owned**: it carries a NOT-NULL `tenant_id` FK, and `ENABLE ROW LEVEL
SECURITY` + `FORCE ROW LEVEL SECURITY` + a `USING`/`WITH CHECK` policy created **in the same migration as
the model** ([[M0-foundations]], `guard-rls-policy`). Policy *content* is wonder-woman's; the column and
the migration are oracle's. No exceptions in this module.

### 3.1 `LeavePolicy` (§6.7)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK | RLS |
| `scope_type` / `scope_id` | enum + UUID | org or campus ([[M1-organization-tenancy]]) |
| `academic_year_id` | FK | [[M7-academic-calendar]]; a policy is meaningless without one |
| `name`, `status` | str, enum `draft/active/superseded` | |
| `activated_at`, `activated_by` | ts, FK | activation initialises balances — audited (§4.2) |

### 3.2 `LeaveType` (§6.7)

| Field | Type | Notes |
|---|---|---|
| `policy_id` | FK | |
| `code` | str | §6.7 enumerates `EL/CL/SL/COMP/DUTY/MAT/LOP`. The blueprint requires six more as MVP (study, sabbatical, paternity, bereavement, marriage, on-duty) and the built HR-26 ships twelve. **`code` must therefore be a per-tenant extensible string with a reserved-code registry, not a fixed DB enum** — see OQ-M8-01 |
| `accrual_rule` | JSON | rate, frequency, pro-ration on joining, monthly cap. Never a code constant (`guard-hardcoded-values`) |
| `carry_forward_cap` | int/Decimal | days carried into the next AY; `0` = does not carry |
| `encashable` | bool | consumed by [[M12-full-and-final]] |
| **`applies_to_vacation_staff`** | bool | **no default** — the education-differentiating switch, set explicitly (built HR-26 enforces this) |
| `allows_half_day` | bool | |
| `max_consecutive_days` | int null | `[proposed]`, on the built screen |
| `is_statutory` | bool | when true, the entitlement is read from the pinned `StatutoryConfig` ([[M11a-statutory-config-versioning]]) and cannot be edited on HR-26 — see OQ-M8-02 |
| `effective_from`, `superseded_by` | date, FK self | active types supersede, never edit in place (§4.3) |

### 3.3 `LeaveBalance` (§6.7)

| Field | Type | Notes |
|---|---|---|
| `employee_id`, `leave_type_id`, `academic_year_id` | FK | unique together |
| `opening`, `accrued`, `used`, `balance` | Decimal(5,1) | half-day granularity needs `.5`; **Decimal, never float** (`guard-money-float` applies to leave days too, because they convert to money at encashment). Invariant `opening + accrued − used = balance`, asserted in the DB and in the DOM (built HR-27) |
| `last_accrued_on` | date | idempotence anchor for the accrual job |

**A vacation-staff employee has no `LeaveBalance` row for a type whose `applies_to_vacation_staff` is
false.** The row is *absent*, not zero — the UI must render an explanation, and a zero row would be
indistinguishable from an exhausted balance.

### 3.4 `LeaveBalanceAdjustment` — **new, append-only**

§6.7 gives no adjustment entity, but HR-27 grants HR a balance adjustment with a required reason, and
§4.2 forbids overwriting. Fields: `balance_id`, `delta` (Decimal, signed), `reason` (required),
`effective_date`, `actor_id`, `created_at`. A correction appends a further row; nothing is edited.

### 3.5 `LeaveRequest` (§6.7)

| Field | Type | Notes |
|---|---|---|
| `employee_id`, `leave_type_id` | FK | |
| `from_date`, `to_date` | date | |
| `day_count` | Decimal(4,1) | computed server-side, excluding holidays and weekly-offs |
| `is_half_day` | bool | **insufficient — see 3.6 and OQ-M8-03** |
| `reason`, `reason_category` | text, enum | reason required; category `[proposed]` |
| `status` | enum `pending/approved/rejected/cancelled` | |
| `approval_chain` | JSON | ordered steps with actor, decision, timestamp, note |
| `is_lop` | bool | true when the type is `LOP` or the applicant explicitly accepted LOP against an exhausted balance |
| `applied_by_id` | FK null | set when HR applies on behalf (HR-28); the audit shows both people |
| `academic_year_id` | FK | a request belongs to exactly one AY — see 4.4 |

### 3.6 `LeaveRequestDay` — **new**

`is_half_day` as a single boolean cannot express "full days Monday to Wednesday, second half of Thursday",
which HR-26's `allows_half_day` plainly permits and which changes paid days by 0.5. One row per calendar
day: `request_id`, `date`, `portion` (`full` / `first_half` / `second_half`), `is_deducted`
(false for a holiday or weekly-off falling inside the range). This is also the row
[[M9-attendance]] joins to when it stamps a day's status.

### 3.7 `CompOffCredit` — **new**

M8 §Business rules requires "comp-off for holiday work" and supplies no mechanism. Fields:
`employee_id`, `source_attendance_id` (the [[M9-attendance]] record on a `holiday`/`weekly_off` day),
`days` (Decimal), `credited_by`, `expires_on`, `status` (`proposed/credited/consumed/lapsed`).
Reconciliation *proposes*; the Dept Head confirms; expiry is policy-driven, not a literal (the built
`leave.jsx` states "lapses 90 days after you earn it" — that number must come from `accrual_rule`, see
OQ-M8-04).

### 3.8 `BlackoutBinding` — **new**

Which leave types a given calendar window blocks. Fields: `policy_id`, `term_id` (FK into
[[M7-academic-calendar]]), `blocked_type_ids` (M2M), `created_by`. **M8 stores the binding; it never
stores the dates** — the dates live on the `Term` and are read at validation time. A blackout date literal
anywhere in M8 code or config is a `guard-hardcoded-values` violation.

### 3.9 `BlackoutOverride` — **new**

`request_id`, `term_id`, `justification` (required), `granted_by`, `granted_at`. Append-only; feeds the
override-frequency report in [[M15-reporting-platform]] so an exception cannot quietly become the rule.

### 3.10 `BlackoutConflict` — **new**

Raised when a blackout window is declared over dates that already carry approved leave (§4.3.4).
`request_id`, `term_id`, `detected_at`, `resolution` (`kept/withdrawn`), `resolved_by`, `resolution_reason`.

---

## 4 · Behaviour walk-through

### 4.1 The vacation-staff distinction — stated for both cases, four times

`is_vacation_staff` lives on the employee ([[M3-core-hr-people]]). `applies_to_vacation_staff` lives on the
leave type (§6.7). The product of the two decides whether a balance row exists at all.

#### 4.1.1 Accrual

| | Non-vacation staff (accounts, admin, transport, hostel, security — 12-month) | Vacation staff (teaching) |
|---|---|---|
| EL | Accrues per `accrual_rule` — the built policy uses 1.5 days per completed month, pro-rated in the joining month. A `LeaveBalance` row exists from policy activation | **Does not accrue. At all.** No `LeaveBalance` row is created for EL. M8 §Acceptance is categorical: "a teacher (vacation staff) cannot accrue EL". The paid break is the vacation `Term` itself, which requires no application and deducts nothing |
| CL / SL / COMP / DUTY / MAT and the education types | Accrue per their own rules | Accrue identically — the vacation-staff rule gates EL, not leave in general |
| Mid-year joiner | Pro-rated per `accrual_rule.proration` from the date of joining | Same, for the types that apply to them |

> The blueprint's phrasing is "EL doesn't accrue **or accrues at a reduced rate**". MVP implements the
> spec's categorical reading (no accrual). A tenant wanting reduced-rate accrual expresses it as a
> *separate* `LeaveType` with `applies_to_vacation_staff = true` and its own lower `accrual_rule` — a
> configuration path, not a code path. No branch in the accrual engine tests `is_vacation_staff` for a
> rate; it tests it only for applicability.

#### 4.1.2 Carry-forward at academic-year close

| | Non-vacation staff | Vacation staff |
|---|---|---|
| EL | Closing balance carries into the next AY up to `carry_forward_cap`; the excess **lapses** and the lapse is written as a `LeaveBalanceAdjustment` with reason `ay_close_lapse`, never as a silent zeroing | No EL balance exists, so nothing carries. The close job must skip cleanly rather than create a zero row |
| CL | Typically `carry_forward_cap = 0` — lapses in full, audited | Same |
| SL | Carries to its own cap | Carries identically |
| COMP | Does not carry across the AY; unconsumed credits lapse on `expires_on` | Same — and comp-off is the *only* balance a teacher typically ends the year holding |

The new year's opening balance is written as `LeaveBalance.opening` on the new AY's row, so
`opening + accrued − used = balance` still reconciles on both sides of the boundary.

#### 4.1.3 Encashment

| | Non-vacation staff | Vacation staff |
|---|---|---|
| Which types | Types with `encashable = true` — conventionally EL only | Types with `encashable = true` **that also apply to them**. In the built policy that set is **empty**: CL, SL, COMP, DUTY are all `encashable = false` |
| In-service encashment | Out of MVP scope (blueprint §3 tags the leave-year-end encashment process P2). The `encashable` flag is configured in MVP and consumed at exit | Same |
| At exit | Encashable days × day-rate, §10(10AA), computed by [[M12-full-and-final]] | The encashable figure is legitimately **zero days**, returned with a machine-readable reason code so the F&F screen explains it instead of rendering a bare `0` next to a teacher's twenty years of service |

**M8 never computes money.** It publishes days. The rupee value of a day is [[M10-payroll-core]]'s
divisor decision (OQ-M8-05) and the tax treatment is [[M11-statutory-compliance]]'s.

#### 4.1.4 The exit interaction with [[M12-full-and-final]]

On exit, M8 exposes `encashableBalanceAtExit(employee_id, last_working_day)` returning, per leave type:
days, `encashable`, and a reason code where days are zero. It is computed after (a) accrual pro-rated to
the exit month and (b) every approved leave day in the notice period deducted, and it is **frozen** — the
returned figure is stored on the settlement and a later leave adjustment cannot silently move a settled
number. For a vacation-staff teacher the call returns zero encashable days with reason
`no_encashable_type_applies`; for a non-vacation clerk it returns her capped EL balance. Both are normal
outcomes; neither is an error.

#### 4.1.5 Forced vacation-leave during breaks, and vacation-period pay

Blueprint §3 tags this MVP and it is the other half of "vacation in lieu of EL" — a teacher who accrues no
EL must actually *get* the vacation, and must be *paid* through it. It is not a leave request.

| | Non-vacation staff | Vacation staff |
|---|---|---|
| A day inside a `vacation` term ([[M7-academic-calendar]]) | An ordinary working day unless the campus holiday calendar says otherwise. Office and accounts staff work through the school vacation; if they want the time off they apply for EL | **Automatically a paid vacation day.** No application, no approval, no balance movement, no attendance expectation. [[M9-attendance]] stamps the day `holiday`-equivalent (see M9 §4.4 for which status), so it counts toward paid days and nothing counts as absence |
| Applying for leave inside the window | Normal | **Refused with an explanation, not an error** — "the school is closed on these days; vacation needs no application" (built `leave.jsx` renders exactly this) |
| Pay for the period | Ordinary paid days | **Full pay.** The vacation is remuneration in lieu of the EL that never accrued. Zero LOP days arise from a vacation window |
| A teacher who joins mid-year, before a vacation | Not applicable | Paid through the vacation from her date of joining; nothing is pro-rated *away* by the vacation itself |
| A teacher whose last working day falls just before or inside a vacation | Not applicable | **Unresolved — OQ-M8-15.** Whether a resigning teacher is paid through a vacation she will not return from is a school-policy question with real money attached, and no document in the repo answers it |

The forced-vacation rule is derived, never stored as leave rows: M8 does not create a `LeaveRequest` per
teacher per vacation day (which would generate hundreds of thousands of meaningless rows and pollute the
balance ledger). It is a **rule evaluated against the calendar** at reconciliation time by
[[M9-attendance]], with `is_vacation_staff` and the `Term.type = vacation` as its only inputs.

### 4.2 Happy path — applying and approving

1. Teacher opens EMP-06 on her phone ([[M13-ess-mobile]]). The type picker shows **only** types where
   `applies_to_vacation_staff` matches her flag. EL is absent, and EMP-05 carries the sentence explaining
   why (built `leave.jsx`).
2. She picks dates. `day_count` is computed server-side excluding campus holidays and weekly-offs
   ([[M7-academic-calendar]], the `Shift` weekly-off pattern in [[M9-attendance]]).
3. Live validation runs four checks: **balance**, **blackout**, **applicability**, **overlap**. A blackout
   hit is refused by name — "Term 1 examinations, 8–19 September" — with the route to ask the Principal
   (PR-03), never a generic "not allowed".
4. Submit creates `LeaveRequest(status=pending)` + `LeaveRequestDay` rows and an `approval_chain` routed
   to her Dept Head. **Nothing is decremented at submission.**
5. Dept Head approves on DH-02 (or the app). If policy escalates, it goes to the Principal (PR-03).
6. On final approval, in one transaction: balance decremented, `LeaveRequestDay` rows published to
   [[M9-attendance]] which stamps each date's `AttendanceRecord.status = leave`, `is_lop` flagged where
   unpaid, `leave.approved` emitted, employee notified ([[M14-notifications]]), everything audited (§4.2).

### 4.3 States, edge cases and error paths

**4.3.1 Applying against an exhausted balance.** The type stays selectable; the request converts to LOP
only on the applicant's **explicit** acceptance, and the consequence is stated in days-of-pay terms before
submit (EMP-06). An implicit downgrade to LOP is forbidden — it takes money from someone who did not agree
to it losing it.

**4.3.2 Applying for a day inside a vacation term.** Not an error and not a deduction: the system explains
that the school is closed and the day needs no application. A vacation day must never consume a balance.

**4.3.3 A blackout declared over dates with a request still `pending`.** Re-validated at approval; the
approver sees the blackout flag and cannot approve without a `BlackoutOverride`.

**4.3.4 A blackout declared over dates whose leave is already `approved` — the spec is silent, so M8 rules
explicitly.** Approved leave is **not** auto-revoked. An approval is a promise a teacher has already
arranged her life around; silently withdrawing it is a worse failure than the coverage risk it protects.
Instead, declaring a blackout window (HR-26) over dates carrying approved leave:

- refuses to save silently — the confirmation **lists every affected approved request** with its dates,
  applicant and approver, and requires an acknowledgement;
- writes a `BlackoutConflict` per affected request;
- surfaces those conflicts on PR-03 as an explicit **keep / ask-to-withdraw** decision **per request**,
  each with a required reason and each audited;
- never changes a `LeaveRequest.status` without a named human act. "Ask to withdraw" notifies the employee
  and, if she agrees, runs the ordinary `/cancel` path with the balance restored;
- leaves the [[M9-attendance]] day statuses untouched until a decision is taken, so paid days do not
  flicker underneath a payroll run.

**4.3.5 The blackout override.** PR-03 grants the Principal an override with a **required justification**,
recorded as a `BlackoutOverride` and reported by frequency. The spec grants no override at all (OQ-M8-06);
this spec proposes one because a blackout with no exception path produces either a rule people route
around or a teacher who cannot attend her own father's funeral during exam week. It is a *single*-approver
act: the Principal already **is** the escalation.

**4.3.6 Cancellation.** Permitted while `pending`, or `approved` but not yet commenced (M8 §API `/cancel`).
On cancel: balance restored, `AttendanceRecord` days reverted from `leave`, approver notified, audited.
Once the leave has commenced, or the month is frozen for payroll, cancellation is **shown disabled with the
reason** (built HR-28), not hidden.

**4.3.7 A request spanning an academic-year boundary.** `LeaveBalance` is keyed per AY, so a single request
cannot decrement two ledgers. M8 **splits at submission** into two linked requests, one per AY, validated
and approved together and shown to the applicant as one item (Q11, resolved here — see OQ-M8-07 for the
ruling request).

**4.3.8 A retrospective request for a frozen payroll month.** Refused as a leave application; routed to a
correction that lands in [[M10c-arrears-pay-revision]]. A frozen paid-days snapshot is never rewritten.

**4.3.9 The applicant is the approver.** A Dept Head's own request skips her level and routes to the
Principal. Self-approval is refused **server-side**, not merely hidden (§8).

**4.3.10 The approver is absent or the post is vacant.** The spec escalates *by policy*, not by absence
(Q10, still open — OQ-M8-08). MVP ships the reassignment control HR-28 and PR-03 already carry, audited,
as the manual answer.

**4.3.11 Policy or type changed mid-year.** Editing an active type **supersedes** it (§4.3) with a reason
and an effective date, and forces an explicit answer to "what happens to balances that already exist" —
recalculate or grandfather. The built HR-26 asks exactly this question and refuses to proceed without an
answer (Q23 — OQ-M8-09).

**4.3.12 Statutory entitlements.** Maternity is not a school's number to choose. Where `is_statutory` is
true the entitlement is read from the pinned, effective-dated `StatutoryConfig`
([[M11a-statutory-config-versioning]]) and HR-26 shows it locked. §6.10's `rules` JSON does not currently
list maternity/paternity days — OQ-M8-02.

### 4.4 Concurrency

- **Balance decrement is serialised.** Approval takes a row lock on the `LeaveBalance` and re-checks the
  balance inside the transaction. Two approvals racing on the last remaining day must not both succeed.
- **Two approvers acting at once** — idempotent; the second sees the first's decision rather than an
  error, per §7's `ETag`/`If-Match` and idempotency-key conventions.
- **Approval racing a payroll freeze** — approval takes the period's freeze state in the same transaction
  and refuses if the period is frozen, routing to arrears. Payroll must never read a paid-days figure that
  changed between reconciliation and compute.
- **Accrual is idempotent** — keyed on `last_accrued_on`; running the monthly job twice credits once.
- **Cancel racing approve** — whichever commits first wins; the loser reports what happened, by whom.

### 4.5 The LOP contract with [[M9-attendance]] and [[M10-payroll-core]] — who owns what

This is the ambiguity that becomes a wrong salary, so it is settled here rather than described.

| Concern | Owner | Rule |
|---|---|---|
| **Whether a day is unpaid** | **M8** | Only M8 decides that a leave day is LOP: either `LeaveType.code = LOP`, or the applicant explicitly accepted LOP against an exhausted balance. M8 publishes this as a per-day fact on `LeaveRequestDay` |
| **Whether an unexplained absence is unpaid** | **[[M9-attendance]]** | A day with no punch, no leave and no approved regularization is M9's LOP, not M8's. M8 has no opinion on days it was never asked about |
| **The paid-days figure** | **[[M9-attendance]]** — single writer | `paid_days = present + paid_leave + holidays + weekly_offs` (M9 §Business rules), computed by M9's reconciliation, which reads M8's approved days, M7's holidays and the shift's weekly-offs. **M8 does not compute paid days and M10 does not recompute them** |
| **The money** | **[[M10-payroll-core]]** | Payroll is a pure **reader** of the frozen paid-days snapshot bound to its run. If no frozen snapshot exists for the period, the run refuses to compute rather than reconstructing one |
| **A change after the freeze** | **[[M10c-arrears-pay-revision]]** | An approval, cancellation or regularization landing after the freeze produces an arrear adjustment. It never rewrites a paid month |

Two invariants follow, and both are testable:

1. `present + paid_leave + holidays + weekly_offs + lop = days_in_service_in_period` — where
   `days_in_service` respects date-of-joining and last-working-day, so a mid-month joiner's days before
   joining are `not_in_service`: neither paid nor LOP (the built PY-08 renders this as a sixth code).
2. `paid_days = days_in_service_in_period − lop`.

The **day-rate divisor** (what one LOP day costs) is [[M10-payroll-core]]'s, is configuration, and is
never a literal in M8 or M9 (`guard-hardcoded-values`). The built screens all use gross ÷ 30 — see
OQ-M8-05, which must be answered before payroll core ships.

### 4.6 i18n and accessibility

- Every user-facing string is **Hindi and English** via i18n files (`guard-i18n-strings`): leave-type
  names, accrual-rule descriptions, refusal reasons, blackout term names, and the vacation-staff
  explanation. A leave type's display name is an i18n key, not a row of free text typed by HR into a
  settings form — otherwise a Hindi-medium school's teacher reads her own leave policy in English.
- Weekday and month short forms are **translator-authored**, never sliced from the full word: truncating
  Devanagari mid-syllable collides (शुक्र / शनि).
- Status is conveyed by **word + glyph**, never colour alone (WCAG AA, two-face's audit). Approved,
  rejected, pending and blackout-blocked must be distinguishable in greyscale.
- The blackout refusal and the LOP consequence are announced via `aria-live`, because they are the two
  moments where a user is about to do something they did not intend.
- The balance ledger is a real table with row and column headers, and `opening + accrued − used = balance`
  reconciles in the rendered DOM, not only in the API response.
- Dates render in Indian format and the frame is the **academic year**, not Jan–Dec (§9 Localisation).

### 4.7 Privacy

A leave **type** is health-adjacent — `SL` is literally medical leave. Type and reason therefore never
appear on a shared surface: the campus day view and the roster grid say "On leave" and nothing more; the
type appears only on the request console and the per-type ledger, which are per-type by definition; the
free-text reason is readable only inside a single opened request. Medical-certificate attachments are
encrypted at rest and access-logged (§8). Nothing about leave is ever written to a log line
(`guard-pii-logging`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M8-AC-01 | Every M8 table carries a NOT-NULL `tenant_id` FK **and** `ENABLE`+`FORCE ROW LEVEL SECURITY` **and** a `USING`/`WITH CHECK` policy, all in the **same migration** as the model. | §3, `guard-rls-policy`, [[M0-foundations]] |
| M8-AC-02 | Tenant A's context reads zero of tenant B's `LeaveRequest`, `LeaveBalance`, `LeavePolicy` and `LeaveType` rows over both the ORM and raw SQL, and cannot insert a row bearing tenant B's id. | §8, §11 tenant-isolation, **O7** |
| M8-AC-03 | A `LeavePolicy` cannot be created without an `academic_year_id`; balances are keyed to that AY. | M8 §Business rules, §6.7 |
| M8-AC-04 | `applies_to_vacation_staff` has **no default** in the model, the API or the UI; creating a `LeaveType` without setting it is rejected with a field-level error. | M8 §Business rules, §6.7 |
| M8-AC-05 | **Vacation staff accrue no EL.** Activating a policy for a campus containing teaching and non-teaching staff creates EL balances for non-vacation staff only; a vacation-staff employee has **no EL `LeaveBalance` row** — absent, not zero. | **M8 §Acceptance** ("a teacher (vacation staff) cannot accrue EL"), §6.7 |
| M8-AC-06 | A vacation-staff employee's leave-type picker omits EL entirely, and an API `leaveRequestApply` naming EL for that employee is refused server-side with code `type_not_applicable`. | M8 §Business rules, §6.7 |
| M8-AC-07 | EMP-05 renders an **explanation** where EL would be, not a zero balance; the explanation names the vacation terms that stand in its place. | M8 §Acceptance, `docs/screen-inventory.md` EMP-05, **O12** |
| M8-AC-08 | **Accrual, both cases:** a non-vacation joiner mid-month accrues EL pro-rated per `accrual_rule` from the date of joining; a vacation-staff joiner accrues nothing for EL and accrues normally for CL/SL/COMP. Rates come from `accrual_rule`, never from code. | M8 §Business rules, `guard-hardcoded-values` |
| M8-AC-09 | **Carry-forward, both cases:** at AY close a non-vacation employee's EL carries up to `carry_forward_cap` with the excess written as an audited lapse adjustment; a vacation-staff employee's close runs without creating or touching an EL row, and their comp-off credits lapse per their own expiry. | M8 §Business rules, §6.7, §4.2 |
| M8-AC-10 | **Encashment, both cases:** `encashableBalanceAtExit` returns capped EL days for a non-vacation leaver, and **zero days with reason `no_encashable_type_applies`** for a vacation-staff leaver whose applicable types are all `encashable = false`. Both return **days**, never an amount. | M8 §Business rules, [[M12-full-and-final]], §10(10AA) |
| M8-AC-11 | **F&F interaction, both cases:** the exit figure is computed after pro-rated accrual to the last working day and after deducting approved leave in the notice period, is **frozen** onto the settlement, and a later balance adjustment does not move a settled figure — it appends an adjustment visible on the audit trail. | M12 §Business rules, §4.2, **O6** |
| M8-AC-11a | **Forced vacation-leave:** a day inside a `vacation` `Term` is, for a **vacation-staff** employee, a paid non-working day requiring no application and moving no balance; for a **non-vacation-staff** employee it is an ordinary working day. The rule is evaluated against the calendar — no `LeaveRequest` rows are generated for vacation days. | blueprint §3 ("★ Forced vacation-leave during breaks … **[MVP]**"), M7 §Business rules, §6.6 `Term.type` |
| M8-AC-11b | **Vacation-period pay:** a vacation window produces **zero LOP days** for vacation staff, and a teacher present for a full month containing a vacation term is paid full paid-days. A leave application falling wholly inside a vacation window is refused with an **explanation**, never an error or a deduction. | blueprint §3, M8 §Business rules, **O12** |
| M8-AC-12 | Leave-day balances are `Decimal`, never `float`, at half-day precision; `opening + accrued − used = balance` holds in the database, the API and the rendered register. | `guard-money-float`, §6.7 |
| M8-AC-13 | A balance adjustment **appends** a `LeaveBalanceAdjustment` with a required reason and never overwrites the balance history; a correction is a further append. | §4.2 append-only, HR-27, **O6** |
| M8-AC-14 | **Blackout is read from the calendar, not hardcoded:** a leave request whose dates fall inside a `Term` bound as a blackout for that leave type is refused at submit **and** re-validated at approval, naming the term and its dates. No blackout date literal exists anywhere in M8. | **M8 §Acceptance** ("a leave request during an exam term is blocked"), §6.6, `guard-hardcoded-values` |
| M8-AC-15 | Changing the exam term's dates in [[M7-academic-calendar]] changes which requests are blocked, with no M8 change and no data migration. | M7 §Acceptance, M8 §Business rules |
| M8-AC-16 | **A blackout declared over already-approved leave never auto-revokes it.** Saving the binding lists every affected approved request, requires acknowledgement, writes a `BlackoutConflict` per request, and surfaces a per-request keep / ask-to-withdraw decision to the Principal — each with a required reason and audited. No `LeaveRequest.status` changes without a named human act. | M8 §Business rules (silence resolved here), §4.2 |
| M8-AC-17 | A Principal may override a blackout only with a **required justification**; the override is stored, audited as an override, and counted in an override-frequency report. Without justification the control is **disabled with the reason shown**. | PR-03, §4.2, [[M15-reporting-platform]] |
| M8-AC-18 | Approval routes to the Dept Head and escalates to the Principal where policy requires; a Dept Head's own request skips her level; **self-approval is refused server-side**, not merely hidden in the UI. | M8 §Workflow, §8, **O5**, **A27** ("You cannot approve your own leave") |
| M8-AC-19 | Balance decrement, attendance stamping and LOP flagging happen **at final approval**, never at submission, and all in one transaction — a failure of any part leaves none of it committed. | M8 §Workflow |
| M8-AC-20 | Cancelling a `pending` or approved-not-commenced request restores the balance and reverts the `AttendanceRecord` days; once leave has commenced or the month is frozen, cancel is **disabled with the reason**, not hidden. | M8 §API `/cancel`, EMP-05, **A28** (state the payroll consequence before committing) |
| M8-AC-21 | Half-day is supported per `allows_half_day` at first-half/second-half granularity and `day_count` carries `.5`; **period-level leave is absent from the model, the API and the UI** (D2). | M8 §Business rules, **D2** |
| M8-AC-22 | `day_count` excludes campus holidays and weekly-offs read from [[M7-academic-calendar]] and the employee's shift; a request wholly inside a vacation term deducts nothing and explains why. | M8 §Business rules, M7 §Business rules |
| M8-AC-23 | **LOP is only ever explicit:** a request is marked `is_lop` when the type is `LOP` or the applicant affirmatively accepted LOP against an exhausted balance. No path silently converts paid leave to unpaid. | M8 §Business rules, EMP-06, **A26** |
| M8-AC-24 | **The LOP → payroll contract holds:** M8 publishes unpaid days; [[M9-attendance]] is the **single writer** of paid days; [[M10-payroll-core]] **reads** the frozen snapshot and never recomputes it, refusing to compute where no frozen snapshot exists. | **M8 §Acceptance** ("an approved unpaid day reduces payroll paid-days"), M9 §Business rules, M10 §Workflow |
| M8-AC-25 | An approval or cancellation landing after the paid-days freeze is refused as a rewrite and routed to an arrear adjustment; the paid month is never mutated. | M10 §Arrears, §4.2 |
| M8-AC-26 | Comp-off is credited only against an [[M9-attendance]] record on a `holiday` or `weekly_off` day, is confirmed by an approver rather than self-granted, and expires on a policy-derived date rather than a code constant. | M8 §Business rules, `guard-hardcoded-values` |
| M8-AC-27 | A request spanning an academic-year boundary splits into two linked per-AY requests so each decrements its own ledger; the applicant sees one item. | §6.7 `LeaveBalance.academic_year_id` |
| M8-AC-28 | Editing an active `LeaveType` **supersedes** it with a reason and effective date and forces an explicit recalculate-or-grandfather answer for existing balances; in-place edit of an active type is impossible. | §4.3, HR-26, **O18** (the verb is "Revise, effective from …", never "Edit") |
| M8-AC-29 | A leave type flagged `is_statutory` reads its entitlement from the pinned, effective-dated `StatutoryConfig` and cannot be edited on HR-26; the lock states the config version in force. | §4.4, [[M11a-statutory-config-versioning]], `guard-statutory-hardcode`, **O9** |
| M8-AC-30 | HR holds `leave.manage` (apply-on-behalf, adjust, reassign, cancel) but **not** `leave.approve`; the approve control is **absent** for an HR-only role, and an API approve attempt returns 403. Apply-on-behalf records both the applicant and the acting HR user. | M8 §Permissions, HR-28, **O7** (scope applies to pickers, exports and counts too) |
| M8-AC-31 | Two approvals racing on the last available day: exactly one succeeds; the balance never goes negative through concurrency; the loser is told who decided and when. | §7 Concurrency, **O17** |
| M8-AC-32 | Every consequential act — approve, reject, cancel, adjust, supersede, override, apply-on-behalf — writes an audit row with actor, before/after and the required reason, in the same transaction as the change. | §4.2, **O6** (attribution readable where the decision is read) |
| M8-AC-33 | All M8 user-facing copy exists in **Hindi and English**; leave-type display names and refusal reasons are i18n keys; no hardcoded English sentence is a contract. | `guard-i18n-strings`, §9, **O12** |
| M8-AC-34 | Leave **type** and **reason** never appear on a shared roster or campus day view (health-adjacent data); the type appears only on the request console and per-type ledger, and the reason only inside a single opened request. | §8 PII classification, **O11**, §2.5 note ("the reason text must never appear on a shared roster") |
| M8-AC-35 | No leave data — type, reason, or attachment reference — is written to any log line; subjects appear as opaque UUIDs. Notification bodies for leave decisions carry no leave type and no reason (the lock screen is a public surface). | `guard-pii-logging`, **O11** |
| M8-AC-35a | A **medical-certificate upload is a PII touchpoint**: it carries an itemised notice at the point of collection (what is collected, why, who sees it, how long it is kept) in the language the user is reading, and the retention window is stated on the attachment. | **O1**, **O2**, §8 DPDP |
| M8-AC-35b | The leave surfaces state the scope the user is inside and apply it to lists, filters, approver pickers, exports and totals; an out-of-scope leave request **does not exist in the response** — it is never rendered as a restricted or greyed row, and a direct-navigation deep link 404s rather than 403-ing with a name. | **O7**, M8 §Permissions |
| M8-AC-36 | GraphQL resolvers for balances and requests traverse relations under `DjangoOptimizerExtension` / dataloaders; a campus-wide request list issues a bounded number of queries. | §7, `guard-missing-dataloader` |
| M8-AC-37 | **Deferred-scope boundary:** the model, schema and UI contain no period reference, no timetable reference and no substitution surface; approval emits `leave.approved` for a future subscriber. | **D2** |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | The accrual engine against a table of `accrual_rule` fixtures × {vacation, non-vacation} × {full-year, mid-month joiner, mid-month leaver} — including the case that asserts **zero EL rows** for vacation staff. `day_count` computation across holidays, weekly-offs, half-days at either end, and a vacation term. Carry-forward capping and the lapse adjustment. `encashableBalanceAtExit` for both staff kinds, asserting the zero-with-reason case. Blackout predicate against `Term` fixtures (inside, edge day, adjacent, overlapping two terms). Balance invariant `opening + accrued − used = balance`. Decimal half-day arithmetic and the refusal of `float`. Approval-chain routing incl. self-approval and Dept-Head-as-applicant. **No DB where the behaviour is not persistence** (`pytest` markers) |
| Integration | **bane** | Apply → approve → balance decremented → `AttendanceRecord` stamped `leave` → LOP flagged, as one transaction, with an induced failure proving nothing commits. Cancel restoring balance and reverting attendance. Approve refused against a frozen period and routed to arrears. Blackout re-validation between submit and approve. Blackout-over-approved-leave producing conflicts and changing no status. Supersession forcing the balance answer. Statutory type reading the pinned config version |
| RLS / isolation | **bane** | The isolation matrix over all M8 tables × {select, insert, update, delete} × {ORM, raw SQL}; zero-context queries return nothing; a cross-tenant approval attempt fails at the policy, not only at the resolver |
| Permissions | **bane** | `leave.apply` self-only; `leave.approve` scoped to department/campus; HR with `leave.manage` but not `leave.approve` gets 403 on approve; apply-on-behalf records both identities |
| Concurrency | **bane** | Two concurrent approvals on the last day; approve racing cancel; approve racing the payroll freeze; the accrual job run twice crediting once |
| E2E / workflow | **bane** | The education path: a vacation-staff teacher who cannot see EL, applies CL inside an exam term and is blocked by name, gets a Principal override with justification, and the approved day appears in [[M9-attendance]] and reduces nothing; then an LOP day that **does** reduce paid days through to a payslip |
| Compliance review | **gordon** | Health-adjacent leave type never on a shared surface; no PII in logs; audit completeness on every consequential act; DPDP retention of medical attachments |
| UI / a11y | **two-face** | Hindi + English parity across all M8 copy; greyscale-distinguishable statuses; the vacation-staff explanation reads as an explanation, not an error; `aria-live` on the blackout and LOP announcements |

Assertions reference the source of truth — `accrual_rule` fixtures, `Term` fixtures, i18n keys, the
`StatutoryConfig` fixture, factories — never a re-typed literal (`CLAUDE.md` Testing standards).

---

## 7 · Proposed stories

Sprint 5 unless noted. Owners per `docs/development-specification.md` module ownership. Points are
relative, calibrated against M0's set.

| # | Title | Intent | Owner | Pts | Depends on | Sprint |
|---|---|---|---|---|---|---|
| M8-S01 | `LeavePolicy` / `LeaveType` models + RLS migration | The configuration spine, AY-keyed, with `applies_to_vacation_staff` non-defaulting and `code` extensible. | oracle | 5 | M0-S05, M7 calendar models | 5 |
| M8-S02 | `LeaveBalance`, `LeaveBalanceAdjustment` + RLS migration | The per-AY ledger with the reconciling invariant and an append-only adjustment trail. | oracle | 5 | M8-S01 | 5 |
| M8-S03 | `LeaveRequest`, `LeaveRequestDay`, `CompOffCredit` + RLS migration | Day-level rows so a half-day at the end of a range is representable and joinable by [[M9-attendance]]. | oracle | 5 | M8-S02 | 5 |
| M8-S04 | `BlackoutBinding` / `BlackoutOverride` / `BlackoutConflict` + RLS migration | Blackout stored as a binding to a `Term`, never as dates. | oracle | 3 | M8-S01, M7 | 5 |
| M8-S05 | RLS policy content for all M8 tables | Employee-scope, manager-scope and campus-scope predicates on top of the tenant predicate. | wonder-woman | 5 | M8-S01..S04 | 5 |
| M8-S06 | **Accrual engine with the vacation-staff rule** | The differentiator in code: applicability decides whether a balance exists; the rate comes from `accrual_rule`. | riddler | 8 | M8-S02 | 5 |
| M8-S07 | Policy activation + balance initialisation | Activating a policy creates exactly the right balance rows for a mixed teaching / non-teaching campus. | cyborg | 5 | M8-S06 | 5 |
| M8-S08 | **Blackout validation service** reading [[M7-academic-calendar]] | One predicate, used at submit and at approval, that names the term it refused for. | cyborg | 5 | M8-S04 | 5 |
| M8-S09 | Leave application + validation API (GraphQL + REST edge) | Apply with the four checks and a machine-readable refusal code per check. | cyborg | 8 | M8-S03, M8-S08 | 5 |
| M8-S10 | Approval chain, escalation, reject, cancel | Routing incl. self-approval refusal and Dept-Head-as-applicant; cancel restoring balance and attendance. | cyborg | 8 | M8-S09 | 5 |
| M8-S11 | **Approval side-effects: balance, attendance stamp, LOP flag** — one transaction | The moment the module becomes load-bearing for pay. | cyborg | 5 | M8-S10, M9-S03 | 5 |
| M8-S12 | Comp-off credit from holiday/weekly-off work | Proposed by reconciliation, confirmed by an approver, expiring on a policy date. | cyborg | 5 | M8-S03, M9-S06 | 6 |
| M8-S12a | **Forced vacation-leave + vacation-period pay rule** | A vacation term is a paid non-working day for vacation staff and an ordinary working day for everyone else — evaluated against the calendar, generating no leave rows. | riddler | 5 | M8-S06, M9-S06 | 5 |
| M8-S13 | AY close: carry-forward, cap, lapse, opening balances | Makes `carry_forward_cap` real instead of decorative, both staff kinds. | riddler | 5 | M8-S06 | 5 |
| M8-S14 | **`encashableBalanceAtExit` contract for [[M12-full-and-final]]** | Days with a reason code, frozen onto the settlement; never money. | riddler | 5 | M8-S13 | 5 |
| M8-S15 | Blackout-over-approved-leave conflict flow | The silence in the spec, implemented as an explicit human decision per request. | cyborg | 5 | M8-S08 | 5 |
| M8-S16 | Blackout override with justification + override-frequency report feed | An exception path that cannot quietly become the rule. | cyborg | 3 | M8-S15 | 5 |
| M8-S17 | HR-26 Leave policy & types (web) | The screen where the differentiator is configured; supersession forces the balance answer. | green-lantern | 8 | M8-S07 | 5 |
| M8-S18 | HR-27 Leave balances register (web) | The ledger that reconciles in the DOM; append-only adjustment. | green-lantern | 5 | M8-S02 | 5 |
| M8-S19 | HR-28 Leave requests console (web) | Campus picture, apply-on-behalf, reassign — with approve **absent**, not disabled. | green-lantern | 5 | M8-S10 | 5 |
| M8-S20 | DH-02 Leave approvals + PR-03 escalations (web) | The two approval surfaces built together so they do not duplicate. | green-lantern | 8 | M8-S10, M8-S16 | 5 |
| M8-S21 | EMP-05 / EMP-06 leave on mobile ([[M13-ess-mobile]]) | Apply, track, cancel, and the vacation-staff explanation, phone-first, Hindi + English. | nightwing | 8 | M8-S09 | 5 |
| M8-S22 | Leave notifications ([[M14-notifications]] events) | Approval, rejection, escalation, blackout conflict, comp-off expiry. | cyborg | 3 | M8-S10 | 6 |
| M8-S23 | Leave statement + leave register exports | The inspection artefact, audited on export. | cyborg | 3 | M8-S02 | 6 |
| M8-S24 | Unit-test suite for accrual, day-count, carry-forward, encashment | Highest test density in the module, both staff kinds in every table. | deathstroke | 8 | M8-S06, M8-S13 | 5 |
| M8-S25 | Integration + RLS + concurrency suite | Isolation matrix, transactional side-effects, the two-approver race, freeze interaction. | bane | 8 | M8-S11 | 5 |
| M8-S26 | E2E: the education path, apply → block → override → paid days | The demo that proves the differentiator end to end. | bane | 5 | M8-S25, M9-S12 | 6 |
| M8-S27 | Compliance review of M8 | Health-adjacent exposure, audit completeness, DPDP retention of attachments. | gordon | 3 | M8-S20 | 6 |
| M8-S28 | UI/a11y audit of the M8 surfaces | Hindi/English parity, greyscale statuses, the explanation-not-an-error rule. | two-face | 3 | M8-S21 | 6 |

**Total: 29 stories, 153 points.**

**Dependency edges that constrain sprint order:** M7 calendar models must exist before M8-S01/S04
(a policy without an academic year is invalid, and a blackout without a `Term` has nothing to bind to);
[[M3-core-hr-people]]'s `is_vacation_staff` must exist before M8-S06 or the accrual engine has nothing to
branch on; M8-S11 depends on [[M9-attendance]]'s `AttendanceRecord` (M9-S03) even though M8 ships a sprint
earlier — **this is the one cross-sprint edge and it should be pulled forward**: either M9-S03 lands in
Sprint 5, or M8-S11 slips to Sprint 6, but it cannot be scheduled as written; M8-S14 blocks
[[M12-full-and-final]] in Sprint 9; M8-S11 blocks the paid-days reconciliation (M9-S09) in Sprint 6, which
in turn blocks [[M10-payroll-core]]'s first computational step in Sprint 7.

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M8-01 | **`LeaveType.code` is enumerated in §6.7 as seven codes, but the blueprint requires six education types as MVP and the built HR-26 ships twelve.** | A DB enum would make the product's own MVP requirement unimplementable, and a migration would be needed for each new tenant leave type. | Make `code` a per-tenant string with a reserved-code registry (`EL/CL/SL/COMP/DUTY/MAT/LOP` reserved because engine logic keys on them); the rest are tenant data. **Needs a data-model ruling from oracle + BATMAN.** |
| OQ-M8-02 | **Statutory leave entitlements have nowhere to live.** §6.10 `StatutoryConfig.rules` lists PF/ESI/PT/TDS/gratuity/bonus/LWF/min-wage — **not maternity or paternity days**. But maternity entitlement is statute, and the built HR-26 already locks it and reads it from a config version. | Hardcoding 26 weeks is a `guard-statutory-hardcode` violation and will be wrong the next time the Act moves. | Add `maternity_days`, `paternity_days` (and any other statutory leave minimum) to `StatutoryConfig.rules` in [[M11a-statutory-config-versioning]]. Cheap now, a data migration later. |
| OQ-M8-03 | **`LeaveRequest.is_half_day` is a single boolean**, which cannot express a multi-day request with a half day at one end — yet `allows_half_day` plainly permits it and paid days move by 0.5. | A silent 0.5-day error in paid days is a wrong salary, and it is the kind that reconciles to nothing and is found months later. | Adopt `LeaveRequestDay` (§3.6) and keep `is_half_day` as a derived convenience flag. |
| OQ-M8-04 | **Comp-off has no defined credit trigger, expiry, or encashability.** M8 §Business rules says only "comp-off for holiday work". The built `leave.jsx` invents "lapses 90 days after you earn it". | For a vacation-staff teacher, comp-off is often the *only* balance she holds — an invented expiry silently destroys the one thing she has. | Credit proposed by reconciliation from an [[M9-attendance]] record on a holiday/weekly-off, confirmed by the Dept Head; expiry from `accrual_rule.expiry_days`; not encashable by default. **Needs a product ruling on the default expiry.** |
| OQ-M8-05 | **What divides a monthly gross into a day rate?** The built screens use **gross ÷ 30** in five places (`DAY_DIVISOR`). The spec never states it. Candidates: 30 fixed, calendar days in the month, 26 working days. | This single number decides what every LOP day costs and what every encashed day is worth. Different divisors give materially different answers, and the choice interacts with §10(10AA). | Make it a `PayGroup`-level configuration with a documented default, owned by [[M10-payroll-core]], never a literal. **Blocking for payroll core (Sprint 7); answer before then.** |
| OQ-M8-06 | **May a Principal override an exam blackout, and does the override need a second approver?** (Screen-inventory Q22.) The spec grants no override at all; PR-03 proposes one. | Without an override, the blackout is either routed around informally or produces genuinely unjust refusals. With an unaudited override, the policy quietly ceases to exist. | Override exists, requires justification, is audited as an override, needs **no** second approver (the Principal is the escalation), and is reported by frequency. **Needs BATMAN's ruling.** |
| OQ-M8-07 | **Does a request spanning an academic-year boundary split?** (Screen-inventory Q11.) `LeaveBalance` is per-AY, so one request cannot decrement two ledgers. | Silently charging both days to the old year's balance is the likeliest naive implementation and it is wrong. | Split at submission into two linked requests, presented as one. Recorded here as the proposed default. |
| OQ-M8-08 | **What happens when an approver is absent or the post is vacant?** (Screen-inventory Q10.) M8 §Workflow escalates *by policy*, not by absence. | A teacher's leave stuck behind a Dept Head on medical leave is the most common real-world failure of any approval chain. | MVP: the manual reassignment control on HR-28/PR-03, audited. An absence-aware auto-escalation is a Phase-2 candidate. |
| OQ-M8-09 | **When a leave type changes mid-year, are existing balances recalculated or grandfathered?** (Screen-inventory Q23.) | A recalculation can retroactively put a balance below what someone has already taken. | Force an explicit per-supersession choice (the built HR-26 already does); never a system default. **Needs a product ruling on whether "recalculate" may drive a balance negative.** |
| OQ-M8-10 | **Does a leave-policy change need a second pair of eyes?** (Screen-inventory Q27.) It reaches pay through LOP and encashment. The built HR-26 records it for a second pair of eyes; the spec's maker-checker list (§8) does not include it. | §8's maker-checker list is deliberately exhaustive; adding to it informally erodes the meaning of the list. | Record it as an audited notification to the Principal (what the design does) rather than a blocking checker gate — and **say so in §8** so the list stays authoritative. |
| OQ-M8-11 | **Is in-service leave encashment in MVP?** Blueprint §3 tags "accrual, carry-forward caps, encashment, pro-ration rules per type" **[MVP]** but "leave-year-end process (close, carry-forward, new-year grant, encashment)" **[P2]** — the same document, two tags, one behaviour. | If neither the year-end process nor in-service encashment ships, `carry_forward_cap` and `encashable` are configured in MVP and never executed until F&F. | MVP ships the **carry-forward computation** (M8-S13) because F&F cannot value a balance without it; the year-end **wizard UI** and in-service encashment stay P2. Extends screen-inventory Q30's tag reconciliation. |
| OQ-M8-12 | **`Term.type` has no `admission` value.** §6.6 enumerates `teaching/exam/vacation`, but M8 §Business rules says "exam/**admission** blackout", HR-26's must-contain says "blackout binding to exam/**admission** Terms", and the blueprint adds "result declaration". | A blackout the spec explicitly requires is currently unmodellable, and the first workaround will be a fake "exam" term named "Admissions". | Either extend `Term.type` with `admission` and `result` in [[M7-academic-calendar]], or introduce a first-class `BlackoutWindow` (campus, date range, label) that blackout bindings point at. **Needs an M7 ruling — this is a cross-lane dependency.** |
| OQ-M8-13 | **Approval routing needs `reports_to`, which does not exist.** (Screen-inventory Q6/Q31.) §6.3 `Employee` carries only `department_id`, and "Dept Head" is not derivable from it. | Every approval in M8 and [[M9-attendance]] routes through a relationship the data model does not have. | Add `reports_to` to [[M3-core-hr-people]]. Already raised as Q31; repeated here because M8 is where it becomes blocking. |
| OQ-M8-14 | **Is `LeaveRequest` the only surface, or does an employee-delegate model exist?** (Screen-inventory Q28.) HR-28 has apply-on-behalf; nothing says whether a teacher may authorise a colleague. | Apply-on-behalf as an HR power is a governance control; delegation between peers is a different thing with a different audit story. | MVP: HR apply-on-behalf only, both identities recorded. No peer delegation. |
| OQ-M8-15 | **Is a teacher who resigns just before or during a vacation paid through it?** Vacation is remuneration in lieu of accrued EL, so a teacher who resigns in March has in one sense already earned the summer vacation and in another sense will never return from it. No document in the repo answers this. | It is the single largest sum of money the vacation-staff rule moves, it is the exact scenario every school administrator will ask about in a demo, and it is where a wrong default becomes either a windfall or a dispute. | State it as tenant policy on the leave policy (`vacation_pay_on_exit`: paid to LWD only / paid through a vacation already commenced / pro-rated), defaulting to **paid to last working day**. Feeds [[M12-full-and-final]]. **Needs a product ruling.** |
| OQ-M8-16 | **Is "forced" vacation-leave enforceable, or advisory?** Blueprint §3 says "★ **Forced** vacation-leave during breaks". If a school needs a skeleton staff during a vacation (admissions, results), can it require named vacation staff to attend, and what does that day become — comp-off, duty leave, or extra-duty pay? | Every school runs admissions or result work inside a vacation window, so the exception is routine rather than rare. Without an answer, those days are silently paid twice or not at all. | Attendance recorded inside a vacation window generates a `CompOffCredit` proposal on the same footing as a holiday (§3.7). Extra-duty *pay* for it belongs to [[M10-payroll-core]] — see CF-M8-G. |

### Conflicts between documents

| # | Conflict | Sides | Proposed resolution |
|---|---|---|---|
| CF-M8-A | **Period-level leave is tagged `[MVP]` in blueprint §3 — and, more seriously, in PART C itself.** PART C is named the authoritative in/out list, and its item 3 reads "academic-year cycle, vacation vs non-vacation staff, exam/admission blackouts, **period-level leave**, **leave→substitution** & leave→LOP linkage". The **only** thing correcting it is the "Locked-scope deltas" paragraph directly beneath, which defers both under D2. | `functionality-blueprint.md` §3 **and PART C item 3** vs the same document's locked-scope deltas and `decisions-to-finalize.md` **D2**. | D2 wins (a locked decision beats a summary list). But **PART C contradicts itself on the same page**, and since PART C is the document agents are told to treat as authoritative, the numbered list must be corrected — not just the module tags. Extends screen-inventory **Q30**. **Reported, not applied.** |
| CF-M8-B | **"Leave → substitution linkage" is tagged `[MVP]`** in blueprint §3 and in PART C item 3, while the substitution module is D2-deferred. | Same pair. | D2 wins. M8 emits `leave.approved` and stops there. Same correction as CF-M8-A. |
| CF-M8-C | **Blueprint §3 tags both "encashment … per type **[MVP]**" and "leave-year-end process … encashment **[P2]**".** | Blueprint against itself. | See OQ-M8-11. |
| CF-M8-D | **§6.7's seven leave codes vs the blueprint's MVP education types vs the built screen's twelve.** | Dev spec §6.7 vs blueprint §3 vs `hr-leaveatt.jsx`. | See OQ-M8-01. The built screen is the agreed UX and is right; the schema note is what needs changing. |
| CF-M8-E | **The built HR-26 treats a leave-policy change as a second-pair-of-eyes event; §8's maker-checker list does not include leave policy.** | `hr-leaveatt.jsx` vs dev spec §8, and `ui-compliance-requirements.md` **A29**, which marks a manual balance adjustment as needing approval with the note "*a balance grant is money at encashment*". | See OQ-M8-10 — resolve as an audited notification rather than a blocking checker gate, and record the decision in §8 so **O5**'s list remains the single authority on what is gated. |
| CF-M8-F | **The ShriConnect deck presents period-level attendance and substitute arrangement as shipping capabilities.** Slide 04 lists "Period-level attendance" among "Five things not one competitor does", and slide 06's head-to-head ticks "Substitute + period-level attendance" for Naveya with no Phase-2 marker — while slide 05 does correctly caveat substitute arrangement as "on the near-term roadmap". | `docs/Naveya-School-HRMS-Voxturrlabs.pdf` (22 July) vs `development-specification.md` + **D2**. | **Dev spec wins** — these are Phase 2 and M8/M9 do not build them. But this deck was shown to ShriConnect, so the expectation exists outside the repo. Flagging as a **commercial** rather than an engineering conflict: BATMAN should decide whether the deck is re-issued with the caveat. |
| CF-M8-G | **Extra-duty / overtime pay is `[MVP]` in PART C item 4 ("LOP proration, **extra-duty pay**") and `[P2]` in blueprint §2 ("Overtime / extra-duty auto-calculation with configurable rates **[P2]**")** — and the built EMP-02 already ships an "Overtime & extra duty" tab. | `functionality-blueprint.md` PART C item 4 vs §2, plus `design/v3/pages/attendance.jsx`. | Touches M8 only through comp-off and forced vacation (OQ-M8-16); the substantive resolution belongs to [[M9-attendance]] §8 and [[M10-payroll-core]]. Recorded in both. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
