# M10b — Reimbursements & FBP · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M10 Payroll — Reimbursements / FBP (build-plan Sprint 7) · **Work item:** NA-22 ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M10 §*Reimbursements / FBP (ShriConnect scope,
> 2026-07-22)*, §6.9 `ReimbursementClaim` / `ReimbursementClaimLine`, M10 §API, §Permissions, §Acceptance;
> M13; §4.2, §7, §8 · `docs/functionality-blueprint.md` PART A **§13 Expense, Reimbursement & Travel**
> (mobile submission with receipts, configurable policies by category/role, multi-level approval,
> payout via payroll — all **[MVP]**; travel and mileage **[Later]**) and PART A §4, PART C item 4 ·
> `docs/ui-compliance-requirements.md` **O5, O3, O6, O10, O11, O17**, actions A44, A45 ·
> `docs/screen-inventory.md` EMP-12, EMP-13, DH-09, PY-14, AC-02 ·
> built design `design/v3/pages/py-ops.jsx` §8, `emp-tasks.jsx`.
>
> **Graph:** claims are submitted from [[M13-ess-mobile]], approved by a manager in the chain from
> [[M2-identity-access]], and paid **only** through a payout batch attached to a run in
> [[M10-payroll-core]]; receipts are files on the REST edge described in [[M0-foundations]]; tax treatment
> per category is settled with [[M11-statutory-compliance]]; unpaid approved claims at exit are the open
> question that reaches [[M12-full-and-final]]; notifications go via [[M14-notifications]]; disputes
> become tickets in [[M15a-helpdesk]]; registers are [[M15-reporting-platform]]'s. Siblings:
> [[M10a-loans-advances]], [[M10c-arrears-pay-revision]].

---

## 1 · Intent

A teacher buys ₹2,400 of lab consumables on a Saturday, photographs the bill on her phone in the corridor
on Monday, and expects to see it in her salary at the end of the month. Between those two moments the
school needs a department head to say the expense was real, a payroll operator to decide it is exempt or
taxable, and a **second** person to sign off before the money leaves — because a payout batch is a bulk
release of school funds, and `M10 §Reimbursements` makes that maker–checker without qualification.

M10b's design tension is that **approval and payment are deliberately separate**. The head who approves the
claim does not release the money; the payout batch does, under a distinct checker. Every screen in the
built design enforces that separation by what it refuses to contain — DH-09 must not contain the payout
batch, PY-14 must not contain claim approval. This spec keeps that separation as a rule, because collapsing
them is the obvious "simplification" that would quietly remove the control.

---

## 2 · Scope & surfaces

### In scope

| Area | What M10b delivers |
|---|---|
| The claim | `ReimbursementClaim` — category (LTA, medical, telephone, books/academic, fuel), amount **Decimal**, `tax_treatment` (taxable / exempt / fbp), status, approval chain, and the paying run |
| Claim lines | `ReimbursementClaimLine` — description, amount **Decimal**, `incurred_on`, **encrypted receipt reference per line** |
| **Policy** | `ReimbursementPolicy` — per-category, per-role/pay-group limits and enforcement mode. Blueprint §13 makes "configurable expense policies by category/role" **[MVP]**; the dev spec has no entity for it (C-M10b-01) |
| Submission | Mobile-first with receipt upload, draft save, offline tolerance ([[M13-ess-mobile]]) |
| Approval | Multi-level chain (blueprint §13 **[MVP]**), claimant ≠ approver, reject with reason, send-back |
| **Payout batch** | `ReimbursementPayoutBatch` — the entity the spec implies but does not name; approved-unpaid claims selected into a batch attached to a `PayrollRun`, released under **maker–checker** |
| Payment | Approved batch lines land as `earning` `PayslipLine`s in [[M10-payroll-core]], split by tax treatment |
| Employee view | EMP-12 (my claims, with the batch/run that paid each) and EMP-13 (new claim) |

### Explicitly out of scope

| Out | Owned by / status |
|---|---|
| Travel requests, travel-desk, mileage/distance reimbursement | **[Later]** (blueprint §13) |
| OCR / receipt auto-reading | Not in the dev spec; the deck's "AI" claims are C-M10-08 in [[M10-payroll-core]] |
| The TDS effect of a taxable reimbursement | [[M11-statutory-compliance]] — M10b supplies the taxable/exempt split |
| The payroll run, payslip and bank file | [[M10-payroll-core]] |
| Vendor/direct payment (paying a shop rather than the employee) | Not in scope; every payout goes through payroll |
| Claims by one employee on another's behalf | No delegate model exists (screen-inventory Q28) |

### Surfaces

- **EMP-13 · New claim** and **EMP-12 · My claims** ([[M13-ess-mobile]] + web).
- **DH-09 · Reimbursement approvals** (Department Head) — receipts viewable inline, claimant history,
  approve/reject with reason. Contains **no** payout control.
- **PY-14 · Reimbursement payout batches** (Payroll Operator, maker) — eligible claims, batch total,
  taxable/exempt split, the attached run, and the checker gate. Contains **no** claim-approval control.
  Built in `design/v3/pages/py-ops.jsx` (block 8).
- **AC-02 · maker–checker gate** — where the batch is actually released.

---

## 3 · Data model

All tables tenant-owned: NOT-NULL `tenant_id` FK plus `ENABLE`+`FORCE ROW LEVEL SECURITY` with `USING`
**and** `WITH CHECK` policies **in the same migration as the model** (`guard-rls-policy`).

**Money is `Decimal`, stated per field.** `ReimbursementClaim.amount`, `ReimbursementClaimLine.amount`,
`ReimbursementPolicy.limit_amount`, `ReimbursementPayoutBatch.total_amount`, `.taxable_amount`,
`.exempt_amount` and every per-line payout figure are `NUMERIC(14,2)` via M0's `MoneyField`, computed as
`decimal.Decimal`, serialised as **strings** across GraphQL and REST. `§6.9` annotates the two spec
entities `(Decimal)`; this spec extends the annotation to the tables it adds.

### 3.1 `ReimbursementClaim` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK Tenant, not null | + RLS policy, same migration |
| `employee_id` | FK Employee | the claimant; a claim is always self ([[M3-core-hr-people]]) |
| `legal_entity_id` | FK LegalEntity | who pays; scopes the batch and the checker's queue |
| `reference` | text | human-readable |
| `category` | enum `lta` \| `medical` \| `telephone` \| `books_academic` \| `fuel` | `§6.9`; **no default** — the category drives the tax treatment |
| `financial_year` | text (`2026-27`) | **added** — FBP entitlements are annual; without an FY key the remaining-entitlement figure EMP-12 must show cannot be computed |
| `amount` | **`NUMERIC(14,2)` Decimal** | derived as Σ lines; stored for query performance and asserted equal |
| `tax_treatment` | enum `taxable` \| `exempt` \| `fbp` | `§6.9`. **Derived from the category via policy, shown not chosen** by the claimant (EMP-13) |
| `status` | enum `draft` \| `submitted` \| `approved` \| `rejected` \| `paid` \| `withdrawn` \| `sent_back` | `§6.9` gives the first five; withdrawal and send-back are required by EMP-12/DH-09 |
| `approval_chain` | JSONB | multi-level, per blueprint §13 |
| `current_approver_user_id` | FK User, null | whose turn it is |
| `payout_batch_id` | FK ReimbursementPayoutBatch, null | set on batching |
| `payroll_run_id` | FK PayrollRun, null | `§6.9` — set when the paying run is known; `status=paid` when that run disburses |
| `submitted_at`, `decided_at`, `decided_by_user_id`, `decision_reason` | | reason mandatory on reject and send-back |
| `over_limit`, `over_limit_reason` | bool, text | the policy verdict retained as evidence |

### 3.2 `ReimbursementClaimLine` (§6.9)

`tenant_id` (+RLS), `claim_id`, `sequence`, `description`, `amount` **`NUMERIC(14,2)` Decimal**,
`incurred_on` date (**not future**), `receipt_ref` (**encrypted** object-store key, per-tenant namespace,
signed-URL access only — `§6.9` marks it `(enc)`), `receipt_sha256` (duplicate-receipt detection),
`line_status` (`claimed` | `approved` | `rejected`) and `line_reason`.

Line-level status exists because DH-09 raises partial approval by line as a natural `[proposed]` action.
The column is defined now so that granting it later is a permission change, not a migration.

### 3.3 `ReimbursementPolicy` — **new entity, MVP by the blueprint** (closes C-M10b-01)

Blueprint §13 makes "configurable expense policies by category/role" **[MVP]**. `§6.9` has no entity, and
EMP-12's "category entitlement remaining", EMP-13's "policy limit check" and DH-09's "policy limit vs
claimed" all read from something that does not exist. Configurable means a configuration record, or it
becomes a constant in a resolver (`guard-hardcoded-values`).

`tenant_id` (+RLS), `legal_entity_id`, `category`, `applies_to_pay_group_id` / `applies_to_staff_category_id`
(either, both nullable = applies to all), `financial_year`, `limit_amount` **Decimal, nullable**,
`limit_basis` (`per_claim` | `per_month` | `per_financial_year`), `enforcement`
(`block` | `flag_and_route_up`), `tax_treatment` (`taxable` | `exempt` | `fbp`),
`requires_receipt` bool (default true), `max_claim_age_days` int, `effective_from`, `superseded_by_id`.

The **tax treatment lives on the policy, not in code** — which category is exempt is a tax judgement the
school's accountant makes, and it changes (O9's discipline applied to a non-statutory but tax-affecting
setting).

### 3.4 `ReimbursementPayoutBatch` — **new entity, required** (the spec names the concept, not the table)

`M10 §Reimbursements` says approved claims "are paid out in a **payout batch** attached to a `PayrollRun`.
The payout batch is a financial finalization → **maker-checker** (`payroll.approve`) required", and
`M10 §API` exposes `…/reimbursement-payout-batches` (+`/approve`). `§6.9` gives the claim a
`payroll_run_id` but defines no batch. Without the table there is nothing to approve, nothing to hold the
maker and checker, and no unit for the AC-02 queue.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `legal_entity_id`, `period` | | |
| `payroll_run_id` | FK PayrollRun | the run that will pay it |
| `reference` | text | |
| `status` | enum `draft` \| `awaiting_checker` \| `approved` \| `paid` \| `rejected` \| `cancelled` | |
| `claim_count` | int | |
| `total_amount`, `taxable_amount`, `exempt_amount` | **Decimal** | must sum: `taxable + exempt = total` |
| `maker_user_id`, `submitted_at` | | |
| `checker_user_id`, `decided_at`, `decision_reason` | | DB `CHECK (checker_user_id IS DISTINCT FROM maker_user_id)` + the natural-person rule of [[M10-payroll-core]] §4.5 |
| `input_digest_at_submission` | text | staleness detection — a claim removed after submission invalidates the total the checker was shown |
| `idempotency_key` | text | `§7`, O17 |

---

## 4 · Behaviour walk-through

### 4.1 Happy path

1. **Compose (EMP-13).** The employee picks a category — **no default**, because the category decides the
   tax treatment, which is then **displayed, not chosen**. Lines are added with description, amount
   (`Decimal`), `incurred_on` (not future) and **a receipt per line**. The running total and the remaining
   category entitlement for the financial year are visible **before** submission, not after rejection.
2. **Submit.** With every line receipted, the claim moves to `submitted`, the approval chain is shown
   before the click, the first approver is notified ([[M14-notifications]]), and it is audited. Over-limit
   behaviour follows the policy's `enforcement`: blocked, or flagged and routed up.
3. **Approve (DH-09).** The approver — who is **never** the claimant — views receipts inline, sees policy
   limit versus claimed and the claimant's history in that category, and approves or rejects with a
   reason. Approval makes the claim **eligible for a payout batch**. It does **not** pay anything.
4. **Batch (PY-14).** The Payroll Operator (maker) selects approved-unpaid claims for the period into a
   draft batch attached to the open run, with the total and the taxable/exempt split computed from the
   claims, not typed.
5. **Release (AC-02).** The batch goes to a **distinct** `payroll.approve` holder, who confirms against the
   claim count and the exact ₹ total. On approval the batch is payable.
6. **Pay.** The run in [[M10-payroll-core]] writes one `earning` `PayslipLine` per claim (or per category,
   with the claim reference in `basis`), split by tax treatment so the taxable portion enters the TDS base
   and the exempt portion does not. When the run disburses, each claim moves to `paid` with its
   `payroll_run_id` set — which is what EMP-12 shows the employee.

### 4.2 States

`ReimbursementClaim`: `draft` → `submitted` → (`approved` | `rejected` | `sent_back` | `withdrawn`) →
`paid`. Screen states add *approved, awaiting payout batch*, *claim window closed for the FY*,
*category limit exhausted*, *duplicate receipt suspected*.
`ReimbursementPayoutBatch`: `draft` → `awaiting_checker` → `approved` → `paid` | `rejected` | `cancelled`.

### 4.3 Edge cases and error paths

| Situation | Required behaviour |
|---|---|
| **Claimant is the approver** | The approve control is **absent**, and an attempt is refused server-side (`M13 §Acceptance`, O5). This is separate from the batch checker rule and both apply |
| **Maker of the batch is the checker** | Refused server-side; the AC-02 row shows *"you created this — another approver is required"* (O5, A45) |
| **Approved claim, batch slips a month** | EMP-12 must say *"approved, scheduled for the <month> payout"* — never an indefinite "approved" with no destination |
| **Claim withdrawn or rejected after batching** | Removed from the batch with a notice; the batch total recomputes; if the batch was already submitted, it is **stale** and the checker's approval is refused until the maker resubmits |
| **Batch approved, then the run is recomputed** | The batch's claims stay attached; the run's `input_digest` includes the batch id so any change is detected |
| **Batch approved but the run never disburses** | Claims stay `approved`+batched, **not** `paid`. `paid` is a consequence of disbursement, not of approval — the design's own rule |
| **Duplicate receipt** | `receipt_sha256` collision warns and names the earlier claim (`[proposed]` in EMP-13, justified here by fraud risk); it does not silently block |
| **Receipt missing on a line** | Submission is blocked **naming the line**, unless the policy sets `requires_receipt=false` |
| **Future `incurred_on`** | Blocked |
| **Claim spans two financial years** | The `incurred_on` date decides the FY, stated on screen; a claim whose lines straddle 31 March must be split into two claims |
| **Claim older than `max_claim_age_days`** | Blocked or flagged per policy; the school decides, the code does not |
| **Weak connectivity on a phone** | Lines survive; receipts queue and upload on reconnect ([[M13-ess-mobile]] offline behaviour) |
| **Employee exits with an approved unpaid claim** | **The spec does not say what happens.** `M12` lists loan recovery but not reimbursement payables (screen-inventory Q18). OQ-M10b-02 |
| **Exempt claim later found taxable** | The claim is append-only once paid; a reclassification is a correction through [[M10c-arrears-pay-revision]] and a revised Form 16 in [[M11-statutory-compliance]], never an edit of the paid claim |
| **Partial approval by line** | Column exists (`line_status`); whether the action is granted is OQ-M10b-03 |
| **Claim on behalf of a colleague** | Not supported — no delegate model exists (screen-inventory Q28) |

### 4.4 Concurrency and idempotency

Batch creation, submission and approval carry idempotency keys (`§7`, O17) — a retried approve must not
release two batches for the same claims. `ETag`/`If-Match` on the claim and the batch. A claim can belong
to **at most one** batch, enforced by a partial unique constraint on `payout_batch_id` where the batch is
not cancelled; concurrent batching attempts therefore lose cleanly rather than paying twice.

### 4.5 Receipts, PII and audit

Receipts are staff-supplied documents that routinely contain a home address, a hospital name or a family
member's name. They are stored **encrypted** with a per-tenant object-store key namespace and served only
by short-lived signed URL through the REST edge; **every view is access-logged** (`§8`, O3, O10, and
DH-09's own "access is logged"). A medical receipt is health-adjacent data and is not shown to anyone
outside the approval chain and payroll. Amounts and receipt contents never enter a log line, error payload
or webhook body (O11). Every submission, approval, rejection, batching and release writes an immutable
audit row visible on the claim's timeline to the claimant (`§4.2`, O6).

### 4.6 i18n and a11y

Category names, tax-treatment labels, policy-limit messages and rejection reasons are Hindi + English i18n
keys (`guard-i18n-strings`, O12) — a rejection a claimant cannot read is a helpdesk ticket. Amounts render
in Indian grouping. On mobile: receipt capture is reachable by keyboard and screen reader, the running
total is announced on change, and file-upload errors name the offending line rather than failing the form
as a whole (WCAG AA, `§9`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M10b-AC-01 | `ReimbursementClaim`, `ReimbursementClaimLine`, `ReimbursementPolicy` and `ReimbursementPayoutBatch` each carry a NOT-NULL `tenant_id` FK and `ENABLE`+`FORCE ROW LEVEL SECURITY` with `USING` and `WITH CHECK` policies created **in the same migration** as the model; a cross-tenant read of a claim, a batch or a receipt fails through the ORM and raw SQL, and a tenant-B receipt URL cannot be minted from tenant A. | `§3`, `guard-rls-policy`, O7 |
| M10b-AC-02 | Every monetary field on all four tables is `Decimal`-backed `NUMERIC(14,2)`; no `float` appears in claim totalling, the taxable/exempt split or the payout computation; money crosses the API as a string. | `§6.9` `(Decimal)`, `guard-money-float` |
| M10b-AC-03 | A claim's `amount` equals the sum of its lines, and a batch's `total_amount` equals the sum of its claims and equals `taxable_amount + exempt_amount`; a mismatch blocks submission. | `M15 §Acceptance`, PY-14 |
| M10b-AC-04 | The claimant chooses the category; the **tax treatment is derived from policy and displayed, never chosen by the claimant**, and the resulting taxable/exempt split is visible on the batch. | `§6.9`, EMP-13, PY-14 |
| M10b-AC-05 | Every claim line requires a receipt (unless policy says otherwise); submission is blocked naming the offending line; receipts are stored **encrypted** and served only by short-lived signed URL. | `§6.9 receipt_ref(enc)`, `§8`, **O10** |
| M10b-AC-06 | Every receipt view is access-logged with actor, subject and timestamp; receipts are visible only to the approval chain and payroll, never to peers. | `§8`, **O3**, DH-09 |
| M10b-AC-07 | **A claimant can never approve their own claim** — the control is absent and the attempt is refused server-side. | `M13 §Acceptance`, **O5**, A44 |
| M10b-AC-08 | Approval makes a claim eligible for payment and pays nothing; **claim approval and payout are separate surfaces** — DH-09 carries no batch control and PY-14 carries no approval control. | `M10 §Reimbursements`, DH-09/PY-14 must-NOT-contain |
| M10b-AC-09 | **A reimbursement claim submitted from mobile with a receipt, once approved, is paid only via a payout batch that a distinct checker approves; the maker cannot self-approve** — enforced by a database constraint and re-verified server-side, including the two-accounts-one-person case. | `M10 §Acceptance` (verbatim), `§8`, **O5**, A45 |
| M10b-AC-10 | The checker sees the claim count, the exact ₹ total, the taxable/exempt split, the maker and the attached run before approving, and re-authenticates at the moment of approval. | **O5**, PY-14 |
| M10b-AC-11 | If any claim is added, removed, withdrawn or rejected after the batch was submitted, the checker's approval is refused as **stale** and the maker must resubmit. | `§7`, **O17**, AC-02 |
| M10b-AC-12 | A claim belongs to at most one non-cancelled batch, enforced by a database constraint; concurrent batching cannot pay a claim twice, and a retried batch approval releases once. | `§7`, **O17** |
| M10b-AC-13 | Approved batch lines land as `earning` `PayslipLine`s in the attached run, split so the taxable portion enters the TDS base and the exempt portion does not; each line names its claim. | `M10 §Reimbursements`, [[M11-statutory-compliance]], **O6** |
| M10b-AC-14 | A claim becomes `paid` only when the attached run **disburses** — not when the batch is approved — and EMP-12 then shows which batch and run paid it. | `§6.9 payroll_run_id`, EMP-12, **O6** |
| M10b-AC-15 | Category limits and enforcement mode come from `ReimbursementPolicy`; no limit, tax treatment or claim-age threshold is a literal in code or a screen; the remaining entitlement is visible to the employee **before** spending. | blueprint §13 **[MVP]**, `guard-hardcoded-values`, EMP-12 |
| M10b-AC-16 | Over-limit behaviour follows the policy's `enforcement` (block, or flag and route up) and the verdict is retained on the claim as evidence. | blueprint §13, EMP-13 |
| M10b-AC-17 | Multi-level approval chains are supported, with the current approver named and the chain visible to the claimant before submission. | blueprint §13 **[MVP]** |
| M10b-AC-18 | An approved claim awaiting payment states **which month's payout it is scheduled for**, never an indefinite "approved". | EMP-12 non-happy paths |
| M10b-AC-19 | A rejected claim is not editable; the claimant raises a **new** claim pre-filled from it, and the rejected record stands. | EMP-12, `§4.2` append-only |
| M10b-AC-20 | A duplicate receipt (hash collision) warns and names the earlier claim; it does not silently pass. | EMP-13, fraud risk |
| M10b-AC-21 | A future `incurred_on` is refused; a claim whose lines straddle a financial-year boundary must be split, and the FY-deciding rule is stated on screen. | EMP-13 non-happy paths |
| M10b-AC-22 | Every submission, approval, rejection, send-back, batching and release writes an immutable audit row, and the claimant can see the whole timeline of their own claim. | `§4.2`, **O6** |
| M10b-AC-23 | Claim amounts and receipt contents never appear in a log line, error payload or webhook body. | **O11**, `guard-pii-logging` |
| M10b-AC-24 | Claims and receipts are retained past exit for the statutory/records window and are not hard-deleted on employee exit. | **O2**, `§8` |
| M10b-AC-25 | Claim submission works on a weak connection: lines persist as a draft and receipts upload on reconnect. | `§9` Mobile offline, [[M13-ess-mobile]] |
| M10b-AC-26 | Category names, tax-treatment labels, limit warnings and rejection reasons resolve through Hindi + English i18n keys; amounts render in Indian grouping. | `guard-i18n-strings`, `§9`, O12 |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| **Unit** | **deathstroke** | Claim total = Σ lines and batch total = Σ claims = taxable + exempt, at Decimal precision; policy limit evaluation across `per_claim` / `per_month` / `per_financial_year` bases including the boundary claim that exactly hits the limit; FY derivation from `incurred_on` across 31 March; receipt-hash duplicate detection; the distinct-person predicate for both the approver rule and the checker rule; staleness digest for a batch whose membership changed |
| **Integration** | **cyborg** + **riddler** | Batch lines land in the run split by tax treatment; the taxable portion moves the TDS base and the exempt portion does not; a claim reaches `paid` only on disbursement |
| **Golden-file** | **riddler** + **bane** | The "employee with a reimbursement payout line" scenario in [[M10-payroll-core]] §4.6 |
| **Integration / RLS** | **bane** | Cross-tenant claim, batch and **receipt** access through ORM, raw SQL and signed URL; a peer cannot read another employee's receipt at any permission level below payroll |
| **Governance** | **bane** | Claimant cannot approve (server-side); batch maker cannot check (server-side, including two accounts for one person); stale batch approval refused; a claim cannot enter two batches under concurrency; retried approval releases once |
| **E2E** | **bane** | Phone submission with a photographed receipt on a throttled connection → head approves → batch → distinct checker → run disburses → EMP-12 shows the paying run and EMP-07 shows the line |
| **Contract** | **cyborg** + CI | Money as string; receipt upload/download only on the REST edge; generated clients compile |
| **UI / a11y** | **two-face** | Running total announced; per-line upload errors; Hindi parity on categories and rejection reasons |
| **Compliance** | **gordon** | The receipt-access path, the medical-category visibility rule, and the taxable/exempt split before merge |

---

## 7 · Proposed stories

Build-plan **Sprint 7** (payout batch), with the ESS surfaces landing in **Sprint 10** per §12's
ShriConnect sequencing note.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M10b-S01 | `ReimbursementClaim` + `ReimbursementClaimLine` models + RLS + encrypted receipt refs | The claim and its evidence. | oracle | 5 | M0-S16, M3 |
| M10b-S02 | `ReimbursementPolicy` model + limit/tax-treatment evaluator | Configurable means configured, not constant. | oracle + riddler | 5 | M10b-S01 |
| M10b-S03 | `ReimbursementPayoutBatch` model + RLS + distinct-checker constraint | The thing the checker actually approves. | oracle | 3 | M10b-S01, M10-S07 |
| M10b-S04 | Receipt upload/serve on the REST edge: encryption, signed URLs, access logging, hash | The most sensitive file in the module. | cyborg | 5 | M10b-S01 |
| M10b-S05 | Claim submission + multi-level approval workflow API | Chain, send-back, reject-with-reason, claimant≠approver. | cyborg | 8 | M10b-S02 |
| M10b-S06 | Batch composition, submission, staleness digest, AC-02 integration | Maker–checker on money leaving in bulk. | wonder-woman | 5 | M10b-S03, M10-S14 |
| M10b-S07 | Run integration: payout lines split by tax treatment; `paid` on disbursement | Where the claim becomes salary. | riddler | 5 | M10b-S06, M10-S08 |
| M10b-S08 | DH-09 reimbursement approvals (inline receipts, limit vs claimed, history) | The approver's judgement surface. | green-lantern | 8 | M10b-S05 |
| M10b-S09 | PY-14 payout batches | Selection, totals, split, the gate. | green-lantern | 8 | M10b-S06 |
| M10b-S10 | EMP-12 my claims + EMP-13 new claim (Flutter + web), offline-tolerant | Phone-first submission and the "which month pays this" answer. | nightwing | 13 | M10b-S04, M10b-S05 |
| M10b-S11 | Reimbursement register + reconciliation (PY-18) | The register that adds up. | green-lantern | 3 | M10b-S07 |
| M10b-S12 | Policy configuration screen (categories, limits, tax treatment, enforcement) | The screen without which the limits become literals. | green-lantern | 5 | M10b-S02 |
| M10b-S13 | Unit + governance test suites | Totals, limits, and the two distinct-person rules. | deathstroke | 5 | M10b-S07 |
| M10b-S14 | E2E mobile-to-payslip on a throttled connection | The journey the blueprint actually promised. | bane | 5 | M10b-S10 |

**Total: 14 stories, 83 points.**

**Dependency edges constraining order.** M10b-S06 needs the shared maker–checker service from
[[M10-payroll-core]] (M10-S14) — the batch is not a second gate implementation. M10b-S07 needs the compute
engine and must be sequenced with [[M11-statutory-compliance]] so the taxable split reaches the TDS base
in the same sprint it starts being paid. M10b-S10 lands with the Flutter app in **Sprint 10**, three
sprints after the payout batch exists, so **Sprint 7 must ship a web claim-entry path** or approved claims
in Sprints 7–9 have no origin. That is a real sequencing hole worth naming.

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (**not applied**) |
|---|---|---|---|
| **OQ-M10b-01** | **Is there a claim window, and who sets it?** EMP-12 marks it `[proposed]`; FBP is annual by nature but the spec defines no window. | "Claim window closed for the FY" is a state on the built screen with nothing behind it, and year-end claim cut-off is exactly when disputes happen. | `ReimbursementPolicy.max_claim_age_days` plus an FY cut-off date per legal entity. **Needs a product ruling.** |
| **OQ-M10b-02** | **What happens to an approved, unpaid claim when the employee exits?** `M12 §Business rules` lists loan recovery but **not** reimbursement payables (screen-inventory Q18). | The school owes the money and has no mechanism to pay it — the leaver's last payslip has already run and there is no off-cycle run in MVP (blueprint §4 tags supplementary runs P2). | Add reimbursement payables as an F&F component in [[M12-full-and-final]]. **Needs a ruling** — this is a genuine hole, not a preference. |
| **OQ-M10b-03** | **Is partial approval by line permitted?** DH-09 raises it as `[proposed]`; the entity has lines, so line-level rejection is natural but unspecified. | Without it an approver must reject an entire ₹8,000 claim because one ₹300 line lacks a bill, and the claimant re-keys everything. | Grant it: `line_status` exists, the approver rejects lines with reasons and the claim total recomputes before batching. Confirm. |
| **OQ-M10b-04** | **Which categories are exempt, and on what authority?** `tax_treatment` is an enum on the claim; nothing says who decides that medical is exempt up to what, or whether it varies by regime (old vs new). | Under the new regime most of these exemptions do not apply. Treating a category as exempt for an employee on the new regime understates TDS for every such employee, every month. | Tax treatment resolves **per employee per FY against the elected regime** in [[M11-statutory-compliance]], not per category alone. Policy supplies the default; the regime overrides. **Needs riddler + a tax ruling.** |
| **OQ-M10b-05** | **Is FBP declaration-based?** True flexible-benefit plans require an annual declaration of how a benefit allowance is apportioned; `tax_treatment=fbp` exists with no declaration entity. | Without a declaration, `fbp` is indistinguishable from `exempt` and the "FBP" in the module name is unimplemented. | Either treat `fbp` as a synonym for a policy-limited exempt category in MVP and say so, or scope an FBP declaration alongside the investment declaration in [[M11-statutory-compliance]]. **Needs a ruling.** |
| **OQ-M10b-06** | **Does a claim need a second pair of eyes at approval as well as at payout?** The spec requires a distinct **checker on the batch** and a non-self **approver on the claim**; whether a large single claim needs two approvers is open. | A ₹1,80,000 LTA claim passes on one head's approval and then rides inside a batch total nobody itemises. | Policy-driven approval levels by amount band (blueprint §13's "multi-level approval workflows"). Confirm the bands are configuration, not code. |
| **OQ-M10b-07** | **Are medical receipts subject to any special handling?** They are health-adjacent and often name a family member. DPDP treats health data as sensitive in practice. | Storing them like any other attachment, viewable by a department head, may be more exposure than the school intends. | Restrict medical-category receipt viewing to payroll + the direct approver, mark the category `sensitive`, and log every view distinctly. **Needs gordon's call.** |
| **C-M10b-01** | **"Configurable expense policies by category/role" is blueprint-MVP with no entity in `§6.9`.** Three built screens read a limit that has no source. | Configurable-with-no-config-table means the first limit becomes a constant in a resolver and the second customer needs a code change (`guard-hardcoded-values`). | Add `ReimbursementPolicy` (§3.3) to `§6.9` and a business-rule line to `M10 §Reimbursements`. Specified here, **not applied** to the dev spec. |
| **C-M10b-02** | **The payout batch is named in `M10 §Reimbursements` and `§API` but has no entity in `§6.9`.** | The maker–checker gate the acceptance criterion demands has nothing to attach to; an implementer would put maker/checker fields on the claim and lose the batch as a unit. | Add `ReimbursementPayoutBatch` (§3.4) to `§6.9`. Specified here, **not applied**. |
| **C-M10b-03** | **Screen-numbering error in `docs/screen-inventory.md`:** EMP-12 and DH-09 both cite the payout batch as **PY-16**; PY-16 is *Exits & settlements register* and the payout batch is **PY-14**. | A builder following those must-NOT-contain lines routes claims into the exits register. | Correct both citations to PY-14. Documentation fix, filed not applied (also recorded as C-M10-01 in [[M10-payroll-core]]). |
| **C-M10b-04** | **`M13 §Purpose` gives ESS claim submission to Sprint 10 while the payout batch lands in Sprint 7.** | For three sprints the batch has no claims to compose unless a web entry path exists. | Ship a web claim-entry surface in Sprint 7 and the Flutter one in Sprint 10, or move the batch to Sprint 10. **Needs a sequencing ruling from BATMAN.** |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
