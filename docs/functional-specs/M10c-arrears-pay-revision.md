# M10c — Arrears & Retrospective Pay Revision · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M10 Payroll — Arrears & retrospective pay-revision (build-plan **Sprint 9**) ·
> **Work item:** NA-22 · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M10 §*Arrears & retrospective pay-revision
> (ShriConnect scope, 2026-07-22)*, §6.9 `ArrearAdjustment`, M10 §API / §Permissions / §Acceptance;
> §4.3 effective-dating, §4.4 versioned statutory config, §7, §8, §12 (critical-path risk #3) ·
> `docs/functionality-blueprint.md` PART A §4 ("★ Arrears & retrospective pay-revision processing
> (DA/VDA revisions, pay-commission arrears) with auto PF/ESI/TDS recompute and month-splitting
> **[MVP]**"; off-cycle/arrears-only runs **[P2]**) and PART C item 4 ·
> `docs/ui-compliance-requirements.md` **O9, O5, O6, O18, O17, O3, O11**, action A46, A47 ·
> `docs/screen-inventory.md` PY-15, PY-05, PY-04, AC-02, EMP-07 ·
> built design `design/v3/pages/py-ops.jsx` §9.
>
> **Graph:** an arrears computation begins with a back-dated revision on PY-05 in [[M10-payroll-core]] and
> posts back into one of its runs; each affected month recomputes on **that month's originally pinned**
> version from [[M11a-statutory-config-versioning]], with the deltas calculated by
> [[M11-statutory-compliance]]; a retrospective honorarium rate change arrives from
> [[M10-payroll-core]]'s PY-04; a revision originating in [[M17-performance-appraisal]] is advisory and
> reaches pay only through PY-06; the reissued payslip is delivered by [[M13-ess-mobile]] and
> [[M14-notifications]]; a filed period touched by arrears means a revised return in
> [[M11-statutory-compliance]]; an arrears amount owed to a leaver reaches
> [[M12-full-and-final]]. Siblings: [[M10a-loans-advances]], [[M10b-reimbursements-fbp]].

---

## 1 · Intent

In February the trust approves a 12 % revision effective the previous April. Ten months of salary were
already paid, filed with PF, reported in TDS returns and printed on payslips staff have already read. The
school now owes each teacher the difference — and the difference is not "12 % × ten months". It is ten
separate recomputations, each of which must be done **on the rules that were in force in that month**,
because the PF ceiling changed in July and a July arrear computed on today's ceiling is simply the wrong
number.

This is the requirement that makes version pinning worth building. `§4.4` says each `PayrollRun` pins the
`StatutoryConfig` version it used; M10c is the module that **reads that pin back**, ten months later, one
month at a time. If the pin were a log line, a comment, or a timestamp resolved at read time, arrears would
be uncomputable and the product would quietly produce plausible wrong numbers — the worst possible failure,
because nobody notices until a PF inspection.

Everything else in M10c follows from that: the month split is visible rather than implied, the config
version is printed **per month** because they differ, a month whose original run cannot be resolved is
**listed and excluded** rather than computed on today's rules, adjustments are append-only so a correction
supersedes and never edits, and posting needs a distinct checker.

---

## 2 · Scope & surfaces

### In scope

| Area | What M10c delivers |
|---|---|
| Trigger | A back-dated `EmployeeSalary` revision (`pay_revision` · `da_vda` · `promotion` · `correction`), a retrospective `HonorariumRule` rate change, or a manual arrears basis |
| **Month split** | One `ArrearAdjustment` row **per affected month per employee**, never one lump figure |
| **Per-month config resolution** | Each month's row carries the `statutory_config_id` **that month's original run pinned**, resolved from the run, and recomputes PF/ESI/TDS on it |
| Recompute | Old figure, new figure, delta, and the statutory deltas per month, stored in `recompute` JSONB |
| Exclusions | A month whose original run cannot be resolved is listed and **excluded**, with the reason |
| Gate | Maker–checker before posting (`M10 §Arrears`, `M10 §Acceptance`, O5) |
| Posting | Approved adjustments post as `earning`/`deduction` `PayslipLine`s into a **regular open run** in [[M10-payroll-core]] (arrears-only runs are P2) |
| Append-only | A correction **supersedes**; nothing is edited, no past payslip is touched |
| Reissue | The affected employee's payslip is reissued **alongside** the original, both retained (EMP-07) |
| Downstream flags | Naming which filed artefacts (ECR, 24Q, Form 16) a touched period affects |

### Explicitly out of scope

| Out | Owned by / status |
|---|---|
| Arrears-only / off-cycle / supplementary runs | **[P2]** (blueprint §4) — arrears post into a regular run |
| The statutory calculators and the revised-return generation | [[M11-statutory-compliance]] |
| `StatutoryConfig` authoring and version publication | [[M11a-statutory-config-versioning]] |
| Bonus arrears | [[M11b-bonus]] — a bonus run is its own gated finalisation |
| The pay-commission / UGC pay-matrix engine (auto DA progression) | **[P2]** (blueprint §4, D5) — M10c handles the *arrears* of a revision, not its derivation |
| Editing any past payslip | **Forbidden everywhere.** There is no such action for any role |

### Surfaces

- **PY-15 · Arrears workbench** (Payroll Operator) — source, affected employees, **the month-by-month split
  with each month's originally pinned config version shown, not implied**, the recomputed PF/ESI/TDS
  deltas, the grand total, the posting run and the checker gate. Built in `design/v3/pages/py-ops.jsx`
  (block 9). The inventory names this one of two screens worth prototyping before its wave, "if the
  month-split with per-month pinned config can be made legible, the rest of payroll is easy by comparison".
- **PY-05 · Employee salary & revisions** — where a back-dated revision offers to generate arrears, and
  where back-dating across a pinned-config boundary makes the arrears path **mandatory, not optional**.
- **AC-02 · maker–checker gate** — where posting is authorised.
- **EMP-07 · My payslips** — the arrears line, and both versions of a reissued payslip.

---

## 3 · Data model

All tables tenant-owned: NOT-NULL `tenant_id` FK plus `ENABLE`+`FORCE ROW LEVEL SECURITY` with `USING`
**and** `WITH CHECK` policies **in the same migration as the model** (`guard-rls-policy`).

**Money is `Decimal`, per field.** `old_amount`, `new_amount`, `delta_amount`, every value inside the
`recompute` payload, and every batch total are `NUMERIC(14,2)` via M0's `MoneyField`, computed as
`decimal.Decimal`, serialised as **strings**. `§6.9` already annotates `delta_amount (Decimal)`; this spec
extends it to every field it adds, including the ones inside JSONB — a JSONB number is a float once it
round-trips through most JSON libraries, so **statutory deltas inside `recompute` are stored as strings**
and parsed back to `Decimal`. That is the one place in this module where a float would enter unnoticed.

### 3.1 `ArrearAdjustmentSet` — **new**, the unit that gets approved

`§6.9` gives `ArrearAdjustment` a maker-checker `status` per row, but a checker approves a *computation*
covering N employees × M months, not 40 individual rows. The set is what AC-02 queues and what the
`PayrollApproval` in [[M10-payroll-core]] §3.12 points at.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK Tenant, not null | + RLS policy, same migration |
| `legal_entity_id` | FK LegalEntity | |
| `reference` | text | `AR-2026-10`, per the built design |
| `source` | enum `pay_revision` \| `da_vda` \| `promotion` \| `correction` | mirrors `§6.9 ArrearAdjustment.source`; **no default** |
| `basis` | enum `salary_revision` \| `honorarium_rate` \| `manual` | what generated it |
| `source_employee_salary_ids` | UUID[] | the back-dated revisions this arrears set settles |
| `period_from`, `period_to` | date | the affected range |
| `employee_count`, `month_count` | int | |
| `status` | enum `draft` \| `computed` \| `awaiting_checker` \| `approved` \| `posted` \| `rejected` \| `superseded` | |
| `total_gross_delta`, `total_statutory_delta`, `total_net_delta` | **Decimal** | must equal the sum of rows |
| `excluded_months` | JSONB | `[{employee_id, period, reason}]` — visible, never silent |
| `target_payroll_run_id` | FK PayrollRun, null | the run it posts into |
| `maker_user_id`, `submitted_at`, `checker_user_id`, `decided_at`, `decision_reason` | | DB `CHECK (checker ≠ maker)` + the natural-person rule of [[M10-payroll-core]] §4.5 |
| `input_digest_at_submission` | text | staleness detection |
| `superseded_by_id` | FK self, null | append-only correction chain |
| `idempotency_key` | text | `§7`, O17 |

### 3.2 `ArrearAdjustment` (§6.9) — one row per employee per affected month

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `set_id` | FK ArrearAdjustmentSet | |
| `employee_id` | FK Employee | |
| `source` | enum as above | `§6.9` |
| `affected_period` | date (month-first-day) | `§6.9`; unique with `(set_id, employee_id)` |
| **`statutory_config_id`** | **FK StatutoryConfig, NOT NULL** | `§6.9`. **The month's ORIGINALLY pinned version**, copied from `original_payroll_run_id.statutory_config_id` — never resolved by date at compute time, never the current version |
| `original_payroll_run_id` | FK PayrollRun, **not null** | **added, and load-bearing**: it is the provenance of the pin and the thing whose absence makes a month unresolvable and therefore excluded |
| `original_employee_salary_id`, `revised_employee_salary_id` | FK EmployeeSalary | old and new basis, both retained |
| `old_amount`, `new_amount`, `delta_amount` | **`NUMERIC(14,2)` Decimal** | `delta = new − old`; may be **negative** (a downward correction) |
| `paid_days_at_original` | Decimal | the arrear is prorated on the **original month's** paid days, not this month's |
| `recompute` | JSONB | `§6.9` — `{pf: {employee, employer}, esi: {employee, employer}, tds, lwf, pt}`, **every value a string**, each computed on `statutory_config_id` |
| `net_delta` | **Decimal** | `delta_amount − Σ employee-side statutory deltas` |
| `payroll_run_id` | FK PayrollRun, null | `§6.9` — the run that posted it |
| `payslip_line_ids` | UUID[] | where it landed; provenance for EMP-07 |
| `status` | enum `pending_checker` \| `approved` \| `posted` \| `excluded` \| `superseded` | `§6.9` gives the first three |
| `exclusion_reason` | text | mandatory when `excluded` |
| `affects_filings` | JSONB | which filed artefacts this month's change invalidates (ECR / 24Q / Form 16), for [[M11-statutory-compliance]] |

**No `updated_at`-driven edit path exists.** `M10 §Arrears` says adjustments are append-only; a correction
creates a new set that supersedes and the original rows stand (O6, O18).

---

## 4 · Behaviour walk-through

### 4.1 Happy path

1. **Trigger.** On PY-05 a salary is revised with `effective_from` in a past, already-paid month. The
   revision supersedes as normal (`§4.3`), and because it is back-dated the screen **offers arrears** — and
   where the back-dating crosses a pinned-config boundary, the arrears path is **mandatory, not optional**,
   because the difference cannot be settled correctly in a single current-month figure.
2. **Create the computation (PY-15).** The maker names the `source`, the affected period range and the
   employee population. Ranges predating an employee's DOJ, or predating the available run history, are
   refused at creation with the reason.
3. **Compute.** For each employee × each month in range:
   - resolve the **original `PayrollRun`** for that legal entity and month;
   - if it cannot be resolved (no run, run never approved, employee not in it) → the month is **excluded**,
     listed with its reason, and **never computed on today's config**;
   - take `statutory_config_id` **from that run**;
   - recompute that month's pay on the revised salary version, using the **original month's paid days** and
     the original month's proration basis;
   - `delta = new − old`;
   - call [[M11-statutory-compliance]]'s calculators **with that month's pinned config** to recompute PF,
     ESI, PT, LWF and the TDS effect, storing each delta;
   - write one `ArrearAdjustment` row carrying all of it.
4. **Review the split.** PY-15 shows, per month: old, new, delta, **the config version and its
   effective-from**, the statutory deltas and the net — with column totals that sum. The built design
   already renders two different versions inside one three-month arrears set (`CFG_APR` for June,
   `CFG_JUL` for July and August); that is the screen's entire point.
5. **Send for approval.** The set moves to `awaiting_checker` with its total and the named checker; the
   `input_digest` is recorded.
6. **Approve (AC-02, a distinct human).** The checker opens the month split as evidence and confirms
   against the exact ₹ total. Posting requires a distinct checker (`M10 §Acceptance`, O5).
7. **Post to a run.** The approved set attaches to an **open, not-yet-approved** run and its rows land as
   payslip lines — the gross delta as an `earning` line naming the month, and each statutory delta as its
   own line. The rows move to `posted`, and the run's own maker–checker still applies to the run.
8. **Reissue and notify.** The affected employees' payslips for the arrears month are **reissued alongside**
   the originals with the supersession visible; staff are notified. The filings affected are flagged to
   [[M11-statutory-compliance]] for a revised return.

### 4.2 States

`ArrearAdjustmentSet`: `draft` → `computed` → `awaiting_checker` → `approved` → `posted`, with `rejected`
and `superseded` as terminals. PY-15 adds *month outside available config history* (**blocking**) and
*stale* (inputs changed since submission — the built design models a `stale` awaiting set explicitly).
`ArrearAdjustment`: `pending_checker` → `approved` → `posted`; or `excluded`; or `superseded`.

### 4.3 Edge cases and error paths

| Situation | Required behaviour |
|---|---|
| **A month's original run cannot be resolved** | The month is **listed and excluded with the reason**, never silently computed on the current config. This is the single most important rule on the screen (`M10 §Arrears`, PY-15) |
| **Two config versions inside the affected range** | Normal and expected. Each month uses **its own** pinned version and the screen prints both. A set that shows one version across a range spanning a rate change is a bug |
| **The current config differs from every pinned version in the range** | Irrelevant to the computation. The current version is used for **nothing** in M10c except the run the arrears post into, which computes its *own* month normally |
| **A statutory rate rose retrospectively by law** | Out of scope as an automatic behaviour: that is a new config version with an effective date in the past, which is [[M11a-statutory-config-versioning]]'s problem and a different (and rarer) operation than a salary revision. Flagged as OQ-M10c-05 |
| **Negative arrears** (a downward correction) | A first-class case. `delta_amount` may be negative; the recovery appears as a deduction and can push the target month toward a negative net, which [[M10-payroll-core]] §4.3 forbids clamping |
| **Employee exited during the affected range** | Arrears are still owed for the months worked. If they exited before the posting run, the amount must reach [[M12-full-and-final]] rather than a payslip that will never exist. OQ-M10c-03 |
| **Employee joined mid-range** | Months before DOJ are excluded with that reason |
| **Target run already approved** | Posting is blocked. Arrears post only into an open run |
| **Inputs change after submission** | The set is **stale**; the checker's approval is refused and the maker must recompute — the built design already renders a stale awaiting set with the cause named |
| **A posted set is wrong** | It is **superseded** by a new set, never edited, and both stand on the record. The employee sees two payslips for that month, not a rewritten one |
| **Arrears touch a period already filed** (ECR submitted, 24Q filed, Form 16 issued) | The set must **name the affected artefacts** before approval, and the consequence — a revised return, a revised Form 16 marked as superseding — is stated to the checker. Silence here is how a school discovers a mismatch at assessment |
| **Two makers compute overlapping sets for the same employee-months** | The second is refused: an employee-month may appear in **at most one non-superseded, non-rejected set**, enforced by a partial unique index. Otherwise the same month is paid twice |
| **Honorarium rate changed retrospectively** | PY-04 routes it here. The arrear is `rate_delta × the units originally recorded for that month`, and the monthly cap is re-applied **on the original month's** cap value |
| **Paid days changed retrospectively** (attendance corrected in a locked month) | Same path — a correction-sourced arrears set, recomputed on the original month's config |
| **The set is enormous** (a pay-commission revision across 400 staff × 14 months) | Compute is a progress-reporting, resumable, idempotent Celery job like the run itself; the review surface paginates and the totals stay visible |

### 4.4 Concurrency and idempotency

Compute, submit, approve and post each carry idempotency keys (`§7`, O17). A retried post must not create a
second set of payslip lines. `ETag`/`If-Match` on the set. The `input_digest` covers: the source salary
revision ids and their effective dates, the resolved original-run ids and their pinned config ids, the
employee population and the range. If any of those change, the checker's approval is refused as stale —
because the number they were shown no longer exists.

### 4.5 Why the pin must be data, not a lookup

Stated plainly, because it is the one thing in this module that cannot be retrofitted:

- If `ArrearAdjustment` resolved its config **by effective date at compute time**, a config version
  published later with a backdated `effective_from` would silently change what a past month recomputes to —
  and the same arrears run executed twice would produce two different answers.
- If the pin lived only on the run and were read by joining "the version effective on the period's last
  day", the answer would be correct only while no version was ever backdated. It is not a guarantee, it is
  a coincidence.
- Therefore: `PayrollRun.statutory_config_id` is a **foreign key set at compute and never reassigned**
  ([[M10-payroll-core]] M10-AC-05), and `ArrearAdjustment.statutory_config_id` is **copied from the
  original run**, with `original_payroll_run_id` retained so the copy is auditable. A month with no
  resolvable run has no pin, and a month with no pin is **excluded** — never guessed.
- `§12` names versioned statutory config as critical-path risk #3 for exactly this reason: "must be
  data-versioned from first use; arrears and the bonus run in Sprint 9 depend on it being version-pinnable
  per month". M10c is the module that would fail if it were not.

### 4.6 Audit, PII, i18n and a11y

Every compute, submission, approval, rejection, posting and supersession writes an immutable audit row
(`§4.2`, O6). Arrears amounts are salary-class PII: never in a log line, error payload or webhook body
(O11); visible to others only with the salary PII permission, and that access logged (O3). Every string —
source labels, exclusion reasons, the config-version chip, the "recomputed on the version in force that
month" sentence — is a Hindi + English i18n key (`guard-i18n-strings`, O12); the employee reading a
surprise credit is entitled to read *why* in their own language. The month-split table is a real table with
header associations and per-month totals programmatically linked; the exclusion list is focus-addressable;
the config version is text, never conveyed by colour or a badge alone (WCAG AA, `§9`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M10c-AC-01 | `ArrearAdjustmentSet` and `ArrearAdjustment` each carry a NOT-NULL `tenant_id` FK and `ENABLE`+`FORCE ROW LEVEL SECURITY` with `USING` and `WITH CHECK` policies created **in the same migration** as the model; cross-tenant access fails through the ORM and raw SQL. | `§3`, `guard-rls-policy`, O7 |
| M10c-AC-02 | Every monetary field is `Decimal`-backed `NUMERIC(14,2)`; statutory deltas inside the `recompute` JSONB are stored as **strings** and parsed to `Decimal`; no `float` appears anywhere in the recompute path; money crosses the API as a string. | `§6.9` `(Decimal)`, `guard-money-float` |
| M10c-AC-03 | **A back-dated revision produces month-split `ArrearAdjustment`s** — one row per employee per affected month, never a single lump figure. | `M10 §Acceptance` (verbatim), blueprint §4 |
| M10c-AC-04 | **Each affected month recomputes PF/ESI/TDS on *its originally pinned* `StatutoryConfig` version**, taken as a foreign key copied from that month's original `PayrollRun`, never resolved by date at compute time and never the current version. | `M10 §Arrears`, `M10 §Acceptance` (verbatim), `§4.4`, **O9** |
| M10c-AC-05 | `ArrearAdjustment.original_payroll_run_id` is not null on every computed row, so the provenance of the pin is auditable; the same arrears computation run twice produces byte-identical figures. | `§4.4`, `§4.2`, **O9** |
| M10c-AC-06 | **A month whose original run cannot be resolved is listed and excluded with its reason** — it is never silently computed on the current configuration. | `M10 §Arrears`, PY-15 |
| M10c-AC-07 | Where the affected range spans a config change, the split shows **different versions on different months**, each printed with its effective-from date; a single version across such a range is a failure. | **O9**, PY-15 |
| M10c-AC-08 | Each month's arrear is prorated on **that month's original paid days** and its original proration basis, not the current month's. | `M10 §Business rules` proration, [[M9-attendance]] |
| M10c-AC-09 | **Posting requires a distinct checker** who is not the maker — enforced by a database constraint and re-verified server-side, including the two-accounts-one-person case; the approve control is absent for the maker and the attempt is refused server-side. | `M10 §Acceptance` (verbatim), `§8`, **O5**, A46 |
| M10c-AC-10 | The checker is shown the month split as evidence, with per-month config versions and the exact ₹ total, and re-authenticates at approval. | **O5**, AC-02 |
| M10c-AC-11 | If the source revisions, the resolved runs, the pinned configs or the population change after submission, approval is refused as **stale** and the maker must recompute. | `§7`, **O17**, PY-15 |
| M10c-AC-12 | **Adjustments are append-only:** a correction creates a superseding set and the original rows stand; there is no edit path and **no past payslip is ever modified**, for any role. | `M10 §Arrears`, `§4.3`, **O6**, **O18** |
| M10c-AC-13 | Approved arrears post into an **open** run as itemised payslip lines naming the affected month; posting into an approved run is refused; the run's own maker–checker still applies. | `M10 §Arrears`, [[M10-payroll-core]] |
| M10c-AC-14 | An employee-month appears in **at most one** non-superseded, non-rejected set, enforced by a database constraint — the same month can never be paid twice. | `§7`, **O17** |
| M10c-AC-15 | A negative delta (downward correction) is supported and posts as a recovery; it is never clamped to zero or silently dropped. | `§6.9 delta_amount`, [[M10-payroll-core]] §4.3 |
| M10c-AC-16 | A period range predating the employee's DOJ or the available run history is refused at creation, naming the reason. | PY-15 |
| M10c-AC-17 | Where arrears touch a period whose statutory artefacts were already filed, the affected artefacts (ECR / 24Q / Form 16) are **named to the checker before approval** and flagged to [[M11-statutory-compliance]] for a revised return. | `M11 §Business rules`, ui-compliance A54, **O6** |
| M10c-AC-18 | An affected employee's payslip is **reissued alongside** the original with the supersession visible; both remain downloadable and neither replaces the other. | EMP-07 non-happy paths, `§4.3`, **O6** |
| M10c-AC-19 | The arrears line on the payslip explains itself: source, affected month, old→new basis, and the config version that month was computed on. | **O6**, **O9**, `DESIGN` principle 6 |
| M10c-AC-20 | A back-dated salary revision on PY-05 that crosses a pinned-config boundary makes the arrears path **mandatory, not optional**; a revision into a locked month cannot be settled as an ordinary current-month adjustment. | PY-05, A47 |
| M10c-AC-21 | A retrospective `HonorariumRule` rate change routes to arrears and recomputes as `rate_delta × the units originally recorded`, with the **original month's** monthly cap re-applied. | PY-04, `§6.9 HonorariumRule`, `§4.3` |
| M10c-AC-22 | Compute is idempotent, resumable and progress-reporting for a large set (hundreds of staff × a dozen months); a retried post never creates a second set of payslip lines. | `§7`, `§9`, **O17** |
| M10c-AC-23 | Set totals equal the sum of their rows, and the posted payslip lines equal the set's totals; a mismatch blocks posting. | `M15 §Acceptance` |
| M10c-AC-24 | Every compute, submission, approval, rejection, posting and supersession writes an immutable audit row with actor and before/after. | `§4.2`, **O6** |
| M10c-AC-25 | Arrears amounts never appear in a log line, error payload or webhook body; another employee's arrears are visible only with the salary PII permission, and that access is logged. | **O11**, **O3** |
| M10c-AC-26 | No statutory rate, ceiling or slab is hardcoded anywhere in the recompute path; every figure comes from the per-month pinned config. | `guard-statutory-hardcode`, **O9** |
| M10c-AC-27 | Every user-facing string, including the exclusion reasons and the per-month config-version statement, resolves through Hindi + English i18n keys. | `guard-i18n-strings`, O12 |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| **Unit** | **deathstroke** | Month-range expansion including partial first and last months; per-month config resolution from the original run; the exclusion predicate (no run / unapproved run / employee absent from the run / month before DOJ); delta arithmetic at `Decimal` precision including negatives; JSONB round-trip of statutory deltas **as strings** with no float contamination; set totals = Σ rows; the distinct-person predicate; the input digest |
| **Correctness (the heart of it)** | **riddler** | A three-month set spanning a PF-ceiling change computes June on v-old and July/August on v-new, and the **same set recomputed after a new config version is published (including one backdated) produces identical figures**. This is the test that proves the pin is data. Honorarium retro with the original month's cap. Proration on original paid days |
| **Golden-file** | **riddler** + **bane** | The "employee with arrears from two differently-pinned months" scenario in [[M10-payroll-core]] §4.6, byte-for-byte, per config version |
| **Integration / RLS** | **bane** | Cross-tenant sets, rows and exports through ORM and raw SQL |
| **Governance** | **bane** | Maker cannot approve (server-side); stale approval refused; posting into an approved run refused; a second set overlapping the same employee-month refused; no update/delete path reaches a posted adjustment or a past payslip; a superseding correction leaves the original intact |
| **E2E** | **bane** | Back-date a revision across a config boundary on PY-05 → compute → one month excluded and named → distinct checker approves → post into the open run → payslip reissued alongside → employee sees both versions and the arrears line's provenance → the affected filing is flagged |
| **Performance** | **bane** | 400 employees × 14 months computes within an acceptable window, resumable after a kill |
| **Contract** | **cyborg** + CI | Money and JSONB statutory deltas serialise as strings; generated clients compile |
| **UI / a11y** | **two-face** | The per-month config version is legible text, not a colour; totals reconcile visibly; Hindi parity on exclusion reasons |
| **Compliance** | **gordon** | Mandatory review of every diff in this module — it is the highest-consequence statutory path in the product |

---

## 7 · Proposed stories

Build-plan **Sprint 9** (§12: "arrears and the bonus run follow the versioned statutory config and F&F").

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M10c-S01 | `ArrearAdjustmentSet` + `ArrearAdjustment` models, RLS, distinct-checker and one-set-per-employee-month constraints | The append-only ledger, with the pin as a NOT-NULL FK. | oracle | 5 | M10-S07, M11a |
| M10c-S02 | **Per-month config resolution from the original run + exclusion rules** | The correctness core: the pin is read back, or the month is excluded. | riddler | 8 | M10c-S01 |
| M10c-S03 | Arrears compute engine: month split, recompute, statutory deltas per month | Ten months, ten configs, one visible answer. | riddler | 13 | M10c-S02, M11 |
| M10c-S04 | Honorarium retro and paid-days-correction arrears paths | The two non-salary triggers the screens already route here. | riddler | 5 | M10c-S03 |
| M10c-S05 | Idempotent, resumable, progress-reporting Celery orchestration | A pay-commission set that does not die at employee 300. | cyborg | 5 | M10c-S03 |
| M10c-S06 | Maker–checker + staleness digest + AC-02 integration | The gate, reusing the shared service rather than a second one. | wonder-woman | 5 | M10c-S03, M10-S14 |
| M10c-S07 | Posting into an open run: payslip lines, totals reconciliation, run digest participation | Where the money finally lands. | riddler | 8 | M10c-S06, M10-S08 |
| M10c-S08 | Supersession path for a wrong posted set | Correction without edit. | cyborg | 3 | M10c-S07 |
| M10c-S09 | Payslip reissue alongside the original + notification | Both versions, never a silent replacement. | cyborg | 5 | M10c-S07, M14 |
| M10c-S10 | Affected-filings detection and hand-off to statutory | The revised return nobody should discover at assessment. | riddler | 5 | M10c-S07, M11 |
| M10c-S11 | **PY-15 arrears workbench** | The month split with per-month pinned config made legible. Worth prototyping ahead of the wave. | green-lantern | 13 | M10c-S06 |
| M10c-S12 | PY-05 back-dated revision → mandatory arrears path | The trigger, with the config-boundary rule enforced in the UI. | green-lantern | 5 | M10c-S11, M10-S22 |
| M10c-S13 | EMP-07 arrears line provenance + both payslip versions | The employee's answer to "why is there extra money". | nightwing | 5 | M10c-S09 |
| M10c-S14 | Arrears statement export (PY-18) with reconciliation | The artefact the accountant hands over. | green-lantern | 3 | M10c-S07 |
| M10c-S15 | Unit + correctness test suites incl. the backdated-config-publication test | The test that proves the pin is data, not a lookup. | deathstroke + riddler | 8 | M10c-S03 |
| M10c-S16 | E2E, governance and performance suites | Cross-boundary journey, refusals, and 400×14. | bane | 8 | M10c-S13 |

**Total: 16 stories, 104 points.**

**Dependency edges constraining order.** M10c-S02 is the gating story for the entire module and it is
worthless unless [[M10-payroll-core]] has been pinning `statutory_config_id` **as a foreign key since the
first run in Sprint 7**. If Sprint 7 ships with the pin as a derived lookup, Sprint 9 cannot recover it —
the history is gone. That makes an M10 core AC (M10-AC-05) a **prerequisite of this module's existence**,
not merely a related requirement, and it is why `§12` lists version pinning as critical-path risk #3.
M10c-S06 reuses the shared maker–checker service (M10-S14); M10c-S10 needs
[[M11-statutory-compliance]]'s filing artefacts, which land in Sprint 8, one sprint earlier — that ordering
is correct. M10c-S03 needs [[M11-statutory-compliance]]'s calculators to be **callable with an explicit
config version as an argument**, not with an implicit "current" — a design constraint on M11's API that
should be stated to riddler before Sprint 8, not discovered in Sprint 9.

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (**not applied**) |
|---|---|---|---|
| **OQ-M10c-01** | **In which financial year is an arrear taxed?** §192 and §89(1) relief allow arrears to be taxed in the year of receipt with relief computed against the year of accrual (Form 10E). The spec says only "recompute TDS". | An April-to-February revision paid in February is taxed in the current FY, but the employee may claim §89(1) relief. Ignoring it either over-deducts or leaves the school unable to produce the figures the employee needs for Form 10E. | Tax the arrear in the **year of receipt** (the posting run's FY), and produce the **per-accrual-year breakup** the employee needs for Form 10E as an output of the set. Whether Naveya computes the relief itself is a further question. **Needs a tax ruling with riddler.** |
| **OQ-M10c-02** | **Does PF on arrears attract interest or damages?** EPFO treats delayed contributions as attracting interest under §7Q and damages under §14B. The spec recomputes the contribution but says nothing about the consequence of paying it late. | A school that pays ten months of arrear PF in one ECR may receive a demand it did not expect and that the product never mentioned. | Compute and post the contribution; **surface a warning** naming the potential §7Q/§14B exposure rather than computing it. **Needs a compliance ruling** (gordon + riddler). |
| **OQ-M10c-03** | **Arrears owed to an employee who has already exited.** The months were worked; the person has no future payslip. | Without a path the money is simply not paid, or is paid outside the system. There is no off-cycle run in MVP (blueprint §4 tags supplementary runs P2). | Route to [[M12-full-and-final]] as a settlement component where the F&F is still open, and otherwise **this is the same hole as OQ-M10b-02** — it argues jointly for a minimal supplementary run in MVP. **Needs a ruling.** |
| **OQ-M10c-04** | **Who may originate an arrears computation, and is there an amount threshold above which a second approver is not enough?** `payroll.approve` gates posting; nothing gates a ₹40 lakh pay-commission set differently from a ₹4,000 correction. | The control is the same size regardless of consequence. | Amount-banded approval (a second checker or a Principal/Director co-sign above a configured band), the band in `PayrollSettings`, never a literal. **Confirm.** |
| **OQ-M10c-05** | **What happens when a `StatutoryConfig` version is published with a backdated `effective_from`?** [[M11a-statutory-config-versioning]] allows effective-dating; a retrospective statutory change is a real event (a PF-ceiling revision announced in arrears). | This is the one case where a *past* month legitimately should recompute on a *different* config than the one its run pinned — the exact opposite of M10c's core rule. If it is not handled explicitly, someone will "fix" the pin rule to accommodate it and break everything else. | Model it as a **distinct, named operation**: a *statutory recompute set* that explicitly re-pins named months to a named new version, with its own approval and a loud audit trail — never as a silent re-resolution. Out of MVP scope unless ruled in. **Needs a ruling**; recorded because it is the most dangerous "reasonable-sounding" change anyone could make to this module. |
| **OQ-M10c-06** | **Do arrears affect the 50 % excluded-allowance verdict retrospectively?** A revision changes the wage composition for a past month. | If the revised composition breaches the Labour Code for those months, the school has a retrospective compliance issue nobody surfaces. | Re-run the 50 % test per affected month at compute and warn (not block) where a past month now breaches. **Confirm.** |
| **OQ-M10c-07** | **Does an arrear change leave-encashment or gratuity bases already settled?** Both are computed from salary, and [[M12-full-and-final]] may already have paid them. | A revision effective before a settled F&F makes that settlement wrong. | Detect and flag settled F&Fs in the affected range; the correction is a new, gated adjustment against the settlement, not an edit. **Needs a ruling** with the M12 lane. |
| **C-M10c-01** | **`§6.9 ArrearAdjustment` has no `original_payroll_run_id`.** It carries `statutory_config_id`, but nothing records *where that pin came from*, and nothing distinguishes "this month's run pinned v2026.2" from "somebody set v2026.2". | The rule the acceptance criterion states — recompute on *the originally pinned* version — is unverifiable from the data as specified. An auditor cannot confirm it and a test can only assert what the code just wrote. | Add `original_payroll_run_id` (NOT NULL) to `§6.9 ArrearAdjustment` and derive `statutory_config_id` from it. Specified here (§3.2); **not applied** to the dev spec. |
| **C-M10c-02** | **`§6.9` gives maker-checker `status` to the individual `ArrearAdjustment` row, but a checker approves a computation, not a row.** `M10 §API` exposes `…/arrear-adjustments` (+`/compute`, `/approve`) with no set-level object. | Without a set entity there is nothing for AC-02 to queue, nothing to hold one maker and one checker for a 40-row computation, and no unit for the staleness digest. | Add `ArrearAdjustmentSet` (§3.1) to `§6.9`. Specified here; **not applied**. |
| **C-M10c-03** | **`ArrearAdjustment.recompute` is JSONB carrying money.** `§6.9` specifies "recompute (JSON: PF/ESI/TDS deltas)" while `CLAUDE.md` requires Decimal money. | A JSON number is a float in most serialisers. This is the single most likely place a float enters the payroll path unnoticed, and it is in the module with the least tolerance for it. | Store every value in `recompute` as a **string**, parse to `Decimal`, and add a schema validation refusing numeric JSON values. Stated as M10c-AC-02; flagging because `§6.9`'s wording invites the mistake. |
| **C-M10c-04** | **Blueprint §4 tags "off-cycle / supplementary / **arrears-only** runs" as [P2]** while arrears themselves are MVP. | Consistent — arrears must post into a regular run — but it means an arrears computation approved just after a run is approved waits a full month, and a leaver's arrears have nowhere to go (OQ-M10c-03). | Keep arrears-only runs P2 and make the wait explicit on PY-15 ("will post into the <month> run"). Revisit jointly with OQ-M10b-02 and OQ-M10c-03, which both point at the same missing supplementary run. |
| **C-M10c-05** | **`M10 §API` lists `…/arrear-adjustments` as REST**, against the 2026-07-18 GraphQL-primary decision. | Same class as C-M10-04 in [[M10-payroll-core]]. | Logical action names; GraphQL mutations (`arrearSetCompute`, `arrearSetApprove`, `arrearSetPost`), REST only for the statement export. Confirm with cyborg. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
