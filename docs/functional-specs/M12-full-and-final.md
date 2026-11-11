# M12 — Full & Final Settlement · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M12 Full & Final Settlement (build-plan Sprint 9) · **Story:** NA-23 (Lane E) ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M12 (incl. the 2026-08-11 configurable-checker product
> decision), §6.11, §6.3 `ServiceRecord`, §8, M8, M10 §Loans ·
> `docs/decisions-to-finalize.md` **D3 — full statutory parity LOCKED**, *"Consequence: the Full & Final
> settlement engine is now MVP-coupled (gratuity + leave encashment at exit require it)"* ·
> `docs/functionality-blueprint.md` **PART C item 6** (the authoritative in/out list) ·
> `docs/screen-inventory.md` **PY-16**, **PY-17** (built: `design/v3/pages/py-ops.jsx`), AC-02, amendment C ·
> `docs/ui-compliance-requirements.md` **O2, O5, O6, O9, O10, O11, O17**, A55, A56, A57, §9-Q2, §9-Q4 ·
> `CLAUDE.md` `guard-money-float`, `guard-statutory-hardcode`.
>
> Formulae come from [[M11-statutory-compliance]] and rates from [[M11a-statutory-config-versioning]]; leave
> balances and the vacation-staff rule from [[M8-leave]] via [[M3-core-hr-people]]; outstanding loans from
> [[M10a-loans-advances]]; unpaid claims from [[M10b-reimbursements-fbp]]; the final payslip from
> [[M10-payroll-core]].

---

## 1 · Intent

A settlement is the last thing a school ever does for a person, and it is the one payroll event with no
second chance. Every other number the product produces gets corrected next month; this one is handed over
with a signature on it, and the employee is gone.

Full & final is in the MVP because decision **D3** put it there — not as a feature choice but as a
consequence. Locking full statutory parity meant locking gratuity and leave encashment, and both of those are
exit events. You cannot claim gratuity support without an exit that computes it.

What makes F&F genuinely hard is not the arithmetic of any one line. It is that the lines are **not
independent**. Leave encashment is computed on last-drawn basic and DA, which is not final until the last
part-month's salary is settled. Gratuity cannot be computed at all until continuous service is established
from an unbroken service record. Loan interest accrues to the settlement date, so the recovery figure depends
on when the settlement happens. And the TDS true-up depends on every line above it, because it must be
computed on the full financial-year picture including two exemptions — §10(10AA) on encashment and §10(10)
on gratuity — that only exist once those two lines are known. Compute the tax before the gratuity and you
understate exempt income and over-deduct from someone who has no further payslip to correct it on.

**The order changes the number.** That is the substance of this document.

---

## 2 · Scope & surfaces

### In scope — from `functionality-blueprint.md` PART C item 6

Final salary · **leave encashment (§10(10AA))** · **gratuity payout** · notice pay/recovery · loan recovery ·
TDS true-up — plus, from `M12 §Business rules`, the final payslip and access revocation, and from the built
PY-17 design, ex-gratia and reimbursement payables.

| Area | Detail |
|---|---|
| Settlement lifecycle | Exit initiated → draft → computed → (checker, if the tenant requires one) → approved/completed → paid |
| Component computation | Nine ordered lines, each **named and sourced** (§4.2) |
| The vacation-staff difference | Encashment differs for teaching staff, and the difference must be **stated, not shown as a silent zero** |
| Exemptions | §10(10AA) on encashment and §10(10) on gratuity, both computed from the **pinned config's** limbs and ceilings |
| Configurable maker-checker | The **one** narrow exception in the product (amendment C, 2026-08-11) — and single-person completion is recorded as such |
| Artefacts | Final payslip (password-protected), settlement statement (the artefact the leaver signs) |
| Access & retention | `User.is_active=false` on completion, against §8's requirement that statutory data survives exit |

### Explicitly out of scope

| Out | Where |
|---|---|
| Exit **initiation** (last working day, reason, notice) | [[M3-core-hr-people]] — an action on HR-02/HR-03 (`screen-inventory.md` conflict C3, resolved) |
| Clearance checklist, asset return, exit interview | **P2** per blueprint §8 and conflict C3 |
| Gratuity **formula** and continuous-service derivation | [[M11-statutory-compliance]] §4.5 — M12 owns the *event*, M11 owns the *formula* |
| Statutory exit filings (PF Form 19/10C/10D, gratuity Form F) | blueprint §5 tags them P2/later — **but see OQ-M12-06**, because a leaver needs them |
| Loan schedule and interest accrual | [[M10a-loans-advances]] — M12 consumes the outstanding balance |
| Form 16 for the exit year | [[M11-statutory-compliance]] — issued in June, after the person is inactive (OQ-M12-05) |
| A leaver's bonus for the accounting year | [[M11b-bonus]] OQ-M11b-06 |

### Surfaces

| Surface | Screen |
|---|---|
| Web — Payroll Operator | **PY-16** exits & settlements register · **PY-17** full & final settlement — **both built** (`design/v3/pages/py-ops.jsx`, tab 5, master/detail) |
| Web — checker | **AC-02** — F&F appears in the queue **only when the tenant requires a checker for it** (amendment C) |
| Web — HR | HR-06 service book (the gratuity basis); HR-03 for the access-revocation gap flagged on PY-16 |
| ESS | The final payslip and settlement statement, reachable by a person whose account has just been deactivated — the unresolved part (OQ-M12-05) |
| API | `…/final-settlements` (+ `/compute`, `/approve`, `/complete`, `/statement`) |

---

## 3 · Data model

Tenant-owned; `tenant_id` + RLS `ENABLE`/`FORCE` + policy in the same migration. All amounts `Decimal`.

### 3.1 `FinalSettlement` (§6.11) — extended

`§6.11` defines flat columns: `employee_id, last_working_day, leave_encashment, gratuity, notice_recovery,
loan_recovery, tds_trueup, net_payable, status`. That shape cannot express what PY-17 renders — *"each
component as a named, sourced line"* with overrides recorded alongside computed values — and it is **missing
four things the specification itself requires**:

| Field | Type | Why |
|---|---|---|
| `statutory_config_id` | FK, **NOT NULL** once computed | **Gap.** PY-17 sources gratuity from *"the service record and the pinned configuration"*; NA-23 AC7 requires the pin. The version pinned is the one **effective on the last working day**, not today's |
| `salary_owed` | Decimal | **Gap.** PY-17's first line ("Salary still owed"); absent from `§6.11` |
| `ex_gratia` | Decimal | **Gap.** A built, discretionary line; absent from `§6.11` |
| `reimbursement_payable` | Decimal | **Gap** and `[proposed]` — `screen-inventory.md` Q18 notes M12 lists loan recovery but not approved-unpaid claims |
| `other_recoveries` | Decimal | Excess leave availed, salary advances outside a formal loan, excess payments |
| `settlement_mode` | enum `checker_required · single_person` | Amendment C — captured **on the settlement**, not merely read from tenant settings, so the record states which regime it was completed under |
| `maker_user_id`, `checker_user_id`, `completed_by_user_id` | FK → User | A single-person completion writes `completed_by` and leaves `checker` null — *recorded as such*, never as an approval |
| `service_record_verified_at` | timestamptz | Gratuity cannot be computed on an unverified continuous-service derivation |
| `computed_at`, `paid_at`, `final_payslip_id`, `statement_ref` | | |
| `idempotency_key` | text | Compute, approve and complete are idempotent (O17) |
| `supersedes_id` | FK → self | A revised settlement supersedes; the original stands (O6) |

### 3.2 `FinalSettlementLine` — **new entity (data-model gap)**

| Field | Notes |
|---|---|
| `settlement_id`, `sequence` | **The sequence is the order of operations** (§4.2) and it is data, not a UI sort |
| `component` | enum `salary_owed · leave_encashment · gratuity · ex_gratia · notice_recovery · loan_recovery · other_recovery · reimbursement_payable · tds_trueup` |
| `computed_amount` | Decimal — from source, always retained |
| `override_amount`, `override_reason`, `overridden_by_user_id` | An override sits **alongside** the computed value, never replacing it invisibly (PY-17) |
| `is_statutory` | bool — **statutory lines cannot be overridden at all** (PF, gratuity formula); only discretionary lines (ex-gratia, notice waiver) can |
| `source_ref` | JSONB — the provenance PY-17 renders: leave ledger, service record, loan register, contract, approved claims |
| `exemption_amount`, `taxable_amount` | Decimal — the §10(10AA)/§10(10) split, computed and shown, because it is what the TDS line consumes |
| `basis_detail` | JSONB — days × rate, completed years, notice shortfall: the arithmetic shown rather than implied |

### 3.3 Read dependencies (nothing new, but they must all exist)

`ServiceRecord` ([[M3-core-hr-people]]) · `LeaveBalance` + `LeaveType.encashable` +
`LeaveType.applies_to_vacation_staff` ([[M8-leave]]) · `EmploymentContract.is_vacation_staff` and
`notice_period` · `EmployeeSalary` and the final `Payslip` ([[M10-payroll-core]]) · `Loan` /
`LoanInstallment` ([[M10a-loans-advances]]) · approved-unpaid `ReimbursementClaim`
([[M10b-reimbursements-fbp]]) · the pinned `StatutoryConfig` ([[M11a-statutory-config-versioning]]).

---

## 4 · Behaviour walk-through

### 4.1 Preconditions — what must be true before a settlement can compute

Each of these is a **blocking** state on PY-17, named rather than silently producing a smaller number:

1. Exit is initiated and a **last working day** is set (a future LWD is allowed and marked *provisional*).
2. The final month's **attendance is reconciled** — paid-days drive the salary-owed line ([[M9-attendance]]).
3. The **service record is complete and unbroken**. The built design blocks on exactly this: *"the service
   record has a four-month gap in 2023 that nobody has closed. Continuous service cannot be established, and
   gratuity computed on a broken record would be wrong."*
4. All **leave requests are resolved** — a pending request changes the encashable balance.
5. The **loan statement is current** to the settlement date ([[M10a-loans-advances]]).
6. **Reimbursement claims are decided** — a claim left in `submitted` is neither payable nor refused.
7. A **config version covers the last working day** ([[M11a-statutory-config-versioning]] coverage gap).

### 4.2 The order of operations — and why each step depends on the one before

**Step 0 · Pin the config.** Resolve and pin the `StatutoryConfig` **effective on the last working day**, not
today's version. A teacher who left in March and is settled in July is settled on March's rules — the same
principle as [[M10c-arrears-pay-revision]]. Everything below reads from this pin.

**Step 1 · Salary still owed.** The unpaid part-month on a paid-days basis, prorated per
[[M10-payroll-core]]. *First, because it establishes last-drawn pay.* Steps 2 and 4 are both computed on
last-drawn basic + DA, and that figure is not final until this step is.

**Step 2 · Leave encashment.** Which balances are encashable (`LeaveType.encashable`), how many days, at what
rate — basic + DA over the config's day divisor. **This is where the vacation-staff distinction bites.**
[[M8-leave]] gates earned leave on `LeaveType.applies_to_vacation_staff`: teaching staff receive vacations in
lieu of earned leave and therefore **do not accrue the EL that non-vacation staff encash at exit**. A
teacher's settlement will frequently show little or no encashment where an administrative colleague of equal
tenure shows a substantial sum. That is correct, and it is the single most likely line to be disputed, so it
must be **explained on the settlement** — *"as vacation staff, earned leave is not accrued; vacations were
taken in lieu"* — and never rendered as a bare zero. The §10(10AA) exemption limbs and the notified ceiling
come from the pinned config; the exemption and taxable split are computed here and consumed in step 9.

**Step 3 · Gratuity.** Only now, because it requires continuous service (established in the preconditions)
**and** last-drawn basic + DA from step 1. Formula, day divisor, qualifying-service rule, near-miss rule and
the §10(10) exemption ceiling all come from the pinned config — **never a hardcoded 15/26 or ₹20 lakh**
(`guard-statutory-hardcode`, PY-17 must-NOT-contain). Where the qualifying period is not met the line is a
**stated refusal**, not a zero: the built design's copy is *"not payable. Continuous service from the service
record is 3 years 4 months; the qualifying period in v2026.3 is not met."*

**Step 4 · Ex-gratia.** Discretionary, entered with a required reason, recorded as an override-class line.
Placed after the statutory lines so it is visibly an addition to them rather than a substitute for one — a
school sometimes offers ex-gratia *because* gratuity is not payable, and the settlement should show both
facts side by side.

**Step 5 · Notice recovery.** Shortfall days × day-gross, per `EmploymentContract.notice_period`. Waivable
with a required reason. It is a recovery, so it comes after everything payable is known; a recovery computed
before the payables is a recovery against an unknown base.

**Step 6 · Loan recovery.** Outstanding principal **plus interest accrued to the settlement date** from
[[M10a-loans-advances]], closing the loan. This depends on the settlement date, which is why it cannot be
taken from a stale loan statement. Any waiver is audited and may be a taxable perquisite
(`ui-compliance-requirements.md` Q10, still open).

**Step 7 · Other recoveries.** Excess leave availed, informal advances, overpayments — each named.
Asset recovery is **P2** (no asset register exists in the MVP data model).

**Step 8 · Reimbursements owed.** Approved-but-unpaid claims. Marked `[proposed]` in the built design because
`M12 §Business rules` does not list it (`screen-inventory.md` Q18) — but an approved claim left unpaid at
exit is simply a debt the school owes, and the built design is right to surface it.

**Step 9 · TDS true-up — last, and it must be last.** The final month's tax is computed against **actual**
financial-year income rather than a projection, and it needs every line above it: the encashment's taxable
portion after §10(10AA), the gratuity's taxable portion after §10(10), the ex-gratia (fully taxable), the
loan perquisite up to the LWD, and the bonus if one was paid. **Notice recovery is a deduction from cash, not
ordinarily from taxable salary** — treating it as a reduction in income is a real and common error that
under-deducts. Getting the sequence wrong here produces a number that is wrong in a direction the employee
cannot fix, because there is no next payslip.

**Step 10 · Net payable.** The sum, which **may be negative** — recovery exceeding payables is a real state
(PY-17 lists it explicitly), and the settlement must present it as an amount owed *to* the school with a
route to recover it, not as a broken calculation.

### 4.3 Maker-checker — the one configurable exception in the product

Per **amendment C (2026-08-11)** and `M12 §Business rules`, F&F is the **only** finalisation whose distinct-
checker requirement is a tenant setting. Small schools often have one finance person, and a settlement is a
single individually-reviewed payment rather than a bulk release.

Two modes, and the screen must **show which is in force**:

- **Checker required** → *Send for approval*; the item appears on AC-02 for a distinct approver; the maker's
  own approval is refused server-side.
- **Single-person allowed** → *Complete settlement*, with a confirmation that says plainly *"your school
  allows single-person completion — this settlement will be recorded as completed by you alone"*, and the
  record is audited **as a single-person completion, not as an approval**.

This exception **never** extends to payroll run approval, bank-file generation or disbursement, statutory
filings, reimbursement payout batches, arrears posting or bonus runs (§8, O5). The mode in force is captured
on the settlement itself, so a record settled years ago still states how it was authorised.

### 4.4 States

`exit initiated · F&F not started · draft · computed · awaiting checker (only when required) · approved ·
paid · overdue (statutory settlement timelines) · **negative net** · gratuity not eligible (explained) ·
service record incomplete (**blocking**) · access still active after the LWD (a compliance flag on PY-16) ·
superseded by a correction`.

### 4.5 Edge cases and error paths

| Case | Behaviour |
|---|---|
| **LWD in the future** | Allowed and clearly marked **provisional**; recompute on the actual LWD before completion |
| **Broken service record** | **Blocking**, naming the gap. Gratuity on a broken record is wrong in a way nobody would notice |
| **Rehire** | A second `Employee` record silently breaks gratuity continuity (`screen-inventory.md` Q15, unresolved). Until a merge path exists, the settlement must **warn** where a matching prior record is detected rather than computing service from the later stint alone |
| **Death in service** | The qualifying-service rule does not apply to gratuity on death; the payee is a nominee, not the employee. **Not modelled anywhere** — see OQ-M12-07 |
| **Recovery exceeds payables** | Negative net is a supported state, not an error |
| **Statutory line override attempted** | **Blocked.** Only discretionary lines are overridable (PY-17) |
| **Config version changes between compute and approval** | The pin is taken at compute and does not move; if inputs change, the item goes **stale** on AC-02 and the maker recomputes |
| **Approval retried after a timeout** | Idempotent on the key; the replay returns the original result and never pays twice (O17) |
| **Employee has an open helpdesk grievance or a disputed claim** | Surfaced as a warning on the settlement, not a block — but recorded, so nobody can say it was not visible |
| **Access revoked while artefacts are still owed** | The compliance flag on PY-16 works in one direction (access still live after the LWD); the other direction — artefacts owed to a deactivated person — is OQ-M12-05 |

### 4.6 Concurrency

Compute takes a row lock on the settlement; a second compute is refused while one is in flight. Approval and
single-person completion are idempotent on a required key. Completion is transactional across: settlement
status, final payslip generation, loan closure, leave-balance zeroing and `User.is_active=false` — a partial
completion that deactivates a user without generating their payslip is the worst possible failure mode here.

### 4.7 i18n and accessibility

Copy is Hindi + English (`guard-i18n-strings`, O12), and this screen carries the product's heaviest
plain-language obligation: the settlement statement is the artefact a departing employee signs, and the
vacation-staff encashment explanation, the gratuity-refusal reason and the single-person-completion
confirmation must all be unambiguous in both languages. The **statement artefact** itself follows the same
rule as statutory artefacts — see [[M11-statutory-compliance]] §4.8 and the open question at
`ui-compliance-requirements.md` Q6.

Accessibility: the line table is a real `<table>` with a caption naming the employee and the LWD; recoveries
are negative amounts distinguished by **sign and label**, never by colour alone; the refused-gratuity line
carries its reason in the row, associated via `aria-describedby`, not in a tooltip; the completion dialog
traps and returns focus and states the consequence in the confirm control's accessible name (WCAG AA, `§9`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M12-AC-01 | A **6-year teacher's** settlement includes gratuity and leave encashment, each as a named, sourced line. | M12 §Acceptance |
| M12-AC-02 | Settlement components compute in the specified **sequence** (salary owed → encashment → gratuity → ex-gratia → notice recovery → loan recovery → other recoveries → reimbursements → **TDS true-up** → net), the sequence is persisted on the line rows, and a test asserts that computing TDS before gratuity/encashment produces a different (wrong) net — proving the ordering is load-bearing. | M12 §Business rules, PY-17 built design |
| M12-AC-03 | The settlement pins the `StatutoryConfig` **effective on the last working day**, not the current version, and displays it; gratuity formula, day divisor, qualifying rule and both exemption ceilings are read from that pin. | §4.4, **O9**, PY-17 must-contain |
| M12-AC-04 | **No gratuity or exemption figure is hardcoded** — no 15/26, no ₹20 lakh, no ₹25 lakh, anywhere in code, fixtures, tests, mocks or copy. | PY-17 must-NOT-contain, `guard-statutory-hardcode`, **O9** |
| M12-AC-05 | Gratuity is computed from **continuous service in `ServiceRecord`**; an incomplete or broken record **blocks** the computation and names the gap. | M12 §Business rules, HR-06, PY-17 states |
| M12-AC-06 | Where the qualifying period is not met, the gratuity line is a **stated refusal** giving the actual continuous service and the qualifying period **from the named config version** — never a silent zero. | PY-17 built copy, `DESIGN.md` principle 6 |
| M12-AC-07 | **Leave encashment differs by vacation-staff status.** A teacher (`is_vacation_staff=true`) does not accrue earned leave (`LeaveType.applies_to_vacation_staff`), and the settlement **states why** the encashment differs rather than showing a bare zero. A test compares a vacation-staff and a non-vacation-staff leaver of equal tenure and asserts both the different amount and the presence of the explanation. | M8 §Business rules, §6.7, M12 §Business rules |
| M12-AC-08 | The **§10(10AA)** exemption on encashment and the **§10(10)** exemption on gratuity are computed from the pinned config's limbs and ceilings, and the exempt/taxable split is shown on the line and consumed by the TDS line. | M12 §Business rules, blueprint PART C item 6 |
| M12-AC-09 | **Outstanding loan recovery** is pulled from `Loan`/`LoanInstallment` including interest accrued to the settlement date; the loan closes on completion, and an unclosed loan's balance appears in the leaver's `loan_recovery`. | M10 §Loans, M10 §Acceptance, [[M10a-loans-advances]] |
| M12-AC-10 | Notice recovery uses the contract's notice period, is waivable **with a required reason**, and is **not** treated as a reduction in taxable salary in the TDS true-up. | M12 §Business rules, PY-17 |
| M12-AC-11 | The **TDS true-up is computed last**, against actual financial-year income including the taxable portions of encashment, gratuity, ex-gratia, loan perquisite and any bonus paid. | M12 §Business rules, [[M11-statutory-compliance]] §4.4 |
| M12-AC-12 | A **negative net payable** is a supported state, presented as an amount owed to the school with a recovery route — never as an error or a clamped zero. | PY-17 states |
| M12-AC-13 | Each component is a **named, sourced line**; an override records the **computed value alongside** it with a required reason and actor; **statutory lines cannot be overridden at all**. | PY-17 actions, **O6** |
| M12-AC-14 | **Maker-checker is configurable per tenant** and the screen **shows which mode is in force**. With it enabled, a maker cannot approve their own settlement (refused server-side). With it disabled, single-person completion succeeds and is **audited as single-person, not as an approval**. | M12 §Acceptance, amendment C, §8, **O5** |
| M12-AC-15 | The F&F exception **never** relaxes the distinct-checker requirement on payroll run approval, bank-file generation/disbursement, statutory filings, reimbursement payout batches, arrears posting or bonus runs; a test asserts each of those still refuses a self-approval. | §8, amendment C, **O5** |
| M12-AC-16 | The mode in force is **persisted on the settlement**, so a historical record states how it was authorised even after the tenant setting changes. | amendment C |
| M12-AC-17 | On completion: the **final payslip is generated (password-protected)**, the settlement statement is available, the loan is closed, leave balances are zeroed and **`User.is_active` flips to false** — all in one transaction. A partial completion is impossible. | M12 §Acceptance, **O10** |
| M12-AC-18 | **Statutory-retention data survives exit**: payslips, statutory contributions, filings, service record and audit rows are retained per the retention policy and are **not** deleted by deactivation. | §8, **O2** |
| M12-AC-19 | PY-16 flags **access still active after the last working day** as a compliance state, routing to HR-03. | PY-16 actions, A57 |
| M12-AC-20 | `/compute`, `/approve` and `/complete` are **idempotent** on a required key; a replayed completion never pays twice and never deactivates twice. | §7, **O17** |
| M12-AC-21 | A settled settlement is **append-only**: a correction is a **superseding** settlement; the original is retained and marked superseded. | `§4.2`, **O6** |
| M12-AC-22 | The settlement statement and final payslip downloads are **audited** with actor, subject and timestamp; the password derivation is stated at the download point and the password itself never travels in the same channel. | §8, **O10** |
| M12-AC-23 | No PII (PAN, UAN, ESIC, bank account, salary) appears in any log line, error message or exported filename produced by the settlement path. | §8, **O11**, `guard-pii-logging` |
| M12-AC-24 | `FinalSettlement` and `FinalSettlementLine` carry `tenant_id` with RLS `ENABLE`+`FORCE`+policy **in the same migration**; a cross-tenant read returns zero rows. | §3, `guard-rls-policy` |
| M12-AC-25 | All settlement amounts are **`Decimal`**; a float in the settlement path fails CI. | `guard-money-float` |
| M12-AC-26 | Settlement tests assert against **named config fixtures** for the gratuity formula and both exemption ceilings; no re-typed statutory literal appears in any test. | §11, `CLAUDE.md` Testing standards |
| M12-AC-27 | Settlement UI copy is Hindi + English, including the vacation-staff encashment explanation, the gratuity-refusal reason and the single-person-completion confirmation. | `guard-i18n-strings`, **O12** |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | The **ordering invariant**: the same inputs computed out of order produce a different net, and the specified order produces the golden one. Encashment day-rate arithmetic. §10(10AA) and §10(10) exemption limbs at and above the ceiling, from fixtures. Gratuity at the qualifying boundary, above it, below it, and under the near-miss rule. Notice shortfall including a full-notice case (nothing recovered) and a waiver. Loan outstanding with interest accrued to a settlement date. Negative net. Override alongside computed value; statutory override refused. **Vacation-staff vs non-vacation-staff encashment on identical tenure** |
| Integration | **bane** | Both maker-checker modes end to end: checker-required refuses the maker **server-side** and routes to AC-02; single-person completion succeeds and is audited as single-person. The exception does **not** leak — run approval, bank file, filings, batches, arrears and bonus each still refuse self-approval. Completion transactionality: a forced failure mid-completion leaves no deactivated user without a payslip. Idempotent replay of approve and complete. Broken service record blocks. Cross-tenant RLS on both tables. Retention: a deactivated leaver's payslips, contributions and Form 16 still exist and are still reachable by an authorised actor |
| E2E | **bane** | The spec's exit leg: hire → … → payroll → **exit → F&F → final payslip → access revoked**, on the seed multi-campus fixture, run once for a 6-year non-vacation staff member and once for a 6-year teacher, asserting the encashment difference and its explanation |
| Golden file | **riddler** + **bane** | Committed settlement statements per config version; a formula or ceiling change is an intentional, reviewed diff |
| Compliance review | **gordon** | The configurable exception is genuinely narrow and correctly recorded. No statutory literal. Append-only holds. Retention survives deactivation (O2). Download auditing and PII handling per O10/O11. The single-person confirmation copy states the consequence plainly rather than burying it |
| Contract | **cyborg** + CI | Settlement types in the committed SDL/OpenAPI; TS + Dart clients compile |

---

## 7 · Proposed stories

Sprint 9. Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M12-S01 | `FinalSettlement` extensions + `FinalSettlementLine` model, migration, RLS | The line-level, sourced, pinned shape PY-17 actually renders. | oracle | 5 | M11a-S01 |
| M12-S02 | Settlement lifecycle + preconditions engine (blocking states, named) | Refuses to compute on a broken service record or an unreconciled month. | cyborg + riddler | 5 | M12-S01 |
| M12-S03 | **Ordered settlement computation engine** (the nine lines, in sequence, each sourced) | The heart of the module: the order that changes the number. | riddler | 13 | M12-S02, M11-S07 |
| M12-S04 | **Leave-encashment computation with the vacation-staff rule and §10(10AA)** | The line most likely to be disputed, and the one that must explain itself. | riddler | 5 | M8 balances, M11a-S04 |
| M12-S05 | **Gratuity payout with §10(10) exemption**, refusal path and provisioning link | Formula from config, service from the record, refusal stated not implied. | riddler | 5 | M11-S07 |
| M12-S06 | Recoveries: notice, loan (interest to date), other; waiver with reason | Recoveries after payables, each named and reversible only by recompute. | riddler | 5 | M10a loans |
| M12-S07 | **Settlement TDS true-up** on actual FY income, computed last | The line that consumes every other line. | riddler | 8 | M11-S06, M12-S03 |
| M12-S08 | **Configurable maker-checker**: tenant setting, both modes, AC-02 wiring, mode persisted on the record | The product's one narrow exception, implemented narrowly and recorded honestly. | wonder-woman + cyborg | 8 | AC-02 |
| M12-S09 | Completion transaction: final payslip, statement, loan closure, balance zeroing, `is_active=false` | All or nothing — the partial completion is the failure that matters. | cyborg | 5 | M12-S03, M12-S08 |
| M12-S10 | **PY-16 exits & settlements register** (built design → implementation) | The compliance clock and the access-revocation gap flag. | green-lantern | 5 | M12-S02 |
| M12-S11 | **PY-17 full & final settlement screen** (built design → implementation) | Named sourced lines, both modes shown, overrides alongside computed values. | green-lantern | 8 | M12-S03, M12-S08 |
| M12-S12 | Settlement statement + final payslip artefacts (protected, audited) | The artefact the leaver signs, and the one they keep. | riddler + cyborg | 5 | M12-S09 |
| M12-S13 | Settlement unit suite incl. the **ordering invariant** and the vacation-staff comparison | Proves the order is load-bearing rather than asserting it. | deathstroke | 8 | M12-S03 |
| M12-S14 | F&F integration + exit-leg E2E, both checker modes, retention-after-exit | Proves the exception is narrow and the data survives. | bane | 8 | M12-S09 |

**Total: 14 stories, 93 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| **OQ-M12-01** | **`FinalSettlement` has no `statutory_config_id`.** `§6.11` defines flat amount columns only, yet PY-17 sources gratuity from *"the pinned configuration"* and NA-23 AC7 requires the pin. | A settlement whose rule set cannot be identified cannot be reproduced or defended, and gratuity is the most litigated number in the product. | Add the pin (effective on the LWD), plus `salary_owed`, `ex_gratia`, `reimbursement_payable`, `other_recoveries`, `settlement_mode` and the actor columns. Specified in §3.1. |
| **OQ-M12-02** | **`FinalSettlementLine` does not exist.** PY-17 requires *"each component as a named, sourced line"* with overrides recorded alongside computed values; flat columns cannot express provenance, exemption splits, override reasons or the ordering. | The built design is unbuildable against the current data model. | Add the entity per §3.2. Needs oracle's migration and BATMAN's sign-off on the entity-catalog addition. |
| **OQ-M12-03** | **Approved-but-unpaid reimbursement claims at exit** (Q18 in `screen-inventory.md`). `M12 §Business rules` lists loan recovery but not claim payables; the built design carries the line as `[proposed]`. | An approved claim left unpaid at exit is a debt the school owes and, unhandled, simply disappears when the employee is deactivated. | Include it as a settlement line (step 8). The built design is right; the spec's business-rule list should be extended to match. Needs a ruling to move it from `[proposed]`. |
| **OQ-M12-04** | **Rehire and duplicate-person merge** (Q15 in `screen-inventory.md`, still open). Creating a second `Employee` for a returning teacher silently breaks gratuity continuity. | Continuous service is the gratuity basis. A break the system cannot see is a number nobody will question until a tribunal does. | Until a merge path exists, **detect and warn** on a probable prior record at settlement time. A merge path is a [[M3-core-hr-people]] story, not mine, but the consequence lands here. |
| **OQ-M12-05** | **Ex-employee access to Form 16, payslips and the settlement statement.** `M12 §Acceptance` flips `User.is_active=false` on completion; `§8` requires statutory data to survive exit; Form 16 for the exit year is issued in June, months later. Recorded as conflict C8, `screen-inventory.md` Q7 and `ui-compliance-requirements.md` §9-Q2 — **still unruled across three documents**. | A statutory artefact the ex-employee is legally entitled to, behind a door the product closes on completion. It also blocks [[M11b-bonus]] OQ-M11b-06 (a leaver's bonus) and the F&F statement itself. | A **time-boxed, read-only post-exit mode** limited to tax documents, payslips and the settlement statement — not a binary `is_active` flip. It is one enum and a scope filter, and it resolves four open questions at once. **This is the highest-value ruling outstanding on my lane.** |
| **OQ-M12-06** | **Exit statutory forms are unscoped.** PF Form 19/10C/10D and gratuity Form F are tagged P2/later in blueprint §5, but they are what a leaver actually needs in order to claim the PF and gratuity the settlement computed. | Naveya computes a gratuity and a PF balance, then leaves the person to obtain the claim forms elsewhere. That is a visible seam in exactly the moment the product is being judged. | Confirm P2, but **state it in the settlement UI** so nobody assumes the forms were issued. Needs a parity ruling against greytHR, which supports them. |
| **OQ-M12-07** | **Death in service is not modelled.** Gratuity's qualifying-service rule does not apply on death, the payee is a nominee, and neither `ServiceRecord.event_type` nor `FinalSettlement` has any concept of it. | A rare event handled wrongly under pressure, in the most sensitive circumstances a school HR office ever encounters. The system would refuse gratuity for a 3-year teacher who died in service — confidently, and wrongly. | Add `deceased` to the exit reasons and a nominee payee on the settlement; suppress the qualifying-service rule for that reason code. Small change, large consequence. Needs a ruling on MVP inclusion. |
| **OQ-M12-08** | **Is there a statutory settlement deadline the compliance clock should enforce?** PY-16 shows *"days since exit"* and an **overdue** state referencing *"statutory settlement timelines"*, but no authority document names the timeline or where it is configured. | An overdue state with no configured threshold is decoration. | Make the settlement deadline a **config field** (it varies by state under the wage-payment rules) so PY-16's clock derives from the pinned config like everything else. Needs the value confirmed, not invented. |
| **OQ-M12-09** | **Loan waiver at F&F as a taxable perquisite** (`ui-compliance-requirements.md` Q10, open). A waived loan balance is generally a perquisite and belongs in the TDS true-up and on Form 12BA. | Waiving a loan without taxing the benefit under-deducts, and the employee discovers it at their own filing. | Treat a waiver as a perquisite line feeding step 9 and Form 12BA. Needs a tax ruling before it is built either way. |

**Conflict with the built design: none.** PY-16 and PY-17 as built in `design/v3/pages/py-ops.jsx` match this
specification — including the line ordering, the sourced lines, the blocking service-record state, the stated
gratuity refusal and both maker-checker modes. Three of the open questions above (OQ-M12-01, -02, -03) are
places where the **built design is ahead of the data model**, not places where they disagree.

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
