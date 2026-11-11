# M1 — Organization & Tenancy · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M1 Organization & Tenancy (build-plan Sprint 1) · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M1, §3, §6.1, §4.1, §4.2, §4.3, §7, §8 ·
> `docs/decisions-to-finalize.md` D1 (multi-branch IN MVP), D7 · `docs/functionality-blueprint.md`
> PART A §12, **PART C item 1** (group→trust→campus hierarchy), PART B §1 · design screens **GA-02** (org structure)
> and **GA-03** (legal entities & registrations) in `design/v3/pages/ga-systems.jsx`, **GA-01** rollups in
> `design/v3/pages/groupadmin.jsx` · `docs/screen-inventory.md` §9.

---

## 1 · Intent

A school group is not a flat list of employees. It is a trust or society that runs several campuses, each
in a state whose government sets its own professional tax and labour-welfare rules, each divided into
departments that decide who approves whose leave. M1 is where a customer describes that shape to the
system — *this is our trust, these are our campuses, this one is in Karnataka and that one in Tamil Nadu,
this campus employs under this legal entity, and it is that entity's PAN and PF establishment number that
appear on the returns we file.* Everything the product later computes is keyed to this shape: statutory
rates come from a campus's state, filings come from a legal entity's registrations, and access control
comes from the campus and department a person is assigned to. M1 also carries the module's second, quieter
job — proving that this shape lives entirely inside one tenant and that no query can reach across.

---

## 2 · Scope & surfaces

### In scope

- `Organization`, `LegalEntity`, `Campus`, `Department` — creation, revision, archival, hierarchy moves.
- **Campus `state`** as the statutory driver, effective-dated, with a stated consequence on change.
- **Legal-entity statutory identity** — PAN, TAN, PF establishment id, ESI code, 12A registration — with
  format validation and a "which filings depend on this" read.
- Campus ↔ legal-entity assignment, and the "campus has no legal entity → payroll is blocked" state.
- The **scope vocabulary** (`group` / `campus` / `department` + id) that [[M2-identity-access]]'s
  `RoleAssignment` binds to.
- Headcount-per-node reads for GA-02 (counts only; the people are [[M3-core-hr-people]]'s).
- The M1 half of the tenant-isolation acceptance criterion: a Group Admin can create ≥2 campuses in
  different states, and no query returns another tenant's rows.

### Explicitly out of scope

| Out | Owned by |
|---|---|
| `Tenant` itself, RLS substrate, audit substrate | **[[M0-foundations]]** |
| Roles, permissions, who may act at a scope | **[[M2-identity-access]]** |
| Employees, headcount as people rather than counts | **[[M3-core-hr-people]]** |
| Academic year, terms, holiday calendars (a *time* hierarchy, not an org one) | **[[M7-academic-calendar]]** |
| Statutory **rates** — GA-07's versioned `StatutoryConfig`. M1 owns *who files*, [[M11-statutory-compliance]] owns *what the rules are* | **[[M11a-statutory-config-versioning]]** |
| Pay groups | **[[M10-payroll-core]]** |
| Group dashboards and rollup analytics (GA-01's numbers) | **[[M15-reporting-platform]]** — M1 exposes the tree and the counts, M15 composes the board |
| Devices, integrations (GA-10/GA-11) | **[[M16-integrations]]** |

### API surfaces

- **GraphQL — primary.** Queries: `organization`, `campuses`, `departments`, `legalEntities`, `orgTree`
  (a single batched read for GA-02, DataLoader-backed). Mutations as explicit verbs, not overloaded
  updates: `campusCreate`, `campusRevise`, `campusArchive`, `departmentCreate`, `departmentMove`,
  `departmentArchive`, `legalEntityCreate`, `legalEntityReviseIdentifiers`, `legalEntityAssignCampuses`.
- **REST edge:** none required by M1 beyond what M0 provides. (The spec's `GET/POST/PATCH
  …/organizations|legal-entities|campuses|departments` predates the 2026-07-18 GraphQL decision; the
  GraphQL surface is the implementation of that intent. Flagged as OQ-M1-07.)
- **Client surfaces:** web only — GA-02, GA-03, and the scope switcher that appears in every role's header.
  Mobile ([[M13-ess-mobile]]) consumes campus/department names read-only for display.

---

## 3 · Data model

All four tables are tenant-owned. **`tenant_id` (FK, NOT NULL) and the `ENABLE`+`FORCE ROW LEVEL SECURITY`
policy ship in the SAME migration as each model** (§3, `guard-rls-policy`, [[M0-foundations]] AC-03).

### 3.1 `Organization` (§6.1)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `name` | text | the group / society as it is spoken about |
| `default_timezone` | text | GA-02 defaults a new campus's timezone from "the org's" — the field must exist for that promise to be keepable |
| `is_active` | bool | archive, never delete |

### 3.2 `LegalEntity` (§6.1)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `organization_id` | FK → Organization | |
| `name` | text | employer of record |
| `registration_type` | enum `trust` \| `society` \| `sec8` | no default (GA-03) |
| `pan`, `tan` | text, format-validated | **sensitive-field registry** — masked by default, audited reveal |
| `pf_estab_id`, `esi_code`, `reg_12a` | text, nullable | a filing that needs a missing identifier is flagged against *that filing*, not silently skipped |
| `is_active` | bool | archive, never delete |

Identifier changes are **effective-dated** (§4.3): a revision writes a new dated row, and the previous row
stays readable because a filed return was filed under it. This is the same supersession pattern as [[M3-core-hr-people]]'s
contracts and [[M11a-statutory-config-versioning]]'s config — one pattern, reused (§4.3).

### 3.3 `Campus` (§6.1)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `organization_id` | FK | |
| `legal_entity_id` | FK, **nullable** | null is a legitimate, *flagged* state: the campus exists but payroll cannot run for it (GA-02) |
| `name`, `address` | text | |
| **`state`** | enum (Indian states/UTs) | **the statutory driver** — PT slabs, LWF, minimum wage |
| `timezone` | text, default from org | |
| `is_active` | bool | archive, never delete |

**`CampusStateAssignment`** (effective-dated child, `[proposed]` — §6.1 has `state` as a flat column):
`campus_id`, `state`, `effective_from`, `effective_to` (null = current), `reason` (required),
`changed_by_user_id`. A campus's statutory profile at any date is the row in force at that date, so a
payroll month already filed keeps the state it was filed under. See OQ-M1-01.

### 3.4 `Department` (§6.1)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `campus_id` | FK | |
| `name` | text | unique per campus (GA-02: duplicate name in the campus is blocked) |
| `type` | enum `academic` \| `admin` \| `transport` \| `hostel` \| `library` \| `medical` \| `security` \| `other` | **no default** (GA-02) |
| `is_active` | bool | archive, never delete |

A department **move** between campuses is not an update of `campus_id` in place: it is an effective-dated
event that (a) rewrites the department's campus from the effective date, (b) asks [[M3-core-hr-people]] to write a
`ServiceRecord(transferred)` for every employee in it, and (c) re-points approval chains. Modelled as
`DepartmentMove` (`department_id`, `from_campus_id`, `to_campus_id`, `effective_date`, `actor`) so the
history survives.

### 3.5 Relationships and invariants

- `Tenant 1─n Organization` per §5's ER diagram. GA-02 renders one tree. See OQ-M1-02.
- `Organization 1─n LegalEntity`, `Organization 1─n Campus`, `Campus 1─n Department`.
- `Campus n─1 LegalEntity` — a legal entity groups campuses for payroll and filing (M1 §Business rules).
- Every FK is **within the same tenant**; a cross-tenant FK is impossible under RLS's `WITH CHECK` and is
  additionally asserted by a DB-level check that the parent's `tenant_id` matches.
- The scope tuple `(group|campus|department, id)` M2 binds to resolves here: `group` = the tenant's
  organization(s), `campus` = a `Campus.id`, `department` = a `Department.id`.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — first-run setup (M1 §Acceptance)

1. A Group Admin signs into a brand-new tenant. GA-02 is in its **first-run (empty tenant)** state.
2. They create the `Organization` (the trust/society as spoken about).
3. They create `LegalEntity` "Sunrise Education Trust" on GA-03 with `registration_type=trust`, PAN, TAN,
   PF establishment id, ESI code, 12A reference. Formats are validated as typed; a missing PF id is
   allowed but is flagged *against the ECR filing that needs it*, not as a generic warning.
4. They add Campus "Indiranagar" (`state=Karnataka`) and Campus "Adyar" (`state=Tamil Nadu`) and assign
   both to the legal entity. **Two campuses in different states is the module's own acceptance criterion.**
5. They add departments under each — `academic`, `admin`, `transport`, `hostel` — each with an explicit
   `type` and no default.
6. Every one of those creations writes an `AuditLog` row (§4.2, [[M0-foundations]]). The tree is now the
   scope vocabulary [[M2-identity-access]] assigns roles against and [[M3-core-hr-people]] posts employees to.

### 4.2 States

| Entity | States |
|---|---|
| Tenant/org | first-run (empty) · single campus · multi-campus multi-state |
| Campus | active · **no legal entity → payroll blocked** (visible, routed to GA-03) · archived |
| Department | active · in use (archival blocked with the count) · archived |
| LegalEntity | none exist (blocks payroll) · complete · **missing an identifier a filing needs** · archived |

### 4.3 Edge cases and error paths

| Situation | Behaviour |
|---|---|
| Campus created with no legal entity | **Allowed** and flagged as blocking for payroll, with the route to GA-03 (GA-02's own rule). Never silently blocked, never silently fine |
| Duplicate department name within a campus | Rejected, `department_name_duplicate`. The same name in a *different* campus is fine |
| Archiving a campus with active staff | Refused; the response carries the count so the screen can show the disabled control with a reason. **Archive, never delete** — history is retained (§4.2) |
| Archiving a department in use | Same shape |
| Changing a campus's `state` | Requires a **reason**; creates a new dated `CampusStateAssignment`; the response states the consequence — PT slabs, LWF and minimum-wage treatment change **from the effective date**, and historical filings are unaffected. If returns have already been filed in the outgoing state, the response says so explicitly |
| Changing a campus's state with a **locked/filed payroll month** overlapping the effective date | Warned, and the effective date may not fall inside an already-filed period without an explicit acknowledgement recorded on the change (O18's "warn loudly when the effective date falls inside a period already paid or filed") |
| Editing a legal-entity identifier | Effective-dated supersession, reason required. Response enumerates **which filings and periods depend on it** so GA-03 can warn before commit. Filed returns are unaffected; a revised return may be needed |
| Moving a department between campuses | Effective-dated. Employees move with it and each gets a `ServiceRecord(transferred)` ([[M3-core-hr-people]]). If any affected employee sits in a locked payroll month, the response warns |
| Reassigning a campus already assigned to another legal entity | Allowed, with an explicit warning about in-flight payroll runs for that campus |
| Deep-link to a campus in another tenant | **404, never 403-with-a-name** (O7 — a 403 confirms the record exists) |
| A campus-scoped user requesting the org tree | Receives only their own campus's subtree; "All campuses" does not exist as an option for them (O7) |

### 4.4 Concurrency

- Campus, department and legal-entity edits use `ETag`/`If-Match` (§7). A stale write returns 412 and the
  screen reloads.
- Effective-dated rows never conflict on update because they are never updated — two admins revising the
  same campus's state on the same day produce two dated rows, and the later one is in force. A revision
  whose `effective_from` duplicates an existing row for the same campus is rejected as
  `effective_date_conflict` rather than silently interleaved.

### 4.5 i18n

- All GA-02/GA-03 copy is Hindi + English at parity (`guard-i18n-strings`, O12), including the
  consequence sentences on a state change and an identifier edit — these are exactly the strings a user
  must legally understand, so they may not ship English-only.
- **State names and statutory identifiers stay in their canonical form.** "Karnataka", "PAN", "TAN",
  "12A" are proper nouns of the Indian statutory system; the *label* is translated, the *value and the
  form name* are not (O12; ui-compliance §7-C6 raises the same question for artefacts — see OQ-M1-06).
- Devanagari line-height is budgeted in the tree and the identifier table; no truncation of a consequence
  sentence.

### 4.6 a11y

- The org tree is a real tree: `role="tree"`/`treeitem`, arrow-key traversal, expanded/collapsed announced,
  and each node's headcount read as part of its accessible name rather than as an unlabelled number.
- Structural state (blocking for payroll, archived, missing identifier) is carried by **mark or word plus
  colour**, never colour alone (DESIGN 8).
- Every consequence dialog moves focus to its heading and returns focus to the trigger on dismiss; the
  reason field is a labelled input with its error announced, not a placeholder.
- WCAG-AA for the core flows (§9 Accessibility).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M1-AC-01 | A Group Admin can create an organization with **≥2 campuses in different states**, each with departments. | **M1 §Acceptance** |
| M1-AC-02 | No query returns another tenant's organization, legal entity, campus or department — verified by an RLS cross-tenant test using raw SQL with the ORM filter disabled. | **M1 §Acceptance**, §3 |
| M1-AC-03 | `Organization`, `LegalEntity`, `Campus` and `Department` each carry `tenant_id` and their RLS policy **in the same migration as the model**. | §3, `guard-rls-policy` |
| M1-AC-04 | `Campus.state` is required at creation and is the value the statutory engine reads for PT, LWF and minimum wage. | **M1 §Business rules**, §6.1 |
| M1-AC-05 | A campus's state is effective-dated: changing it requires a reason, creates a new dated row, leaves the prior row readable, and the statutory profile at any date resolves to the row in force at that date. | §4.3, O18, GA-02 actions |
| M1-AC-06 | A state change whose effective date falls inside an already-filed period is refused without an explicit recorded acknowledgement, and the response names the affected filings. | §4.3, O18 |
| M1-AC-07 | A legal entity carries `registration_type` (no default), PAN, TAN, PF establishment id, ESI code and 12A reference, with format validation on PAN and TAN. | §6.1, GA-03 |
| M1-AC-08 | Editing a legal-entity identifier is a supersession with a required reason, and the response enumerates the filings and periods that depend on that identifier. | §4.3, O18, GA-03, M11 |
| M1-AC-09 | A campus may exist with no legal entity; the API reports it as a **blocking-for-payroll** state rather than rejecting the campus or reporting it as healthy. | GA-02 states, §6.9 |
| M1-AC-10 | A legal entity groups campuses for payroll and filing; reassigning an already-assigned campus succeeds with an explicit in-flight-run warning. | **M1 §Business rules**, GA-03 |
| M1-AC-11 | Department `type` has **no default** and a duplicate department name within one campus is rejected. | GA-02 actions |
| M1-AC-12 | Campuses and departments are **archived, never deleted**; archival is refused while active staff or active use exists, and the refusal carries the count. | §4.2, O6, GA-02 actions |
| M1-AC-13 | Moving a department to another campus is effective-dated, moves its staff with it, and emits a `ServiceRecord(transferred)` per affected employee ([[M3-core-hr-people]]). | GA-02 actions, §6.3 |
| M1-AC-14 | Every create, revise, move and archive writes an `AuditLog` row with actor, before/after and scope. | §4.2, O6 |
| M1-AC-15 | `org.manage` at **group** scope ([[M2-identity-access]]) is required for every M1 mutation; a campus-scoped caller receives *absent*, not *denied*, in the schema they can reach. | **M1 §Permissions**, §4.1 |
| M1-AC-16 | A campus-scoped user reading the org tree receives only their own subtree; no "all campuses" option is offered and no out-of-scope node appears greyed or redacted. | O7, **M2 §Acceptance** |
| M1-AC-17 | A direct read of an out-of-scope or out-of-tenant campus id returns **404**, not 403. | O7 |
| M1-AC-18 | The org-tree query returns nodes with headcounts in a bounded number of database queries (DataLoader/optimizer), not one per node. | §7, `guard-missing-dataloader` |
| M1-AC-19 | On-prem (`deployment_mode='on_prem'`) runs the identical code path with exactly one tenant; no M1 behaviour branches on deployment mode. | §3 |
| M1-AC-20 | All GA-02/GA-03 user-facing strings, including consequence sentences, exist in Hindi and English at parity. | `guard-i18n-strings`, O12 |

---

## 6 · Testing

| Level | Owner | Assertions that matter |
|---|---|---|
| Unit | **deathstroke** | PAN/TAN format validators against valid, invalid and boundary inputs (assertions read the validator's own pattern constant, never a re-typed regex); state-in-force resolution at a date, including the boundary day and a same-day double revision; department name uniqueness scoped to campus, not to tenant; archival guards; `DepartmentMove` producing exactly one transfer event per affected employee |
| Integration | **bane** | Two campuses in two states created end to end (M1-AC-01) through the GraphQL surface; a campus with no legal entity reported as blocking-for-payroll; a legal-entity identifier revision returning the dependent-filings list; a state change refused inside a filed period and accepted with an acknowledgement |
| **RLS isolation** | **bane** | Tenant A's Group Admin reaches zero of tenant B's organizations, legal entities, campuses and departments — via ORM, via raw SQL, via a deep-link by id, and via the org-tree batch loader. A cross-tenant `INSERT` (a department whose campus belongs to tenant B) is rejected by `WITH CHECK` |
| **Scope isolation** | **bane** | A Principal scoped to Campus A sees Campus A's subtree only; a Department Head sees one department; neither sees an "all campuses" filter option; a group-scope total is withheld rather than greyed (O7) |
| Contract | CI | The org-tree and mutation shapes appear in the committed SDL; generated TS and Dart compile |
| a11y | **two-face** | Tree keyboard traversal and announced expansion state; state-change dialog focus management; no state carried by colour alone |

---

## 7 · Proposed stories

Target sprint **1** throughout (build plan §12: "Tenancy + RBAC (M1–M2)").

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M1-S01 | Organization, Campus, Department models with `tenant_id` + RLS | The org tree exists, tenant-scoped from the first migration. | oracle | 5 | [[M0-foundations]] S04, S05 |
| M1-S02 | `LegalEntity` model with statutory identifiers | The employer of record, with PAN/TAN/PF/ESI/12A and format validation. | oracle | 3 | M1-S01 |
| M1-S03 | RLS policy content for the four M1 tables | The standard tenant predicate, plus the parent-tenant-match check on every FK. | wonder-woman | 3 | M1-S01, M1-S02 |
| M1-S04 | Effective-dated campus `state` (`CampusStateAssignment`) | A campus's statutory profile at a date, so a filed month keeps the state it was filed under. | oracle | 5 | M1-S01 |
| M1-S05 | Effective-dated legal-entity identifier revisions + dependent-filings read | Editing a PAN tells you which returns depend on it before you commit. | cyborg | 5 | M1-S02 |
| M1-S06 | GraphQL org surface: `orgTree`, campus/department/legal-entity queries | One batched read for GA-02, DataLoader-backed, scope-filtered. | cyborg | 5 | M1-S01, M1-S02, [[M0-foundations]] S11 |
| M1-S07 | GraphQL mutations: create / revise / archive / assign / move | Explicit verbs with reasons, consequences and audit, never an overloaded update. | cyborg | 5 | M1-S06 |
| M1-S08 | Campus↔legal-entity assignment and the payroll-blocking state | The state GA-02 must show and payroll must refuse to run against. | cyborg | 3 | M1-S05, M1-S07 |
| M1-S09 | Department move with per-employee transfer events | Moving a department moves its people, and their service books say so. | cyborg | 5 | M1-S07, **[[M3-core-hr-people]] S05 (ServiceRecord)** |
| M1-S10 | Scope resolution service (`group`/`campus`/`department` → id set) | The vocabulary M2 binds roles to and every later list filters by. | wonder-woman | 5 | M1-S01 |
| M1-S11 | M1 unit suite | Validators, state-in-force resolution, uniqueness and archival guards. | deathstroke | 3 | M1-S07 |
| M1-S12 | M1 RLS + scope isolation suite | Cross-tenant zero-rows and cross-campus zero-rows, including the deep-link 404. | bane | 5 | M1-S07, M1-S10 |

**Total: 12 stories, 52 points.**

> **Cross-module edge:** M1-S09 depends on [[M3-core-hr-people]]'s `ServiceRecord` (Sprint 2). Either sequence M1-S09 into
> Sprint 2, or land it in Sprint 1 behind the event contract and wire the consumer in Sprint 2. My
> recommendation is the former — a department move is not needed to demo Sprint 1.

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M1-01 | **Is `Campus.state` effective-dated?** §6.1 models it as a flat column. GA-02's action table requires a reason, an effective date and a consequence warning — which only makes sense on a dated row. | If it is a flat column, changing a campus's state silently re-rates every historical PT and LWF computation. That is a statutory-correctness bug with no error message. | Introduce `CampusStateAssignment` as specified in §3.3. **Data-model addition — needs a ruling.** |
| OQ-M1-02 | **Can one tenant hold more than one `Organization`?** §5's ER says `TENANT ||--o{ ORGANIZATION`; GA-02 renders a single tree and the scope level is called "group". | If many are allowed, `group` scope is ambiguous — group-scope means "which organization?" — and every scoped query gains a join. If one, the ER is wrong. | **One `Organization` per tenant in MVP**, enforced by a unique constraint, with the ER corrected. Multi-org is a post-MVP change with a clean migration path. Needs a ruling. |
| OQ-M1-03 | **Blueprint §1 tags "Multi-legal-entity support under one tenant **[P2]**"**, while M1 §Business rules, §6.1, §6.9 and GA-03 make `LegalEntity` an MVP entity that [[M10-payroll-core]] and every filing in
[[M11-statutory-compliance]] key to. | A P2 tag on an MVP dependency will be read by someone as permission to ship a single hardcoded entity, and every filing would then be keyed wrong. | The blueprint tag is stale — this is the same class as conflicts C5/Q30 in the screen inventory. **Correct the blueprint to [MVP].** Not applied: scope tags are BATMAN's call. |
| OQ-M1-04 | **`is_active` / archived does not exist in §6.1.** Only `Tenant` has a `status`. GA-02 requires archive-never-delete on campuses and departments. | Without the field, someone implements `DELETE` and the audit trail points at a row that no longer exists. | Add `is_active` (or `archived_at` + `archived_by`) to Organization, LegalEntity, Campus, Department. Low-risk addition; confirming. |
| OQ-M1-05 | **Does a campus-state change or a legal-entity identifier edit need a second pair of eyes?** GA-02 and GA-03 both mark it `[proposed] yes`; the spec names maker-checker only for payroll/statutory/settlement actions (§8). | A state change silently re-rates statutory deductions for a whole campus, and an identifier is the school's statutory identity. Both are as consequential as several things that *do* carry a gate. | Support it as a **per-tenant configurable second-approval flag** on these two actions, defaulted off, so a ruling either way costs nothing later. This is screen-inventory Q27's territory. Needs a ruling. |
| OQ-M1-06 | **Language of statutory identifiers and state names in a Hindi UI.** ui-compliance §7-C6 raises it for artefacts; it applies to GA-03's labels too. | A Hindi UI that renders "PAN" translated makes the field unrecognisable against the physical card the HR operator is copying from. | Labels translated, canonical form names and values not. Needs the same ruling as §7-C6/Q6. |
| OQ-M1-07 | **M1 §API still lists REST paths** (`GET/POST/PATCH …/organizations|…`), written before the 2026-07-18 GraphQL decision. | An implementer following M1 §API literally builds a REST surface the clients will not consume. | Read M1 §API as *intent*; implement on GraphQL per §7. **Add a one-line note to M1 §API in the dev spec** pointing at §7. Not applied. |
| OQ-M1-08 | **`Organization` has no timezone**, but GA-02 defaults a new campus's timezone "from the org's". | A promise on a built screen with no field behind it. | Add `Organization.default_timezone`. Included in §3.1 as a proposal. |
| OQ-M1-09 | **Who may create the first `Organization`?** `org.manage` is group-scoped, but on a brand-new tenant nobody holds an assignment at any scope yet — this is the same "no `RoleAssignment` → sign-in succeeds but there is no home" state SH-01 already designs for. | A genuine bootstrap deadlock: the first admin cannot be granted a scope that does not exist. | Tenant provisioning ([[M0-foundations]] OQ-M0-03) seeds one Group Admin `RoleAssignment` at group scope as part of creating the tenant. Needs confirming with [[M2-identity-access]]'s seeding story. |

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
