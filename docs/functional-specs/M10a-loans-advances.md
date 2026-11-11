# M10a — Loans & Advances · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M10 Payroll — Loans & Advances (build-plan Sprint 7) · **Work item:** NA-22 ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M10 §*Loans & Advances (ShriConnect scope,
> 2026-07-22)*, §6.9 `Loan` / `LoanInstallment`, M10 §API, §Permissions, §Acceptance; M12; §4.2, §4.3, §7,
> §8 · `docs/functionality-blueprint.md` PART A §4 ("Loans & advances with EMI schedules, interest/
> perquisite, auto-deduction, closure on exit **[MVP]**") and PART C item 4 ·
> `docs/ui-compliance-requirements.md` **O5, O6, O3, O11, O17, O18**, actions A42, A43 ·
> `docs/decisions-to-finalize.md` 2026-07-22 scope-change log ·
> `docs/screen-inventory.md` PY-13, EMP-19, AC-02 · built design `design/v3/pages/py-ops.jsx` §7.
>
> **Graph:** this rides on the run defined in [[M10-payroll-core]]; a skipped instalment is usually caused
> by LOP from [[M8-leave]] via [[M9-attendance]]; the outstanding balance is recovered at
> [[M12-full-and-final]]; the employee's view lives in [[M13-ess-mobile]]; approvals notify through
> [[M14-notifications]]; an interest perquisite is valued from [[M11a-statutory-config-versioning]] and
> taxed by [[M11-statutory-compliance]]; the register is one of [[M15-reporting-platform]]'s; the
> borrower is a person in [[M3-core-hr-people]]; the approver capability is
> [[M2-identity-access]]'s flag. Siblings: [[M10b-reimbursements-fbp]],
> [[M10c-arrears-pay-revision]].

---

## 1 · Intent

A school lends money to its own staff, constantly and informally: a festival advance in October, a medical
advance when a parent is admitted, a two-year loan against a scooter or a daughter's fees. Today that lives
in a ledger book and an understanding, and the recovery happens because somebody remembers. When the
teacher resigns in March with eleven instalments outstanding, the school discovers the balance after the
final payment has already left.

M10a makes the loan a **contract with a schedule**: a principal, a tenure, a rate, and a row per month that
either deducted or did not, each one pointing at the exact payslip line where it happened. The instalment
is taken by the payroll run rather than by anyone's memory, the outstanding balance is a computed figure
nobody types, and at exit that balance flows automatically into the full & final settlement instead of
being discovered afterwards. Because a sanction is money leaving the school, it carries the same
distinct-checker gate as the payroll run itself (`M10 §Loans`: "Loan approval uses `payroll.approve`
maker-checker") — and because a **waiver** is money forgiven, it is treated here as at least as
consequential as the sanction.

---

## 2 · Scope & surfaces

### In scope

| Area | What M10a delivers |
|---|---|
| The loan contract | `Loan` — `kind` (loan / advance), principal, interest rate, `is_perquisite`, EMI, tenure, start period, status, approval chain. **All amounts `Decimal`** (`§6.9` states this explicitly for this entity) |
| The schedule | `LoanInstallment` — one row per instalment with principal/interest split, running balance, status, and the `payslip_line_id` where it was actually deducted |
| Sanction gate | Maker–checker on approval: a distinct `payroll.approve` holder, never the requester (`M10 §Loans`, O5, A42) |
| Auto-deduction | The active EMI is picked up by every run in [[M10-payroll-core]] and lands as a `deduction` `PayslipLine`, decrementing the balance |
| Lifecycle | Skip (defer) and waive (forgive) as **materially different** actions; foreclosure with a settlement figure; closure |
| Exit | The outstanding balance flows to `FinalSettlement.loan_recovery` in [[M12-full-and-final]] — no instalment is taken from an exiting employee's ordinary payslip once the settlement owns the balance |
| Employee view | EMP-19 — the borrower's own schedule, with the payslip line each deduction landed on |
| Registers | The loans/deductions register (PY-13 export, PY-18) |

### Explicitly out of scope

| Out | Owned by / status |
|---|---|
| The payroll run, the payslip and the bank file | [[M10-payroll-core]] |
| **Perquisite valuation** of concessional-interest benefit | Blueprint §4 tags perquisite valuation **[P2]** while `is_perquisite` is MVP — the conflict is C-M10a-01; the valuation formula and its rate source belong to [[M11-statutory-compliance]] |
| Loan policy limits (max principal by grade, eligibility) | **Unspecified in the spec** — OQ-M10a-02 |
| Interest income accounting / JV | [[M16-integrations]], P2 |
| Third-party or bank-funded staff loans | Not in scope at all |

### Surfaces

- **PY-13 · Loans & advances register** (Payroll Operator) — who owes what, **this month's scheduled
  deduction**, totals that reconcile to the run's LOAN deduction line, and exiting employees with balances.
  Built in `design/v3/pages/py-ops.jsx` (block 7).
- **AC-02 · maker–checker gate** — where the sanction is actually approved, by someone else.
- **EMP-19 · My loans & advances** (`[proposed]` in the inventory, and required here — see §4.6) via
  [[M13-ess-mobile]].
- **PY-17 / F&F** — the outstanding balance as a settlement line ([[M12-full-and-final]]).

---

## 3 · Data model

Both tables are tenant-owned: NOT-NULL `tenant_id` FK plus `ENABLE`+`FORCE ROW LEVEL SECURITY` with
`USING` **and** `WITH CHECK` policies, **in the same migration as the model** (`guard-rls-policy`).

**Money is `Decimal`, per field, not per preamble.** `principal`, `interest_rate`, `emi_amount`,
`principal_component`, `interest_component`, `balance`, `settlement_amount`, `waiver_amount` and
`outstanding_at_exit` are every one of them `NUMERIC(14,2)` (rates `NUMERIC(9,4)`) through M0's
`MoneyField`, computed as `decimal.Decimal`, and serialised as **strings** at the GraphQL and REST
boundaries. `§6.9` already annotates this entity's amounts `(Decimal)` — this spec keeps that annotation
on every field it adds.

### 3.1 `Loan` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK Tenant, not null | + RLS policy, same migration |
| `employee_id` | FK Employee ([[M3-core-hr-people]]) | |
| `legal_entity_id` | FK LegalEntity | the lender of record; scopes the checker's queue |
| `reference` | text | human-readable (`LN-2026-039`, `AD-2026-118`) — the design already uses this shape |
| `kind` | enum `loan` \| `advance` | **no default**; an advance is short-tenure and typically interest-free, but the distinction is the school's |
| `purpose` | enum `home` \| `vehicle` \| `education` \| `medical` \| `festival` \| `other` + `purpose_note` | from the built design; needed for the register and for policy limits |
| `principal` | **`NUMERIC(14,2)` Decimal** | > 0 |
| `interest_rate` | **`NUMERIC(9,4)` Decimal** | annual simple rate; `0` is a first-class value, not a null |
| `interest_method` | enum `simple` \| `reducing` \| `none` | **added** — the built design computes simple interest; a reducing-balance loan produces a different schedule entirely (OQ-M10a-03) |
| `is_perquisite` | bool | the §17(2) flag. **A flag, not a valuation** (C-M10a-01) |
| `emi_amount` | **`NUMERIC(14,2)` Decimal** | derived (`(principal + interest) / tenure` for `simple`), **editable at sanction** so a school can round it |
| `tenure_months` | int > 0 | |
| `start_period` | date (month-first-day) | the first run that deducts; **may not be a locked month** |
| `status` | enum `pending_approval` \| `active` \| `closed` \| `foreclosed` \| `rejected` \| `cancelled` | `§6.9` gives the first four; `rejected`/`cancelled` are required by the approval path |
| `approval_chain` | JSONB | who must approve, in order |
| `requested_by_user_id`, `requested_at` | | the **originator** — see OQ-M10a-01 |
| `approved_by_user_id`, `approved_at` | | the **checker**; DB `CHECK (approved_by_user_id IS DISTINCT FROM requested_by_user_id)` and the same natural-person rule as [[M10-payroll-core]] §4.5 |
| `closed_at`, `closure_reason` | | |
| `outstanding_cached` | **Decimal** | denormalised for list performance; a test asserts it equals the computed figure |

**Derived, never stored as an authored number** (the built design already computes these, and computing
them is what makes a register add up):

```
interest       = principal × rate × tenure_months / 1200        (simple)
repayable      = principal + interest
emi            = repayable / tenure_months                       (before any sanctioned rounding)
outstanding    = Σ balance of instalments not yet deducted/waived
```

### 3.2 `LoanInstallment` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `loan_id` | FK Loan | |
| `seq` | int | 1…tenure; unique with `loan_id` |
| `due_period` | date (month-first-day) | shifts forward when an instalment is **skipped** |
| `principal_component` | **`NUMERIC(14,2)` Decimal** | |
| `interest_component` | **`NUMERIC(14,2)` Decimal** | |
| `balance` | **`NUMERIC(14,2)` Decimal** | balance *after* this instalment |
| `status` | enum `scheduled` \| `deducted` \| `waived` \| `skipped` \| `recovered_at_exit` \| `foreclosed` | `§6.9` gives the first four; the last two are needed by [[M12-full-and-final]] and by foreclosure |
| `payslip_line_id` | FK PayslipLine, null | **the provenance** — set when a run actually deducts it |
| `payroll_run_id` | FK PayrollRun, null | which run took it |
| `reason`, `actioned_by_user_id`, `actioned_at` | | mandatory on `skipped`, `waived`, `foreclosed` |

Rounding: the schedule is generated so that **Σ(principal_component) = principal** and
**Σ(interest_component) = interest** exactly, with any rounding remainder absorbed into the **final**
instalment. A schedule whose components do not sum to the principal is a bug that surfaces months later as
a loan that never closes.

### 3.3 `LoanWaiver` — the audit record for forgiven money

`tenant_id` (+RLS), `loan_id`, `installment_id` (null for a foreclosure-level waiver), `amount`
**Decimal**, `reason` (mandatory, controlled list + free text), `is_taxable_perquisite` bool,
`maker_user_id`, `checker_user_id` (**distinct**), `decided_at`. Separated from `Loan` because a waiver is
a payment by another name, must be append-only, and must be individually reportable.

---

## 4 · Behaviour walk-through

### 4.1 Happy path

1. **Origination.** A loan is raised for an employee — by HR/Payroll on PY-13, or by the employee on
   EMP-19 where the tenant enables staff-initiated applications. `status = pending_approval`; the **EMI
   schedule is generated immediately** so the approver sees exactly what they are sanctioning, not a
   promise of a schedule.
2. **Sanction.** The item appears on AC-02 for a **distinct** `payroll.approve` holder, showing principal,
   rate, tenure, EMI, total repayable, the borrower's current net pay and the schedule. On approval:
   `status = active` and the schedule goes live. Nothing is deducted before this (A42, O5).
3. **Deduction.** Every run in [[M10-payroll-core]] picks up instalments whose `due_period` equals the run
   period on `active` loans, writes one `deduction` `PayslipLine` per instalment, sets
   `payslip_line_id`/`payroll_run_id` and moves the instalment to `deducted`. The run's LOAN deduction
   total must equal the sum of those instalments — the built design asserts this in code, and so must the
   implementation.
4. **Visibility.** The employee sees the deduction on EMP-07 with a link to the schedule on EMP-19; the
   register on PY-13 shows outstanding balances and this month's scheduled deduction.
5. **Closure.** After the final instalment, `status = closed` automatically, and the closure is visible to
   the borrower rather than being a silent disappearance from a list.

### 4.2 States

`Loan`: `pending_approval` → `active` → `closed` | `foreclosed`; `rejected` / `cancelled` terminate before
activation. Derived UI states from PY-13: *closing this month*, *installment skipped/waived*,
*outstanding at exit*, *awaiting checker*.
`LoanInstallment`: `scheduled` → `deducted` | `waived` | `skipped` | `recovered_at_exit` | `foreclosed`.

### 4.3 Edge cases and error paths

| Situation | Required behaviour |
|---|---|
| **Employee on LOP; net pay is less than the EMI** | The instalment is **not** force-deducted into a negative net. It is marked `skipped` with the reason, the schedule extends by one month, and **the new closure month is stated explicitly** to the borrower (EMP-19). The design's `LOAN_CANDIDATES` logic already encodes the rule that a further instalment may not exceed the net actually receivable |
| **Partial deduction** | **Not supported in MVP.** An instalment deducts in full or is skipped. A part-instalment breaks the principal/interest split and the closing balance; if the school wants it, it is a schedule restructure, not a partial take |
| **Skip vs waive** | Two separate controls with different consequences: **skip** defers (balance unchanged, tenure extends), **waive** forgives (balance reduces, money is gone). The UI must never present one verb for both. A waive requires a distinct checker and a `LoanWaiver` row |
| **Foreclosure** | Settlement amount derived from the outstanding balance; any shortfall is an explicit `waiver_amount` with a reason. Settlement below outstanding **without** a stated waiver is blocked. Remaining instalments move to `foreclosed`. Audited (`M10 §Loans`) |
| **Start period inside a locked/approved month** | Blocked. The first deduction cannot be retro-fitted into a paid month; it starts at the next open run, or it becomes an arrears matter, which loans are not |
| **Loan raised after the run computed** | The run shows *recompute required* (the `input_digest` in [[M10-payroll-core]] §4.4 includes the due instalment set). It is never quietly picked up mid-approval |
| **Employee exits with a balance** | Instalments stop being taken by ordinary runs from the moment the settlement owns the balance; the outstanding flows to `FinalSettlement.loan_recovery` ([[M12-full-and-final]]). The design models this as an `atExit` state with the settlement reference on the row. **The handover point must be exactly one place** — either the run or the settlement — never both, or the employee is deducted twice |
| **Recovery exceeds the settlement's net payable** | A **negative F&F net** — a real state ([[M12-full-and-final]]). M10a's obligation is to hand over an accurate figure and a schedule, not to clamp it |
| **Employee rejoins / duplicate person record** | A second `Employee` row orphans the old loan (screen-inventory Q15). Flagged, not solved here |
| **Interest-free loan and `is_perquisite = true`** | The flag records that a perquisite arises; MVP does **not** compute its value unless C-M10a-01 is resolved. The screen must say which of the two it is doing — a flag shown next to an uncomputed value reads as a computed zero |
| **Rate changed after sanction** | Not permitted. A sanctioned loan's rate is part of the contract; a change is a **new** loan (or a foreclosure and re-sanction), both audited. Effective-dating does not apply to an executed contract (O18 governs master data, not this) |
| **Two operators approve concurrently** | `ETag`/`If-Match` on the loan plus the approval idempotency key; the second caller sees the first's decision |

### 4.4 Concurrency and idempotency

Sanction, foreclosure and waiver all carry idempotency keys (`§7`, O17) — a retried approve must not
create a second active schedule, and a retried foreclosure must not waive twice. Instalment consumption
happens inside the run's transaction and under the run's idempotency key, so a resumed compute cannot
double-deduct.

### 4.5 Audit and PII

Every sanction, rejection, skip, waive, foreclosure and closure writes an `AuditLog` row with actor,
before/after and timestamp (`§4.2`, O6), and each is **visible to the borrower** on EMP-19 — a deduction
whose reason the employee cannot see is exactly the kind of opacity that generates payroll grievances
([[M15a-helpdesk]]). Loan amounts are salary-class PII: they never enter a log line, an error payload or a
webhook body (O11, `guard-pii-logging`), and a colleague's loan is visible only with the salary PII
permission (O3). Loan records are retained past exit for the statutory window (O2).

### 4.6 Why EMP-19 is required, not optional

The screen inventory marks EMP-19 `[proposed]` because the spec grants no ESS loan surface. But
`M10 §Loans` puts an **EMI deduction on the employee's payslip**, and a consequential deduction with no
explanation is precisely what O6's provenance obligation and `DESIGN` principle 6 forbid. EMP-19 is
therefore treated as MVP in this spec, with two actions (*apply* and *request foreclosure*) remaining
`[proposed]` pending the OQ-M10a-01 ruling on who may originate a loan.

### 4.7 i18n and a11y

Every string is a Hindi + English i18n key, including the payslip line label for the EMI and the
skip/waive reason vocabulary (`guard-i18n-strings`, O12) — a borrower reading a deduction they do not
understand is the failure mode. Amounts render in Indian grouping, mono, right-aligned, identically on
PY-13, EMP-19 and the payslip. The schedule is a real table with header associations; the *skip* and
*waive* controls are distinguishable by label, not by colour or position alone (WCAG AA, `§9`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M10a-AC-01 | `Loan`, `LoanInstallment` and `LoanWaiver` each carry a NOT-NULL `tenant_id` FK and `ENABLE`+`FORCE ROW LEVEL SECURITY` with `USING` and `WITH CHECK` policies created **in the same migration** as the model; a cross-tenant read or write of any of them fails through both the ORM and raw SQL. | `§3`, `guard-rls-policy`, O7 |
| M10a-AC-02 | Every monetary field on all three tables is `Decimal`-backed (`NUMERIC(14,2)`; rates `NUMERIC(9,4)`), no `float` appears in the schedule or recovery computation, and money crosses the API as a string. | `§6.9` (annotates `(Decimal)`), `guard-money-float` |
| M10a-AC-03 | Creating a loan generates the **full `LoanInstallment` schedule immediately**, with the principal/interest split summing exactly to the principal and the interest, any rounding remainder absorbed into the final instalment, and a closing balance of zero. | `M10 §Loans`, `§6.9` |
| M10a-AC-04 | A loan requires **maker–checker**: it is approved by a distinct `payroll.approve` holder who is not the requester, enforced by a database constraint and re-verified server-side; the approve control is absent for the requester and the attempt is refused server-side if made. | `M10 §Loans`, `M10 §Permissions`, `§8`, **O5**, A42 |
| M10a-AC-05 | Nothing is deducted while a loan is `pending_approval`; the schedule goes live only on approval. | `§6.9 Loan.status`, A42 |
| M10a-AC-06 | An **active loan auto-deducts the correct EMI as a `PayslipLine`** in each run and decrements the outstanding balance; the instalment records the `payslip_line_id` and `payroll_run_id` where it landed. | `M10 §Acceptance` (verbatim), `§6.9` |
| M10a-AC-07 | The sum of the run's loan deduction lines equals the sum of the instalments due in that period; a mismatch blocks the run's reconciliation. | `M15 §Acceptance`, [[M10-payroll-core]] |
| M10a-AC-08 | Where net pay is insufficient (LOP or otherwise), the instalment is **skipped with a reason** rather than forced into a negative net; the schedule extends and the revised closure month is shown to the borrower. | PY-13, EMP-19 non-happy paths |
| M10a-AC-09 | **Skip and waive are separate actions with separate outcomes** — skip defers without changing the balance, waive reduces the balance and creates a `LoanWaiver` row; a waive requires a mandatory reason and a **distinct checker**. | PY-13, A43, **O5** |
| M10a-AC-10 | Foreclosure derives the settlement figure from the outstanding balance; a settlement below outstanding is refused unless an explicit waiver amount and reason are supplied; remaining instalments are cancelled and the whole action is audited. | `M10 §Loans` ("foreclosure/waiver is audited"), A43 |
| M10a-AC-11 | **An unclosed loan's outstanding balance appears in the exiting employee's F&F `loan_recovery`**, and the same balance is never also deducted by an ordinary run. | `M10 §Acceptance` (verbatim), [[M12-full-and-final]] |
| M10a-AC-12 | A loan whose start period falls in a locked or approved month is refused at creation. | `§6.9`, [[M10-payroll-core]] |
| M10a-AC-13 | A loan approved after the run computed causes the run to report *recompute required*; it is never absorbed silently between submission and approval. | `§7`, [[M10-payroll-core]] §4.4, **O17** |
| M10a-AC-14 | Sanction, foreclosure and waiver are idempotent under a client key; a retry never creates a second schedule or a second waiver. | `§7`, **O17** |
| M10a-AC-15 | Every state change writes an immutable audit row with actor, before/after and timestamp, and the borrower can see the sanction, every deduction, every skip and every waiver affecting them. | `§4.2`, **O6**, `DESIGN` principle 6 |
| M10a-AC-16 | The borrower's EMP-19 view shows outstanding balance, the full schedule with each instalment's status, the payslip line each deduction landed on, the perquisite flag where set, and the projected closure month. | EMP-19, [[M13-ess-mobile]], **O6** |
| M10a-AC-17 | Loan amounts never appear in a log line, error payload or webhook body; another employee's loan is visible only with the salary PII permission, and that access is logged. | **O11**, **O3**, `guard-pii-logging` |
| M10a-AC-18 | A sanctioned loan's principal, rate and tenure are immutable; a change is a new loan or a foreclosure and re-sanction, both audited. | `§4.2`, `§4.3` |
| M10a-AC-19 | `is_perquisite` is presented as a flag whose valuation is stated as computed or not computed — never as an implied zero. Where valuation is in scope (per the C-M10a-01 ruling), the benchmark rate comes from the pinned `StatutoryConfig`, never a literal. | `guard-statutory-hardcode`, **O9**, blueprint §4 |
| M10a-AC-20 | Loan records and their audit survive the employee's exit for the statutory retention window. | **O2**, `§8` |
| M10a-AC-21 | Every user-facing string, including the EMI payslip-line label and the skip/waive reason vocabulary, resolves through Hindi + English i18n keys. | `guard-i18n-strings`, O12 |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| **Unit** | **deathstroke** | Schedule generation: components sum exactly to principal and interest for awkward combinations (₹369,000 over 18 months; 0 % over 4; 5 % over 24), remainder lands in the final instalment, closing balance is exactly zero; outstanding recomputation after skip, waive and foreclosure; the "skip extends tenure, waive reduces balance" invariant; EMI derivation and the effect of a sanctioned rounding; the distinct-person predicate |
| **Engine integration** | **riddler** | The EMI lands as a `deduction` line inside the run; the run's loan total equals the due instalment set; interaction with a negative-net employee; interaction with an F&F in the same period (deducted **once**, not twice) |
| **Golden-file** | **riddler** + **bane** | The "employee with a loan EMI" scenario in [[M10-payroll-core]] §4.6, per config version |
| **Integration / RLS** | **bane** | Cross-tenant reads and writes on all three tables through ORM and raw SQL; a tenant-B loan is invisible on tenant A's PY-13 and its totals |
| **Governance** | **bane** | Requester cannot approve (server-side refusal); a waiver without a checker is refused; a waiver without a reason is refused; foreclosure below outstanding without a waiver is refused; a start period in a locked month is refused; retried sanction creates one schedule |
| **E2E** | **bane** | Sanction → three runs deduct → LOP month skips and extends → employee exits → balance appears in F&F and is not also deducted by the final ordinary run |
| **Contract** | **cyborg** + CI | Money serialises as a string; generated TS/Dart compile clean |
| **UI / a11y** | **two-face** | Skip and waive are distinguishable by label; Indian money grouping; Hindi parity on the EMI label |
| **Compliance** | **gordon** | Any diff touching the waiver path, the perquisite flag or the F&F handover |

---

## 7 · Proposed stories

Build-plan **Sprint 7** (blueprint: loans ride on payroll core).

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M10a-S01 | `Loan`, `LoanInstallment`, `LoanWaiver` models + RLS + distinct-person constraint | The contract, the schedule and the forgiven-money record. | oracle | 5 | M10-S07 |
| M10a-S02 | Schedule generator (simple/none interest) with exact-sum rounding | A schedule that closes at exactly zero. | riddler | 5 | M10a-S01 |
| M10a-S03 | Sanction workflow + AC-02 integration + idempotency | Nothing deducts until a second person says so. | wonder-woman | 5 | M10a-S01, M10-S14 |
| M10a-S04 | Run integration: instalment pickup, payslip line, balance decrement, digest participation | The deduction the whole module exists for. | riddler | 8 | M10a-S02, M10-S08 |
| M10a-S05 | Insufficient-net handling: skip, tenure extension, revised closure month | The LOP month that must not create a negative net. | riddler | 5 | M10a-S04 |
| M10a-S06 | Skip / waive / foreclose actions with checker gate and audit | Two verbs that must never be one. | cyborg | 5 | M10a-S03 |
| M10a-S07 | F&F handover: outstanding to `loan_recovery`, single-deduction guarantee | The balance the school currently discovers too late. | riddler | 5 | M10a-S04, M12 |
| M10a-S08 | PY-13 loans & advances register | Who owes what, and what comes out this month. | green-lantern | 8 | M10a-S06 |
| M10a-S09 | EMP-19 my loans & advances (web + Flutter) | Provenance for a deduction the borrower did not choose this month. | nightwing | 5 | M10a-S04 |
| M10a-S10 | Loans register export (PY-18) + reconciliation line | The Labour-Code-shaped register, reconciling. | green-lantern | 3 | M10a-S08 |
| M10a-S11 | Unit + governance test suites | Schedule arithmetic and the refusals. | deathstroke | 5 | M10a-S06 |
| M10a-S12 | E2E sanction → deduct → skip → exit → F&F | The whole life of a loan, once. | bane | 5 | M10a-S07, M10a-S09 |
| M10a-S13 | *(conditional)* Loan-interest perquisite valuation from pinned config | Only if C-M10a-01 rules valuation into MVP. | riddler | 5 | M11a |

**Total: 13 stories, 69 points** (M10a-S13's 5 points conditional).

**Dependency edges constraining order.** M10a-S04 cannot start before [[M10-payroll-core]]'s compute engine
(M10-S08) exists; M10a-S03 needs the shared maker–checker service (M10-S14), which is why AC-02 must ship
in the same wave. M10a-S07 needs [[M12-full-and-final]], which the build plan places in **Sprint 9** — so
loans ship in Sprint 7 with the exit handover **stubbed and flagged**, and the F&F link closes in Sprint 9.
That gap is a scheduling fact worth naming, because a loan module that has never been exercised through an
exit is a loan module with its most expensive bug still in it.

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (**not applied**) |
|---|---|---|---|
| **OQ-M10a-01** | **Who originates a loan?** `§6.9 Loan` starts at `status=pending_approval` with an `approval_chain`, but the spec never names the actor — employee, HR, or payroll. (screen-inventory Q2.) | It decides whether EMP-19 has an *Apply* action at all, what the approval chain's first step is, and whether HR raising a loan on someone's behalf needs the employee's consent recorded (DPDP). | Support both: HR/Payroll origination always; employee self-application behind a tenant flag. The chain's first approver is never the originator. **Needs a ruling before EMP-19 ships.** |
| **OQ-M10a-02** | **What are the loan policy limits and where are they configured?** Maximum principal, tenure, eligibility by grade or tenure of service, number of concurrent loans. PY-13 marks this `[proposed]`. | Without limits, "over the sanction limit → flagged" (EMP-19's own failure path) has nothing to compare against, and the flag becomes decorative. | A `LoanPolicy` per legal entity (max principal absolute or × monthly gross, max tenure, max concurrent, eligible staff categories, minimum service). No hardcoded numbers. **Needs a product ruling.** |
| **OQ-M10a-03** | **Simple or reducing-balance interest?** The built design computes simple interest (`principal × rate × tenure / 1200`). The spec says only "interest_rate". | The two produce materially different schedules and different perquisite values. Choosing at implementation time means the first customer's expectation decides it. | `interest_method` on the loan, defaulting to `simple` (which matches the design and is what schools actually use). Confirm. |
| **OQ-M10a-04** | **Is a waived amount a taxable perquisite?** ui-compliance A43 raises this as §9-Q10 and it is still open. | A forgiven ₹40,000 is almost certainly income in the employee's hands; not taxing it understates TDS and Form 16. | Treat a waiver as a taxable perquisite by default, with `LoanWaiver.is_taxable_perquisite` overridable with a reason, and flow it to [[M11-statutory-compliance]]. **Needs a tax ruling.** |
| **OQ-M10a-05** | **Does a loan follow the employee across a campus or legal-entity transfer?** `legal_entity_id` is the lender, and inter-branch transfers are P2. | A teacher moving from one trust to another inside the same group either carries a debt across employers or does not. | Loan stays with the sanctioning legal entity; a transfer triggers a mandatory review. **Confirm** — this touches P2 inter-branch transfer. |
| **OQ-M10a-06** | **Can a loan be sanctioned to an employee already in `notice`?** Nothing forbids it. | Lending to someone leaving in three weeks, recovered from an F&F that may be negative. | Block by default, overridable with a reason and the checker's explicit acknowledgement of the F&F consequence. |
| **C-M10a-01** | **Perquisite valuation is P2; the perquisite flag is MVP.** Blueprint PART A §4 tags "★ Perquisite valuation" **[P2]**, while `§6.9 Loan.is_perquisite` and `M10 §Loans` ("interest may be flagged as a perquisite") are MVP, and the built design says the perquisite *value* "is computed by the run from the pinned configuration". | Three documents describe three different states: a flag only, a flag plus a computed value, and a P2 deferral. An interest-free loan whose perquisite is never valued understates TDS under §17(2), which surfaces at Form 16 time in [[M11-statutory-compliance]]. | Bring **loan-interest** perquisite valuation into MVP as a narrow carve-out (benchmark rate from `StatutoryConfig`), leaving accommodation and transport perquisites P2. If declined, the UI must say the value is not computed. **Needs a ruling** — this is the sharpest correctness question in M10a. |
| **C-M10a-02** | **`M10 §API` lists `…/loans` (+`/approve`, `/foreclose`) as REST**, against the 2026-07-18 GraphQL-primary decision. | Same conflict as C-M10-04 in [[M10-payroll-core]]; recorded here so the loan lane does not resolve it differently. | Logical action names; GraphQL mutations, REST only for supporting-document upload. Confirm with cyborg. |
| **C-M10a-03** | **The spec never says loans stop being deducted once F&F owns the balance.** `M10 §Loans` says the outstanding "flows to M12 `loan_recovery`"; `M12` lists loan recovery as a settlement component. Neither says which one takes the final month. | If both take it, the leaver is deducted twice in their last month and only notices after the money has gone. | The settlement owns the balance from the moment it is computed; the run excludes `atExit` loans (the built design already models this). Stated here as an AC (M10a-AC-11); confirm it matches [[M12-full-and-final]]'s spec. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
