# M11 — Statutory Compliance · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M11 Statutory Compliance (build-plan Sprints 8–9) · **Story:** NA-23 (Lane E) ·
> **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M11, §4.2, §4.4, §6.10, §8, §9, §11, §12 ·
> `docs/functionality-blueprint.md` **PART A §5** (starred education-unique — this lane) and **PART C item
> 5**, the authoritative in/out list ·  `docs/decisions-to-finalize.md` **D3 — full greytHR parity, LOCKED** ·
> `docs/competitor-analysis.md` (the parity bar: *"Form 24Q + FVU validation, signed Form 16/12BA,
> multi-state PT, LWF, ECR"*) · `docs/screen-inventory.md` AC-01, AC-03, AC-04, AC-05, AC-07, AC-08, EMP-08,
> EMP-09 · `docs/ui-compliance-requirements.md` **O5, O6, O9, O10, O11, O17**, A49, A50, A52, A53, A54 ·
> `CLAUDE.md` `guard-statutory-hardcode`, `guard-money-float`, `guard-pii-logging`.
>
> **Read [[M11a-statutory-config-versioning]] first.** Every number in this document comes from a pinned
> config version; this module contains no rates. Bonus lives in [[M11b-bonus]]; exit computation in
> [[M12-full-and-final]]; the runs that feed contributions in [[M10-payroll-core]] and
> [[M10c-arrears-pay-revision]].

---

## 1 · Intent

A school's statutory obligations do not scale with its ambition. A 90-staff K-12 campus in Bengaluru owes
EPFO an ECR every month, ESIC a contribution and a half-yearly return, Karnataka a professional-tax challan,
the income-tax department a monthly challan and a quarterly 24Q, and every teacher a Form 16 by the middle of
June — and it usually owes all of that to a single accountant who also handles fee reconciliation. The reason
schools stay on greytHR despite it knowing nothing about an academic year is that greytHR gets this part
right, and getting it wrong is not a bug report, it is a notice.

Decision **D3** locked full greytHR parity into the MVP precisely because that is the price of entry. This
module is where the product pays it: seven calculators whose every rate comes from a pinned, versioned
config; four filing artefacts that must reconcile to the register that produced them; a liability position
that says plainly what is owed, what was paid and what was filed; and a maker-checker gate in front of every
submission, because a filing is a statement to a government made in a school's name.

The blueprint's framing is worth repeating because it is what makes this an education product rather than a
generic one: *"Charitable/12A status does NOT exempt these — schools must comply."* A trust-run school is
told, often confidently and often wrongly, that its charitable status excuses it. It does not. The one place
a school genuinely does differ is the Payment of Bonus Act §32 educational-institution exemption, and that is
important enough to have its own document ([[M11b-bonus]]).

---

## 2 · Scope & surfaces

### In scope — from `functionality-blueprint.md` PART C item 5

| Area | Detail | Blueprint tag |
|---|---|---|
| **PF / EPS / EDLI** | EPF employee + employer split, EPS share and cap, EDLI, admin charges, configurable wage ceiling, VPF, Code-on-Social-Security wage base (excluded allowances ≤ 50%, validated in [[M10-payroll-core]]) | MVP |
| **ESI** | Employee + employer rates, wage ceiling, **Apr–Sep / Oct–Mar contribution periods with the mid-period continuation rule** | MVP |
| **Professional tax** | State-configurable slabs and frequency; PTEC + PTRC; **states that do not levy it at all** | MVP |
| **TDS §192** | Both regimes, new default; perquisites; monthly challan; average-rate method with monthly true-up | MVP |
| **Gratuity** | 15 × (Basic+DA) × years / 26, continuous-service tracking, exemption ceiling, provisioning. **Teachers are covered** (2009 amendment, SC 2022) | blueprint §5 tags **[P2]** — **MVP by locked D3 and PART C** (conflict C5/Q30) |
| **LWF** | State- and frequency-aware employee + employer contributions | same conflict — **MVP** |
| **Minimum wages** | Validate gross/components against the state notification + VDA by category/zone. A **validation**, never a deduction | same conflict — **MVP** |
| **Filings** | **ECR** + PF challan · ESI challan/return · PT state-wise challans/returns · **Form 24Q** (Annexure I each quarter, II & III in Q4) via RPU/FVU · **Form 16 Part A (TRACES) + Part B** · **Form 12BA** | MVP |
| **Reconciliation** | PF/ESI/PT/TDS payable vs paid vs filed, with variances named; statutory liability provisioning | MVP |
| **Investment declarations** | Declaration window, regime election, proof upload, verification, TDS impact, default-regime fallback | MVP |
| **Versioned config** | [[M11a-statutory-config-versioning]] | MVP |

### Explicitly out of scope

| Out | Where | Why |
|---|---|---|
| Bonus computation, §32 determination, ex-gratia | [[M11b-bonus]] | Large enough, and legally distinct, to be its own document |
| Gratuity **payout** at exit, leave encashment, TDS true-up on settlement | [[M12-full-and-final]] | M11 owns the *formula*; M12 owns the *event* |
| Arrears recompute on past config versions | [[M10c-arrears-pay-revision]] | M11 supplies the calculators; M10c supplies the month-split |
| Payslip generation, bank file, run approval | [[M10-payroll-core]] | Contributions are payroll outputs |
| Portal submission automation (EPFO/ESIC/TRACES adapters) | [[M16-integrations]] | Naveya generates and validates the artefact; a person submits it in MVP (OQ-M11-06) |
| Registers and MIS beyond the statutory set | [[M15-reporting-platform]] | AC-08 is the contributions register; 150+ MIS registers are not MVP |
| Digitally *signing* Form 16 / 12BA | **Conflict — see OQ-M11-03**; blueprint §5 tags signing `[P2]`, PART C and the pitch deck say MVP | |
| Form 5/10, 3A/6A, exit 19/10C/10D, Form F, Labour-Code registers, trust 12A/10(23C) audit reports, Bonus Form C/D | later phases per blueprint §5 | Recorded so they are not mistaken for omissions |
| **Maternity benefit** | **Unowned — see OQ-M11-04** | PART C and the pitch deck put it in the statutory promise; dev-spec M11 and M8 do not mention it at all |

### Surfaces

| Surface | Screens |
|---|---|
| Web — Accountant | **AC-01** compliance calendar · **AC-03** liability & reconciliation · **AC-04** filings register · **AC-05** filing generation & validation · **AC-07** investment-declaration review · **AC-08** contributions register |
| Web — checker | **AC-02** maker-checker gate — filings and bonus runs join the one queue |
| Web — Group Admin | **GA-07** statutory configuration ([[M11a-statutory-config-versioning]]) |
| ESS / mobile | **EMP-08** my tax documents (Form 16, 12BA) · **EMP-09** investment declaration ([[M13-ess-mobile]]) |
| API | `…/statutory-filings` (+`/generate`, `/validate`, `/mark-filed`), `…/investment-declarations`, `…/statutory-liability`, `…/statutory-contributions` (read-only), `…/statutory-payments` |
| Not built yet | AC-04..AC-08 exist in `docs/screen-inventory.md` but **not** in `design/v3/` — only AC-01/02/03 are built (`design/v3/pages/accountant.jsx`). Design work is a dependency of these stories |

---

## 3 · Data model

Tenant-owned throughout: `tenant_id` NOT NULL + RLS `ENABLE`/`FORCE` + policy **in the same migration as the
model** (`guard-rls-policy`). All monetary fields are `Decimal` (`guard-money-float`).

### 3.1 `StatutoryContribution` (§6.10) — extended

| Field | Type | Notes |
|---|---|---|
| `payslip_id` | FK → Payslip | Existing |
| `kind` | enum `pf · eps · edli · esi · pt · tds · lwf · bonus` | §6.10 lists `pf/esi/pt/tds/lwf/bonus`; **EPS and EDLI need to be separable** because ECR reports them as distinct columns (OQ-M11-05) |
| `employee_amt`, `employer_amt`, `base_amount` | Decimal | Existing |
| `state_code` | char(2), null | **New** — PT and LWF are per state; AC-08 groups by it and each state files separately |
| `statutory_config_id` | FK, null | **New** — normally derivable via `payslip → run → config`, but an **arrears-originated** contribution belongs to a *different* version and the chain gives the wrong answer (OQ-M11-02) |
| `arrear_adjustment_id` | FK, null | **New** — marks prior-period adjustment rows, which AC-08 must show separately and which a filing must handle as a revision |
| `rounding_delta` | Decimal | **New** — the difference between the exact and the rounded figure, retained rather than discarded so a reconciliation can explain a one-rupee gap instead of hiding it |

Contributions are **derived and never typed**. AC-08 has no mutating action by design; corrections happen
upstream through a recompute or an arrears adjustment (`§4.3`, O6).

### 3.2 `StatutoryFiling` (§6.10) — extended

| Field | Type | Notes |
|---|---|---|
| `legal_entity_id` | FK → LegalEntity | Filings are per employer of record, not per campus |
| `kind` | enum `ecr · pf_challan · esi_challan · esi_return · pt_challan · pt_return · form_24q · form_16 · form_12ba` | §6.10's enum omits `pf_challan`, `pt_return` and `form_12ba` although M11 §Business rules requires them |
| `period` | date range / quarter | Monthly, quarterly (24Q) or annual (Form 16) |
| `state_code` | char(2), null | **New** — PT and LWF file per state |
| `statutory_config_id` | FK, **NOT NULL** once generated | **New — required by NA-23 AC7.** A filing must carry the rule set it was computed on ([[M11a-statutory-config-versioning]] §3.3) |
| `format_version` | text | The government file-format version the artefact conforms to; these change independently of the rates |
| `artifact_ref` | encrypted ref | Object-store key; downloads are audited (O10) |
| `artifact_digest` | text | So a filed artefact can be proven to be the one generated (A49) |
| `validation_result` | JSONB | Per-employee errors/warnings, the FVU outcome, and the excluded-employee list with reasons |
| `status` | enum `not_due · due · generating · generated · pending_checker · submitted · filed · rejected · superseded` | `filed` requires an acknowledgement |
| `maker_user_id`, `checker_user_id` | FK → User | **Distinct** (O5, §8) |
| `filed_on`, `acknowledgement_ref`, `receipt_file_ref` | | An unacknowledged filing is not a filing (AC-04) |
| `supersedes_id` | FK → self | A revised return **supersedes**; the original is retained (`§4.2`, O6) |
| `idempotency_key` | text | A filing submitted twice is a real-world problem (O17) |

### 3.3 `StatutoryPayment` — **new entity (data-model gap)**

AC-03's *Record a payment / challan* action requires challan number, date, amount and mode. **No entity in
`§6.10` can hold it**, so "payable vs paid" is currently uncomputable. Proposed:

| Field | Type | Notes |
|---|---|---|
| `legal_entity_id`, `kind`, `period`, `state_code` | | Matches the liability it discharges |
| `challan_ref`, `paid_on`, `amount` (Decimal), `mode` | | The payment itself |
| `variance_amount` (Decimal), `variance_reason` | | An amount ≠ liability is **allowed but flagged**, never silently reconciled (AC-03) |
| `recorded_by_user_id` | FK | Recording a payment that did not happen hides a default — see OQ-M11-07 on second eyes |

### 3.4 `InvestmentDeclaration` (§6.10) — extended

Adds `status` (`draft · submitted · under_review · verified · partially_verified · rejected · window_closed`),
`verified_amounts` (JSONB, per head), `verified_by_user_id`, `previous_employer_income` (Decimal, null — see
OQ-M11-08), and `regime_locked_at`. Proof files are encrypted refs, never inline (O11).

### 3.5 `EmployeeStatutoryProfile` — **new entity (data-model gap)**

A calculator cannot answer *"does the PF ceiling apply to this person?"* from the config alone. `§6.3
Employee` carries `pan`, `aadhaar(masked)`, `uan`, `esic_no` — identifiers, not electives. Proposed,
effective-dated (`§4.3`):

`pf_applicable` · `pf_ceiling_applied` (the elective) · `vpf_rate` · `is_international_worker` ·
`esi_applicable` · `pt_state_code` (override where the person works in a different state from their campus) ·
`lwf_state_code` · `tds_regime` (from the declaration) · `is_excluded_employee` with a reason.

PAN, UAN, ESIC and Aadhaar remain **field-permissioned and masked by default with an audited reveal** (O3);
none of them may appear in a log line (O11, `guard-pii-logging`).

### 3.6 `StatutoryLiability` (derived, materialised per period)

Per `legal_entity × kind × state × period`: `computed_amount`, `paid_amount`, `filed_amount`,
`provision_balance`, `variance`. Materialised rather than computed on the fly because AC-01 renders it on a
home screen and AC-03 drills from it into individual payslips.

---

## 4 · Behaviour walk-through — the calculators

Every calculator obeys four rules, and they are the same four rules each time:

1. **Every rate, ceiling, slab and threshold is read from the pinned config** via `resolve_config`
   ([[M11a-statutory-config-versioning]]). There is no default and no fallback (O9).
2. **Rounding is a config-declared rule**, applied at a declared point, and the residual is recorded in
   `rounding_delta` rather than discarded.
3. **Per-employee amounts are rounded; totals are the sum of rounded amounts.** A total rounded
   independently of its parts will disagree with a government portal that adds up the rows, and it is the
   commonest source of an unreconcilable filing.
4. **A missing input is a named refusal, never a zero.** A zero deduction that should have been a deduction
   is a default the school pays for, and it looks identical to a correct zero on every screen.

### 4.1 Provident fund (PF / EPS / EDLI)

**Inputs:** PF wages for the month (the component-inclusion list is a config field, not a code constant),
paid-days proration from [[M10-payroll-core]], `EmployeeStatutoryProfile` electives, `uan`, joining/leaving
dates in the month.

**Computation:** employee share at the config rate on PF wages, capped at the config ceiling **if** the
employee's ceiling election says so; employer share split into EPS (config share, capped at the EPS wage
ceiling) and EPF (the remainder); EDLI and administrative charges at their config rates with the config
minimum. VPF is an additional employee-side amount at the employee's declared rate. **Rounding:** per the
`pf.rounding` rule — conventionally to the nearest rupee per head, with the EPS/EPF split derived so that the
two parts sum to the rounded employer total rather than each being rounded independently (which is how a
one-rupee ECR mismatch is born).

**Edge cases:** a mid-month joiner or leaver (PF wages prorate, the ceiling does **not**); an employee above
the ceiling whose elective is "on full wages"; an international worker (no ceiling applies); an *excluded
employee* (a member who has withdrawn and is above the ceiling on joining); a month with zero PF wages but a
live membership (a nil row is still reported in the ECR — an *absent* row and a *nil* row mean different
things to EPFO); arrears months, which contribute PF in the month of payment but are reported against their
own wage month.

### 4.2 Employees' State Insurance (ESI)

**Inputs:** ESI gross (its own component list), the config ceiling, the config's **contribution-period**
definitions.

**The rule that catches everyone:** ESI is assessed per contribution period (conventionally April–September
and October–March), not per month. An employee whose wages cross the ceiling **mid-period continues to
contribute until the period ends**, and only then leaves coverage. A system that re-tests the ceiling monthly
will drop someone in month four and be wrong for the rest of the period. The period boundaries and the
continuation flag are config fields, so a change in the rule is a new version, not a code change.

**Rounding:** employee and employer shares are rounded **independently** and conventionally **upward** to the
next rupee — a genuinely different mode from PF, which is exactly why `rounding` is per namespace.

**Edge cases:** a disability wage ceiling that differs from the standard one; an employee joining
mid-period above the ceiling (never covered) versus one whose wages rise mid-period (covered to period end);
a campus in a district that is not an implemented ESI area — a **named non-applicability**, not a zero.

### 4.3 Professional tax (PT)

**Inputs:** `Campus.state` (or the employee's `pt_state_code` override), the state's slab table, the state's
periodicity, gross for the slab test.

**Computation:** locate the slab whose band contains the assessable amount and take the slab's fixed amount —
PT is a lookup, not a percentage, so **there is no rounding at all**. Some states levy a different amount in
one month of the year; that is a slab-table field, not a special case in code.

**The state that does not levy PT is not an error.** Delhi, Uttar Pradesh, Haryana and Rajasthan do not levy
it. The config must distinguish *"this state does not levy PT"* (a valid, explicit entry) from *"this state
is missing from the config"* (a blocking gap). Collapsing the two produces either a false zero or a false
alarm, and both erode trust in the compliance calendar.

**PTEC vs PTRC:** the employer's own enrolment certificate liability (PTEC) is distinct from the registration
certificate under which employee deductions are remitted (PTRC). Both are per legal entity per state.

### 4.4 TDS on salary (§192)

The most complex calculator, and the only one that is **forward-looking**.

**Method:** project the employee's annual taxable income from actuals-to-date plus expected remaining months;
apply the elected regime's slabs, standard deduction, allowed exemptions and deductions (each with its config
cap), surcharge bands, cess and rebate; subtract tax already deducted this financial year; divide the
remainder across the remaining months. Every month therefore **trues up** — a mid-year salary revision,
bonus, arrears or verified proof changes the projection and the remaining months absorb it.

**Inputs:** regime election (config's default regime applies when the employee never elects — see
OQ-M11-09), the `InvestmentDeclaration` and its **verified** amounts (declared amounts drive the projection
during the window; verified amounts replace them after review), perquisites including the loan-interest
perquisite from [[M10a-loans-advances]], previous-employer income if in scope (OQ-M11-08), and
`Section 89` relief on arrears (**not** in scope — see OQ-M11-10).

**Rounding:** to the nearest rupee per the config rule, at the monthly-deduction step, with the annual
projection carried unrounded so that twelve roundings do not accumulate into a March surprise.

**Edge cases:** a joiner mid-year with no previous-employer declaration; a leaver, whose final month must
true up against actual rather than projected income ([[M12-full-and-final]] step 10); an employee whose
verified proofs come in below their declaration, which **increases** the remaining months' deduction and must
be explained to them rather than appearing as an unexplained pay drop (AC-07, O6); negative tax (excess
deducted) which is **not refundable through payroll** after the FY closes and must be stated as such.

### 4.5 Gratuity (the formula; the payout is [[M12-full-and-final]])

**Inputs:** continuous service from `ServiceRecord` ([[M3-core-hr-people]], HR-06), last-drawn basic + DA,
the config's formula expression, day divisor, qualifying-service rule and exemption ceiling.

**Continuous-service tracking is the hard part and it is a data problem, not an arithmetic one.** The service
book is an immutable event timeline; continuous service is derived from it, and a **break** in that timeline
changes the answer. The calculator must therefore refuse rather than guess: a service record with an
unexplained gap **blocks** the computation and names the gap (the built PY-17 design does exactly this).
The near-miss rule — where service short of the qualifying period still qualifies if the final year exceeds a
threshold of days — is a config field, because tribunals and states have not treated it uniformly.

Teachers **are** covered (2009 amendment, upheld 2022). This is worth stating in the spec because the
opposite belief is widespread in school administration and a product that quietly excludes teaching staff
would be confidently wrong.

**Provisioning:** the liability accrues monthly for every employee past the qualifying period, whether or not
anyone is leaving, and appears in AC-03's provision balance.

### 4.6 Labour welfare fund (LWF)

**Inputs:** state, the state's employee and employer amounts, the state's periodicity (monthly, half-yearly
or annual) and due month(s).

Flat amounts, no rounding, deducted **only in the due month** of the contribution period — an LWF deducted
every month in a half-yearly state is a real and common defect. Employees on the rolls at the period end are
liable; the config's rule for a mid-period leaver is a field, not an assumption. Many states do not operate
an LWF; that is again an explicit *not levied*, not a gap.

### 4.7 Minimum wages — a validation, never a deduction

Compares gross and the wage components against the state notification's floor for the employee's skill
category and zone, plus VDA. **This calculator changes no money.** It raises a finding on the run, and it
matters most for the support staff a school employs directly — the very group most likely to be under a
notification nobody checked. The finding is a variance on the run ([[M10-payroll-core]] PY-09), and the
notification values are config, per state × category × zone.

### 4.8 States, error paths, concurrency, i18n, a11y

| State (per period, per entity) | Meaning |
|---|---|
| computing · computed | Contributions exist for the period |
| variance present | Payable ≠ paid, or paid ≠ filed — **led on AC-03**, never averaged away |
| unpaid liability · paid but unfiled · filed | The three-stage truth AC-03 exists to show |
| prior-period adjustment present | Arrears rows in the period ([[M10c-arrears-pay-revision]]) |
| config version changed mid-period | Shown explicitly; the run's pin governs |
| validation errors (blocking) | AC-05 refuses to generate; **no "generate anyway" path exists** |
| FVU-failed | The government validator's own error list, mapped back to source records |
| rejected by the portal | The due-date clock resumes |
| superseded | A revised return replaced it; the original is retained |

**Error paths.** Filing generation is refused unless the period's payroll run is `approved` or `disbursed` —
filing a draft run would be a false return (AC-04). Validation failures are listed **per employee, per
field**, each linking to the record that fixes them (HR-04); the accountant is never asked to hunt. An
employee excluded from a return carries a required reason and is **carried into the next period's exception
list**, so an exclusion cannot become permanent by inattention.

**Concurrency and idempotency.** Filing generation and `mark-filed` require idempotency keys (§7, O17): a
retried submission replays its result and the UI says the retry was recognised, rather than producing a
second return to the same portal for the same period. Generation runs as a Celery task with the tenant in
context; two concurrent generations for one filing are serialised by a row lock, and the loser is told which
one won.

**i18n.** All UI copy is Hindi + English (`guard-i18n-strings`). **Statutory artefacts and instrument names
stay in their statutory form** — a Form 24Q is a Form 24Q in a Hindi UI, and a generated return is English
regardless of interface language, because a portal and an auditor accept nothing else. This is recorded as
a resolved position here and remains an open UI question at `ui-compliance-requirements.md` Q6.

**Accessibility.** AC-03 and AC-08 are dense by necessity (`screen-inventory.md` C10 — density is a function
of role). The obligations that follow: real `<table>` semantics with `scope`d headers and a caption naming
period and entity; variance conveyed by text and sign, not colour alone; numeric columns right-aligned with
tabular figures and a screen-reader-friendly unit; every drill-down a real link; validation errors associated
with their row via `aria-describedby` rather than only rendered nearby (WCAG AA, `§9`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M11-AC-01 | PF, EPS, EDLI, admin charges, ESI, PT, TDS, gratuity, LWF and minimum-wage calculators each read **every** rate, ceiling, slab, threshold and formula from the **pinned** `StatutoryConfig`; a repo sweep finds no statutory literal in any calculator, fixture, template or test assertion. | M11 §Business rules, §4.4, **O9**, `guard-statutory-hardcode` |
| M11-AC-02 | Each calculator declares its **rounding mode, precision and application point as config**, not code; per-employee amounts are rounded and the period total is the **sum of the rounded amounts**; the residual is recorded in `rounding_delta` and is explainable on AC-03. | M11 §Business rules, §11, `guard-hardcoded-values` |
| M11-AC-03 | ESI applies the **contribution-period** rule: an employee crossing the wage ceiling mid-period continues contributing to the end of that period; a test drives an employee across the ceiling in month 2 of a period and asserts contributions continue through the period's final month. | blueprint §5 ESI, M11 §Business rules |
| M11-AC-04 | PT is computed per **state** from the state's slab table and periodicity; a state configured as *not levying PT* produces an explicit non-applicability, and a state **absent** from the config produces a **blocking named gap** — the two are never conflated. | blueprint §5 PT, M11 §Business rules |
| M11-AC-05 | TDS §192 computes under **both regimes** using the average-rate method with monthly true-up; a verified proof below the declared amount increases the remaining months' deduction and the change is explained to the employee, not silently applied. | M11 §Business rules, AC-07, **O6** |
| M11-AC-06 | Gratuity is computed from **continuous service in `ServiceRecord`** and the config's formula/divisor/qualifying rule; a service record with an unexplained break **blocks** the computation naming the gap rather than producing a number. Teaching staff are covered. | M12 §Business rules, blueprint §5, HR-06, PY-17 |
| M11-AC-07 | LWF is deducted **only in the due month(s)** of the state's contribution period; a half-yearly state deducting monthly fails the test. | blueprint §5 LWF |
| M11-AC-08 | Minimum-wage checking raises a **finding on the run and changes no money**; a below-notification component produces a named variance on PY-09. | blueprint §5, PART C item 5 |
| M11-AC-09 | A missing statutory input (absent UAN, unimplemented ESI area, missing state slab table, incomplete service record) produces a **named refusal or non-applicability**, never a silent zero. | M11 §Business rules, AC-05 |
| M11-AC-10 | ECR, PF challan, ESI challan/return, PT challan/return, **Form 24Q**, **Form 16 Part B** and **Form 12BA** are generated from the approved run's register, and **every artefact carries the `StatutoryConfig` version it used**. | M11 §Business rules, AC-05, **O9**, NA-23 AC7 |
| M11-AC-11 | **Form 16 Part A is obtained from TRACES**, not generated by Naveya; Part B is generated by the employer. The UI states this and does not present a Naveya-generated Part A as authoritative. | blueprint §5 (*"Form 16 Part A (TRACES) + Part B"*), OQ-M11-02 |
| M11-AC-12 | Form 24Q passes **FVU validation**; a failure surfaces the validator's own message list mapped back to source records, and no artefact is downloadable for submission until it passes. | M11 §Acceptance, AC-05 |
| M11-AC-13 | Filing generation is **disabled with a stated reason** unless the period's payroll run is `approved` or `disbursed`. | AC-04, A49 |
| M11-AC-14 | Every filing is finalised only through **maker-checker by a distinct person** holding `statutory.file`; the maker cannot mark their own filing filed, and the refusal is enforced **server-side** with the rule stated. | §8, M11 §Permissions, **O5**, A50 |
| M11-AC-15 | `mark-filed` requires an **acknowledgement/receipt reference**; an unacknowledged filing cannot reach `filed` status. | AC-04 |
| M11-AC-16 | A revised return **supersedes** the original; the original is retained and visibly marked superseded. **No statutory record is ever deleted or edited in place.** | §4.2, **O6**, A54, NA-23 AC7 |
| M11-AC-17 | Filing generation and `mark-filed` are **idempotent** on a required idempotency key; a replayed submission returns the original result and the UI says so, rather than producing a second return for the same period. | §7, **O17** |
| M11-AC-18 | AC-03 reconciles **payable vs paid vs filed** per head, per state, per period; an amount ≠ liability is recorded **and flagged as a variance**, never silently reconciled; unrecorded payments show the whole liability as the variance and say so plainly. | M11 §Business rules, AC-03 |
| M11-AC-19 | AC-08's contributions register totals **reconcile exactly** to AC-03 and to the filing artefact; a mismatch is a **blocking** state for the filing. AC-08 exposes **no mutating action** — contributions are derived, never typed. | AC-08, AC-03 |
| M11-AC-20 | A statutory liability provision balance is maintained per head per period, including accrued gratuity for staff past the qualifying period. | blueprint §5, M11 §Business rules |
| M11-AC-21 | An investment declaration is submitted only within the window; proofs are verified **down to a verified amount, never rewritten upward**; verification and rejection are audited and visible to the employee with the TDS consequence stated. | §6.10, AC-07, A52, A53 |
| M11-AC-22 | Where no regime is elected, the **config's default regime** applies and the employee is told; unverified heads are disallowed at window close and TDS trues up in the remaining months. | AC-07, blueprint §5 |
| M11-AC-23 | Form 16, Form 12BA and every filing artefact are **password-protected or access-controlled**, the password derivation is stated at the download point but never the password itself, and **every download is audited** with actor, subject and timestamp. | §8, **O10** |
| M11-AC-24 | PAN, UAN, ESIC number, Aadhaar and bank details are **masked by default with an audited reveal** behind a distinct field-level permission, and appear in **no** log line, error message or exported filename. | §8, **O3**, **O11**, `guard-pii-logging` |
| M11-AC-25 | Every statutory table carries `tenant_id` with RLS `ENABLE`+`FORCE`+policy **in the same migration**; a cross-tenant read of contributions, filings or declarations returns zero rows. | §3, `guard-rls-policy` |
| M11-AC-26 | Arrears-originated contributions carry their **own** config pin and are shown as prior-period adjustment rows on AC-08, distinct from current-period rows. | M10 §Arrears, **O9**, AC-08 states |
| M11-AC-27 | Statutory calculator tests assert against **named versioned config fixtures**; no test contains a re-typed rate, ceiling or slab literal, and a fixture-drift test proves an assertion fails when the fixture changes. | §11, `CLAUDE.md` Testing standards |
| M11-AC-28 | Golden-file registers are committed per config version; any change to a calculator's output fails the gate until the golden is intentionally and reviewably updated. | §11 Regression guard |
| M11-AC-29 | AC-01's compliance calendar leads with **items awaiting my approval**, then due dates with days remaining; an item the current user **made** is shown blocked with *"you created this — another approver is required"* rather than being hidden. | AC-01, **O5** |
| M11-AC-30 | Statutory UI copy is Hindi + English; generated statutory artefacts and instrument names remain in their statutory form regardless of interface language. | `guard-i18n-strings`, **O12** |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Each calculator against **named config fixtures**: PF at, below and above the ceiling; ceiling-elective on and off; VPF; international worker; nil-wage member; EPS/EPF split summing to the rounded employer total. ESI at the ceiling boundary and **across a contribution-period boundary in both directions**. PT in a levying state, a non-levying state, a state with a special month, and a state missing from the config. TDS: both regimes, projection with and without verified proofs, mid-year revision, proof verified below declaration, joiner with no previous-employer income, leaver true-up. Gratuity: qualifying period boundary, the near-miss rule, a broken service record (must raise). LWF in monthly/half-yearly/annual states. Minimum-wage pass and fail. **Rounding mode per head, and the total-equals-sum-of-parts invariant** |
| Unit | **riddler** | The calculators themselves are riddler's build; deathstroke owns the assertion suite. Riddler additionally owns the **golden-file registers per config version** |
| Integration | **bane** | Filing generation refused on an unapproved run. Maker-cannot-check refused **server-side**. Idempotent generation and `mark-filed` replay. Revised return supersedes without mutating the original. AC-08 ↔ AC-03 ↔ artefact totals reconcile on a multi-campus, multi-state, multi-pay-group fixture. Cross-tenant RLS isolation on contributions, filings, declarations and payments. Arrears rows pinned to their own config version. Download audit rows written for every artefact |
| E2E | **bane** | The statutory slice of the spec's happy path: approved run → contributions → liability → generate ECR/24Q → FVU → mark filed with acknowledgement → reconciliation balanced. Plus the unhappy path: validation errors block, an employee is excluded with a reason, and the exclusion appears in next period's exception list |
| Compliance review | **gordon** | No statutory literal anywhere. No PII in logs, error messages, filenames or audit diffs (`guard-pii-logging`, O3, O11). Maker-checker genuinely distinct on every filing. Append-only holds for contributions, filings and payments. Artefact protection and download auditing per O10. DPDP retention: what survives exit (O2) so a leaver can still obtain Form 16 |
| Contract | **cyborg** + CI | Statutory types in the committed SDL/OpenAPI; TS + Dart clients compile |

---

## 7 · Proposed stories

Sprints 8–9. Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M11-S01 | `StatutoryContribution` extensions (`eps`/`edli` kinds, `state_code`, config pin, arrear ref, `rounding_delta`) | The contribution row that ECR and AC-08 can actually be built from. | oracle | 3 | M11a-S01 |
| M11-S02 | `StatutoryFiling` extensions + `StatutoryPayment` + `EmployeeStatutoryProfile` (new) | Closes three data-model gaps that make reconciliation and per-employee electives computable. | oracle | 5 | M11a-S01 |
| M11-S03 | **PF / EPS / EDLI calculator** | Config-driven, ceiling-elective aware, with the split-rounding invariant. | riddler | 5 | M11a-S04, M11-S01 |
| M11-S04 | **ESI calculator with the contribution-period rule** | The rule most systems get wrong, isolated so it can be proven. | riddler | 5 | M11a-S04 |
| M11-S05 | **PT calculator, multi-state, with explicit non-levying states** | State-aware lookup that distinguishes "not levied" from "not configured". | riddler | 3 | M11a-S04 |
| M11-S06 | **TDS §192 engine — projection, both regimes, monthly true-up** | The largest calculator; forward-looking and re-entrant. | riddler | 13 | M11a-S04, M11-S12 |
| M11-S07 | **Gratuity calculator + continuous-service derivation from `ServiceRecord`** | Refuses on a broken record rather than guessing; the F&F and provisioning input. | riddler | 5 | M3 service book |
| M11-S08 | **LWF + minimum-wage validation** | Due-month-only deduction; a wage-floor finding that changes no money. | riddler | 3 | M11a-S04 |
| M11-S09 | Contributions persistence + **AC-08 contributions register** (read-only, reconciling) | The derived register with no edit control, by design. | cyborg + green-lantern | 5 | M11-S03..S08 |
| M11-S10 | **Liability & reconciliation engine + AC-03** | Payable vs paid vs filed, with variances named and never averaged. | riddler + green-lantern | 8 | M11-S02, M11-S09 |
| M11-S11 | **AC-01 compliance calendar** | Approvals first, then due dates; a maker's own item shown blocked with the rule. | green-lantern | 5 | M11-S10, AC-02 |
| M11-S12 | **Investment declarations + AC-07 review + EMP-09** | Window, regime, proofs, verification, TDS consequence made visible. | cyborg + green-lantern + nightwing | 8 | M11-S02 |
| M11-S13 | **ECR generation + PF challan** | The monthly artefact, config-stamped, reconciling to the register. | riddler + martian | 8 | M11-S03, M11-S09 |
| M11-S14 | **Form 24Q generation + FVU validation** | Quarterly return with Annexures and the government validator in the loop. | riddler + martian | 13 | M11-S06, M11-S09 |
| M11-S15 | **Form 16 Part B + Form 12BA generation; Part A ingested from TRACES** | The employee-facing artefacts, honest about which part we do not author. | riddler | 8 | M11-S14 |
| M11-S16 | **ESI + PT challans/returns, state-wise** | The per-state filings a multi-campus group actually files. | riddler | 5 | M11-S04, M11-S05 |
| M11-S17 | **AC-04 filings register + AC-05 generation & validation** (needs design first) | Validation before generation; no "generate anyway" path. | green-lantern | 8 | M11-S13, M11-S14 |
| M11-S18 | **Filing maker-checker wiring into AC-02** | Filings join the one checker queue; the maker is refused server-side. | cyborg + wonder-woman | 5 | AC-02, M11-S17 |
| M11-S19 | **EMP-08 my tax documents** (protected download, audited) | Form 16/12BA to the person they belong to, with the password rule stated. | nightwing + green-lantern | 5 | M11-S15 |
| M11-S20 | Golden-file statutory registers per config version | Makes a rate change an intentional, reviewed diff. | riddler + bane | 5 | M11-S03..S08 |
| M11-S21 | Statutory calculator unit suite against named fixtures | The highest test-density area in the product. | deathstroke | 8 | M11-S03..S08 |
| M11-S22 | Statutory integration + reconciliation E2E | Proves the totals agree across register, liability and artefact. | bane | 8 | M11-S17 |
| M11-S23 | **AC-04..AC-08 design** (not built in `design/v3/`) | Five specified-but-undesigned screens; a dependency, not an afterthought. | two-face + green-lantern | 8 | — |

**Total: 23 stories, 148 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| **OQ-M11-01** | **`StatutoryFiling` has no config pin.** `§6.10` defines it as `legal_entity_id, kind, period, artifact_ref, status` — no `statutory_config_id`, though NA-23 AC7 and O9 both require one. | A filed return whose rule set cannot be identified cannot be defended in an assessment, and a revised return cannot be computed on the same basis as the original. | Add `statutory_config_id` NOT NULL once generated, plus `format_version` and `artifact_digest`. Specified in §3.2; needs oracle's migration and BATMAN's nod. |
| **OQ-M11-02** | **Arrears contributions pin the wrong version through the payslip chain.** `StatutoryContribution` derives its config via `payslip → run → config`, but an arrears row was computed on its **affected month's** version. | AC-08 would display, and a filing would report, the wrong basis for exactly the rows most likely to be scrutinised. | Give `StatutoryContribution` its own nullable `statutory_config_id` + `arrear_adjustment_id`, populated for arrears rows. Coordinated with [[M10c-arrears-pay-revision]]. |
| **OQ-M11-03** | **Are Form 16 / 12BA digitally signed in MVP?** `functionality-blueprint.md` §5 tags *"★ Digitally signed Form 16 & Form 12BA"* **[P2]**, while **PART C item 5** — the authoritative in/out list — says *"Form 16 (Part A & B) + Form 12BA, digitally signed"* as MVP, dev-spec M11 says *"Form 12BA (signed)"*, `competitor-analysis.md` puts signed Form 16/12BA in the greytHR parity bar, and the ShriConnect deck (slide 13) promises *"digitally signed"* to school leadership. | Digital signing means DSC procurement, token/HSM handling, key custody and a signing service — days of work and a security surface, not a checkbox. Three documents say MVP and one says P2. | **PART C wins per my brief; treat signing as MVP** and file it as its own story with wonder-woman on key custody. But the blueprint §5 tag must be corrected, and this is a scope-tag change — BATMAN's and the user's call, not mine. |
| **OQ-M11-04** | **Maternity benefit is promised but unowned.** `functionality-blueprint.md` §5 tags *"Maternity Benefit — 26 weeks (12 from 3rd child), 80-day eligibility, crèche obligation flag at 50+ staff"* **[MVP]**, PART C item 5 lists *"Maternity"* in the MVP statutory set, and the pitch deck (slide 13) names it. **Dev-spec M11 does not mention it at all, and M8 does not mention it beyond a leave type.** | It is a statutory entitlement with eligibility arithmetic (80 days in the 12 months preceding), a duration rule that changes with birth order, a full-wage payment obligation, an ESI interaction (an ESI-covered employee draws maternity benefit from ESIC, not from the employer) and a crèche obligation that triggers on headcount. Nobody owns any of it. | Split it: **[[M8-leave]]** owns the leave type, eligibility and duration; **M11** owns the ESI-interaction rule and the crèche-obligation flag on AC-01; **[[M10-payroll-core]]** owns full-wage payment. Needs a ruling on whether it is genuinely MVP, because it is currently in nobody's sprint. |
| **OQ-M11-05** | **`StatutoryContribution.kind` cannot express EPS and EDLI separately** (`pf/esi/pt/tds/lwf/bonus`), yet the ECR reports EPF, EPS and EDLI as distinct amounts and AC-03 lists *"PF (employee/employer/EPS/EDLI/admin)"* as separate heads. | The register cannot be built to the shape the screens and the ECR both require. | Extend the enum to `pf · eps · edli · esi · pt · tds · lwf · bonus`. Low-cost now, a data migration later. |
| **OQ-M11-06** | **Do we submit to portals, or only generate?** M11 says *"generate ECR, Form 24Q (FVU), Form 16, Form 12BA"*; `CLAUDE.md` lists EPFO/ESIC/TRACES among vendor adapters; AC-04's *Mark as filed* implies a **human** submits and returns with an acknowledgement. | The difference is an entire integration surface, credential custody for government portals, and a very different failure mode. | **MVP generates and validates; a person submits.** `Mark as filed` with a mandatory acknowledgement is the contract. Portal automation is [[M16-integrations]], post-MVP. Confirming rather than asking. |
| **OQ-M11-07** | **Does recording a statutory payment/challan need second eyes?** AC-03 marks it `[proposed]`; recording a payment that did not happen makes a default invisible on every screen that watches for one. | It is the one action on the statutory surface that can create a false "all clear". | Require the challan reference and receipt upload (which makes fabrication effortful), and put the action in the audit trail visibly — but **not** full maker-checker, which would stall a routine act. Needs a ruling. |
| **OQ-M11-08** | **Is previous-employer income in scope for TDS and Form 16?** Raised as Q25 in `screen-inventory.md` §11 and still open. | A mid-year joiner's TDS is materially wrong without it, and Form 16 Part B has a place for it. Omitting it means under-deduction the employee discovers at filing time. | Support declaration of previous-employer income (Form 12B shape) in MVP; it is a field and an addend, not a subsystem. Needs a ruling. |
| **OQ-M11-09** | **The fallback when an employee elects the old regime and never submits proofs** (Q24 in `screen-inventory.md`). | The employee's take-home changes materially in the last quarter, and they will experience it as an error. | Disallow unverified heads at window close, true up across remaining months, and **notify the employee with the consequence stated before the first affected run**, not after. |
| **OQ-M11-10** | **Section 89 / Form 10E relief on arrears is unspecified.** [[M10c-arrears-pay-revision]] pays retrospective salary; §89 relief is how the employee avoids being taxed at a higher slab for it. | A school paying a pay-commission arrear without §89 support over-deducts, and the employee must claim relief themselves. greytHR supports it. | Record as **not MVP**, state it in the arrears UI so nobody assumes it is handled, and file it for the phase that follows. Needs a ruling on parity expectations. |
| **OQ-M11-11** | **AC-04 through AC-08 are specified but not designed.** Only AC-01/02/03 exist in `design/v3/pages/accountant.jsx`; the filings register, generation/validation, bonus run, declaration review and contributions register have no built design. | Five MVP screens of the densest kind in the product, with no visual language agreed. Building them from the inventory alone will produce five different-looking screens. | Story M11-S23 makes the design an explicit dependency rather than a discovery. |
| **OQ-M11-12** | **The 2026-07-22 ShriConnect deck (slide 09, 13) still promises a "single-click run … then NEFT bank file and payslips"**, which amendment B (2026-08-11) corrected: compute is one action, **release never is**. `functionality-blueprint.md` PART C item 4 also still carries *"single-click run with variance detection"*. | This is a promise made to school leadership that the product will deliberately not keep. It is [[M10-payroll-core]]'s lane, but it bears directly on O5, which governs my filings and bonus gates. | The dev spec wins (amendment B). PART C item 4's wording should be corrected the way §4 already was, and the deck needs a corrected slide before it is shown again. Flagged, not applied — scope/collateral copy is not mine to change. |
| **OQ-M11-13** | **Blueprint §5 still tags gratuity, LWF and minimum wages as `[P2]`** while D3 and PART C make them MVP — the document contradicts itself. Already recorded as conflict C5 / Q30 in `screen-inventory.md` and still unruled. | Every week this stays open, someone may build to the wrong tag. Three of my calculators are on the wrong side of it. | The locks win; this spec treats all three as MVP. The blueprint tags need correcting — awaiting the same ruling as Q30. |
| **OQ-M11-14** | **Ex-employee access to Form 16** — M12 flips `User.is_active=false` at settlement, but Form 16 is issued in June for a person who left in March (conflict C8, `ui-compliance-requirements.md` Q2, O2). | A statutory artefact the ex-employee is legally entitled to, behind a door we closed. | A time-boxed, read-only post-exit mode limited to payslips and tax documents. Detailed in [[M12-full-and-final]] §8; repeated here because M11 is what generates the document. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
