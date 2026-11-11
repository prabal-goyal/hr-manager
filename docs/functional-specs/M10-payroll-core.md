# M10 — Payroll Core · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M10 Payroll core (build-plan Sprint 7) · **Work item:** NA-22 · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M10, §4.3, §4.4, §6.9, §7, §8, §9, §11, §12 ·
> `docs/functionality-blueprint.md` PART A §4 (starred education-unique, this lane) and PART C item 4 —
> the authoritative in/out list · `docs/ui-compliance-requirements.md` **O2, O3, O5, O6, O9, O10, O11,
> O17, O18**, action register A33–A41, A47 · `docs/executive-summary.md` (positioning) ·
> `docs/competitor-analysis.md` (what greytHR parity means, locked by D3) ·
> `docs/screen-inventory.md` PY-01…PY-12, PY-18, AC-02, EMP-07 · `CLAUDE.md` non-negotiables.
>
> **Graph:** paid days arrive from [[M9-attendance]] and LOP from [[M8-leave]]; pay groups hang off the
> people and contracts in [[M3-core-hr-people]] inside the entity hierarchy of
> [[M1-organization-tenancy]]; every run pins a version of [[M11a-statutory-config-versioning]] and calls
> the calculators in [[M11-statutory-compliance]]; outstanding loans from [[M10a-loans-advances]] are
> recovered at [[M12-full-and-final]]; claims from [[M10b-reimbursements-fbp]] are paid through this run;
> [[M10c-arrears-pay-revision]] recomputes past months against *their* pinned config; the increment
> recommendation reaching PY-06 comes from [[M17-performance-appraisal]] and is **advisory only**;
> payslips reach staff through [[M13-ess-mobile]] and [[M14-notifications]]; the bank file and biometric
> inputs cross [[M16-integrations]]; registers and the audit viewer are [[M15-reporting-platform]]'s.
> Everything here stands on [[M0-foundations]] and is gated by [[M2-identity-access]].
>
> **Siblings:** [[M10a-loans-advances]], [[M10b-reimbursements-fbp]], [[M10c-arrears-pay-revision]].
> Those three ride on the run defined here; read this file first.
>
> **The standard this document is written to:** every ambiguity left in a payroll spec becomes an
> underpayment or an overpayment in somebody's month. Where the spec is silent, this document either
> proposes a concrete default *and says it is proposed*, or refuses to invent one and files an open
> question. It never leaves the choice to whoever writes the resolver.

---

## 1 · Intent

A school pays two kinds of people out of one bank account on the same day: the permanent teacher on a CTC
structure whose pay is a fixed monthly figure prorated by the days she was actually paid for, and the guest
lecturer who is paid ₹ per lecture, up to a monthly ceiling, for however many lectures he actually took.
Generic payroll software does the first well and the second not at all — it is the single most common reason
a school runs a second, informal payroll in a spreadsheet, and the spreadsheet is where compliance goes to
die. M10 runs both logics in **one pass over one legal entity for one month** (`M10 §Purpose`), applies the
statutory deductions from a **pinned, versioned configuration** ([[M11a-statutory-config-versioning]]) so
that a July payslip keeps July's rates forever, shows a human every figure that moved since last month
before anybody approves anything, and then **refuses to let the person who prepared the run release it**.

`docs/competitor-analysis.md` records why this is the wedge: on its feature matrix the *per-lecture
honorarium payroll* row is empty for every incumbent (greytHR, Keka, Zoho People, HROne), and
`docs/executive-summary.md` names multi-scale payroll as one of the three capabilities shipping in the
first release. Blueprint PART A §4 stars the module education-unique and PART C item 4 makes it MVP,
"parallel pay groups (aided/self-financed/contract), per-lecture honorarium engine with caps". Locked
decision D3 sets the bar at full greytHR statutory parity, so parity is the floor, not the goal.

That refusal is the module's spine, not a feature bolted on top. Computation is one action; release —
run approval, bank-file generation, disbursement — is never one click and always needs a second, distinct
human (`M10 §Business rules` *Compute vs release*, amendment B of 2026-08-11; `§8` maker–checker). Every
downstream money surface in the product (loans, reimbursements, arrears, bonus, F&F) enters the ledger
through this run and inherits that gate.

---

## 2 · Scope & surfaces

### In scope

| Area | What M10 core delivers |
|---|---|
| Pay logic setup | `PayGroup` (per legal entity, `kind` = ctc_monthly / contract / honorarium), `SalaryStructure` + `PayComponent` with the Code-on-Wages 50 % validation, effective-dated versions |
| Individual pay | `EmployeeSalary` — effective-dated assignment and revision; supersession, never edit |
| **Honorarium engine** | `HonorariumRule` (unit / rate / monthly cap) **plus** `HonorariumUnitEntry` — the monthly unit-count surface the spec omits (gap G5), without which guest faculty cannot be paid at all |
| Run inputs | Paid-days snapshot from [[M9-attendance]] (present + paid-leave + holidays + weekly-offs − LOP as determined by [[M8-leave]]), frozen onto the run |
| The run | `PayrollRun` lifecycle draft → computing → computed → variance_review → **awaiting_checker** → approved → disbursed, with idempotent, resumable compute |
| Statutory pinning | The run pins one [[M11a-statutory-config-versioning]] version; the pin is a **foreign key, not a log line**; every payslip and every statutory line carries it (O9) |
| **Extra-duty / overtime pay** | Exam duty, extra classes, hostel-warden duty at configurable rates — blueprint PART A §4 **[MVP]**, and **absent from the dev spec's M10 entities entirely** (see C-M10-05). Specified here as `ExtraDutyRule` + `ExtraDutyEntry` because a CTC teacher cannot be paid through an honorarium *pay group* |
| Outputs | `Payslip` + `PayslipLine` (earning / deduction / employer_contrib), the payroll register, the NEFT bank file, password-protected payslip PDFs (O10), publication to ESS ([[M13-ess-mobile]]) |
| Governance | Variance review as a **required** stage; maker–checker with server-side distinct-person enforcement (O5); append-only corrections (O6); effective-dating as the interaction model (O18); full audit |
| Proposed revisions | PY-06 — the [[M17-performance-appraisal]] increment/promotion recommendation arriving as an **advisory** proposal that still passes payroll maker–checker |
| Correctness gate | Golden-file register regression, per `StatutoryConfig` version |
| Reports | The payroll, salary and deductions registers with a reconciliation line on each (PY-18) |

### Explicitly out of scope (owned elsewhere)

| Out | Owned by |
|---|---|
| Attendance capture, regularization, the nightly reconciliation job | **[[M9-attendance]]** (this module *consumes* paid-days) |
| Leave balances, LOP determination | **[[M8-leave]]** |
| The statutory **calculators** themselves (PF / ESI / PT / TDS / LWF formulae) | **[[M11-statutory-compliance]]** — M10 calls them and stores the results |
| `StatutoryConfig` authoring, versioning and publication | **[[M11a-statutory-config-versioning]]** — M10 only *pins and reads* |
| Bonus runs | **[[M11b-bonus]]** (config-driven, own maker–checker) |
| Full & final settlement | **[[M12-full-and-final]]** — M10 supplies pending salary and the loan outstanding |
| Loans, reimbursements, arrears | [[M10a-loans-advances]], [[M10b-reimbursements-fbp]], [[M10c-arrears-pay-revision]] — same run, separate specs |
| Accounting/JV export, Tally | **[[M16-integrations]]**, P2 (blueprint §4) |
| Off-cycle / supplementary / arrears-only runs | **P2** — blueprint §4 tags them P2 explicitly, which is why [[M10c-arrears-pay-revision]] must post into a *regular* run. See OQ-M10-11 |
| Bank return-file ingestion (partial rejections) | **P2** — screen-inventory Q19 |
| Perquisite **valuation** (rent-free accommodation, transport) | **P2** (blueprint §4) — but the loan-interest perquisite *flag* is MVP; see C-M10-06 |

### Surfaces

- **Web (green-lantern), Payroll Operator:** PY-01 payroll home · PY-02 pay groups · PY-03 salary structure
  editor · PY-04 honorarium rules **and monthly unit entry** · PY-05 employee salary & revisions ·
  PY-06 proposed revisions queue · PY-07 run console · PY-08 paid-days reconciliation · PY-09 variance
  review · PY-10 payslip register · PY-11 disbursement & bank file · PY-12 payslip publication ·
  PY-18 reports & registers. Built in `design/v3/pages/payroll.jsx`, `py-salary.jsx`, `py-ops.jsx`.
- **Web, checker (capability holder, typically Accountant):** AC-02 maker–checker approval gate — **one
  queue for every financial finalisation in the product**. Ships *with* the run console, not after it.
- **Mobile (nightwing) + web, Employee:** EMP-07 my payslips ([[M13-ess-mobile]]) — itemised, with
  paid-days as the visible proration basis and the pinned config named on every statutory line (O9).
- **API:** GraphQL for reads and most mutations; **REST edge** for the bank file, payslip PDFs and register
  exports (binary artefacts, `§7`).

---

## 3 · Data model

Every table below is **tenant-owned**: it carries a NOT-NULL `tenant_id` FK and, **in the same migration**,
`ENABLE` + `FORCE ROW LEVEL SECURITY` with a `USING` **and** `WITH CHECK` policy on
`tenant_id = current_tenant()` (`guard-rls-policy`, M0-AC-03). This is stated once here and restated as an
acceptance criterion, because the failure mode — one school's salary register visible to another — is the
worst thing this product could do.

**Money is `Decimal` everywhere.** Concretely: every amount column is `NUMERIC(14,2)` mapped through M0's
`MoneyField`; every rate/percentage column is `NUMERIC(9,4)`; every intermediate in the engine is
`decimal.Decimal` with the context set explicitly; every GraphQL and REST boundary serialises money as a
**string**, never a JSON number, because a JSON number is a float in most clients (`guard-money-float`).
A `FloatField` or a Python `float` anywhere in this module is a build failure, not a review comment.

### 3.1 `PayGroup` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK Tenant, not null | + RLS policy, same migration |
| `legal_entity_id` | FK LegalEntity, not null | payroll scope is the **employer of record**, never the campus (§6.1) |
| `name` | text | unique per `(tenant_id, legal_entity_id)` |
| `kind` | enum `ctc_monthly` \| `contract` \| `honorarium` | decides which engine path runs; **no default** at creation (PY-02) |
| `proration_basis` | enum `calendar_days` \| `standard_working_days` \| `fixed_26` | **`[proposed]`** — see OQ-M10-01. Never a literal 30 in code |
| `rounding_policy` | enum `nearest_rupee` \| `paise` | applies to the net; statutory line rounding is M11's, per head |
| `is_active` | bool | deactivation blocked while active employees are attached |

### 3.2 `SalaryStructure` (§6.9) — effective-dated, superseded never edited (§4.3)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `pay_group_id` | FK PayGroup | |
| `name`, `version` | text, int | version increments on supersession |
| `effective_from` | date, not null | |
| `superseded_by_id` | FK self, null | the supersession chain (§4.3, O18) |
| `status` | enum `draft` \| `active` \| `superseded` \| `retired` | |
| `fifty_percent_verdict` | JSONB | the computed verdict at save, retained as evidence of *why* it passed |

### 3.3 `PayComponent` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `structure_id` | FK SalaryStructure | |
| `code` | text | `BASIC`, `DA`, `HRA`, `SPL`, … unique per structure |
| `sequence` | int | evaluation order; formulas may only reference lower sequences (no cycles) |
| `calc_type` | enum `flat` \| `percent` \| `formula` | |
| `value` | **`NUMERIC(14,2)` Decimal** | flat amount |
| `percent_value` | **`NUMERIC(9,4)` Decimal** | percent, with `percent_of_code` as the basis |
| `formula` | text | restricted expression over prior component codes; no free eval |
| `component_type` | enum `earning` \| `deduction` \| `employer_contrib` | mirrors `PayslipLine.type` |
| `taxable`, `pf_applicable`, `esi_applicable` | bool, **no defaults** | each has a statutory consequence; PY-03 forces an explicit choice |
| `is_excluded_allowance` | bool | participates in the Code-on-Wages 50 % test |
| `prorates` | bool | **added** — a monthly allowance that does not prorate by paid-days must be able to say so, or every such component is silently wrong (OQ-M10-02) |

### 3.4 `EmployeeSalary` (§6.9) — effective-dated

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `employee_id` | FK Employee | |
| `structure_id` | FK SalaryStructure | the **exact version**, not the family |
| `ctc` | **`NUMERIC(14,2)` Decimal** | |
| `effective_from` | date, not null | |
| `effective_to` | date, null | derived on supersession; a Postgres `EXCLUDE` constraint forbids overlapping ranges per employee |
| `reason` | enum `initial` \| `pay_revision` \| `promotion` \| `correction` \| `da_vda` | mirrors `ArrearAdjustment.source` so a back-dated revision maps 1:1 to its arrears (M10c) |
| `status` | enum `pending_checker` \| `active` \| `superseded` | a revision above the configured threshold, or any back-dated one, waits on a checker (A47) |
| `source_appraisal_review_id` | FK AppraisalReview, null | set when accepted from PY-06; **advisory provenance**, never an auto-apply path |
| `created_by_user_id`, `approved_by_user_id` | FK User | distinct-person rule applies where a checker is required |

### 3.5 `HonorariumRule` (§6.9) — effective-dated

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `pay_group_id` | FK PayGroup (`kind=honorarium`) | |
| `unit` | enum `lecture` \| `period` \| `day` | **no default** (PY-04) |
| `rate` | **`NUMERIC(14,2)` Decimal** | per unit |
| `monthly_cap` | **`NUMERIC(14,2)` Decimal, not null** | `M10 §Business rules` makes the cap part of the model — it is **required**, not optional (PY-04) |
| `effective_from`, `superseded_by_id` | date, FK self | a rate change supersedes; **past runs are untouched**, a retro change routes to M10c |
| `applies_to_staff_category_id` | FK StaffCategory, null | narrows the rule inside a pay group |

### 3.6 `HonorariumUnitEntry` — **new entity, required for MVP** (closes gap G5)

`§6.9` defines rate × unit × cap and `M10 §Workflow` computes "rate×units", but **nothing in the spec says
where `units` come from**, and period-level attendance is P2 by locked decision D2. Without this table the
honorarium engine has no input and guest faculty cannot be paid.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `employee_id` | FK Employee | |
| `honorarium_rule_id` | FK HonorariumRule | the **exact version** in force for the period |
| `period` | date (month-first-day) | unique with `(employee_id, honorarium_rule_id)` |
| `units` | **`NUMERIC(9,2)` Decimal** | half-lectures are real; not an integer |
| `source` | enum `manual` \| `attendance_derived` \| `import` | MVP writes `manual`; the enum exists so P2 period-attendance can fill it without a migration |
| `status` | enum `draft` \| `submitted` \| `approved` \| `locked` | only `approved` entries compute; `locked` once a run consumes it |
| `entered_by_user_id`, `approved_by_user_id` | FK User | **must be distinct people** — units are the entire basis of the payment (PY-04, §11 Q27) |
| `note` | text | the plausibility explanation where units exceed the configured threshold |

### 3.6a `ExtraDutyRule` and `ExtraDutyEntry` — **new entities, MVP by the blueprint** (closes C-M10-05)

Blueprint PART A §4 lists **"★ Overtime & extra-duty pay: exam duty, extra classes, hostel-warden duty —
configurable rates **[MVP]**"**. The dev spec's M10 business rules and `§6.9` entity catalog contain **no
entity for it at all**. `HonorariumRule` cannot serve: it hangs off a `PayGroup` of `kind=honorarium`, and
the people who invigilate board exams and run extra classes are the salaried CTC teachers in the
`ctc_monthly` group. Without these two tables an MVP-tagged, education-specific earning has nowhere to live
and will be entered as an ad-hoc "special allowance", losing its taxability and PF treatment.

**`ExtraDutyRule`:** `tenant_id` (+RLS, same migration), `legal_entity_id`, `code`
(`exam_invigilation` | `extra_class` | `hostel_warden` | `transport_duty` | `admission_duty` | `other`),
`unit` (`session` | `day` | `hour`), `rate` **`NUMERIC(14,2)` Decimal**, `monthly_cap`
**Decimal, nullable** (unlike honorarium, a cap is optional here), `taxable`, `pf_applicable`,
`esi_applicable` (**no defaults** — same statutory consequence as a `PayComponent`), `effective_from`,
`superseded_by_id`.

**`ExtraDutyEntry`:** `tenant_id` (+RLS), `employee_id`, `extra_duty_rule_id`, `period`, `units`
**`NUMERIC(9,2)` Decimal**, `status` (`draft` | `submitted` | `approved` | `locked`), `entered_by_user_id`,
`approved_by_user_id` (**distinct people**, as for honorarium units), `note`.

It computes on the same path as honorarium — `min(rate × units, monthly_cap)` where a cap exists — and lands
as an `earning` `PayslipLine` on an otherwise ordinary CTC payslip, with the rule version, units and rate in
`basis`. **This is a proposal, not an applied scope change:** the dev spec is the build contract and it is
silent, so C-M10-05 asks for the ruling.

### 3.7 `PayrollRun` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `legal_entity_id` | FK LegalEntity | the run's scope |
| `period` | date (month-first-day) | unique with `(tenant_id, legal_entity_id, period, run_type)` |
| `run_type` | enum `regular` \| `supplementary` | `supplementary` is **P2**; the column exists so the unique key does not have to change later |
| `status` | enum `draft` \| `computing` \| `computed` \| `variance_review` \| `awaiting_checker` \| `approved` \| `disbursed` \| `failed` | the spec's four states plus the three the workflow actually requires; PY-01/PY-07 render all eight |
| **`statutory_config_id`** | **FK StatutoryConfig, not null from `computing` onward** | **the pin.** One version per run (§4.4). Set at compute from the version effective on the period's last day, and **never reassigned** |
| `pay_group_ids` | UUID[] | which groups this run covered — an excluded group is a fact about the run |
| `paid_days_snapshot_id` | FK PaidDaysSnapshot | frozen inputs (§3.8) |
| `input_digest` | text | SHA-256 over the canonicalised input set (§4.4) — the staleness detector |
| `variance_threshold_pct`, `variance_threshold_amount` | Decimal | **read from tenant payroll config, never a literal in a screen** (ui-compliance F5) |
| `totals_gross`, `totals_deductions`, `totals_employer_contrib`, `totals_net` | **Decimal** | denormalised for the header; **must** equal the sum of payslips or the run is blocked (§4.3) |
| `headcount` | int | |
| `submitted_by_user_id`, `submitted_at` | FK User, timestamptz | the **maker** |
| `approved_by_user_id`, `approved_at` | FK User, timestamptz | the **checker**; DB `CHECK (approved_by_user_id IS DISTINCT FROM submitted_by_user_id)` |
| `rejected_by_user_id`, `rejection_reason`, `rejected_at` | | return-to-maker is a first-class path (ui-compliance F7) |
| `idempotency_key` | text | per §7; compute, approve and bank-file each carry one |
| `is_locked` | bool | true from `approved`; blocks every mutation on the run and its payslips |

### 3.8 `PaidDaysSnapshot` and `PaidDaysRow` — **new**, the frozen input (closes gap G3)

`M10 §Workflow`'s first step is "paid-days per employee", and PY-08 requires the arithmetic to be *shown,
not asserted*. A run that reads attendance live would silently drift every time a regularization is
approved. The snapshot makes the input a fact with a timestamp.

**`PaidDaysSnapshot`:** `tenant_id`, `legal_entity_id`, `period`, `frozen_at`, `frozen_by_user_id`,
`status` (`open` | `frozen`), `source_digest`.

**`PaidDaysRow`:** `tenant_id`, `snapshot_id`, `employee_id`, `days_in_period`, `present_days`,
`paid_leave_days`, `holidays`, `weekly_offs`, `lop_days`, `paid_days` — all `NUMERIC(6,2)` Decimal (half-days
are MVP, `M9 §Business rules`) — plus `joiner_from_date`, `leaver_to_date`, `exception_count`, and
`explanation` JSONB carrying the term-by-term arithmetic PY-08 must display.

`paid_days = present + paid_leave + holidays + weekly_offs − lop`, computed by M9 and **copied** here.

### 3.9 `Payslip` (§6.9)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | + RLS, same migration |
| `payroll_run_id`, `employee_id` | FK | unique together |
| `pay_group_id` | FK | which logic paid this person |
| **`employee_salary_id`** | FK EmployeeSalary, null | **the exact salary version used** — provenance, and the only way EMP-07 can explain a figure a year later. Null for a pure-honorarium payslip |
| **`statutory_config_id`** | FK StatutoryConfig, not null | denormalised from the run **deliberately**: an arrears payslip line references a *different* month's version, so the pin must exist per payslip, not only per run |
| `paid_days`, `lop_days`, `days_in_period` | Decimal | the proration basis, shown on EMP-07 |
| `gross`, `total_deductions`, `total_employer_contrib`, `net` | **Decimal** | |
| `is_locked` | bool | true at run approval; no edit path exists for anyone (PY-10) |
| `is_held` | bool + `hold_reason` | a withheld payee is excluded from the bank file and **says so** (A35) |
| `pdf_artifact_ref` | text | encrypted object-store key; password-protected PDF |
| `superseded_by_id` | FK self, null | a reissue after an arrears correction publishes **alongside**, never over (M10c) |

### 3.10 `PayslipLine` (§6.9)

`tenant_id`, `payslip_id`, `sequence`, `component_code`, `label_key` (i18n key, **not** a rendered string —
`guard-i18n-strings`), `type` (`earning` | `deduction` | `employer_contrib`), `amount` **Decimal**,
`basis` JSONB (the provenance EMP-07's *Explain a line* renders: calc type, base amount, rate, proration
fraction, cap applied, or the pinned config version and rule id for a statutory line), plus typed
back-references — `loan_installment_id`, `reimbursement_claim_id`, `arrear_adjustment_id`,
`honorarium_unit_entry_id` — each nullable, so every rupee on a payslip can name where it came from.

### 3.11 `BankFile`

`tenant_id`, `payroll_run_id`, `version` (int, monotonic — a regeneration **supersedes** and is visibly
numbered), `format_code` (from tenant bank config, never hardcoded), `artifact_ref` (encrypted),
`checksum_sha256`, `payee_count`, `total_amount` **Decimal**, `excluded_count`, `excluded_rows` JSONB
(employee + reason, listed **before** generation), `generated_by_user_id`, `generated_at`,
`downloaded_events` (append-only child table: actor, timestamp, ip), `disbursed_at`, `bank_reference`
(UTR, required to mark disbursed), `idempotency_key`.

### 3.12 `PayrollApproval` — the maker–checker record

One row per gated action across the whole product, so AC-02 has a single queue (screen-inventory G1) and so
the distinct-person rule is enforced in one place rather than six.

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS, same migration |
| `subject_type` | enum `payroll_run` \| `loan` \| `reimbursement_batch` \| `arrear_adjustment_set` \| `bonus_run` \| `final_settlement` \| `employee_salary_revision` | |
| `subject_id` | UUID | |
| `legal_entity_id` | FK | scoping for the checker's queue |
| `amount` | **Decimal** | the exact total the checker must be shown |
| `maker_user_id`, `maker_person_id`, `submitted_at` | | `person_id` = the maker's `Employee` id where one exists (§4.5) |
| `checker_user_id`, `checker_person_id`, `decided_at`, `decision` (`approved` \| `returned`) , `reason` | | `reason` mandatory on `returned` |
| `input_digest_at_submission` | text | staleness detection (§4.4) |
| `evidence_refs` | JSONB | the variance report / month split / EMI schedule / claim list the checker must open |
| Constraint | | DB `CHECK (checker_user_id IS DISTINCT FROM maker_user_id AND checker_person_id IS DISTINCT FROM maker_person_id)` |

### 3.13 Tenant payroll configuration

`PayrollSettings` (one row per legal entity): `variance_threshold_pct`, `variance_threshold_amount`,
`salary_revision_checker_threshold`, `honorarium_units_plausibility_threshold`, `pay_date_day`,
`bank_format_code`, `payslip_password_scheme`, `require_prior_period_closed` (bool). Every one of these
exists so that **no threshold is ever a literal in a screen or a resolver** (`guard-hardcoded-values`,
ui-compliance F5). Statutory rates are **not** here — they are `StatutoryConfig`'s, always.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — the monthly run

1. **Setup, once.** A `LegalEntity` has ≥1 `PayGroup`. CTC groups have an active `SalaryStructure` whose
   50 % verdict passed; the honorarium group has a `HonorariumRule` with a cap. Every payable employee has
   an `EmployeeSalary` (CTC groups) or is on an honorarium rule.
2. **Units, monthly (honorarium only).** The Payroll Operator or HR enters `HonorariumUnitEntry` rows for
   the period; a **different** user approves them. Nothing computes off a draft entry.
3. **Paid days (PY-08).** Reconciliation runs against [[M9-attendance]] and [[M8-leave]]: present + paid-leave + holidays + weekly-offs
   − LOP, per employee, with the arithmetic retained per row. Blocking exceptions must be resolved (routed
   to HR-30) or explicitly accepted as LOP with a reason. The operator then **freezes** the snapshot; the
   run binds to that snapshot id, not to live attendance.
4. **Start the run (PY-01).** `PayrollRun` created `draft` for (legal entity, period). At compute it pins
   `statutory_config_id` = the version effective on the **period's last day**, and shows which and from when.
5. **Compute (PY-07).** One Celery job, idempotent under the run's key, progress-reporting (not a spinner —
   `§9` targets ~2,000 staff in minutes):
   - for each employee in each included pay group, resolve the applicable `EmployeeSalary` **version(s)**
     for the period (§4.4 handles a mid-period revision);
   - **CTC path:** evaluate components in `sequence`; prorate the ones flagged `prorates` by
     `paid_days / basis_days` per the pay group's `proration_basis`; leave the rest whole;
   - **honorarium path:** `amount = rate × units`, then `min(amount, monthly_cap)`, with the rule version,
     the units, the rate and whether the cap bit pinned into `PayslipLine.basis`;
   - attach [[M10a-loans-advances]] EMIs, [[M10b-reimbursements-fbp]] payout-batch lines and
     [[M10c-arrears-pay-revision]] arrears lines as `PayslipLine`s;
   - call [[M11-statutory-compliance]]'s calculators with the **pinned** config for PF / ESI / PT / TDS /
     LWF; store the results as lines and as `StatutoryContribution` rows;
   - write `Payslip` + `PayslipLine` rows as **drafts** and recompute the run totals;
   - record `input_digest`.
6. **Variance review (PY-09) — a required stage, not an optional report** (`M10 §Business rules`). Every
   employee's gross / net / deductions are diffed against the prior approved run, each delta classified
   (joiner · leaver · LOP · salary revision · arrears · loan started/ended · reimbursement · statutory
   change) and flagged against the **configured** threshold. Rows the system can explain by a known cause
   are still **listed** — never silently auto-cleared (ui-compliance F6). The operator explains or
   acknowledges each flagged row; the explanations are stored **on the run, for the checker to read**, which
   is the entire point of the stage. The review cannot be marked complete while an unexplained flagged row
   remains.
7. **Send for approval (PY-07).** The maker confirms against the net total, headcount and the **named
   checker**. `status → awaiting_checker`; a `PayrollApproval` row is written with the maker's user and
   person id, the amount, the evidence refs and `input_digest_at_submission`. **The run locks to the maker**
   from this moment.
8. **Approve (AC-02, a different human).** The checker opens the evidence, re-authenticates, and confirms
   against a restatement of type, period, exact ₹ total, headcount and maker. On approval: run → `approved`,
   payslips `is_locked = true`, `payroll_run.approved` webhook fires ([[M16-integrations]]), everything audited.
9. **Bank file (PY-11).** Only now is generation possible. Employees with missing or invalid bank details
   are **listed and excluded before generation**, never silently zero-paid. The file is versioned,
   checksummed, and its every download is audited. Marking disbursed requires the bank reference/UTR and
   moves the run to `disbursed`.
10. **Publish payslips (PY-12).** Password-protected PDFs become visible in EMP-07; notifications go out
    via [[M14-notifications]]. A released payslip cannot be unreleased; a correction is a reissue that
    stands **alongside** ([[M10c-arrears-pay-revision]]).

### 4.2 States

| Entity | States | Notes |
|---|---|---|
| `PayrollRun` | `draft` · `computing` · `computed` · `variance_review` · `awaiting_checker` · `approved` · `disbursed` · `failed` | plus the derived UI states *recompute required* (digest drift) and *prior month not closed* |
| `SalaryStructure` | `draft` · `active` · `superseded` · `retired` | plus the blocking **50 %-rule violation** state at save |
| `EmployeeSalary` | `pending_checker` · `active` · `superseded` | plus *unassigned* as an employee-level state that blocks the run |
| `HonorariumUnitEntry` | `draft` · `submitted` · `approved` · `locked` | |
| `PaidDaysSnapshot` | `open` · `frozen` | frozen binds to the run |
| `Payslip` | draft · locked · held · superseded | no edit state exists at any point |
| `BankFile` | ready · generated · downloaded · disbursed · superseded (v2…) | |

### 4.3 Edge cases and error paths

| Situation | Required behaviour |
|---|---|
| **Mid-period salary revision** | The period is **split at the effective date** and each segment computed on **its own** `EmployeeSalary` version, then summed. Two `PayslipLine` sets with distinct `basis` blocks, not an average of two CTCs. Unspecified in the spec; specified here because averaging is the intuitive wrong answer (OQ-M10-03) |
| **Mid-month joiner / leaver** | Proration by `paid_days` over the pay group's basis; `M9 §Acceptance` makes this a named criterion. The joiner's first payslip **must** render the paid-days explanation (EMP-07) |
| **Employee with no `EmployeeSalary`** | Compute is **blocked with the exact list of names** — never a silent zero payslip. A zero net that should have been ₹48,000 is indistinguishable from an unpaid month until the employee complains |
| **Honorarium units exceed the cap** | Pay the cap; record `units`, `rate`, `uncapped_amount` and `cap_applied=true` in `PayslipLine.basis`; surface the capped excess on the register. **What happens to the excess units — forfeited, or carried to next month — is unspecified: OQ-M10-04.** MVP forfeits and *says so on screen* |
| **Honorarium employee with no approved unit entry** | Listed as a blocking input, not paid zero |
| **50 % rule breach at save** | Save is **refused** with the exact overage and the offending components (`M10 §Acceptance`). The same test is re-run at `EmployeeSalary` assignment, because a percent-based structure can breach at one CTC and pass at another — see OQ-M10-05 |
| **Formula circular reference** | Blocked at structure save with the cycle named; the `sequence` rule makes most cycles unrepresentable |
| **A newer `StatutoryConfig` becomes effective mid-period** | The run pins **one** version (the one effective on the period's last day) and the screen states which and from when. A warning appears before compute when a newer version exists, stating from which run it will apply (O9) |
| **Inputs change after compute** (attendance corrected, joiner added, loan approved, claim batched) | `input_digest` no longer matches → the run shows **recompute required** and refuses to advance. It does not silently drift from the register |
| **Inputs change after the maker submitted** | The checker's item is **stale**: approval is refused with `approval_stale`, and the maker must recompute and resubmit. A checker must never approve a total that no longer exists |
| **The maker tries to approve** | **Refused server-side** with `maker_cannot_approve` — the UI hiding the control is a convenience, not the control (`§8`). Logged as a security-relevant audit event |
| **Compute crashes halfway** | Resumable under the same idempotency key; the run is never left partially posted. Payslips are written in one transaction per batch with the run's totals recomputed at the end, not incrementally |
| **Register total ≠ Σ payslips** | A **blocking** error displayed as one; approval is impossible (`M15 §Acceptance`) |
| **Employee with missing/invalid bank details** | Listed and excluded from the bank file **before** generation; the payslip still exists and the person is visibly unpaid, not invisibly unpaid |
| **Negative net** (recoveries exceed earnings) | A real state, not an error. Clamped to zero **is forbidden**; the shortfall carries as a recoverable balance and is named on the register. See OQ-M10-06 for who decides the carry rule |
| **Bank file regenerated after download** | v2 supersedes v1, both retained, with an explicit *"v2 supersedes v1 — do not upload both"* warning, and (recommended, OQ-M10-07) a fresh checker acknowledgement |
| **Prior period still open** | The run warns, and refuses where `require_prior_period_closed` is set. Out-of-order runs corrupt arrears month-splits |
| **Two operators compute the same run** | `ETag`/`If-Match` on the run plus the idempotency key; the second caller gets the first's result, never a second job |
| **Tenant has one finance person** | They can be the maker. They **cannot** be the checker. There is no configuration that relaxes this for a payroll run — the F&F exception (amendment C) is F&F's alone (`§8`) |

### 4.4 Concurrency, idempotency and the input digest

- **Idempotency keys are required** on `/compute`, `/approve`, `/bank-file` and `/mark-disbursed` (`§7`,
  O17). A retried approve returns the stored response; it never approves twice. A retried bank-file
  generation returns the same file, never a second payment instruction.
- **`input_digest`** is a SHA-256 over the canonical serialisation of: the paid-days snapshot id and its
  `source_digest`; the ordered set of `(employee_id, employee_salary_id)`; the ordered set of approved
  `HonorariumUnitEntry` ids and their unit counts; the ordered set of loan installment ids due this period;
  the reimbursement batch id; the arrears adjustment set id; the pinned `statutory_config_id`; and the
  included pay group ids. It is computed at compute, stored on the run, re-computed on every read of the run
  console, and compared at approval. Digest drift is the only reliable way to answer *"is what the checker
  is looking at still true?"* — and the answer must be data, not a timestamp heuristic.
- **Optimistic concurrency** (`ETag`/`If-Match`) on the run, structures, salary rows and unit entries.
- **Locking:** `is_locked` on run approval propagates to payslips and lines. Post-approval corrections have
  exactly one path: **arrears** ([[M10c-arrears-pay-revision]]). There is no edit.

### 4.5 How the system knows the maker and the checker are two people

This is asked explicitly because "a distinct user id" is a weaker guarantee than it looks, and the whole
control collapses if it is the same human twice.

1. **Distinct `user_id`** — enforced by a database `CHECK` on `PayrollApproval` and on `PayrollRun`, not
   only in service code. A constraint survives a refactor; an `if` statement does not.
2. **Distinct natural person** — where both users are linked to an `Employee` (`User.employee_id`, §6.2),
   the **`employee_id`s must also differ**. Two accounts for one person (a personal login and a shared
   "payroll@" login) are the same human and are refused. This is the case the control actually exists to
   stop, and it is the one a user-id check misses.
3. **Server-side, at the moment of approval** — permissions are resolved per request (M0 §4.7), so a
   `payroll.approve` capability revoked five minutes ago is already gone. The check is not a UI state.
4. **Re-authentication at approval** — the checker re-enters credentials or a second factor at the moment
   of approval (O5). A logged-in session left open on a shared machine is not a person's consent.
5. **Delegation cannot launder it** — an AC-02 delegate who is the maker is refused (`delegate_is_maker`).
6. **The capability is a flag, not a role** (`M2 §Business rules`, screen-inventory C6). A tenant may put
   `payroll.approve` on a Principal or a Director. It may **not** be held together with `payroll.run` on the
   same run instance: if a role config grants both, the per-instance refusal still applies and says why.
7. **Everything is audited** — maker, checker, both timestamps, the amount, the headcount and the pinned
   config version, on the run permanently and visible on every payslip's provenance (O6).

### 4.6 Golden-file regression — the correctness gate

`§11 Regression guard` and `CLAUDE.md` make this the mechanism by which a rule change is proven intentional.

- The artefact is the **payroll register export** (PY-10's CSV — the screen already names it "the golden-file
  comparison artefact"): a canonical CSV with a fixed column order, LF newlines, UTF-8 without BOM, rows
  sorted by `emp_code`, all money quantised to two decimal places and rendered as plain strings, and **no
  volatile fields** (no run UUID, no timestamps, no generated-at line).
- Goldens are committed under `backend/tests/golden/payroll/<statutory_config_version>/<scenario>.csv`,
  keyed **by config version**, because the same fixture legitimately produces different numbers on different
  versions — which is the property being protected.
- Scenario fixtures cover, at minimum: a CTC teacher full month; a CTC teacher with LOP; a mid-month joiner;
  a mid-month leaver; a mid-period salary revision; a guest lecturer under the cap; a guest lecturer at the
  cap; an employee with a loan EMI; an employee with a reimbursement payout line; an employee with arrears
  from two differently-pinned months ([[M10c-arrears-pay-revision]]); a vacation-staff teacher
  ([[M8-leave]]); an ESI-threshold-crossing employee; and a
  negative-net employee.
- CI **diffs byte-for-byte**. Any drift fails the build. A golden is updated only by a human who states in
  the pull request which rule changed and why, and the diff is reviewed line by line (riddler authors,
  gordon reviews any statutory-affecting change). **A golden is never regenerated silently or in bulk**;
  a commit that rewrites goldens without a stated reason is rejected on review.

### 4.7 Salary is not dashboard material

`DESIGN.md` principle "every element earns its place" and the screen inventory's must-NOT-contain lists put
this in the negative space of a dozen screens. Concretely, for this module:

- No role's home screen (PY-01, AC-01, PR-01, HR-01, DH-01, GA-01, EMP-01) shows an individual's salary,
  gross or net. PY-01 shows **run state and blockers**; EMP-01 shows *"payslip available"*, and never a
  provisional net for an unreleased month.
- Employee-level amounts live on the **payslip** (EMP-07) and on payroll's own register screens (PY-09,
  PY-10, PY-18), one deliberate click away, behind the salary PII permission (`§8` field-level access, O3).
- Aggregate run totals are legitimate on PY-01 and PY-07 — they are the run's identity — but a headline
  total must always reconcile to the sum of payslips, so it is never a decorative number.
- A Department Head or Principal sees a person's pay only if they separately hold the salary PII permission;
  record access is not pay access (O3, O10).

### 4.8 i18n and a11y

- Every user-facing string on every payroll screen is a Hindi + English i18n key (`guard-i18n-strings`,
  O12). This includes **payslip PDF labels and component names**: a payslip is a document a person must
  legally understand, so `PayComponent.label_key` is an i18n key and the PDF renders in the recipient's
  language preference. A component named by free text in one language is a compliance defect.
- Money renders in the **Indian grouping** (₹1,23,456.78) with tabular/mono figures so columns align, and
  the same value never renders two different ways on two screens (`§9` Localisation).
- Dates render in Indian format; the period is always named as a month, never as an ambiguous numeric.
- a11y (WCAG AA, `§9`): the register is a real `<table>` with header associations, not a grid of divs;
  totals rows are programmatically associated with their columns; the maker–checker refusal is announced to
  assistive technology as text, not conveyed by a disabled state alone; long compute reports progress via an
  `aria-live` region rather than an unlabelled spinner; every blocking-issue list is focus-addressable so a
  keyboard user lands on the first blocker.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M10-AC-01 | Every table in this module carries a NOT-NULL `tenant_id` FK and `ENABLE`+`FORCE ROW LEVEL SECURITY` with `USING` **and** `WITH CHECK` policies created **in the same migration** as the model. | `§3`, `guard-rls-policy`, O7 |
| M10-AC-02 | A payroll operator authenticated for tenant A cannot read, compute, approve, export or download any run, payslip, salary row, unit entry or bank file belonging to tenant B — proven through the ORM **and** through raw SQL with the ORM filter disabled. | `§3`, `§11` tenant-isolation tests, O7 |
| M10-AC-03 | Every monetary field in `PayGroup`, `PayComponent`, `EmployeeSalary`, `HonorariumRule`, `HonorariumUnitEntry`, `PaidDaysRow`, `PayrollRun`, `Payslip`, `PayslipLine`, `BankFile` and `PayrollApproval` is a `Decimal`-backed `NUMERIC` column; no `FloatField` and no Python `float` appears anywhere in the compute path; money crosses the GraphQL and REST boundaries as a **string**. A `float` in this module fails CI. | `M10 §Business rules`, `guard-money-float` |
| M10-AC-04 | No statutory rate, ceiling, slab, percentage or threshold appears as a literal in this module's code, screens, tooltips or fixtures; every statutory figure is read from the pinned `StatutoryConfig` and every operational threshold from `PayrollSettings`. | `§4.4`, `guard-statutory-hardcode`, `guard-hardcoded-values`, **O9** |
| M10-AC-05 | A run pins exactly one `StatutoryConfig` version at compute — the version effective on the period's last day — as a **foreign key** on the run **and** denormalised onto every payslip; the pin is never reassigned, and re-running or re-opening the period computes on the originally pinned version. | `§4.4`, `§6.9`, `M11 §Acceptance`, **O9** |
| M10-AC-06 | The pinned version and its effective-from date are displayed on the run console, the payslip register, the payslip PDF and the employee's EMP-07 payslip; a statutory line's *Explain* shows the version that produced it. | **O9**, O6 |
| M10-AC-07 | A run computes a CTC teacher and a per-lecture guest lecturer **correctly in one pass** over one legal entity and period. | `M10 §Acceptance`, blueprint §4 |
| M10-AC-08 | Saving a salary structure whose excluded allowances exceed 50 % of wages is **refused**, naming the exact overage and the offending components; the verdict is recomputed live at a sample CTC while editing. | `M10 §Business rules`, `M10 §Acceptance`, blueprint §4 (★ Labour Code) |
| M10-AC-09 | `EmployeeSalary` is effective-dated: a revision writes a **new dated row** and supersedes; no in-place edit path exists in the API or the UI, and overlapping effective ranges for one employee are refused by a database constraint. | `§4.3`, `§6.9`, **O18** |
| M10-AC-10 | Where a salary revision takes effect mid-period, the period is split at the effective date and each segment is computed on its own salary version; the payslip shows both segments and their bases. | `§4.3`, `M10 §Business rules` proration, O18 |
| M10-AC-11 | Paid days are computed as present + paid-leave + holidays + weekly-offs − LOP, **frozen** into a snapshot bound to the run, and displayed with the arithmetic shown per employee; the run computes from the snapshot, never from live attendance. | `M9 §Business rules`, `M10 §Workflow` |
| M10-AC-12 | Paid-days proration is correct for a mid-month joiner and a mid-month leaver, and the proration basis comes from the pay group's `proration_basis` — never a hardcoded 30. | `M9 §Acceptance`, `M10 §Business rules`, blueprint §4 |
| M10-AC-13 | An approved unpaid leave day reduces paid days and therefore net pay, traceable from the payslip back to the `LeaveRequest`. | `M8 §Acceptance`, blueprint §3 |
| M10-AC-14 | The honorarium engine pays `min(rate × units, monthly_cap)` per rule per employee per month; `monthly_cap` is a required field; the payslip line records units, rate, the uncapped amount, whether the cap bound, and the `HonorariumRule` version used. | `§6.9`, `M10 §Business rules`, blueprint §4 (★ honorarium engine) |
| M10-AC-15 | Monthly honorarium units are captured on an explicit surface as `HonorariumUnitEntry` rows; only `approved` entries compute; the approver **must be a different user** from the person who entered them; an honorarium employee with no approved entry is reported as a blocking input, never paid zero silently. | gap G5, `§6.9`, `M10 §Workflow` |
| M10-AC-16 | A `HonorariumRule` rate change **supersedes** and applies to future runs only; past runs are untouched, and a retrospective rate change is routed to the arrears path (M10c). | `§4.3`, PY-04, O18 |
| M10-AC-17 | Computing a run with any employee lacking a salary assignment, any unresolved blocking paid-days exception, or any missing honorarium unit entry is **blocked with the exact list of names** — never a silent zero payslip. | PY-07, `M10 §Workflow` |
| M10-AC-18 | Variance review is a **required stage** between compute and approval: the run cannot move to `awaiting_checker` while an unexplained flagged variance remains, and the explanations are stored on the run and shown to the checker. | `M10 §Business rules`, `M10 §Workflow`, blueprint §4 (variance auto-detection) |
| M10-AC-19 | Variance thresholds are read from `PayrollSettings`, not from a literal; rows the system attributes to a known cause are **listed and drillable**, never silently auto-cleared. | ui-compliance F5, F6, O9 |
| M10-AC-20 | The first run for a legal entity, having no prior comparator, degrades gracefully — it does not flag every employee as a 100 % variance. | PY-09 |
| M10-AC-21 | A run's headline totals equal the sum of its payslips, which equals the sum of the payslip lines by type; a mismatch is a **blocking** error that prevents approval. | `M15 §Acceptance`, PY-10 |
| M10-AC-22 | A run requires a **distinct checker**: `approved_by_user_id ≠ submitted_by_user_id` **and** the two users' linked `employee_id`s differ where both exist, enforced by a database constraint and re-verified server-side at approval. Approval by the maker is refused with `maker_cannot_approve` and audited. | `§8`, `M10 §Permissions`, `M10 §Acceptance`, **O5** |
| M10-AC-23 | The checker re-authenticates at the moment of approval and confirms against a restatement of type, period, exact ₹ total, headcount and maker. | **O5** |
| M10-AC-24 | The checker has a **return-to-maker with a mandatory reason** action of equal standing to approve; the run returns to the maker as editable and the maker is notified with the reason. | ui-compliance F7, A39, **O5** |
| M10-AC-25 | If any input changes between submission and approval, the approval is refused as **stale** (`approval_stale`), naming what changed; the maker must recompute and resubmit. | `§7`, PY-07, AC-02, **O17** |
| M10-AC-26 | AC-02 presents **one queue** of every financial finalisation awaiting a checker — runs, loans, reimbursement batches, arrears postings, bonus runs, and F&F only where the tenant requires a checker — each with the exact ₹ total, the maker, the submission time and the evidence. Items where the current user is the maker are never approvable. | gap G1, `§8`, amendment C, **O5** |
| M10-AC-27 | Compute, approve, bank-file generation and mark-disbursed each require an idempotency key; a retry replays the stored result and never double-processes; a crashed compute is resumable and never leaves the run partially posted. | `§7`, `§9`, **O17** |
| M10-AC-28 | Bank-file generation is **impossible** before the checker has approved the run — enforced server-side, not only by a disabled control. | `M10 §Workflow`, `§8`, amendment B, **O5** |
| M10-AC-29 | Employees with missing or invalid bank details are listed and **excluded** before generation, never silently paid zero; the exclusion list is part of the file's record. | PY-11, **O10** |
| M10-AC-30 | A regenerated bank file is a new **version** that supersedes and is visibly numbered; both versions are retained; every generation and every download is audited with actor, timestamp and payee count. | PY-11, **O10** |
| M10-AC-31 | Marking a run disbursed requires a bank reference/UTR and is irreversible; a reversal is recorded as a new compensating action, never an undo. | PY-11, `§6.9`, O6 |
| M10-AC-32 | Payslips lock on run approval; no edit path exists for any role; a post-approval correction is only possible as arrears ([[M10c-arrears-pay-revision]]), and a reissued payslip is published **alongside** the original with the supersession visible. | `§6.9`, `§4.3`, [[M10c-arrears-pay-revision]], **O6**, O18 |
| M10-AC-33 | Payslip PDFs are password-protected, served through the REST file edge by short-lived signed URL, and every download is audited with actor, subject and timestamp; the password derivation rule is stated to the subject only. | `§8`, **O10**, O2 |
| M10-AC-34 | An employee sees only their own payslips; a Department Head or Principal sees another person's pay only with the salary PII permission, which is distinct from record access. | `§8` field-level access, **O3**, **O11**, EMP-07 |
| M10-AC-35 | No dashboard or home screen displays an individual's salary, gross or net; an unreleased month shows "not released", never a provisional figure. | `DESIGN` principles, EMP-01, screen-inventory, O3 |
| M10-AC-36 | Every payslip line carries a `basis` that explains it — calc type and base, proration fraction, cap application, or the pinned config version and rule — and EMP-07 renders that explanation. | **O6**, O9 |
| M10-AC-37 | Every mutating action in this module writes an immutable `AuditLog` row (actor, before/after, timestamp), including compute, variance explanation, submission, approval, return, bank-file generation, download and publication. | `§4.2`, **O6** |
| M10-AC-38 | The payroll register export is byte-for-byte canonical and is diffed against a committed golden per `StatutoryConfig` version; any drift fails CI and can be resolved only by a reviewed, reasoned golden update. | `§11` Regression guard, `CLAUDE.md` |
| M10-AC-39 | A run for ~2,000 staff computes within minutes, reports progress, and its list surfaces paginate. | `§9` |
| M10-AC-40 | A finalized M17 increment/promotion recommendation arrives as a **proposed** revision that is editable, is never auto-applied, and still passes payroll maker–checker before it becomes an active `EmployeeSalary` row. | `M17 §Business rules`, `M17 §Acceptance`, PY-06, [[M17-performance-appraisal]] |
| M10-AC-41 | Every user-facing string, including payslip PDF component labels, resolves through Hindi + English i18n keys; money renders in Indian grouping identically on every surface. | `guard-i18n-strings`, `§9`, O12 |
| M10-AC-42 | A negative net (recoveries exceeding earnings) is represented and reported as such; it is never clamped to zero silently. | `§4.3` edge cases |
| M10-AC-43 | A withheld payee is excluded from the bank file with a recorded reason, and the hold is visible on the run and on the payslip. | A35, O6 |
| M10-AC-44 | Salary, bank account, PAN and Aadhaar never appear in a log line, an error payload, a webhook body or an exception message anywhere in the payroll path; subjects are identified in logs by opaque UUID only. | **O11**, `guard-pii-logging` |
| M10-AC-45 | Reading another person's salary or bank detail requires the field-level PII permission and the read is **access-logged**; a masked-by-default view with an audited reveal is the norm on PY-05 and PY-10. | **O3**, `§8` |
| M10-AC-46 | Payslips, the register and the bank file are retained per the tenant's retention policy and survive the employee's exit for the statutory window; a run's artefacts are never hard-deleted. | **O2**, `§8` |
| M10-AC-47 | Extra-duty / overtime earnings (exam duty, extra classes, hostel-warden duty) are payable to a CTC employee at a configurable rate with an optional monthly cap, with `taxable`/`pf_applicable`/`esi_applicable` explicitly set, entered and approved by **different** people, and itemised on the payslip. *(Subject to the C-M10-05 ruling — blueprint MVP, dev-spec silent.)* | blueprint PART A §4 **[MVP]**, PART C item 4 |
| M10-AC-48 | No screen, tooltip, mock, fixture or copy string in this module presents payroll as a single click from computation through to disbursement; the release path always names a distinct checker. | amendment B, **O5**, blueprint §4 (corrected wording) |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| **Unit** | **deathstroke** | Component evaluation order and formula restriction (a cycle is unrepresentable); the 50 % excluded-allowance test at boundary values (49.99 %, 50.00 %, 50.01 %); proration arithmetic across all three `proration_basis` values including a 28-day February and a 31-day month; mid-period split at the effective date; honorarium `min(rate × units, cap)` at, just under and just over the cap, with fractional units; paid-days arithmetic for joiner, leaver, half-day, LOP and holiday-adjacent absence; `Decimal` quantisation and rounding at each documented boundary; `input_digest` canonicalisation (reordering inputs must not change the digest; changing one unit count must); the distinct-person predicate incl. the two-accounts-one-person case; register canonicalisation (the golden serialiser) |
| **Engine correctness** | **riddler** | The computation itself: CTC and honorarium paths, statutory invocation against `StatutoryConfig` **fixtures** (never re-typed rates), proration interaction with statutory bases, employer-contribution derivation, and the interaction of loan/reimbursement/arrears lines with gross, taxable base and net |
| **Golden-file regression** | **riddler** (authors) + **bane** (gate) | The thirteen scenarios of §4.6, per config version, diffed byte-for-byte in CI; a deliberately altered rate produces a failing diff and cannot be absorbed silently |
| **Integration / RLS** | **bane** | Cross-tenant isolation over every table here, through ORM and raw SQL, for read/compute/approve/export/download; a tenant-B payslip PDF signed URL cannot be minted from tenant A; scoped list counts do not leak other legal entities |
| **Maker–checker / governance** | **bane** | The maker cannot approve (server-side refusal, not a hidden button); two accounts for one person are refused; a revoked `payroll.approve` takes effect immediately; approval of a stale run is refused; return-to-maker reopens the run and notifies; bank-file generation before approval is refused at the API; payslip edit endpoints do not exist for any role |
| **Workflow / E2E** | **bane** | The `§11` happy path hire → onboard → attendance → leave → payroll → statutory → exit on the multi-campus seed group, with a guest lecturer and a vacation-staff teacher in the population; run → variance → approve → bank file → publish → employee opens EMP-07 and the figures reconcile |
| **Idempotency / chaos** | **bane** | Compute killed mid-run resumes without duplicate payslips; approve retried under the same key approves once; bank file retried returns the same artefact and checksum; two concurrent computes yield one job; a pooled-connection tenant switch mid-run leaks nothing |
| **Performance** | **bane** | 2,000 staff across 4 pay groups computes within the `§9` target; the register list query stays on the `(tenant_id, payroll_run_id, …)` index |
| **Contract** | **cyborg** + CI | Money serialises as a string in the SDL and OpenAPI; generated TS compiles under `strict` with no `any`; generated Dart analyses clean |
| **UI / a11y** | **two-face** | Indian money grouping and tabular alignment; the maker-refusal message is readable by assistive technology; no salary on any dashboard; Hindi parity on payslip labels |
| **Compliance review** | **gordon** | Every diff touching salary, statutory bases or the maker–checker path before merge |

Assertions reference the source of truth — `StatutoryConfig` fixtures, factories, i18n keys, model metadata
— never a re-typed literal (`CLAUDE.md` Testing standards).

---

## 7 · Proposed stories

Build-plan **Sprint 7**, except where noted. Owners per the spec's module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M10-S01 | `PayGroup` + `PayrollSettings` models, RLS, migration | The per-legal-entity pay logic registry and the config that stops thresholds becoming literals. | oracle | 3 | M0-S05, M1 |
| M10-S02 | `SalaryStructure` + `PayComponent` models with supersession and RLS | Effective-dated component templates; the structure never edits in place. | oracle | 5 | M10-S01 |
| M10-S03 | 50 % excluded-allowance validator | The Code-on-Wages test, refusing the save with the overage named — at structure save **and** at salary assignment. | riddler | 5 | M10-S02 |
| M10-S04 | `EmployeeSalary` model, effective-dating, overlap constraint, RLS | One person's pay history as an append-only ledger. | oracle | 5 | M10-S02 |
| M10-S05 | `HonorariumRule` + **`HonorariumUnitEntry`** models, RLS, approval rule | The honorarium contract and the monthly unit source the spec omits. | oracle | 5 | M10-S01 |
| M10-S06 | `PaidDaysSnapshot`/`PaidDaysRow` + the reconciliation job | Paid days computed from [[M9-attendance]] and [[M8-leave]], with the arithmetic retained and the snapshot freezable. | cyborg | 8 | M9, M8 |
| M10-S07 | `PayrollRun`, `Payslip`, `PayslipLine`, `BankFile`, `PayrollApproval` models + RLS | The run's spine, including the config pin as a FK and the distinct-person DB constraint. | oracle | 8 | M10-S04, M11 config table |
| M10-S08 | **Compute engine — CTC path** | Component evaluation, proration, mid-period salary split, employer contributions. | riddler | 13 | M10-S03, M10-S06, M10-S07 |
| M10-S09 | **Compute engine — honorarium path with monthly cap** | `min(rate × units, cap)`, rule-version pinning, cap provenance on the line. | riddler | 8 | M10-S05, M10-S07 |
| M10-S10 | Statutory invocation + config pinning inside the run | Calls [[M11-statutory-compliance]]'s calculators with the version pinned from [[M11a-statutory-config-versioning]]; stores contributions and the per-payslip pin. | riddler | 8 | M10-S08, M11a |
| M10-S11 | Celery orchestration: idempotent, resumable, progress-reporting compute | 2,000 staff in minutes, restartable, never partially posted. | cyborg | 8 | M10-S08, M0-S13 |
| M10-S12 | `input_digest` + recompute-required / stale-approval detection | The data that answers "is what the checker sees still true?". | cyborg | 5 | M10-S11 |
| M10-S13 | Variance engine: deltas, cause classification, thresholds from config | The required review stage, with nothing silently auto-cleared. | riddler | 8 | M10-S11 |
| M10-S14 | **Maker–checker service + AC-02 queue API** | One gate for every financial finalisation, with distinct-person enforcement and return-to-maker. | wonder-woman | 8 | M10-S07 |
| M10-S15 | Run GraphQL/REST surface: `/compute`, `/variance`, `/approve`, `/bank-file` | The action endpoints, idempotent, ETagged, RFC-7807. | cyborg | 8 | M10-S11, M10-S14 |
| M10-S16 | Payslip PDF generation (password-protected, i18n labels) + signed delivery | The artefact staff actually read, in their language, protected and audited. | cyborg | 5 | M10-S10 |
| M10-S17 | NEFT bank-file generation: format from config, versioned, checksummed, exclusions | The most dangerous export in the product, gated on approval. | martian | 8 | M10-S15 |
| M10-S18 | Payslip publication + M14 notifications | Release to ESS, delivery states, reissue alongside. | cyborg | 3 | M10-S16, M14 |
| M10-S19 | Payroll register export — the canonical golden artefact | The byte-stable CSV every regression compares against. | riddler | 5 | M10-S11 |
| M10-S20 | **Golden-file regression harness + 13 scenario fixtures** | The gate that makes a rule change intentional. | riddler | 8 | M10-S19 |
| M10-S21 | PY-02/PY-03/PY-04 setup screens (pay groups, structures, honorarium + unit entry) | Configuration before consumption — no payroll runs without these. | green-lantern | 8 | M10-S05, M10-S15 |
| M10-S22 | PY-05 employee salary & revisions; PY-06 proposed revisions queue | Effective-dated pay per person; the [[M17-performance-appraisal]] handoff as advisory only. | green-lantern | 8 | M10-S04, M17 |
| M10-S23 | PY-01 home, PY-07 run console, PY-08 paid-days reconciliation | The operator's spine, with the pin and the blockers visible. | green-lantern | 13 | M10-S15 |
| M10-S24 | PY-09 variance review, PY-10 payslip register | The evidence the checker reads, with totals that reconcile. | green-lantern | 8 | M10-S13 |
| M10-S25 | **AC-02 maker–checker gate screen** | Ships **in this wave**, not after — a run console without its gate teaches the wrong model. | green-lantern | 8 | M10-S14 |
| M10-S26 | PY-11 disbursement & bank file, PY-12 publication | Release, versioned and audited. | green-lantern | 8 | M10-S17, M10-S18 |
| M10-S27 | EMP-07 payslips (web + Flutter) with line provenance | The employee's answer to "why that much", including paid-days and the pinned version. | nightwing | 8 | M10-S16 |
| M10-S28 | PY-18 payroll reports & registers with reconciliation lines | Registers that state their own arithmetic. | green-lantern | 5 | M10-S19 |
| M10-S29 | Unit + integration test suites for the engine and governance paths | The density `§11` demands on the highest-risk code in the product. | deathstroke | 8 | M10-S08…S14 |
| M10-S30 | E2E, RLS isolation, idempotency/chaos and performance suites for M10 | Cross-tenant proof and the crash-resume proof. | bane | 8 | M10-S26 |
| M10-S31 | **`ExtraDutyRule`/`ExtraDutyEntry` + compute path + entry screen** *(conditional on the C-M10-05 ruling)* | Exam duty, extra classes and hostel-warden pay for salaried teachers — blueprint MVP with no home in the dev spec. | riddler + green-lantern | 8 | M10-S08 |
| M10-S32 | PII masking + audited reveal on salary and bank fields across PY-05/PY-10/PY-11 | Record access is not pay access; every reveal is logged. | wonder-woman | 5 | M10-S22 |

**Total: 32 stories, 231 points** (M10-S31's 8 points are conditional).

**Dependency edges that constrain sprint order.** `M10-S03` (the 50 % validator) gates every structure
save, so it precedes `M10-S21`. `M10-S06` depends on [[M9-attendance]] and [[M8-leave]] shipping in
Sprints 5–6 — payroll cannot start before them. `M10-S10` depends on
[[M11a-statutory-config-versioning]] existing as **versioned data** before first use; the build plan puts
statutory in Sprint 8, one sprint *after* payroll core, so **the config table and its version-pinning must
be pulled forward into Sprint 7** or the run has nothing to pin and [[M10c-arrears-pay-revision]] in
Sprint 9 inherits an unpinnable history. `§12` already names this as critical-path risk #3; this spec
restates it as a scheduling constraint, not a caveat. `M10-S25` (AC-02) ships **inside** this wave, not
after it. (M10a/M10b/M10c add their own; see those files.)

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (**not applied**) |
|---|---|---|---|
| **OQ-M10-01** | **What is the proration denominator?** The spec says "paid-days proration" and never says over what. Calendar days (28–31), standard working days, or the Indian payroll convention of a fixed 26? | Three answers, three different salaries for the same absence. A teacher on 2 LOP days in February is paid materially differently under each. This is the single highest-value ambiguity in M10. | `proration_basis` per pay group, defaulting to `calendar_days`, with the basis printed on the payslip. **Needs a product/statutory ruling before Sprint 7 code.** |
| **OQ-M10-02** | **Which components prorate?** All earnings, or only some? A fixed monthly conveyance or a books allowance may be policy-flat. | Prorating a flat allowance underpays; not prorating basic overpays. Nothing in the spec distinguishes. | The added `PayComponent.prorates` flag, no default, forcing an explicit choice per component — same discipline as `taxable`/`pf_applicable`. |
| **OQ-M10-03** | **Mid-period salary revision:** split-period computation or whole-month at the new figure? | Unspecified; both are defensible and they differ by real money. Split-period is also the only version that composes correctly with arrears (M10c). | Split at the effective date, each segment on its own version. Recorded here as the design; confirm. |
| **OQ-M10-04** | **Honorarium units above the monthly cap** — forfeited, or carried into the next month? | A visiting lecturer who took 30 lectures in a 20-lecture-cap month either loses 10 lectures' pay or is owed it later. The cap is in the model; the overflow rule is not. | MVP forfeits and states so on screen and on the payslip line. Carry-forward is a policy the spec does not grant. **Needs a ruling.** |
| **OQ-M10-05** | **Is the 50 % rule tested per structure or per employee?** `M10 §Acceptance` tests it at structure save; a percent-based structure can pass at one CTC and breach at another. | A structure that passes the sample test and breaches for a specific employee is a Code-on-Wages exposure that never surfaces. | Test at both points; block assignment on a per-employee breach. Confirm this is intended rather than gold-plating. |
| **OQ-M10-06** | **Negative net** — who carries the shortfall and how is it recovered? Recoveries (loan EMI + notice + LOP) can exceed earnings. | Clamping to zero silently loses money owed to the school; deducting anyway can breach wage-protection norms. | Represent it, do not clamp; carry as a recoverable balance to the next run with an explicit line. **Needs a legal call on permissible deduction limits.** |
| **OQ-M10-07** | **Bank-file regeneration after checker approval** — does v2 need a fresh checker approval? | v1 may already be uploaded; v2 creates a second payment instruction. The spec gates generation on approval but says nothing about regeneration. | Require a fresh checker acknowledgement for any version after v1, and warn *"do not upload both"*. (ui-compliance A40 `[judgement]`.) |
| **OQ-M10-08** | **Payslip PDF password rule** — protection is mandated, the key is not specified (screen-inventory Q20). | Every school will ask, and an inconsistent scheme across tenants is a support nightmare. | Tenant-configurable `payslip_password_scheme`, defaulting to PAN (caps) + DOB (DDMMYYYY), the rule stated to the subject only, never the password itself in the same channel. |
| **OQ-M10-09** | **Rounding policy.** Where does the run round — per component, per line, per payslip, per statutory head? | Rounding at the wrong step is how a register fails to reconcile by a few rupees, which then blocks approval on every run. | Compute at full `Decimal` precision; quantise to 2 dp per **line**; round the net per the pay group's `rounding_policy`; statutory heads round per [[M11-statutory-compliance]]'s per-head rules. Needs riddler's sign-off with M11. |
| **OQ-M10-10** | **Does the run enforce prior-period closure?** PY-01 proposes it; the spec does not require it. | Out-of-order runs corrupt M10c's month-split and the variance comparator. | `require_prior_period_closed` default **on**, overridable with a reason. |
| **OQ-M10-11** | **No off-cycle run exists in MVP**, yet PY-11 needs a way to pay employees excluded for bad bank details. | The excluded employee is simply unpaid until next month, which is not acceptable for a school. | Either promote a minimal `supplementary` run into MVP or define an explicit manual-payment record. **Needs a ruling** — this is a real hole. |
| **OQ-M10-12** | **Who may hold `payroll.approve`, and is it configurable per tenant?** `M2` makes it a capability flag; C6 assigns AC-02 to the Accountant as typical. | A single-finance-person school has nobody to check — and the answer must be "then a Principal or Director holds the flag", not "then we relax the rule". | Keep the flag model; the tenant setup wizard must require at least two distinct `payroll.approve`-capable people before a run can be submitted. Confirm. |
| **OQ-M10-13** | **Where do employer contributions sit on the payslip?** `PayslipLine.type` has `employer_contrib`, but whether the employee-facing PDF shows them is unstated. | Showing them is good practice and standard in India (CTC transparency); hiding them causes "why is my CTC bigger than my payslip" queries every month. | Show them in a separate, clearly-labelled block that does not enter net. EMP-07's must-contain already implies it. |
| **C-M10-01** | **Screen-numbering conflict in the inventory.** EMP-12 and DH-09 both refer to the reimbursement **payout batch** as *PY-16*, but PY-16 is *Exits & settlements register* and the payout batch is **PY-14**. | Two screens' must-NOT-contain lists currently point at the wrong destination; a builder following them would route a claim into the exits register. | Correct EMP-12 and DH-09 to cite **PY-14**. A documentation fix, filed rather than applied — `docs/screen-inventory.md` is not my file this session. |
| **C-M10-02** | **`docs/ui-compliance-requirements.md` predates amendment C.** O5 lists F&F approval as maker–checker `[judgement]` and A56 as "MC (recommended)"; the 2026-08-11 amendment made F&F the **one configurable exception**. | gordon's document is the compliance reference agents will read; leaving it stale will produce an F&F implementation that contradicts a user ruling. | Update O5, A56 and §9-Q4 in `ui-compliance-requirements.md` to record amendment C as answered. Owner: gordon. |
| **C-M10-03** | **A hardcoded threshold already exists in the built design** — ui-compliance F5 records `AUTO_CLEARED = 7` items "below the 15% variance gate" in the pre-v3 payroll console, and F6 records that those seven were suppressed from review entirely. | If the v3 rebuild inherits it, the first payroll screen ships with a policy constant typed into a component and seven unreviewed money variances. | The v3 console must read thresholds from `PayrollSettings` and list every auto-attributed row. Confirmed as an AC here (M10-AC-19); flagging so the rebuild does not reintroduce it. |
| **C-M10-05** | **Extra-duty / overtime pay is blueprint-MVP and dev-spec-absent.** Blueprint PART A §4 lists "★ Overtime & extra-duty pay: exam duty, extra classes, hostel-warden duty — configurable rates **[MVP]**" and PART C item 4 repeats "extra-duty pay". `M10 §Business rules` and `§6.9` define **no entity for it**, and `HonorariumRule` cannot serve because it is bound to an honorarium *pay group* while the invigilators are salaried CTC teachers. | An MVP-tagged, education-specific earning with nowhere to live gets keyed as an ad-hoc special allowance, losing its taxable/PF/ESI treatment and its audit trail. Board-exam invigilation duty is on the deck's own academic-year diagram (slide 08, "Board-exam invigilation duty-leave"). | Add `ExtraDutyRule` + `ExtraDutyEntry` (§3.6a) to `§6.9` and a business-rule block to M10. **Needs a ruling** — I have specified it but not applied a scope change. |
| **C-M10-06** | **Perquisite valuation is P2 while the loan-interest perquisite flag is MVP.** Blueprint §4 tags "★ Perquisite valuation" **[P2]**; `§6.9 Loan.is_perquisite` and `M10 §Loans` are MVP. | If valuation is P2, an interest-free loan's flag is set but the taxable perquisite value is never computed, so TDS is understated — a real §17(2) exposure. | Either bring **loan-interest** perquisite valuation (the SBI-rate method, rate from `StatutoryConfig`) into MVP as a narrow carve-out, or state on screen that the flag records intent only and the value is manual. Detailed in [[M10a-loans-advances]]. **Needs a ruling.** |
| **C-M10-07** | **The ShriConnect deck still promises a single click through to money.** `docs/Naveya-School-HRMS-Voxturrlabs.pdf` slide 09 — *"single-click with variance detection, then bank file + payslips"* — and slide 13 — *"Single-click run: AI anomaly checks, then NEFT bank file and payslips"*. Amendment B (2026-08-11) corrected exactly this wording in the blueprint and the dev spec. | This is the **customer-facing** artefact, prepared for school leadership. It currently promises the one thing `§8` forbids. If it is reused in a sales conversation the product will be sold on a control it must refuse. | Reissue slides 09 and 13: *"one-click computation across all pay groups; release always requires a distinct approver."* Owner: BATMAN / whoever owns the deck. The dev spec wins as the build contract regardless. |
| **C-M10-08** | **"AI anomaly checks" appear in the deck and nowhere in the build contract.** Deck slide 10 ("Payroll & compliance checks — AI flags salary, LOP and statutory outliers before a run, and explains changes") and slide 13. `M10 §Business rules` specifies **threshold-based** variance review; the blueprint says "exception/variance auto-detection", not AI. | Either a promised capability is unbuilt, or an unspecified ML component silently enters the most correctness-critical path in the product. A model that "explains changes" on payroll data is also a PII-processing decision nobody has reviewed (O11, DPDP). | MVP ships **deterministic, threshold-and-cause-classified** variance review (M10-AC-18/19). Anything ML-based is a separate, later, reviewed item. Deck copy should say "automatic variance detection". **Flagged, not applied.** |
| **C-M10-09** | **`docs/pdf/school-hrms-product-definition.pdf` (v0.1, 15 July 2026) is a pre-decision snapshot.** It predates the 2026-07-18 API change and the whole 2026-07-22 ShriConnect scope change, so its payroll section has no loans, reimbursements or arrears. | An agent reading it as current would build the July-15 scope. | Treat it as superseded by the four repo docs. One line in it is worth keeping and is quoted approvingly here: *"All figures for statutory rates, ceilings and pricing are indicative and are held in configurable form in the product"* — that is M10-AC-04 stated in the product's own voice. |
| **C-M10-10** | **The deck does not evidence the three MVP promotions in this lane.** The 2026-07-22 scope-change log attributes loans, reimbursements/FBP and arrears to "ShriConnect alignment", but the ShriConnect deck names none of them anywhere in its 19 pages. | Not a blocker — the scope change is locked in `decisions-to-finalize.md`, which is authoritative. Recorded because I was pointed at the deck as the artefact behind the change and it is not. | No action on scope. If a written ShriConnect requirements list exists outside the repo, it should be filed in `docs/` so the rationale is portable (`CLAUDE.md` knowledge-portability). |
| **C-M10-04** | **`M10 §API` lists `…/loans`, `…/reimbursement-claims` and `…/arrear-adjustments` as REST paths**, while the 2026-07-18 decision makes GraphQL primary with REST reserved for ingestion, files, auth and integrations. | Building these as REST would contradict the API decision; building them as GraphQL contradicts the module's own API list. | Read the spec's paths as *logical* action names: GraphQL mutations (`loanApprove`, `reimbursementBatchApprove`, `arrearAdjustmentCompute`) with the REST edge only for receipt/artefact upload and download. Confirm with cyborg. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
