# M11a — Versioned StatutoryConfig · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M11a StatutoryConfig versioning (build-plan Sprint 8 — **but see §8 OQ-M11a-01: it must land in
> Sprint 7**) · **Story:** NA-23 (Lane E) · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` §4.3, §4.4, §6.10, §10, §12 (critical-path risk #3),
> M10 §Business rules, M10 §Arrears, M11 §Business rules, M11 §Acceptance ·
> `docs/functionality-blueprint.md` PART A §5 (*"Configurable statutory rule-set with auto-updates &
> alerts — architected as a versioned config layer from day one **[MVP as architecture; auto-feed P2]**"*),
> PART C item 5 (*"versioned statutory-config layer"*) and its guiding principle *"keep all statutory bases,
> ceilings, slabs and effective dates configurable/versioned from day one … hard-coding fatal"* ·
> `docs/screen-inventory.md` GA-07, AC-05, AC-06, AC-08, PY-15, PY-17 ·
> `docs/ui-compliance-requirements.md` **O9** (the obligation this document exists to discharge), **O18**
> effective-dating as the interaction model, **O5** maker-checker, **O6** append-only with visible
> attribution, **O17** idempotency, A48 · `docs/executive-summary.md` (bonus rates read from the versioned
> statutory config) · `CLAUDE.md` `guard-statutory-hardcode`, `guard-hardcoded-values`, `guard-money-float`.
>
> **O9, quoted, because it is this module's contract:** *"print the pinned config version and its
> effective-from date on the payroll run, the payslip, the filing artefact and the bonus/arrears run … on an
> arrears run, show per affected month which version was used, because they differ; present a config change
> as a new version with a diff against the previous, never as an editable settings form … The UI must NOT
> hardcode any rate, ceiling, slab, percentage or threshold in a screen, a mock, a tooltip, or example copy
> … offer 'Edit config' (it is immutable — the verb is **Publish new version**); let a user pick a config
> version for a historical month."* Every clause of that paragraph appears below as an acceptance criterion.
>
> **This is the keystone document of the statutory lane.** [[M11-statutory-compliance]] computes against it,
> [[M11b-bonus]] reads its %/cap/ceiling from it, [[M10-payroll-core]] pins it on every run,
> [[M10c-arrears-pay-revision]] recomputes past months against *past* versions of it, and
> [[M12-full-and-final]] pins the version in force on the last working day. Read this before any of them.

---

## 1 · Intent

Every rupee of PF, ESI, professional tax, income tax, gratuity, bonus and labour-welfare-fund that Naveya
deducts or contributes comes from a number that Parliament, a state legislature or a notification can change
at any time, usually with effect from a date that has already passed by the time anyone notices. A payroll
system has exactly two ways to hold those numbers. It can hold them in code, where changing them is a
deployment and where the old value is gone the moment the new one lands. Or it can hold them in data, as an
immutable, effective-dated snapshot that a payroll run **pins** — so that the July payslip a teacher is
holding in her hand can still be reproduced, byte for byte, in December, after the ceiling has changed twice.

`StatutoryConfig` is the second thing. It is one versioned row per rule set, never edited, only superseded,
and it is stamped onto every run, every filing, every arrears month, every bonus run and every settlement
that consumed it.

The reason this document exists separately from [[M11-statutory-compliance]] — and the reason it is written
first — is that the dev spec names it **critical-path risk #3**: *"must be data-versioned from first use."*
The word that matters is **first**. A config that is introduced after payroll already works will not have
been pinned by the runs that came before it, which means those runs can never be reproduced, which means
arrears against those months can never be computed correctly, which means the one hard correctness promise
the product makes — *a prior month re-opened still computes on its original version* — is already broken
before anybody notices.

**Why a rate can never be edited in place.** Suppose an administrator opens the PF ceiling and types a new
number over the old one. Nothing visibly breaks. But that single edit has silently rewritten history for
every payslip that ever referenced that row: the July register no longer reproduces, the ECR already
acknowledged by EPFO no longer reconciles against the system that produced it, the arrears engine recomputing
a March salary revision now applies a ceiling that did not exist in March, the golden-file payroll regression
diffs against a past it can no longer recreate, and an auditor asking *"on what basis was this deduction
made?"* gets an answer that is true today and was false when the money moved. The edit leaves no trace of
what the number used to be, so nobody can even tell that it happened. Immutability is not a preference here;
it is the only structure in which the arrears rule, the re-opened-month rule and the golden-file regression
can all be simultaneously true.

---

## 2 · Scope & surfaces

### In scope

| Area | What M11a delivers |
|---|---|
| The entity | `StatutoryConfig` — immutable, versioned, effective-dated, tenant-owned, with a validated rule-set document |
| Rule-set schema | A versioned JSON schema naming every namespace (PF · EPS · EDLI · ESI · PT · TDS · gratuity · bonus · LWF · min-wage) and every field within it, including each head's **rounding rule** — the shape, never the values |
| Authoring | Clone-from-active → edit draft → validate → diff → **activate** (with a second pair of eyes) |
| Resolution | `resolve_config(tenant, on_date)` — the single sanctioned way any calculator obtains a rate, plus coverage-gap detection |
| Pinning | The `statutory_config_id` FK contract that runs, filings, arrears rows, bonus runs and settlements must carry, and the pin's visibility obligation (O9) |
| Provenance | "Which runs pinned this version" — the chain from any past payslip back to the rule set that produced it |
| Distribution | The platform rule catalogue that on-prem and SaaS tenants **adopt** as a new version (§10 "statutory-config updates ship as data") |
| Guard support | The fixture/factory surface that lets every downstream test assert against a **named version**, never a re-typed literal |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| The calculators that consume the rules (PF, ESI, PT, TDS, gratuity, LWF) | [[M11-statutory-compliance]] |
| Bonus computation and the §32 determination | [[M11b-bonus]] |
| Pinning *behaviour* inside a payroll run (when the pin is taken, variance vs last month) | [[M10-payroll-core]] |
| Per-month re-resolution for retrospective months | [[M10c-arrears-pay-revision]] |
| The settlement's pin on last-working-day | [[M12-full-and-final]] |
| The immutability/effective-dating **base pattern** (abstract model + supersession helper) | [[M0-foundations]] — M11a is its first heavy consumer, not its author |
| Audit-log storage and append-only enforcement | [[M0-foundations]]; the viewer is [[M15-reporting-platform]] |
| Which legal entity operates in which state (drives PT/LWF applicability) | [[M1-organization-tenancy]] (`Campus.state`) |
| Role/permission definition for `statutory.manage` | [[M2-identity-access]] |

### Surfaces

| Surface | Screen | Obligation |
|---|---|---|
| Web — Group Admin | **GA-07 Statutory configuration** (built: `design/v3/pages/ga-systems.jsx`) | Version list · rule set by namespace · field-by-field diff · activate with a second Group Admin · view pinning. **No edit-in-place control exists for an active or superseded version, for anybody** |
| Web — Payroll | PY-07, PY-09, PY-10, PY-15 | The pinned version and its effective-from printed on the run and per arrears month |
| Web — Accountant | AC-03, AC-05, AC-06, AC-08 | The version stamped on the filing artefact, the bonus run and the contributions register |
| Web — Payroll | PY-17 | The version pinned to the settlement, sourcing the gratuity formula |
| Mobile / ESS | Payslip footer ([[M13-ess-mobile]], EMP-07) | *"Computed on StatutoryConfig v2026.3 · effective 01 Jul 2026"* |
| API | GraphQL `statutoryConfigs`, `statutoryConfigPublish`, `statutoryConfigActivate`, `statutoryConfigDiff`; REST edge for catalogue import | `M11 §API …/statutory-configs` |

---

## 3 · Data model

All tables are tenant-owned: `tenant_id` NOT NULL FK **plus** `ENABLE`+`FORCE ROW LEVEL SECURITY` and a
`USING`+`WITH CHECK` policy emitted **in the same migration as the model** ([[M0-foundations]] §3.4,
`guard-rls-policy`). No exceptions in this module.

### 3.1 `StatutoryConfig` (§6.10)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK → Tenant, NOT NULL | RLS predicate column |
| `version` | text, NOT NULL | Human label, e.g. `2026.3`. Unique per tenant |
| `effective_from` | date, NOT NULL | **Must be the first day of a payroll month** (see OQ-M11a-02) |
| `status` | enum `draft · pending_activation · active · superseded` | Never `deleted` once pinned |
| `rules` | JSONB, NOT NULL | The rule set; validated against `schema_version` |
| `schema_version` | text, NOT NULL | The rule-set schema this document conforms to; lets the schema evolve without rewriting history |
| `source` | enum `platform_catalogue · tenant_authored` | Where the numbers came from (§10 distribution) |
| `catalogue_ref` | text, null | The platform catalogue release this was adopted from |
| `supersedes_id` | FK → self, null | The version this one replaces; forms the timeline |
| `published_by_user_id` | FK → User, NOT NULL | The maker |
| `published_at` | timestamptz | |
| `activated_by_user_id` | FK → User, null | The **distinct** second Group Admin (built design; see OQ-M11a-03) |
| `activated_at` | timestamptz, null | |
| `notes` | text | Why this version exists — the notification, circular or budget it implements |

**Constraints and invariants**

- `UNIQUE (tenant_id, version)` and `UNIQUE (tenant_id, effective_from)` — two rule sets cannot claim the
  same start date.
- A database trigger refuses `UPDATE` on `rules`, `effective_from`, `version` or `schema_version` once
  `status` has ever left `draft`. Immutability is enforced by the database, not by the application
  (`§4.3`, `§4.4`, and the same posture [[M0-foundations]] takes for `AuditLog`).
- `DELETE` is refused for any row referenced by a pin (see §3.3). A draft that was never activated and never
  pinned may be deleted.
- Every state change writes an `AuditLog` row (`§4.2`).

### 3.2 The rule-set document (`rules` JSONB)

The schema names namespaces and fields. **No value in this document is normative** — every number lives in
tenant data, and any literal appearing in code, a fixture assertion, a design mock or a tooltip is a
`guard-statutory-hardcode` violation (O9).

| Namespace | Fields (shape only) |
|---|---|
| `pf` | employee rate, employer rate, wage ceiling, whether the ceiling is optional per employee, wage-component inclusion list, `rounding` |
| `eps` | share of the employer rate, wage ceiling, `rounding` |
| `edli` | rate, ceiling, admin-charge rate, minimum admin charge, `rounding` |
| `esi` | employee rate, employer rate, wage ceiling, **contribution-period definitions** (start/end months), the mid-period continuation rule flag, `rounding` |
| `pt` | per state code → slab table (from, to, amount), periodicity (`monthly · half_yearly · annual`), special-month rule, exemption list, `rounding` |
| `tds` | per regime (`old · new`) → slab table, standard deduction, surcharge bands, cess rate, rebate thresholds, default regime, allowed exemption/deduction heads with their caps, `rounding` |
| `gratuity` | formula expression, day divisor, qualifying-service rule, the near-miss rule, exemption ceiling, `rounding` |
| `leave_encashment` | day divisor, wage-component basis, the §10(10AA) exemption limbs and the notified ceiling, `rounding` |
| `bonus` | minimum and maximum percentage (the band), eligibility wage ceiling, calculation ceiling, minimum working days, establishment headcount threshold, `rounding` |
| `lwf` | per state code → employee amount, employer amount, periodicity, due month(s), `rounding` |
| `min_wage` | per state × skill category → monthly floor, `rounding` |

Each `rounding` object carries `{mode: half_up · half_even · ceil · floor · none, precision, applied_at}`.
**Rounding is a rule, not an implementation detail** — a head rounded up rather than to nearest changes the
figure a government portal expects, and putting the mode in the config is what lets a state that rounds
differently be supported without a code change ([[M11-statutory-compliance]] §4 carries the per-head detail).

### 3.3 The pinning contract (binding on other modules)

Every artefact whose numbers were produced by a rule set **must carry the FK that produced them**. This table
is the checklist other lanes are held to:

| Table | Pin column | Owner | Status today |
|---|---|---|---|
| `PayrollRun` | `statutory_config_id` | [[M10-payroll-core]] | **Present** in `§6.9` |
| `ArrearAdjustment` | `statutory_config_id` | [[M10c-arrears-pay-revision]] | **Present** in `§6.9` — and it holds the *affected month's original* version, not the current one |
| `BonusRun` | `statutory_config_id` | [[M11b-bonus]] | **Missing** — `BonusRun` is not in `§6.10` at all (OQ-M11b-01) |
| `StatutoryFiling` | `statutory_config_id` | [[M11-statutory-compliance]] | **Missing** from `§6.10` — required by NA-23 AC7 (OQ-M11-01) |
| `FinalSettlement` | `statutory_config_id` | [[M12-full-and-final]] | **Missing** from `§6.11` — PY-17 renders it (OQ-M12-01) |
| `StatutoryContribution` | derives via `payslip → run → config` | [[M11-statutory-compliance]] | Chain works for regular runs; **breaks for arrears-originated rows**, which belong to a different version (OQ-M11-02) |

A pin is set **once**, at computation, and is immutable thereafter. Re-computing a draft re-resolves and may
change the pin; re-computing anything approved is not a thing that exists — the answer is a superseding
adjustment ([[M10c-arrears-pay-revision]]).

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a ceiling changes

The EPF wage ceiling is revised with effect from 1 October. The Group Admin opens **GA-07**, chooses *Create
a new version*, and clones the active version (cloning is on by default — nobody should retype a TDS slab
table). She sets `effective_from = 1 October`, edits the single field in the `pf` namespace, adds a note
naming the notification, and saves. The version is `draft`.

She opens *Compare with previous*. The diff shows one row: `pf.wage_ceiling`, before and after. This is the
artefact a reviewer actually needs, and it is the reason the diff is a first-class feature rather than a
convenience — a reviewer asked to check a whole rule set will check nothing.

She presses *Activate*. The confirmation restates what changes, from when, and how many staff across how many
campuses will be paid under it. Activation is submitted and the version sits at `pending_activation` until a
**second Group Admin** confirms it. On confirmation the version becomes `active`, the previous version
becomes `superseded` with its `valid_to` implied by the new `effective_from`, and every run from the October
period onward resolves to the new version. **Every run already computed keeps the version it used.** Nothing
about September changes, or could change.

In December, a back-dated August pay revision goes through [[M10c-arrears-pay-revision]]. The arrears engine
resolves August's config *by August's date*, gets the pre-October version, and recomputes PF on the old
ceiling. The screen shows that version explicitly, per month, because on an arrears run the versions differ
between rows and an implied version is an invisible error.

### 4.2 States

| State | Meaning | What is possible |
|---|---|---|
| `draft` | Authored, not yet submitted | Editable; deletable; **not resolvable** by any calculator |
| `pending_activation` | Submitted, awaiting the second admin | Read-only; recallable by the maker; still not resolvable |
| `active` | The version in force from `effective_from` | Immutable; resolvable; pinnable |
| `superseded` | A later version has taken over | Immutable; **still resolvable for dates in its own window** — this is the whole point |
| future-dated | `active` with `effective_from` in the future | Resolvable only for dates on or after that day; the UI warns before a run computes that a newer version exists and states when it applies (O9) |
| **coverage gap** | A date with no version at or before it | **Blocking.** Payroll, arrears, bonus and F&F all refuse to compute, naming the gap |

### 4.3 Edge cases and error paths

| Case | Behaviour |
|---|---|
| `effective_from` falls inside a period that already has an approved run | **Blocked at activation.** Activating it would contradict pinning: the run's numbers would no longer be reproducible from its own effective-date window. The correct instrument is arrears (GA-07 states this and routes to PY-15) |
| `effective_from` is mid-month | **Rejected** — see OQ-M11a-02. The resolution function is date-based, but a wage month cannot straddle two rule sets without a splitting rule the spec does not define |
| A calculator asks for a date before the earliest version | Coverage gap → refuse. **Never** fall back to the nearest version, and never to a default rate. A silent fallback is how a wrong number enters a filing |
| A draft's rule set fails schema validation | Activation is disabled with the failing field named; the draft is savable but not activatable |
| A value is outside plausible bounds (a PF rate of 92%) | **Warned, not blocked** — bounds are heuristics, and a legislature may do a surprising thing. The warning must be acknowledged, and the acknowledgement is audited |
| Someone attempts to delete a pinned version | Refused at the database, not just the UI. The error names a run that pinned it |
| Someone attempts to edit an active version through the API or the Django admin | Refused by the trigger. There is no privileged path; `statutory.manage` does not grant it |
| A tenant operating in a state with no PT slab table in the config | The PT calculator raises a *named* configuration gap for that state, not a zero. A zero deduction that should have been a deduction is a default the school pays for |
| Rehired employee, historical months under an older version | Resolution is by date, so this is not a special case here — but see [[M12-full-and-final]] for the continuous-service consequence |

### 4.4 Concurrency

- Activation takes a row lock on the tenant's config timeline and re-checks the `UNIQUE (tenant_id,
  effective_from)` invariant inside the transaction. Two admins activating two versions with the same
  effective date: one succeeds, the other gets a conflict naming the winner.
- Draft edits use `ETag`/`If-Match` (`§7 Concurrency`); a stale write returns 412 rather than overwriting.
- `statutoryConfigActivate` requires an **idempotency key** (`§7`, O17). A retried activation replays its
  result; it never produces a second version.
- A payroll run resolves and pins its config **inside the compute transaction**. A version activated
  mid-compute cannot change a run that is already resolving.

### 4.5 i18n

Rule *labels* and helper text are Hindi + English via the i18n catalogue (`guard-i18n-strings`); GA-07's
built design already carries both. Statutory **numbers** are formatted per Indian conventions (₹, lakh/crore
grouping) but never translated or transliterated. Statutory **instrument names** — Form 24Q, ECR, EPS, §10(10AA)
— remain in their statutory form inside a Hindi UI (see [[M11-statutory-compliance]] §8 and
`ui-compliance-requirements.md` Q6, still open).

### 4.6 Accessibility

The diff is a real `<table>` with `scope`d headers, and before/after are distinguished by **text and
position**, not colour alone (WCAG AA, `§9 Accessibility`). The activation confirmation is a modal with focus
trapped and returned, its consequence stated in the accessible name of the confirm control rather than only
in surrounding prose. Version status is a text label, never a colour chip alone.

### 4.7 Why the config is tenant-owned when the law is national

Rates are national or state law, yet the row carries `tenant_id`. This is deliberate and worth stating so it
is not "fixed" later. Three reasons: an on-prem install is a whole tenant and must be able to receive rule
updates as data without a release (`§10`); tenants legitimately differ on the elective parts (whether the PF
ceiling is applied or contributions are on full wages, which components are PF wages, whether a voluntary
higher rate is offered); and adoption is an **auditable act by a named person at a school**, which is what
makes the school answerable for the numbers it filed. The platform ships a **catalogue release**; a tenant
**adopts** it, which creates a tenant version with `source='platform_catalogue'`. Who is answerable when the
catalogue itself is wrong is OQ-M11a-04, and it is a commercial and legal question, not a technical one.

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M11a-AC-01 | `StatutoryConfig` exists with `version`, `effective_from`, `status`, `rules` (JSONB), `schema_version`, `source`, `supersedes_id` and maker/checker columns, carries `tenant_id` NOT NULL, and its RLS `ENABLE`+`FORCE`+policy is created **in the same migration as the model**. | M11 §6.10, §3, `guard-rls-policy` |
| M11a-AC-02 | Changing any rate, ceiling or slab **creates a new version**; a test asserts that `UPDATE` on `rules`, `effective_from`, `version` or `schema_version` of a non-draft row is refused **by a database trigger**, not only by application code. | M11 §Acceptance, §4.4, §4.3, **O18**, **O6** |
| M11a-AC-03 | A prior month re-opened computes on **its original version**: a payroll run recomputed after a newer version is activated resolves to, and pins, the version effective in that run's period — proven by a golden-file diff that is byte-identical to the original. | M11 §Acceptance, §11 Regression guard |
| M11a-AC-04 | `resolve_config(tenant, on_date)` is the **only** sanctioned path to a statutory value; a repo sweep asserts no calculator, serializer, template, fixture, **design mock, tooltip or example copy** contains a statutory rate, ceiling, slab or percentage literal. | `guard-statutory-hardcode`, §4.4, **O9** |
| M11a-AC-05 | A date with no version at or before it raises a **named coverage gap** that blocks payroll, arrears, bonus and F&F computation; the system never falls back to the nearest version or a default rate. | §4.4, GA-07 states, M11 §Business rules |
| M11a-AC-06 | Activation requires a **distinct second Group Admin** holding `statutory.manage`; the maker cannot activate their own version, and the refusal states the rule. | GA-07 built design (`gs7.activate.secondEyes`), A48, §8, **O5** |
| M11a-AC-07 | Activating a version whose `effective_from` falls inside a period that already has an approved payroll run is **blocked**, naming the run, and the UI routes to the arrears path instead. | §4.4, GA-07, M10 §Arrears |
| M11a-AC-08 | `effective_from` must be the first day of a payroll month; a mid-month date is rejected with the reason. | OQ-M11a-02 (pending ruling — implement the constraint, revisit if ruled otherwise) |
| M11a-AC-09 | A version pinned by any run, filing, arrears row, bonus run or settlement **cannot be deleted**; the refusal names a pinning artefact. Only an unactivated, unpinned draft is deletable. | §4.4, GA-07 must-NOT-contain |
| M11a-AC-10 | `PayrollRun`, `ArrearAdjustment`, `BonusRun`, `StatutoryFiling` and `FinalSettlement` each carry a non-null `statutory_config_id` once computed; a conformance test enumerates these tables and fails if a pin column is absent or nullable-after-compute. | §4.4, M10 §Business rules, NA-23 AC7 |
| M11a-AC-11 | The pinned version and its effective-from are **displayed** on the run, the payslip, the filing artefact, the bonus run and the settlement; on an arrears run the version is shown **per affected month**, because they differ. Copy follows O9's wording: *"Computed on StatutoryConfig v… · effective …"*. | **O9**, PY-15 must-contain, M10 §Arrears |
| M11a-AC-12 | No edit-in-place control exists on an active or superseded version for **any** role, including Group Admin and Django admin; the only verbs are *Publish new version* and *Activate*. **No surface lets a user pick a config version for a historical month.** | GA-07, **O9**, **O18** |
| M11a-AC-13 | Every version publication, edit-while-draft, activation, adoption and acknowledgement of an out-of-bounds warning writes an `AuditLog` row with actor, timestamp and diff, and the attribution is **visible on the version itself**, not only in the audit viewer. | §4.2, A48, **O6** |
| M11a-AC-14 | *View pinning* on a version lists every `PayrollRun` that pinned it, giving any past payslip an unbroken provenance chain back to the rule set that produced it. | GA-07, `DESIGN.md` principle 6 |
| M11a-AC-15 | The rule set validates against a declared `schema_version`; a draft failing validation cannot be activated, and the failing field is named. | §4.4 |
| M11a-AC-16 | Each namespace carries an explicit `rounding` rule (mode, precision, application point); no rounding mode is a code constant. | §11 Testing, `guard-hardcoded-values` |
| M11a-AC-17 | A platform catalogue release is **adopted** into a tenant version by a named user, recording `source='platform_catalogue'` and `catalogue_ref`; adoption never mutates an existing version, and on-prem receives updates as data with no release. | §10 |
| M11a-AC-18 | Downstream tests assert against **named config fixtures** (`v_test_2026_1`, `v_test_2026_2`), never a re-typed rate literal; a fixture-drift test proves an assertion fails when the fixture's value changes. | `CLAUDE.md` Testing standards, §11 |
| M11a-AC-19 | A cross-tenant read of another tenant's `StatutoryConfig` returns zero rows under RLS with the ORM filter deliberately disabled. | §3, §11 tenant-isolation tests |
| M11a-AC-21 | `statutoryConfigActivate` and catalogue adoption require an **idempotency key**; a replayed activation returns the original result and never creates a second version, and the UI states that the retry was recognised rather than silently repeating. | §7 Concurrency, **O17** |
| M11a-AC-22 | The rule set contains **no personal data**; a test asserts no employee identifier, PAN, UAN or ESIC number can be written into `rules`, and config-related log lines carry no PII. | **O11**, `guard-pii-logging` |
| M11a-AC-20 | GA-07's version list, rule-set view, diff and activation dialog carry Hindi + English labels; statutory instrument names are not transliterated. | `guard-i18n-strings`, **O12** |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | `resolve_config` at boundaries: the day before `effective_from`, the day of, the last day of a superseded window, a date before the first version (gap), a date with a future-dated version present. Rule-set schema validation, per namespace, with a missing required field and an unknown field. The diff engine: added / removed / changed / unchanged, including nested slab tables. Rounding-rule interpretation for each mode. Version-label ordering. Bounds-warning generation. **Every assertion reads from a named fixture, never a literal rate** |
| Integration | **bane** | The immutability trigger: `UPDATE` on an active row raises, as the application role, over both ORM and raw SQL. `DELETE` of a pinned version raises. Activation concurrency: two simultaneous activations for one `effective_from` — one wins, one conflicts. Idempotent activation replay. Maker-cannot-activate refused **server-side**, not merely hidden. RLS cross-tenant isolation on `statutory_config`. A run resolving mid-activation pins deterministically |
| Golden-file regression | **bane** + **riddler** | A committed register per config version. Activating a new version leaves every prior register byte-identical; a rule change produces a diff that must be an intentional, reviewed golden update, never a silent one | 
| Compliance review | **gordon** | No rate/ceiling/slab literal anywhere in code, fixtures, mocks or copy (`guard-statutory-hardcode` sweep). Audit completeness on publish/activate/adopt. Second-eyes on activation actually enforced. The immutability posture holds through every write path including Django admin and management commands |
| Contract | **cyborg** + CI | `statutoryConfigs` and its mutations appear in the committed SDL; generated TS/Dart clients compile |

---

## 7 · Proposed stories

Sprint 7 (**not** 8 — see OQ-M11a-01). Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M11a-S01 | `StatutoryConfig` model, migration and RLS policy | The versioned, effective-dated table with `tenant_id` + policy in the same migration. | oracle | 3 | M0-S05 |
| M11a-S02 | **Database-level immutability**: update/delete triggers and privilege revocation | Immutability enforced by Postgres, so no code path — admin, shell or migration — can rewrite a rate. | oracle + wonder-woman | 5 | M11a-S01 |
| M11a-S03 | Rule-set JSON schema (all namespaces incl. per-head `rounding`) + validator | The shape every calculator codes against, versioned so it can evolve. | riddler | 5 | M11a-S01 |
| M11a-S04 | `resolve_config()` + coverage-gap detection | The single sanctioned door to a statutory value, refusing rather than defaulting. | riddler | 3 | M11a-S03 |
| M11a-S05 | Publish / clone / edit-draft / activate workflow with the **distinct-second-admin** gate | The authoring lifecycle, with the highest-consequence setup action in the product properly gated. | cyborg + wonder-woman | 5 | M11a-S02 |
| M11a-S06 | Field-by-field diff engine and API | The artefact a reviewer needs; a whole-ruleset review is no review. | cyborg | 3 | M11a-S03 |
| M11a-S07 | Pinning contract: FK + conformance test across the five pinning tables | Makes a missing pin a CI failure rather than a discovery during an audit. | oracle + bane | 5 | M11a-S01 |
| M11a-S08 | Provenance: "runs pinned to this version" query and API | The chain from any past payslip back to its rule set. | cyborg | 3 | M11a-S07 |
| M11a-S09 | Platform catalogue release format + tenant adoption path | On-prem and SaaS receive rate updates as data, adopted by a named person. | martian + riddler | 5 | M11a-S05 |
| M11a-S10 | Named config fixtures + factory for all downstream tests | The fixture every statutory, payroll, arrears, bonus and F&F test asserts against. | deathstroke | 3 | M11a-S03 |
| M11a-S11 | GA-07 statutory configuration screen (list · rule set · diff · activate · pinning) | The built design, wired — no edit-in-place control anywhere on it. | green-lantern | 8 | M11a-S05, M11a-S06 |
| M11a-S12 | Immutability + isolation + concurrency integration suite | Proves the promise rather than asserting it. | bane | 5 | M11a-S05 |

**Total: 12 stories, 53 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| **OQ-M11a-01** | **Sequencing conflict: the build plan puts versioned statutory config in Sprint 8, but payroll core in Sprint 7 already "pins `StatutoryConfig`" (M10 §Business rules) and §12 itself says it "must be data-versioned from first use."** The plan contradicts its own critical-path risk. | If Sprint 7 ships runs that pin nothing, every Sprint-7 run is unreproducible, arrears against those months are uncomputable, and the golden-file regression has no baseline. This is the single most expensive retrofit in the product. | **Move M11a to the start of Sprint 7, before the first `PayrollRun` computes.** M11a has no dependency on payroll; payroll has a hard dependency on it. Needs BATMAN's sequencing sign-off. |
| **OQ-M11a-02** | **Mid-month `effective_from`.** A notification effective 15 October leaves a wage month straddling two rule sets. The spec's resolution is date-based and defines no splitting rule. | Silently applying one version to the whole month is a defensible policy; doing it *accidentally* is not. Splitting a month is a large change to the payroll engine and would ripple into ECR wage months. | Constrain `effective_from` to the first of a payroll month (AC-08) and, where a real mid-month notification arrives, handle the stub period through arrears. Needs a statutory-practice ruling. |
| **OQ-M11a-03** | **Does activating a version need a second approver?** `ui-compliance-requirements.md` Q11 flags the spec's silence; `docs/screen-inventory.md` GA-07 marks it `[proposed]`; the **built design already implements it** (*"a second Group Admin must confirm"*). | The docs, the inventory and the built screen disagree in status while agreeing in substance. Left unresolved, an implementer may build the screen without the gate the design shows. | **Adopt the built design as the ruling** and record it: activation is second-eyes. It is written into AC-06 here so an implementer is not asked to guess. Requires BATMAN to confirm the promotion from `[proposed]` to binding. |
| **OQ-M11a-04** | **Who owns rate correctness in the platform catalogue?** §10 promises on-prem customers stay compliant because config ships as data — which makes Voxturr Labs the de-facto author of the numbers a school files on. | A wrong ceiling in a catalogue release misprices every run at every tenant that adopts it. This is a liability question with a product consequence: adoption must be an explicit act by the school, not an automatic update. | Catalogue releases are **offered, never auto-applied**; adoption creates a tenant-authored version by a named user; the release notes carry the source notification. Commercial/legal ruling needed on warranty. |
| **OQ-M11a-05** | **Is the config per tenant or per legal entity?** `§6.10` places it at tenant level with PT/LWF slabs keyed by state, while filings are per `LegalEntity` (`§6.1`) and PT/LWF applicability derives from `Campus.state`. | A group operating a trust in Karnataka and a company in Telangana may face genuinely different elective choices (PF ceiling applied or not), which a single tenant-level row cannot express. | Keep the rule set tenant-level (the law is not per-entity) and put **elective** choices on `LegalEntity` as a separate, effective-dated `StatutoryElection` record. Flagged rather than designed here — it touches [[M1-organization-tenancy]]. |
| **OQ-M11a-06** | **Does a `superseded` version ever stop resolving?** Nothing defines a retention horizon for rule sets, and `AuditLog` retention is already open ([[M0-foundations]] OQ-M0-01). | Arrears and re-opened months can reach years back; a config pruned for tidiness would make those months uncomputable — the exact failure immutability exists to prevent. | Rule sets are **never pruned**. They are small, and they are the provenance of every payslip. Confirming rather than asking. |
| **OQ-M11a-07** | **Employee-level statutory electives** (PF on full wages vs ceiling, voluntary PF, regime choice) live partly in the config's shape and partly on the employee. `§6.9`/`§6.3` carry neither. | A calculator cannot resolve "does the ceiling apply to this person" from the config alone, and inventing the field during Sprint 8 would put a statutory elective outside the versioning discipline. | Define `EmployeeStatutoryProfile` (effective-dated: PF applicability, ceiling election, voluntary rate, ESI applicability, PT state override, LWF state) in [[M11-statutory-compliance]] §3. Raised there; noted here because it is the config's other half. |

**Conflict with the built design: none.** GA-07 as built is consistent with this specification in every
respect, and is *ahead* of the written spec on OQ-M11a-03 — which is why that question is a request to
ratify rather than to decide.

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
