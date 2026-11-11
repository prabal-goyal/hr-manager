# M2 — Identity, Roles & Access · Functional Specification

> **Naveya** — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M2 Identity, Roles & Access (build-plan Sprint 1) · **Epic:** NA-15 · **Author:** tn-alfred
> **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` M2, §4.1, §4.2, §6.2, §7 Auth, §8 ·
> `docs/functionality-blueprint.md` **PART B §1** (RBAC, scoped access, field-level PII, maker-checker),
> **PART C item 10** · design screens
> **GA-04** (users & role assignments) and **GA-08** (audit log) in `design/v3/pages/groupadmin.jsx`,
> **GA-05** (roles & permissions) in `design/v3/pages/ga-systems.jsx`, **SH-01/SH-02/SH-04** in
> `design/v3/screens.jsx` · `docs/ui-compliance-requirements.md` O3, O6, O7, O16, §2.1 A1–A7 ·
> `docs/screen-inventory.md` §1, §9.
>
> **This module carries two rules that are enforced here and nowhere else:** the Employee role must LACK
> `documents.write` (see §4.6), and the audit trail is append-only with sensitive diffs recorded as
> *changed* rather than as values (see §4.7). A specification that leaves either to the frontend has
> failed.

---

## 1 · Intent

Every person who touches Naveya — the trustee who set the group up, the principal who signs off leave, the
HR operator who holds three hundred people's PAN numbers, the physics teacher who wants last month's
payslip — reaches the system through the same door and sees a completely different building on the other
side. M2 is that door and the floor plan behind it. It answers two questions and keeps them separate: *is
this person who they say they are* (a staff ID, a password, a one-time code, a second factor for anyone
who can move money), and *what may they reach* — which is never a single answer but a pair: **what** they
may do and **where** they may do it. A department head may approve leave, in her department, and may not
see a bank account anywhere. The pair is the permission; either half alone is a security hole. M2 also
carries the two guarantees that make the rest of the product's governance real rather than decorative: the
employee's inability to write their own documents, and the trail that records every decision without ever
becoming a second place PII leaks from.

---

## 2 · Scope & surfaces

### In scope

- `User` — HR-provisioned identity, invite lifecycle, activation/deactivation, MFA enrolment and reset,
  session and login history.
- Authentication: staff-ID + password sign-in, one-time-code sign-in, MFA challenge, rotating refresh,
  lockout, rate limiting, non-enumerating failures, sign-out-everywhere.
- `Role` — permission sets, seed roles, custom roles, system-role protection, the **permission catalogue**
  itself, the maker-checker capability flag.
- `RoleAssignment` — the role × scope binding, effective-dating, the privileged-grant second-approval
  path, revocation.
- **Field-level PII grants** (`people.pii.read`, salary visibility) as grants distinct from record access.
- **Permission resolution and enforcement**: the union of scoped assignments, applied on every GraphQL
  resolver and REST endpoint, and the *scope-set* handed to every list query.
- The effective-permission preview (GA-04's "the only honest way to answer *what can this person see?*").
- The **audit semantics** every other module writes against: what an audit row means, what a sensitive
  diff may contain, and why nothing can amend one.
- Seeding: the seven seed roles with their permission sets, shipped as data with a migration.

### Explicitly out of scope

| Out | Owned by |
|---|---|
| JWT primitives, lockout mechanics, the `AuditLog` table and its append-only trigger | **[[M0-foundations]]** — M2 configures and consumes them |
| The scope vocabulary's referents (campus, department ids) | **[[M1-organization-tenancy]]** |
| Employee master data; the `User ↔ Employee` link is M2's, the employee record is not | **[[M3-core-hr-people]]** |
| `documents.write` **semantics** and the document workflow | **[[M4-document-governance]]** — M2 owns only the fact that the permission is not grantable to an employee-shaped role |
| The audit-log **viewer**, filters and export (GA-08 screen) | **[[M15-reporting-platform]]** |
| DPDP consent records, "Your data", retention (GA-12) | **[[M15-reporting-platform]]** |
| Notification delivery of invites and grants | **[[M14-notifications]]** — M2 raises the events |
| Approval *chains* for leave, payroll, requisitions | **[[M8-leave]]**, **[[M10-payroll-core]]**, **[[M5-recruitment-ats]]** — M2 supplies the capability, not the workflow |
| Public/token-authenticated surfaces (candidate apply, offer acceptance, pre-boarding upload) | **[[M5-recruitment-ats]]**, **[[M6-onboarding]]** — they are deliberately *not* users |

### API surfaces

- **REST edge** (§7 — "auth endpoints" are explicitly REST): `POST /api/v1/auth/login`,
  `/auth/otp/request`, `/auth/otp/verify`, `/auth/mfa/verify`, `/auth/refresh`, `/auth/logout`,
  `/auth/logout-all`. These are REST because the mobile and web clients need them before a GraphQL
  session exists.
- **GraphQL — primary for everything else**: `me`, `users`, `user(id)`, `roles`, `permissionCatalogue`,
  `effectivePermissions(userId)`, `pendingGrants`. Mutations: `userInvite`, `userDeactivate`,
  `userReactivate`, `userResetMfa`, `userForcePasswordReset`, `roleCreate`, `roleRevisePermissions`,
  `roleDelete`, `roleAssignmentCreate`, `roleAssignmentApprove`, `roleAssignmentDecline`,
  `roleAssignmentRevoke`, `piiGrantSet`, `makerCheckerCapabilitySet`.
- **Client surfaces:** web (SH-01, SH-02, SH-04, GA-04, GA-05); mobile ([[M13-ess-mobile]]) consumes the
  auth REST endpoints and `me` only.

---

## 3 · Data model

Every table below is tenant-owned: **`tenant_id` (FK, NOT NULL) and its `ENABLE`+`FORCE ROW LEVEL
SECURITY` policy ship in the SAME migration as the model** ([[M0-foundations]] AC-03, `guard-rls-policy`).

### 3.1 `User` (§6.2)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `staff_id` | text, unique per tenant | **SH-01 signs in with a staff ID, not an email** — the design is explicit |
| `email`, `phone` | text, nullable | **sensitive-field registry** (phone is PII) |
| `password_hash` | text | Django's hasher; `guard-hand-rolled-auth` forbids anything bespoke |
| `employee_id` | FK → Employee, **nullable** | null = an admin-only user; an employee with no user is a state HR-02 must render |
| `status` | enum `invited` \| `active` \| `inactive` | GA-04's own state list |
| `mfa_enrolled_at`, `mfa_secret_ref` | timestamptz / opaque ref | secret never returned by any API |
| `preferred_language` | enum `en` \| `hi` | SH-01 stores the pre-auth device preference and merges it here at sign-in |
| `last_sign_in_at` | timestamptz | GA-04 column |
| `assignment_epoch` | int | bumped by any grant/revoke; see §4.3 |
| `is_active` | derived from `status` | deactivation revokes sessions, never deletes |

### 3.2 `Role` (§6.2)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `name` | text, unique per tenant | |
| `permission_set` | JSONB (array of permission codes) | validated against the permission catalogue |
| `is_system` | bool | seed roles: **read-only with a clone action**, never silently editable (GA-05) |
| `shape` | enum `admin` \| `manager` \| `operator` \| **`employee_self`** | the machine-readable fact that makes §4.6 enforceable |
| `supports_maker_checker` | bool | whether the capability flag may be set on an assignment of this role |
| `is_active` | bool | delete only while unassigned; otherwise deactivate |

### 3.3 `Permission` (catalogue — `[proposed]`, §6.2 has no such table)

| Field | Type | Notes |
|---|---|---|
| `code` | text pk | `people.manage`, `leave.approve`, `documents.write`, `people.pii.read`, … |
| `module` | text | GA-05 groups the catalogue by module |
| `label_en`, `label_hi` | text | O12 parity |
| `kind` | enum `record` \| `field` \| `capability` | **field-level PII permissions are a distinct kind** (§4.1) |
| `is_privileged` | bool | drives the second-approval requirement (§4.4) |
| `grantable_to_shapes` | array of `Role.shape` | **`documents.write` excludes `employee_self`** (§4.6) |

The catalogue is **code-declared and migration-seeded**, not user-editable. A permission that exists only
as a string in a JSON blob cannot be validated, cannot be grouped for GA-05, and cannot carry the
`grantable_to_shapes` rule that makes M4's governance a server-side fact.

### 3.4 `RoleAssignment` (§6.2)

| Field | Type | Notes |
|---|---|---|
| `tenant_id` | FK, not null | + RLS policy, same migration |
| `user_id`, `role_id` | FK | |
| `scope_level` | enum `group` \| `campus` \| `department` | **no default** — the pair *is* the permission |
| `scope_id` | UUID, nullable for `group` | resolves against [[M1-organization-tenancy]] |
| `effective_from`, `effective_to` | date / nullable | GA-04 renders an "Effective from" field; see OQ-M2-05 |
| `status` | enum `pending_approval` \| `active` \| `declined` \| `revoked` | GA-04's built flow |
| `granted_by_user_id`, `grant_reason` | FK / text (required) | |
| `approved_by_user_id`, `approved_at` | FK / timestamptz | **must differ from `granted_by_user_id`** — a DB check constraint, not a service-layer `if` |
| `revoked_by_user_id`, `revoked_at`, `revoke_reason` | FK / timestamptz / text | revoke, never delete |
| `has_checker_capability` | bool, default **false** | the maker-checker capability flag (M2 §Business rules) |

### 3.5 `PiiGrant` (`[proposed]` — the field-level half of §4.1 and §8)

| Field | Type | Notes |
|---|---|---|
| `tenant_id`, `user_id` | FK, not null | + RLS policy, same migration |
| `field_class` | enum `pii_identifiers` (PAN/Aadhaar/UAN/ESIC) \| `bank` \| `salary` | GA-04 renders **separate** toggles |
| `scope_level`, `scope_id` | enum + UUID | a PII grant is scoped like any other |
| `granted_by_user_id`, `grant_reason` (required), `approved_by_user_id` | | distinct-approver constraint as above |
| `effective_from`, `expires_at` | date / nullable | a temporary grant expires on its own (ui-compliance §2.1 note) |
| `revoked_at`, `revoke_reason` | | |

Modelled separately from `RoleAssignment` because §4.1 says field-level PII permissions are *separate from
record access*, and because GA-04 grants them per user with their own reason and their own audit line
visible to the **subject** as well as the grantee.

### 3.6 `LoginEvent` / `Session` (§8 "audit of logins", O16, SH-04)

| Field | Type | Notes |
|---|---|---|
| `tenant_id`, `user_id` | FK | + RLS policy, same migration |
| `event` | enum `login_success` \| `login_failure` \| `otp_issued` \| `otp_verified` \| `mfa_pass` \| `mfa_fail` \| `lockout` \| `refresh_rotated` \| `refresh_reuse_detected` \| `logout` \| `logout_all` | |
| `ip`, `user_agent`, `device_label` | text | **never the OTP code, never the full phone** (ui-compliance A2) |
| `refresh_family_id`, `revoked_at` | UUID / timestamptz | powers "sign out everywhere" |
| `created_at` | timestamptz | |

`LoginEvent` is append-only by the same mechanism as `AuditLog`. Failures are recorded against the
*attempted* staff ID even when it does not exist — that is how a spraying attack is detectable — but the
response is identical either way (§4.5).

### 3.7 Seed roles (M2 §Seed roles)

| Role | `shape` | Notes |
|---|---|---|
| Group Admin | `admin` | `org.manage`, `iam.manage` at group; MFA required |
| Campus Principal | `manager` | campus scope; leave escalation, requisition approval |
| HR Operator | `operator` | `people.manage`, `documents.manage`, `documents.verify`; MFA required |
| Payroll Operator | `operator` | payroll maker; **never** `supports_maker_checker` on the same run |
| Accountant | `operator` | typical checker holder; `supports_maker_checker = true` |
| Department Head | `manager` | department scope; `leave.approve`; **no PII grant is offered at all** (M2 §Acceptance) |
| **Employee** | **`employee_self`** | self-scoped reads, `leave.apply`, `documents.request.respond`; **`documents.write` is not grantable to this shape** |

---

## 4 · Behaviour walk-through

### 4.1 Happy path — sign in and reach exactly your own building

1. A teacher opens SH-01, types her staff ID and password, submits. The client sends
   `POST /api/v1/auth/login`.
2. The server resolves the tenant from the hostname, finds the user *within that tenant*, verifies the
   password, and checks `status='active'`.
3. If any of her active assignments carries a privileged permission (Group Admin, HR, Payroll, Accountant),
   an **MFA challenge** is required before a token is issued.
4. An access token (~15 min) and a rotating refresh token are issued. The access token carries
   `sub`, `tid`, `jti`, `epoch` — **and no permissions**.
5. `LoginEvent(login_success)` is written with device and IP.
6. The client calls `me`. The server resolves her assignments **from the database**, expands each scope to
   a concrete id set via [[M1-organization-tenancy]], unions the permission codes, applies her `PiiGrant`s,
   and returns identity + effective permissions + scope sets + preferred language.
7. Every subsequent request re-resolves (from a cache keyed on `user_id:assignment_epoch`), and every list
   query is filtered to the scope id set before RLS even sees it.

### 4.2 Permission resolution — permission × scope (§4.1)

- A permission check is always a **pair**: `has("leave.approve", campus=X)`.
- A `group`-scope assignment expands to every campus and department in the tenant; a `campus`-scope
  assignment expands to that campus and its departments; a `department`-scope assignment to one department.
- The caller's reach is the **union** of their assignments (§4.1: "filtered to the union of the caller's
  scoped assignments"). Two assignments never subtract from each other.
- Field-level PII is a **second** check, never implied by record access: `canReveal(pii_identifiers,
  employee)` requires a `PiiGrant` whose scope covers that employee. A Department Head who can read a
  team member's record still gets **no reveal control at all** — the field is absent from her schema
  response, not disabled (M2 §Acceptance, O3).
- Out-of-scope records **do not exist** in a response. Not greyed, not "restricted", not a redacted row —
  a placeholder confirms the record exists and often its name (O7). A direct read by id returns 404.

### 4.3 Freshness of permissions

Permissions are resolved server-side per request against `User.assignment_epoch`; any grant, revoke,
approval, decline, role-permission edit or PII grant bumps the epoch of every affected user and busts the
cache. **Revocation takes effect on the next request, not the next token refresh.** A fifteen-minute
window in which a revoked admin still holds `payroll.approve` is the exact failure the maker-checker
control exists to prevent. See OQ-M2-01 — this contradicts one line of GA-04's built copy.

### 4.4 Granting a role — the second-admin path (GA-04, as built)

1. A Group Admin opens a user on GA-04 and chooses role + `scope_level` + scope. **Neither has a default.**
   A reason is required.
2. If the role carries any `is_privileged` permission (`payroll.approve`, `people.pii.read`, `iam.manage`,
   `org.manage`), the assignment is created `pending_approval` and **does not grant anything yet**.
3. A **different** Group Admin sees it in "Awaiting your approval" and approves or declines with a reason.
   The grantor can never approve their own grant — enforced by a check constraint on the row, not by a UI
   affordance.
4. On approval: `status='active'`, epoch bumped, audit written, and the grant is visible on the grantee's
   profile **and** — for a PII grant — on the subject's own data page (ui-compliance A4).
5. Non-privileged grants activate immediately, still audited, still reasoned.

**Escalation guards:** an assigner may not grant a scope outside their own, and may not grant a permission
they do not themselves hold. Both are server-side; GA-04's "assigning a scope outside the assigner's own
scope → blocked" is the visible half of a rule that must hold for a direct API call too.

### 4.5 Authentication edge cases and error paths

| Situation | Behaviour |
|---|---|
| Unknown staff ID | Identical response and identical timing to a wrong password (`auth_invalid_credentials`). Never "no such staff ID" — staff-ID enumeration is the cheapest attack on a school (SH-01, O16) |
| Correct password, `status='invited'` | The invite must be accepted first; response says "contact your HR office" in the client's words |
| Correct password, `status='inactive'` (post-exit) | `auth_account_inactive`. **See OQ-M2-06** — a leaver still needs their Form 16 |
| Tenant suspended | `tenant_suspended` ([[M0-foundations]]) — a tenant-level message, not an auth error |
| N failed attempts | Lockout with a stated remaining time; `LoginEvent(lockout)`; unlock by HR |
| OTP path (SH-02) | The code is delivered to the registered phone; the response never reveals whether the staff ID exists; the code and the full phone number are **never** logged or stored in `LoginEvent` |
| MFA enrolled but device lost | HR/Group Admin `userResetMfa`; user re-enrols at next sign-in; audited |
| Refresh token replayed | The whole token family is revoked and `refresh_reuse_detected` is audited as a security event |
| **User signs in with no `RoleAssignment`** | Sign-in **succeeds** and `me` returns an empty permission set. SH-01's designed state — "your access hasn't been set up yet" — requires this to be a successful, empty response rather than a 403. GA-04 must surface the user in its "no role assigned" state |
| Deactivating a user who owns pending approvals | Refused until reassigned; the response **lists** the pending items so GA-04 can name them before confirming |
| Granting checker capability to the only payroll maker | Allowed but returns an explicit warning payload — "this defeats the gate" — which GA-04 renders. Not silently permitted, not silently blocked |
| Deleting a role with active assignments | Refused with the count; deactivate instead |
| Editing a system role's permissions | Refused; the API offers clone. GA-05 shows system roles read-only with a clone action |
| Removing a permission that strands a workflow (no `payroll.approve` holder left in a scope) | Returns a warning with the impact preview and requires an explicit confirmation flag on the mutation |

### 4.6 `documents.write` and the Employee role — the rule enforced here

M4's governance is a permission fact. It is made unbreakable in **four** places, and no one of them is
sufficient alone:

1. **Catalogue:** `documents.write` declares `grantable_to_shapes = [admin, operator]`. `employee_self`
   is absent.
2. **Validation:** `roleRevisePermissions` rejects a permission set containing a code not grantable to
   that role's `shape` — `permission_not_grantable_to_role_shape`. GA-05 renders `documents.write` as
   *permanently unavailable* to any Employee-shaped role: shown, not hidden, because this is the one
   place the product must prove the platform enforces it.
3. **Seed data:** the Employee seed role's permission set is asserted at migration time and by a test that
   reads the seed definition rather than a re-typed literal.
4. **Enforcement:** [[M4-document-governance]]'s write endpoints check the **permission**, never the role
   name. An employee who somehow held the permission would be a permission bug, not a document bug; an
   endpoint that checks `role == 'Employee'` would be a document bug the moment a custom role appears.

A test asserts that for every role with `shape='employee_self'`, the resolved effective permission set
never contains `documents.write` — and that a direct `POST …/employees/{id}/documents` as an Employee
returns **403** (M4 §Acceptance).

### 4.7 Audit — append-only, and what a sensitive diff may say

M2 defines the semantics every module writes against ([[M0-foundations]] ships the table):

- Every mutating action writes one `AuditLog` row in the same transaction: actor, action, entity,
  entity_id, before/after, scope, timestamp (§4.2).
- **Supersede, never delete.** There is no amend path, no edit path, no delete path, for any actor, at any
  privilege level. The database refuses it.
- **A diff of a sensitive field records that it changed, never the values.** A PAN correction audits as
  `{"field": "pan", "changed": true}`. This is not a display rule — the value is never written to
  `audit_log` in the first place, because a masked field re-exposed in an audit viewer is the same breach
  with a longer retention period (GA-08 must-NOT-contain, §8, O3).
- A **PII reveal is itself an audited action** with `sensitivity_class='pii_access'`, recording actor,
  field class, subject and time — and it is surfaced to the *subject* as well as to an administrator
  (O3, ui-compliance A10).
- Login events, grants, revocations and permission-set edits are audited with `sensitivity_class` set so
  GA-08's high-sensitivity views can filter to them.

### 4.8 i18n

- Every string SH-01, SH-02, SH-04, GA-04 and GA-05 renders exists in **Hindi and English at parity**
  (`guard-i18n-strings`, O12) — including lockout copy, the non-enumerating failure, consent-adjacent
  notices, the grant-reason prompts and the "you cannot approve your own grant" sentence. These are exactly
  the strings a person must understand to act correctly; English-only is not a temporary state.
- The API returns `code`s; the copy is the client's. `Permission.label_en`/`label_hi` are the exception —
  GA-05 renders a catalogue the backend owns, so the backend carries both labels.
- Language preference is stored pre-auth on the device and **merged to `User.preferred_language` at
  sign-in** (SH-01's stated behaviour).
- One language at a time; never both on one screen (DESIGN 11).

### 4.9 a11y

- SH-01: the password show/hide is a labelled toggle whose state is announced; the failure message is in
  an `aria-live` region and focus moves to it; the MFA step is a separate landmark, not a modal that traps
  a screen reader; lockout time is text, not a colour.
- GA-04: role × scope pairs are read as pairs, not as two adjacent unlabelled cells; the "no role assigned"
  and "maker + checker" states carry a word plus the colour (DESIGN 8); the effective-permission preview is
  a navigable list, not a tooltip.
- GA-05: the permission catalogue is grouped with real headings; `documents.write` rendered unavailable
  carries `aria-disabled` **and** the reason in text.
- Every destructive dialog (revoke, deactivate) moves focus to its heading, labels its reason field, and
  returns focus to the trigger.
- WCAG-AA on all core flows (§9).

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M2-AC-01 | A Principal scoped to Campus A **cannot read Campus B data** — verified through list queries, direct-id reads (404), search, pickers, filter option lists, and exports. | **M2 §Acceptance**, O7 |
| M2-AC-02 | A Department Head can approve leave in her department but **cannot see bank details** anywhere: no reveal control is present in her schema response, and a direct reveal call returns 403. | **M2 §Acceptance**, §4.1, §8 |
| M2-AC-03 | Authorization is evaluated as **permission × scope** on every resolver and endpoint; a permission check with no scope is a schema-build-time error. | §4.1 |
| M2-AC-04 | A caller's reach is the union of their active, in-effect assignments; a group-scope assignment expands to all campuses and departments in the tenant. | §4.1 |
| M2-AC-05 | Field-level PII permissions (`pii_identifiers`, `bank`, `salary`) are **separate grants** from record access and are granted independently of each other. | §4.1, §8, GA-04 |
| M2-AC-06 | **The Employee role's effective permission set never contains `documents.write`**, and `documents.write` is not grantable to any role with `shape='employee_self'` — enforced by the catalogue, by mutation validation, by seed assertion, and by a test. | **M4 §Business rules #2**, §4.5, **M4 §Acceptance**, O4 |
| M2-AC-07 | An Employee calling any document write endpoint outside an open request receives **403**, and the check is on the permission, never on the role name. | **M4 §Acceptance**, O4 |
| M2-AC-08 | The seven seed roles exist with their permission sets, are `is_system`, and are **read-only with a clone action**; a permission edit on a system role is rejected. | **M2 §Seed roles**, GA-05 |
| M2-AC-09 | A `RoleAssignment` requires `scope_level` and scope with **no defaults** and a reason; the pair is stored, audited and rendered together. | §6.2, GA-04 |
| M2-AC-10 | A grant carrying any privileged permission lands `pending_approval` and grants nothing until a **distinct** Group Admin approves; `approved_by ≠ granted_by` is a database check constraint. | GA-04 as built, §8 maker–checker principle |
| M2-AC-11 | An assigner cannot grant a scope outside their own scope, nor a permission they do not hold; both are refused server-side, not merely hidden. | §4.1, GA-04 |
| M2-AC-12 | Revoking a role, declining a grant, or editing a role's permission set takes effect on the **next request**, not the next token refresh. | §8, §7 Auth |
| M2-AC-13 | The maker-checker capability is a **flag on an assignment**, not a role; granting it to a user who is also a payroll maker returns an explicit warning payload. | **M2 §Business rules**, screen-inventory C6 |
| M2-AC-14 | Deactivating a user revokes their sessions immediately and is **refused while they own pending approvals**, with the pending items enumerated in the response. | GA-04 actions |
| M2-AC-15 | Roles and assignments are **revoked/deactivated, never deleted**; a role with active assignments cannot be deleted and the refusal carries the count. | §4.2, O6, GA-05 |
| M2-AC-16 | JWT access tokens carry identity and tenant only — **no permission claims**; a token cannot be replayed to assert a permission the database no longer grants. | §7 Auth, §4.1 |
| M2-AC-17 | MFA is required for roles carrying privileged permissions before a token is issued; MFA reset is an administrator action and is audited. | §8 Auth hardening, **M2 §Business rules**, O16 |
| M2-AC-18 | Sign-in failures are non-enumerating and constant-time across "unknown staff ID" and "wrong password"; N failures lock the account with a stated duration. | §8, O16, SH-01 |
| M2-AC-19 | Every login, OTP issue/verify, MFA outcome, lockout, refresh rotation, refresh reuse and logout is recorded; **the OTP code and the full phone number are never stored or logged**. | §8, ui-compliance A2, `guard-pii-logging` |
| M2-AC-20 | A user with no `RoleAssignment` **signs in successfully** and receives an empty permission set — not a 403 — so SH-01's designed empty-access state is reachable. | SH-01 non-happy paths, §6.2 |
| M2-AC-21 | Every mutating action in M2 writes an `AuditLog` row in the same transaction, including grants, approvals, declines, revocations, permission-set edits, PII grants and deactivations. | §4.2, O6 |
| M2-AC-22 | **Audit is append-only:** no API, admin surface or database role can update or delete an audit row; the attempt is refused by the database. | §4.2, **M15 §Acceptance**, O6 |
| M2-AC-23 | **A diff on a sensitive field records that the field changed, never the old or new value**; a test proves no PAN/Aadhaar/bank value is recoverable from `audit_log`. | §8, GA-08 must-NOT-contain, O3, O6 |
| M2-AC-24 | A PII reveal is an audited action carrying actor, field class, subject and time, visible to an administrator **and to the subject**. | §8 "access-logged", O3 |
| M2-AC-25 | The effective-permission preview returns the resolved permission × scope union for a user — the same resolution the enforcement layer uses, not a re-implementation. | §4.1, GA-04 |
| M2-AC-26 | All M2 tables carry `tenant_id` and their RLS policy in the same migration; a user in tenant A can never be read, assigned to, or authenticated against tenant B. | §3, `guard-rls-policy`, O7 |
| M2-AC-27 | Users are **HR-provisioned**; no self-registration path exists on any surface. | SH-01 must-NOT-contain, §6.2 |
| M2-AC-28 | All SH-01/SH-02/SH-04/GA-04/GA-05 strings exist in Hindi and English at parity, including lockout, failure and grant-reason copy. | `guard-i18n-strings`, O12 |
| M2-AC-29 | No PII appears in any auth or IAM log line; subjects are opaque UUIDs. | `guard-pii-logging`, §8, O11 |
| M2-AC-31 | A `RoleAssignment`'s effective window is honoured: an assignment whose `effective_to` has passed grants nothing, without a nightly job having to revoke it. | §4.3, O18, GA-04 |
| M2-AC-30 | No impersonation / "view as" capability exists anywhere in the API. | ui-compliance §3 "never build" |

---

## 6 · Testing

| Level | Owner | Assertions that matter |
|---|---|---|
| Unit | **deathstroke** | Scope expansion (`group` → all campuses; `campus` → its departments; `department` → itself) against a factory-built tree; permission union across overlapping assignments; `has(permission, scope)` truth table read from the catalogue, never re-typed; catalogue validation rejecting `documents.write` for `employee_self`; the distinct-approver constraint; effective-date windows including the boundary day; password hashing and timing-equalised failure paths; OTP generation never persisted; `LoginEvent` payload contains no phone or code |
| Integration | **bane** | Full sign-in → MFA → token → `me` → scoped query; refresh rotation and reuse-detection revoking the family; lockout after N failures; the privileged-grant flow end to end **including the refusal when grantor and approver are the same person**; revocation reflected on the *next* request; deactivation refused with pending approvals listed; system-role edit refused, clone accepted |
| **Governance** | **bane** | The `documents.write` proof: for every seed and custom `employee_self` role, the resolved permission set excludes it; `roleRevisePermissions` refuses to add it; a direct document write as an Employee returns 403 ([[M4-document-governance]]) |
| **Audit** | **bane** | Every M2 mutation produces exactly one audit row; `UPDATE`/`DELETE` on `audit_log` refused; a PAN change audits as `changed: true` with **no** value recoverable by any query over `audit_log`; a PII reveal writes a `pii_access` row visible to the subject |
| **Scope / RLS isolation** | **bane** | The M2 §Acceptance matrix: Principal@A vs Campus B across list, direct id (404 not 403), search, type-ahead, approver picker, filter options, export, dashboard total. Department Head has no reveal control in the schema response and 403 on a direct call. Cross-tenant: a user in tenant A cannot authenticate into tenant B even with a valid password |
| Escalation | **bane** | A campus-scoped `iam.manage` holder cannot grant a group-scope assignment, cannot grant a permission they lack, and cannot self-approve |
| Contract | CI | Auth REST endpoints in the committed OpenAPI; IAM types in the committed SDL; TS + Dart clients compile |
| a11y | **two-face** | SH-01 error focus and live region; GA-04 role×scope pair semantics and non-colour-only state; GA-05 unavailable-permission reason in text |

---

## 7 · Proposed stories

Target sprint **1** unless noted (build plan §12: "Tenancy + RBAC (M1–M2)").

| # | Title | Intent | Owner | Pts | Depends on | Sprint |
|---|---|---|---|---|---|---|
| M2-S01 | `User` model, invite lifecycle and HR provisioning | An identity HR creates; no self-registration path exists. | oracle | 5 | [[M0-foundations]] S05 | 1 |
| M2-S02 | `Role`, `Permission` catalogue and `RoleAssignment` models | The two-dimensional binding, with a catalogue that can be validated against. | oracle | 5 | M2-S01, [[M1-organization-tenancy]] S01 | 1 |
| M2-S03 | RLS policy content for all M2 tables | Users, roles and assignments cannot be read or written across tenants. | wonder-woman | 3 | M2-S01, M2-S02 | 1 |
| M2-S04 | Seed the seven roles with permission sets, shapes and system protection | The roles the whole build period runs on, shipped as data. | wonder-woman | 5 | M2-S02 | 1 |
| M2-S05 | **`documents.write` non-grantability to `employee_self`** | M4's governance made a server-side permission fact in four independent places. | wonder-woman | 5 | M2-S04 | 1 |
| M2-S06 | Sign-in, OTP sign-in, lockout, rate limiting, non-enumerating failures | SH-01 and SH-02's contract, with staff ID as the identifier. | wonder-woman | 8 | [[M0-foundations]] S08 | 1 |
| M2-S07 | MFA enrolment, challenge, reset for privileged roles | A second factor for anyone who can move money or read PII. | wonder-woman | 5 | M2-S06 | 1 |
| M2-S08 | `LoginEvent` / session history, sign-out-everywhere | SH-04's own-session view, and the login audit §8 requires. | wonder-woman | 3 | M2-S06 | 1 |
| M2-S09 | **Permission resolution + scope-set service, epoch cache** | The single resolver every list query and every mutation asks; revocation immediate. | wonder-woman | 8 | M2-S02, [[M1-organization-tenancy]] S10 | 1 |
| M2-S10 | GraphQL enforcement layer: field/resolver permission decorators, 404-not-403 for out-of-scope ids | The rule applied consistently rather than remembered per resolver. | cyborg | 5 | M2-S09, [[M0-foundations]] S11 | 1 |
| M2-S11 | `PiiGrant` model, reveal endpoint and its audited access | Field-level PII as a distinct, scoped, reasoned, expiring grant. | wonder-woman | 5 | M2-S09 | 1 |
| M2-S12 | Privileged-grant second-approval flow (pending → approve/decline) | The GA-04 flow as built, with `approved_by ≠ granted_by` in the schema. | cyborg | 5 | M2-S09 | 1 |
| M2-S13 | Maker-checker capability flag + the maker-and-checker warning | The capability the whole money side of the product depends on. | cyborg | 3 | M2-S12 | 1 |
| M2-S14 | GA-04/GA-05 GraphQL surface: users, roles, catalogue, effective-permission preview, pending grants | The reads the two identity screens need, resolved by the enforcement layer itself. | cyborg | 5 | M2-S09, M2-S12 | 1 |
| M2-S15 | Role lifecycle: clone, custom role, permission edit with impact preview, deactivate | GA-05's actions, including the stranded-workflow warning. | cyborg | 5 | M2-S14 | 1 |
| M2-S16 | User deactivation with pending-approval reassignment | Access revoked without orphaning the approvals they held. | cyborg | 3 | M2-S14 | 2 |
| M2-S17 | **Audit semantics: sensitivity classes, sensitive-diff redaction, PII-access rows** | What an audit row means, and the guarantee it never becomes a second PII store. | wonder-woman | 5 | [[M0-foundations]] S10 | 1 |
| M2-S18 | M2 unit suite | Scope expansion, permission union, catalogue validation, timing-equalised failures. | deathstroke | 5 | M2-S09 | 1 |
| M2-S19 | **M2 acceptance suite: Principal@A vs Campus B, and DH vs bank details** | The module's own two acceptance criteria, proven across every surface that can name a person. | bane | 8 | M2-S10, M2-S11 | 1 |
| M2-S20 | Governance + audit suite: `documents.write` exclusion, append-only, redacted diffs | The two rules enforced here and nowhere else, proven. | bane | 5 | M2-S05, M2-S17 | 1 |

**Total: 20 stories, 101 points** (2 points of which sit in Sprint 2).

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M2-01 | **Design conflict — GA-04 says role changes apply "on the next token refresh"**; this spec resolves permissions server-side per request so revocation is immediate. | A ≤15-minute window in which a revoked Group Admin still holds `payroll.approve` is a security defect, and the copy on a built screen would be describing it as intended behaviour. | Keep server-side resolution; **change GA-04's copy to "applies immediately"**. Design copy change — needs BATMAN's sign-off. Same item as [[M0-foundations]] OQ-M0-06. |
| OQ-M2-02 | **Is MFA optional or mandatory for admin/payroll roles?** M2 §Business rules says "*optional* MFA for admin/payroll roles"; §8 says "MFA for admin/payroll roles"; ui-compliance O16 says the UI must "**require** and state MFA" for Group Admin, HR, Payroll and Accountant. Three documents, three strengths. | Whether a Payroll Operator can decline MFA changes the threat model for every money action, and it changes GA-04's MFA column from informational to enforcing. | **Required for any role holding a privileged permission**, configurable per tenant only in the direction of *more* strictness. Needs a ruling. |
| OQ-M2-03 | **Does granting a privileged role need a second admin?** The spec is silent (screen-inventory Q27, ui-compliance §9-Q9 both flag it); **GA-04 has already built the pending/second-approval flow**. | This is the escalation path *around* maker-checker: whoever can grant `payroll.approve` to themselves has defeated it. The design has answered; the spec has not. | Adopt the design: privileged grants require a distinct second Group Admin. Specified in §4.4 and M2-AC-10 on that basis. **Needs a ruling to become spec.** |
| OQ-M2-04 | **The `Permission` catalogue does not exist in §6.2** — permissions live only as strings inside `Role.permission_set` JSON. | Without a catalogue there is nothing to validate against, nothing to group GA-05 by, nothing to carry Hindi labels, and no place to declare `documents.write`'s non-grantability. The M4 guarantee would degrade to a code comment. | Add the catalogue as a code-declared, migration-seeded table (§3.3). **Data-model addition — needs a ruling.** |
| OQ-M2-05 | **Is a `RoleAssignment` effective-dated?** Nothing in §6.2 says so; GA-04 renders an "Effective from" field marked `[proposed]`; transfers and acting-charge arrangements need it (screen-inventory Q26). | An acting principal covering a term is the normal case in a school, and without dating it is a manual grant-and-remember. | Add `effective_from`/`effective_to`, with `effective_to` also giving PII grants a self-expiry. Needs a ruling. |
| OQ-M2-06 | **Post-exit access.** [[M12-full-and-final]] flips `User.is_active=false` at settlement, while §8 requires statutory-retention data to survive exit and the leaver has a statutory need for their Form 16 (screen-inventory C8/Q7, ui-compliance §9-Q2). | A binary flip either denies a leaver a legally required document or leaves a full account live after exit. M2 owns the flag, so M2 must model the answer. | A third `User.status` — `post_exit_limited` — reaching only payslips and tax documents, self-scoped, time-boxed. **Needs a legal/product ruling before [[M12-full-and-final]] is built**, but the enum should be reserved now. |
| OQ-M2-07 | **Who may open police/background-verification records?** §8 says "access-restricted" and names no permission (screen-inventory Q8, ui-compliance §9-Q5). Whether a control is *absent* or *disabled* depends on it. | Child-safety data with the widest blast radius in the product, and M2 is where the permission would have to exist. | Define `documents.child_safety.read` as a `is_privileged` catalogue entry now, grantable independently of `documents.manage`, and let [[M4-document-governance]] decide who holds it. Needs a ruling on the holder. |
| OQ-M2-08 | **Is there an `iam.manage` at campus scope?** M2 §Permissions says "`iam.manage` (group/campus scope)" and GA-04's action table says "Group Admin / campus admin with `iam.manage`" — but no seed role other than Group Admin holds it. | If a Principal can invite users and assign roles for their campus, the escalation guards in §4.4 are load-bearing in a way they otherwise are not. If not, the phrase is dead text. | Keep `iam.manage` scopeable to campus, grant it to no seed role, and let a tenant grant it via a custom role. Confirming. |
| OQ-M2-09 | **Is there a service-principal / machine identity?** §6.2 has only `User`; [[M9-attendance]]'s ingest endpoint and [[M16-integrations]]'s webhooks need an authenticated non-human caller. | An ingest token invented in Sprint 6 will reason about tenancy and scope a second time, differently. | Define `ServiceToken` alongside `User` now (also raised as [[M0-foundations]] OQ-M0-04). |
| OQ-M2-10 | **Does the Employee role need `people.read.self` as an explicit permission**, or is self-scope implicit? The spec says "Employee (read-only self)" without a permission code. | "Implicit self-access" is the kind of rule that gets re-implemented per resolver and drifts. | Model self-scope as an explicit `scope_level='self'` on the assignment — a fourth scope level — so the same `has(permission, scope)` call answers it. **Adds a scope level to §6.2. Needs a ruling.** |
| OQ-M2-12 | **Blueprint PART B §5 scopes the audit log as "[MVP for payroll/statutory; full P2]"**, while dev-spec §4.2 says *every* mutating action writes an `AuditLog` and O6 makes append-only attribution a compliance contract across the product. | If "full audit is P2" is read literally, master-data and identity changes ship unaudited in MVP — and GA-08, a built MVP screen, would have nothing to show for a role grant or a PII reveal. Retrofitting audit onto mutations already written is the same class of cost as retrofitting RLS. | The dev spec and O6 win: audit every mutation from Sprint 0. **Correct the blueprint tag** — same class as conflicts C5/Q30. Not applied; scope tags are BATMAN's call. |
| OQ-M2-11 | **What is a "privileged" permission, exactly?** §4.4's second-approval rule and MFA both key off it, and the spec has no such classification. | If the list is invented per-story it will be inconsistent, and the second-approval gate will have holes. | Ship the classification as data on the catalogue: `payroll.approve`, `payroll.run`, `people.pii.read`, `iam.manage`, `org.manage`, `statutory.file`, `documents.child_safety.read`. Needs review by gordon. |

---

*Written by tn-alfred, 2026-09-07. No application code was written.*
