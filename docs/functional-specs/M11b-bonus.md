# M11b — Statutory & Ex-gratia Bonus · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M11b Bonus (build-plan Sprint 9) · **Story:** NA-23 (Lane E) · **Author:** tn-alfred ·
> **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M11 §*Statutory / ex-gratia Bonus (ShriConnect scope,
> 2026-07-22)*, M11 §API, M11 §Permissions, M11 §Acceptance, §6.10, §8 ·
> `docs/functionality-blueprint.md` PART A §5 (*"Statutory Bonus — 8.33–20%, calc cap, eligibility ceiling;
> **★ note educational-institution exemption (§32)** — support ex-gratia/festival bonus even where statutory
> bonus doesn't apply **[MVP]**"*), PART C item 4 · `docs/decisions-to-finalize.md` 2026-07-22 scope change ·
> `docs/executive-summary.md` (*"bonus rates read from the versioned statutory config"*) ·
> `docs/screen-inventory.md` **AC-06 Bonus run**, AC-02, AC-08 ·
> `docs/ui-compliance-requirements.md` **O5, O6, O9, O17**, A51 · `CLAUDE.md` `guard-statutory-hardcode`,
> `guard-money-float`.
>
> Rates come from [[M11a-statutory-config-versioning]]; the run pays through [[M10-payroll-core]];
> contributions and registers roll up in [[M11-statutory-compliance]].

---

## 1 · Intent

Bonus is where generic payroll software misleads a school, and it does so confidently.

Every Indian payroll product implements the Payment of Bonus Act 1965: a minimum of 8.33% and a maximum of
20% of the year's wages, computed on a capped wage, for employees earning under an eligibility ceiling, paid
within eight months of the accounting year's close. Point a product like that at a school and it will
cheerfully compute a statutory bonus liability for every teacher and ayah on the rolls.

But §32 of that Act lists the establishments to which it *does not apply*, and among them are institutions —
including educational institutions — **established not for purposes of profit**. Most Indian private schools
are run by a registered society or a public charitable trust that exists precisely on that basis; it is the
same not-for-profit character that underpins their 12A registration. For those schools, statutory bonus is
not a reduced obligation or a deferred one. It does not arise.

What *does* happen, universally, is that schools pay a **festival or ex-gratia bonus** — around Diwali, at
the close of the session, as a thirteenth-month payment. It is discretionary, it is real money, it is fully
taxable salary, and it needs the same computation, approval, audit and payslip treatment as any statutory
payout. A product that only implements statutory bonus forces the school to pay it as an untracked "special
allowance" adjustment; a product that implements only ex-gratia leaves the for-profit self-financed school
non-compliant.

So M11b implements **both**, and — this is the part that matters — it **never infers which one applies**. The
software records a determination that a human made, with a basis and a date, and computes accordingly. A
system that guesses an exemption from a legal-entity type field is a system that has silently given legal
advice.

---

## 2 · Scope & surfaces

### In scope

| Area | Detail |
|---|---|
| **Applicability determination** | A recorded, dated, attributed determination per `LegalEntity`: statutory bonus applies, or the §32 exemption is claimed, with the basis stated |
| **Statutory bonus run** | Percentage within the config's band, calculation cap, eligibility wage ceiling, minimum-working-days eligibility, per-person eligibility explanation, establishment headcount threshold |
| **Ex-gratia / festival bonus run** | Discretionary basis (flat amount, percentage of a wage base, or a formula), configurable eligibility criteria, the same approval and audit discipline |
| **Maker-checker** | `statutory.file` maker + a **distinct** checker, via [[M11-statutory-compliance]]'s AC-02 queue (§8, O5) |
| **Payment** | Attachment to a `PayrollRun` so the amount flows through TDS, the payslip and the register ([[M10-payroll-core]]) |
| **Roll-up** | `StatutoryContribution(kind=bonus)` rows and the bonus register |
| **Append-only** | Finalised runs are never edited; a correction is a superseding run (`§4.2`, O6) |

### Explicitly out of scope

| Out | Where / why |
|---|---|
| Bonus Form C / Form D and the ex-gratia statutory register | blueprint §5 tags **[Later]**; AC-06's export is a CSV/PDF register, not the statutory form |
| Set-on / set-off of allocable surplus (§15) | Not mentioned in any authority doc; a full allocable-surplus computation needs the trust's accounts, which Naveya does not hold. **Not MVP** — see OQ-M11b-04 |
| Disqualification under §9 (fraud, riotous behaviour, theft) | An HR determination with due process behind it, not a payroll calculation. Supported as a **recorded per-employee exclusion with a reason**, not as an automated rule |
| The rates themselves | [[M11a-statutory-config-versioning]] |
| TDS on the bonus | [[M11-statutory-compliance]] §4.4 — bonus is taxable salary in the month of payment and enters the projection |
| Performance/incentive bonus tied to appraisal | [[M17-performance-appraisal]] produces **advisory** increment recommendations, never a payout |

### Surfaces

| Surface | Screen |
|---|---|
| Web — Accountant / Payroll (maker) | **AC-06 Bonus run** — specified in `docs/screen-inventory.md`, **not yet built** in `design/v3/` (see [[M11-statutory-compliance]] OQ-M11-11) |
| Web — checker | **AC-02** maker-checker gate — bonus runs appear in the one queue with their evidence |
| Web — Group Admin | **GA-07** — the bonus band, calc cap and eligibility ceiling live in the config, read-only everywhere else |
| Web — Payroll | Bonus attaches to a run and lands as payslip lines (PY-07, PY-10) |
| ESS | The payslip line, named as bonus or ex-gratia — never as an unexplained allowance ([[M13-ess-mobile]]) |
| API | `…/bonus-runs` (+ `/compute`, `/approve`, `/attach-to-run`), `…/bonus-applicability` |

---

## 3 · Data model

Tenant-owned; `tenant_id` + RLS policy in the same migration. All amounts `Decimal`.

### 3.1 `BonusRun` — **new entity (data-model gap)**

M11 §API names `…/bonus-runs` and M11 §Acceptance describes a bonus run that *"cannot be finalized by its
maker"*, but **`§6.10` contains no `BonusRun` entity** — only `StatutoryContribution(kind=bonus)`, which is
a per-payslip output row and cannot hold a run's type, config pin, approval state or population. Proposed:

| Field | Type | Notes |
|---|---|---|
| `legal_entity_id` | FK → LegalEntity | Bonus is an employer-of-record obligation |
| `type` | enum `statutory · ex_gratia` | **No default** — §32 means the school must decide (AC-06) |
| `accounting_year` | text | The bonus year, which is the financial year unless the trust's accounts say otherwise |
| `statutory_config_id` | FK, NOT NULL | The pinned version supplying band, calc cap and eligibility ceiling ([[M11a-statutory-config-versioning]] §3.3) |
| `percentage` | Decimal, null | Statutory: chosen **within the config's band**. Ex-gratia: null when the basis is a flat amount |
| `basis` | enum `percentage_of_wages · flat_amount · formula`, null | Ex-gratia only |
| `basis_value` | Decimal / expression | The flat amount or formula |
| `eligibility_criteria` | JSONB | Ex-gratia: min service days, active-on date, exclusion of staff serving notice, etc. |
| `applicability_id` | FK → BonusApplicability | Which determination authorised this run |
| `status` | enum `draft · computed · pending_checker · approved · attached · paid · superseded` | |
| `maker_user_id`, `checker_user_id` | FK → User | **Distinct**, enforced server-side (§8, O5) |
| `payroll_run_id` | FK, null | The run that pays it |
| `supersedes_id` | FK → self, null | A correction supersedes; the original stands (O6) |
| `idempotency_key` | text | Compute and approve are idempotent (O17) |
| `total_amount` | Decimal | The exact, grouped total the checker confirms |

### 3.2 `BonusRunLine` — **new**

| Field | Notes |
|---|---|
| `bonus_run_id`, `employee_id` | |
| `is_eligible` | bool |
| `ineligibility_reason` | enum + text — **eligibility must be explainable per person** (AC-06): above the wage ceiling · fewer than the minimum working days · not employed in the accounting year · §9 disqualification recorded · excluded by the ex-gratia criteria · incomplete wage history |
| `wage_base`, `capped_wage_base`, `amount` | Decimal |
| `working_days` | int — the eligibility arithmetic, shown not implied |
| `override_amount`, `override_reason`, `overridden_by` | An override sits **alongside** the computed value, never replacing it invisibly |

### 3.3 `BonusApplicability` — **new, and the education-specific part**

Effective-dated (`§4.3`), per `LegalEntity`, append-only:

| Field | Notes |
|---|---|
| `legal_entity_id` | |
| `determination` | enum `act_applies · exempt_s32` |
| `basis` | text, **required** — e.g. *"Society registered under the Societies Registration Act 1860; not established for purposes of profit; §32(v)(c)"* |
| `supporting_document_ref` | Optional encrypted ref — trust deed, registration certificate ([[M4-document-governance]]) |
| `effective_from` | date |
| `determined_by_user_id`, `determined_at` | The human who takes responsibility |
| `superseded_by_id` | A determination changes by supersession, never by edit |

**The software never sets `determination` itself.** It is offered as an explicit choice with the consequence
stated, it requires a basis, and it is attributed. This is the boundary between recording a legal position
and giving legal advice, and it is deliberate.

---

## 4 · Behaviour walk-through

### 4.1 Happy path A — a not-for-profit trust school (the common case)

The Group Admin records, once, that the trust's legal entity claims the §32 exemption, stating the basis and
attaching the registration certificate. Thereafter AC-06 shows *"statutory bonus does not apply to this
entity — §32 educational-institution exemption recorded on 12 Aug 2026 by A. Rao"* and the **statutory** run
type is disabled with that reason. The **ex-gratia** type remains fully available.

In October the Accountant creates an ex-gratia festival bonus run: basis *flat amount*, eligibility *employed
on 1 September and at least 90 days of service*. Compute lists every employee with their eligibility and, for
those excluded, the reason. The maker sends it for approval; a **distinct** checker opens the evidence on
AC-02, sees the headcount, the total in ₹ and the eligibility basis, and approves. The run is finalised,
append-only from that moment, and attached to the October payroll run, where it lands as a named payslip line
and enters the TDS projection like any other salary.

### 4.2 Happy path B — a self-financed company-run institution

The determination is `act_applies`. The statutory run type is enabled and the ex-gratia type remains
available alongside it (a school may pay both). Compute reads the percentage **band**, the calculation cap
and the eligibility wage ceiling from the pinned config, applies the chosen percentage within the band to
each eligible employee's capped wage base, and produces per-person amounts. Everything else — the checker,
the append-only finalisation, the attachment to a run — is identical.

### 4.3 States (AC-06)

`draft · computed · awaiting checker · finalized · paid via a run · superseded · §32 exemption applied
(statutory bonus not applicable → ex-gratia path)`.

### 4.4 Edge cases and error paths

| Case | Behaviour |
|---|---|
| **No applicability determination recorded** | Both run types are **disabled with the reason**, routing to the determination screen. The system does not default to "the Act applies" and does not default to "exempt" — either default would be a legal position taken by software |
| **No config version covers the accounting year** | **Blocked.** Never fall back to a default percentage (AC-06) |
| **Percentage outside the config's band** | Rejected, naming the band **as read from the named config version** — the band is not a code constant |
| **Establishment below the Act's headcount threshold** | Surfaced as a determination *input* with the current headcount shown; it never auto-exempts, because the threshold interacts with the Act's continuing-applicability rule once an establishment has been covered |
| **Employee with an incomplete wage history** | **Listed, not silently excluded** (AC-06). The maker resolves or records an exclusion with a reason |
| **Employee joined mid-year** | Eligible on the minimum-working-days test, with the days shown; the wage base covers only the months worked |
| **Employee who left during the accounting year** | Eligible if they meet the working-days test — a leaver's bonus is a real and commonly missed liability. Payment routes through [[M12-full-and-final]] if the settlement is still open, otherwise as an off-cycle payment |
| **§9 disqualification** | A per-employee exclusion with a recorded reason and an attributed actor. Never automated |
| **Maker attempts to approve their own run** | **Refused server-side** with the rule stated, not merely hidden (M11 §Acceptance, O5) |
| **Correction after finalisation** | A **superseding** run. The original stands, visibly superseded. No edit, no delete (O6) |
| **Target payroll run already approved** | Attachment blocked — bonus cannot be slipped into a run that has passed its own gate |
| **Compute retried after a timeout** | Idempotent on the key; the replay returns the original result and the UI says the retry was recognised (O17) |

### 4.5 Concurrency

Compute runs as a tenant-scoped Celery task under a row lock on the bonus run; a second compute is refused
while one is in flight. If the underlying inputs change after submission (a salary revision lands, an
employee is added), the pending item is marked **stale** on AC-02 and the checker cannot approve it until the
maker recomputes — the same staleness rule the built AC-02 design already implements for payroll runs.

### 4.6 i18n and accessibility

Copy is Hindi + English (`guard-i18n-strings`). The exemption explanation carries the heavier obligation: it
is a statement about the school's legal position and must read correctly in both languages (O12), while the
statutory reference itself (*Payment of Bonus Act 1965, §32*) stays in its statutory form. Eligibility
reasons are per-person text, not icons — a person told they are ineligible deserves a sentence. The
eligible/ineligible split is a filter over a real table, with the reason column readable by a screen reader
in row context; nothing conveys eligibility by colour alone (WCAG AA, `§9`).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M11b-AC-01 | A bonus run reads its **percentage band, calculation cap and eligibility wage ceiling from the pinned, effective-dated `StatutoryConfig`**; no percentage, cap or ceiling appears as a literal in code, fixtures, tests, mocks, tooltips or copy. | M11 §Bonus, **O9**, `guard-statutory-hardcode` |
| M11b-AC-02 | Changing a bonus rate in the config **produces a new version, not an edit**; a run pinned to the earlier version recomputes identically after the change. | M11 §Acceptance, [[M11a-statutory-config-versioning]] |
| M11b-AC-03 | No config version covering the accounting year → the run is **blocked**; the engine never falls back to a default rate. | AC-06, M11 §Bonus |
| M11b-AC-04 | `BonusApplicability` records, per `LegalEntity`, whether the Payment of Bonus Act applies or the **§32 educational-institution exemption** is claimed, with a **required basis**, an effective date and an attributed determiner. It is append-only; a change supersedes. | M11 §Bonus, blueprint §5, `§4.3`, **O6** |
| M11b-AC-05 | **The software never infers the §32 determination.** With no determination recorded, both run types are disabled with the reason; neither "the Act applies" nor "exempt" is a default. | M11 §Bonus, blueprint §5 ★ note |
| M11b-AC-06 | Where `exempt_s32` is recorded, the **statutory** run type is disabled with the exemption stated, and the **ex-gratia / festival** path remains fully available — this is the path a not-for-profit school actually uses. | M11 §Bonus (*"supports ex-gratia/festival bonus as a configurable payout"*), blueprint §5 |
| M11b-AC-07 | Ex-gratia runs support a flat amount, a percentage of a wage base, or a formula, with configurable eligibility criteria, and carry the **same** approval, audit and append-only discipline as a statutory run. | M11 §Bonus |
| M11b-AC-08 | Eligibility is **explainable per person**: every ineligible employee carries a named reason (wage ceiling · working days · service · §9 disqualification · ex-gratia criteria · incomplete wage history). | AC-06 must-contain |
| M11b-AC-09 | An employee with an incomplete wage history is **listed, never silently excluded**. | AC-06 |
| M11b-AC-10 | A bonus run is finalised only through **maker-checker by a distinct `statutory.file` holder**; the maker's approval is **refused server-side** with the rule explained, not merely hidden in the UI. | M11 §Acceptance, §8, **O5**, A51 |
| M11b-AC-11 | A finalised run is **append-only**: no edit, no delete: a correction is a **superseding** run and the original remains visible and marked superseded. | M11 §Bonus, `§4.2`, **O6** |
| M11b-AC-12 | All bonus amounts are **`Decimal`**; a float anywhere in the path fails CI. | M11 §Bonus, `guard-money-float` |
| M11b-AC-13 | An approved run produces `StatutoryContribution(kind=bonus)` rows carrying `base_amount` and the config pin, reconciling to AC-08 and to the bonus register. | §6.10, AC-08 |
| M11b-AC-14 | A finalised run attaches to a `PayrollRun` and lands as a **named** payslip line (bonus or ex-gratia, never an unexplained allowance); attachment to an already-approved run is blocked. | AC-06, [[M10-payroll-core]] |
| M11b-AC-15 | The bonus amount enters the **TDS projection** for the month of payment. | [[M11-statutory-compliance]] §4.4 |
| M11b-AC-16 | The run displays the **pinned config version and its effective-from**, and the band/cap/ceiling are shown as read-only values *from that named version*. | **O9**, AC-06 |
| M11b-AC-17 | `/compute` and `/approve` are **idempotent** on a required key; a replay returns the original result and the UI states that the retry was recognised. | §7, **O17** |
| M11b-AC-18 | Inputs changing after submission mark the pending item **stale** on AC-02; the checker cannot approve a stale item and the maker must recompute. | AC-02 states |
| M11b-AC-19 | A per-employee override records the **computed value alongside** the override with a required reason and an attributed actor; it never replaces the computed figure invisibly. | `DESIGN.md` principle 6, **O6** |
| M11b-AC-20 | `BonusRun`, `BonusRunLine` and `BonusApplicability` each carry `tenant_id` with RLS `ENABLE`+`FORCE`+policy **in the same migration**; a cross-tenant read returns zero rows. | §3, `guard-rls-policy` |
| M11b-AC-21 | Every determination, compute, submission, approval, rejection, override and supersession writes an `AuditLog` row, and the attribution is **visible on the run itself**, not only in the audit viewer. | `§4.2`, **O6** |
| M11b-AC-22 | Tests assert against **named config fixtures** for band, cap and ceiling; no bonus test contains a re-typed percentage or ceiling literal. | §11, `CLAUDE.md` Testing standards |
| M11b-AC-23 | Bonus-run copy is Hindi + English; the §32 exemption explanation reads correctly in both, while the statutory citation remains in its statutory form. | `guard-i18n-strings`, **O12** |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | Eligibility at the wage-ceiling boundary (at, below, above). Minimum-working-days boundary. Mid-year joiner and mid-year leaver wage bases. Capped-wage-base arithmetic at and above the calculation cap. Percentage at both ends of the config band and **rejection outside it**. Ex-gratia flat / percentage / formula bases. Every ineligibility reason produced correctly. Rounding per the config rule. **All against named config fixtures — no literal percentage or ceiling anywhere** |
| Integration | **bane** | Maker-cannot-approve refused **server-side**. Stale-input blocking on AC-02. Idempotent compute and approve replay. Superseding a finalised run leaves the original intact and visible. Attachment to an approved run blocked. Contribution rows reconcile to AC-08. Cross-tenant RLS isolation on all three new tables. `exempt_s32` genuinely disables the statutory path at the API, not only in the UI |
| Golden file | **riddler** + **bane** | A committed bonus register per config version; a band change is an intentional, reviewed golden diff |
| Compliance review | **gordon** | The §32 determination is never inferred by code. Append-only holds. Maker-checker distinct. No rate literal. Overrides recorded alongside computed values with a reason. The exemption copy does not read as legal advice from the software |
| Contract | **cyborg** + CI | Bonus types in the committed SDL/OpenAPI; TS + Dart clients compile |

---

## 7 · Proposed stories

Sprint 9. Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M11b-S01 | `BonusRun`, `BonusRunLine`, `BonusApplicability` models + migrations + RLS | Three entities the spec's API assumes and its data model omits. | oracle | 5 | M11a-S01 |
| M11b-S02 | **§32 applicability determination** — record, supersede, attribute, require a basis | The education-specific decision, made by a person and never by the software. | cyborg + green-lantern | 5 | M11b-S01 |
| M11b-S03 | **Statutory bonus calculator** (band, calc cap, eligibility ceiling, working days — all from config) | Payment-of-Bonus-Act computation with nothing hardcoded. | riddler | 8 | M11a-S04, M11b-S01 |
| M11b-S04 | **Ex-gratia / festival bonus calculator** (flat · percentage · formula, configurable eligibility) | The path a not-for-profit school actually uses. | riddler | 5 | M11b-S01 |
| M11b-S05 | Per-person eligibility explanation engine | Every exclusion carries a reason a human can read. | riddler | 3 | M11b-S03, M11b-S04 |
| M11b-S06 | Bonus-run lifecycle + **maker-checker into AC-02** with staleness | The gate, refused server-side, with evidence in the one queue. | cyborg + wonder-woman | 5 | AC-02, M11b-S03 |
| M11b-S07 | Attachment to a `PayrollRun`, payslip lines, TDS inclusion | The money actually reaching people, taxed correctly and named honestly. | cyborg + riddler | 5 | M10 run, M11-S06 |
| M11b-S08 | `StatutoryContribution(kind=bonus)` roll-up + bonus register export | Reconciles to AC-08 and to the liability position. | riddler | 3 | M11-S09 |
| M11b-S09 | **AC-06 bonus run screen** (needs design first — not built in `design/v3/`) | Type choice with no default, config version shown, eligibility explained per person. | two-face + green-lantern | 8 | M11b-S06, M11-S23 |
| M11b-S10 | Bonus unit suite against named fixtures + golden register | Boundaries proven; a rate change becomes a reviewed diff. | deathstroke + bane | 5 | M11b-S03, M11b-S04 |

**Total: 10 stories, 52 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| **OQ-M11b-01** | **`BonusRun` does not exist in the data model.** M11 §API exposes `…/bonus-runs` and M11 §Acceptance describes its approval, but `§6.10` has only `StatutoryContribution(kind=bonus)` — a per-payslip output that cannot hold a run's type, config pin, population, approval state or supersession chain. | AC-06 is unbuildable as specified, and the maker-checker requirement has nothing to attach to. | Add `BonusRun`, `BonusRunLine`, `BonusApplicability` per §3. Needs oracle's migration and BATMAN's sign-off on the entity-catalog addition. |
| **OQ-M11b-02** | **Who determines §32 applicability, and is the determination itself second-eyes?** No authority document names an actor. It is a legal characterisation of the employer with a direct money consequence. | Recorded wrongly in one direction the school under-pays a statutory entitlement; in the other it pays a liability that never arose. Either way the software will have computed exactly what it was told. | Group Admin with `statutory.manage`, basis required, supporting document attachable, append-only. **Recommend second eyes** on the determination — it is the same class of act as publishing a config version (`ui-compliance-requirements.md` Q11). Needs a ruling. |
| **OQ-M11b-03** | **Is the §32 determination legal advice we should be near at all?** Naveya presents the choice and stores it; a school may reasonably read the presence of an "exempt" option as endorsement. | This is the sharpest legal-exposure question in my lane. The blueprint asks us to *"note"* the exemption; noting it and offering it as a selectable state are different acts. | Present it as a **recorded determination with a required basis**, accompanied by copy that says plainly the school's own advisor decides this. Never pre-select, never infer, never validate the basis text. Needs a legal review of the copy before launch. |
| **OQ-M11b-04** | **Allocable surplus, set-on and set-off (§15) are unspecified.** A statutory bonus above the 8.33% minimum is, in law, driven by the allocable surplus computed from the establishment's accounts, which Naveya does not hold. | Naveya lets a user choose a percentage in the band; the Act says the percentage is *derived*. For a for-profit institution this is a real gap against greytHR-class parity. | Record as **not MVP**: the chosen percentage is an input the school's finance function supplies, and the UI should say so rather than implying the number was computed. Set-on/set-off is a later phase. Needs a parity ruling. |
| **OQ-M11b-05** | **Is the accounting year the financial year?** The Act works on an accounting year that a trust may define differently, and a school's operating rhythm is the **academic** year (Apr–Mar in most cases, so they usually coincide — but not always). | An 8-month payment deadline runs from the accounting year's close; getting the year wrong makes the compliance calendar wrong. | Default to the financial year, allow a per-legal-entity override on `BonusApplicability`, and drive AC-01's due date from it. Needs confirmation. |
| **OQ-M11b-06** | **A leaver's bonus when the F&F is already closed.** M11b makes a leaver eligible on the working-days test; [[M12-full-and-final]] settles and deactivates them, possibly months before the bonus run. | A real and commonly missed liability, and a person whose account is inactive still needs to be paid and to receive a payslip. | Support an **off-cycle payment to a settled leaver** with the payslip reachable through the post-exit limited-access mode proposed in [[M12-full-and-final]] §8. Depends on the same ruling as OQ-M12-05. |
| **OQ-M11b-07** | **Bonus Form C / Form D are tagged `[Later]`** in blueprint §5, but a school that *is* covered by the Act has a statutory register obligation. | AC-06's export is a CSV/PDF register, which is not the prescribed form. For an `act_applies` entity we would be compliant on payment and non-compliant on record-keeping. | Accept `[Later]` per the blueprint, but **state the gap in the UI** for `act_applies` entities so nobody believes the register discharges the obligation. Flagging, not changing the tag. |
| **OQ-M11b-08** | **AC-06 is specified but not designed** — no built screen in `design/v3/`, and the type choice with no default plus per-person eligibility reasons is a non-trivial layout. | Built without design, it will diverge from the accountant surface it sits beside. | Story M11b-S09 pairs with M11-S23; AC-06 should be designed in the same pass as AC-04/05/07/08. |

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
