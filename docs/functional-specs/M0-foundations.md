# M0 — Foundations · Functional Specification

> **Naveya** (*nava* "new" + *nāv* "vessel/navigate") — AI-powered HRMS, built by schools, for schools.
>
> **Module:** M0 Foundations (build-plan Sprint 0) · **Epic:** NA-13 · **Author:** tn-alfred · **Date:** 2026-09-07
> **Authority:** `docs/development-specification.md` §2, §3, §4, §7, §8, §10, §11, §12 ·
> `docs/decisions-to-finalize.md` D6 (superseded 2026-07-18 on the API layer), D7 ·
> `docs/functionality-blueprint.md` PART B §5 (audit), §6 (data security & PII), §7 (integration architecture) ·
> `docs/ui-compliance-requirements.md` O3, O6, O7, O11, O16, O17, O18 · `CLAUDE.md` non-negotiables.
>
> M0 is not a module in the spec's Part III module list — it is the **cross-cutting foundations** of §4
> plus the engineering chapters of Part IV, gathered into one buildable epic because the build plan
> (§12, Sprint 0) treats them as one. Every later module inherits what is decided here.

---

## 1 · Intent

Before a school can be set up, before a single teacher's record exists, the system needs a floor to stand
on: a database that physically cannot hand one school's staff list to another school, a login that issues
a token carrying which school you belong to, a record of every change that nobody can quietly rewrite, and
a way to ship all of it repeatably. M0 builds that floor. Nothing in M0 is visible to a Principal or an HR
Operator — and that is the point: it is the set of promises the product makes on their behalf, enforced by
the database and the pipeline rather than by anyone remembering. The build plan names tenant isolation as
critical-path risk #1 precisely because it is cheap now and prohibitively expensive to retrofit: every
table, every query, every test, and every fixture inherits the shape M0 chooses.

---

## 2 · Scope & surfaces

### In scope

| Area | What M0 delivers |
|---|---|
| Repo & toolchain | Monorepo layout (`backend/`, `frontend/`, `app/`), `uv`-managed Python, Django 5 project skeleton, per-environment settings, `backend/CLAUDE.md` |
| Local stack | Docker Compose: Postgres, Redis, app, Celery worker, Celery beat, object-store stub (MinIO) |
| **Tenant isolation** | `Tenant` model; `TenantScopedModel` base + auto-filtering manager; tenant-resolution middleware; Postgres session GUC; **RLS enable + FORCE + policy emitted per tenant-owned table in the same migration**; a repo-wide RLS conformance test |
| Auth primitives | JWT access + rotating refresh, DRF auth class, GraphQL context auth, password hashing, lockout + rate limiting, login audit. **Login/OTP endpoints and RBAC belong to [[M2-identity-access]]** — M0 delivers the token machinery M2 configures |
| API skeleton | strawberry-django schema entry point with tenancy-scoped context and `DjangoOptimizerExtension`; DRF REST edge with `drf-spectacular`; RFC-7807 error envelope; cursor pagination; `ETag`/`If-Match`; idempotency-key handling |
| Contract pipeline | `backend/schema.graphql` + `backend/openapi.json` committed; TS + Dart client generation; `check-contract-sync` in CI |
| Async | Celery + beat wiring with **tenant context propagation into every task**; Channels skeleton |
| Audit infrastructure | `AuditLog` table, the write path, the sensitive-field redaction registry, and **DB-level append-only enforcement**. The *viewer* and read API are [[M15-reporting-platform]]'s (GA-08) |
| Effective-dating pattern | The abstract base + supersession helper reused by contracts ([[M3-core-hr-people]]), salary ([[M10-payroll-core]]) and `StatutoryConfig` ([[M11a-statutory-config-versioning]]) |
| Safety primitives | `MoneyField` (Decimal); PII-redacting log filter; per-tenant object-storage key layout + signed URLs |
| CI/CD | ruff/black, eslint, **mypy + django-stubs as a blocking gate**, pytest with `db`/`slow`/`postgres` markers, migration check, contract diff, guard hooks |
| Test foundation | Factory-built fixtures including a **two-tenant** fixture that every isolation test uses |

### Explicitly out of scope

| Out | Owned by |
|---|---|
| The org hierarchy (Organization / LegalEntity / Campus / Department) | **[[M1-organization-tenancy]]** |
| Roles, permissions, role assignments, seed roles, login/OTP endpoints, MFA enrolment | **[[M2-identity-access]]** |
| Any staff data | **[[M3-core-hr-people]]** |
| Audit-log viewer, filters, export | **[[M15-reporting-platform]]** (GA-08) |
| Notification delivery | **[[M14-notifications]]** |
| Vendor adapters, webhooks, outbox | **[[M16-integrations]]** (martian) |
| RLS policy *content* for a domain table beyond the standard tenant predicate | **wonder-woman**, per table, in that table's own migration |
| DPDP consent/retention records and the data-protection console | **[[M15-reporting-platform]]** (GA-12) — M0 only provides the audit substrate they need |

### API surfaces

- **GraphQL (strawberry-django)** — primary. M0 ships the schema entry point, context, error mapping and
  optimizer extension. No domain types.
- **REST edge (DRF + drf-spectacular)** — auth endpoints, file up/download, ingestion, integrations.
  M0 ships the router, the versioned prefix `/api/v1/`, the problem+json handler and the OpenAPI emitter.
- **Client surfaces consuming M0 directly:** none. Web (`frontend/`) and mobile ([[M13-ess-mobile]], `app/`) consume the
  *generated clients* M0 produces; the design screens depend on M0 only through the guarantees it makes.

---

## 3 · Data model

Three tables. Everything else in M0 is behaviour.

### 3.1 `Tenant` (§6.1)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `name` | text | |
| `slug` | text, unique | subdomain resolution |
| `deployment_mode` | enum `saas` \| `on_prem` | §3 — on-prem is the same image with one tenant |
| `status` | enum `active` \| `suspended` \| `closed` | SH-01 must render a tenant-level message on `suspended` |
| `data_region` | text | DPDP data-residency |
| `created_at`, `updated_at` | timestamptz | |

**No `tenant_id`** — the tenant *is* the boundary (§6.1). It still carries RLS: a policy
`USING (id = current_tenant())` so a request cannot enumerate the tenant table. Bootstrap/admin work runs
in an explicit elevated context (§4.4 below).

### 3.2 `AuditLog` (§6.11, §4.2)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK → Tenant, not null | **tenant_id + RLS policy ship in the SAME migration** |
| `actor_user_id` | UUID, nullable | null = system/scheduled actor; `actor_kind` distinguishes |
| `actor_kind` | enum `user` \| `system` \| `service_token` \| `agent` | |
| `action` | text | stable machine code, e.g. `employee.contract.superseded` |
| `entity` | text | app-qualified model label |
| `entity_id` | UUID | |
| `before`, `after` | JSONB | **redacted per the sensitive-field registry** (§4.5 below) |
| `sensitivity_class` | enum `standard` \| `pii_access` \| `child_safety` \| `money` \| `statutory` | drives GA-08's high-sensitivity views |
| `scope_level`, `scope_id` | enum + UUID, nullable | the scope the action was taken at |
| `request_id`, `ip`, `user_agent` | text, nullable | never PII-bearing |
| `created_at` | timestamptz | |

**Append-only is enforced in the database, not by convention:** the migration creates a `BEFORE UPDATE OR
DELETE` trigger that raises, and `REVOKE UPDATE, DELETE ON audit_log FROM <app_role>`. Belt and braces,
because §4.2 calls it "non-bypassable" and M15's acceptance criterion is "audit log is append-only".

### 3.3 `IdempotencyKey` (§7 Concurrency)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID pk | |
| `tenant_id` | FK, not null | tenant_id + RLS policy in the SAME migration |
| `key` | text | client-supplied; unique with `(tenant_id, endpoint)` |
| `endpoint` | text | |
| `request_fingerprint` | text | hash of the canonicalised payload — a same-key/different-body retry is a conflict, not a replay |
| `status` | enum `in_flight` \| `completed` \| `failed` | |
| `response_snapshot` | JSONB | replayed verbatim on a duplicate |
| `created_at`, `expires_at` | timestamptz | |

M0 ships the machinery; §7 requires it on payroll/statutory/settlement actions ([[M10-payroll-core]],
[[M11-statutory-compliance]], [[M12-full-and-final]]), which simply declare themselves idempotent.

### 3.4 The tenant-owned-table contract (binding on every later module)

Every tenant-owned table, in every module, carries:

1. `tenant_id` — FK to `Tenant`, **NOT NULL**, indexed, and first in every composite index that supports a
   scoped query.
2. In the **same migration**: `ALTER TABLE … ENABLE ROW LEVEL SECURITY;`,
   `ALTER TABLE … FORCE ROW LEVEL SECURITY;`, and a policy
   `USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant())`.
   The `WITH CHECK` half matters as much as `USING` — without it a caller can *write* a row into another
   tenant even though it cannot read one back.
3. A Django model inheriting `TenantScopedModel`, whose default manager filters by the active tenant and
   whose `save()` refuses a row whose `tenant_id` is not the active tenant.

`FORCE ROW LEVEL SECURITY` is not optional: without it the table **owner** bypasses every policy, and in a
single-database deployment the owner is exactly who the app is most likely to connect as by accident.

---

## 4 · Behaviour walk-through

### 4.1 Happy path — a request

1. The client presents a JWT bearer token. The token carries `sub` (user), `tid` (tenant), `jti`, `exp`
   (~15 min) — and **nothing about permissions** (see §4.7).
2. Middleware verifies the token, loads the tenant, and rejects on: bad signature, expiry, unknown tenant,
   `tenant.status != active`.
3. Middleware opens the request transaction and issues `SET LOCAL app.tenant_id = '<uuid>'`. `SET LOCAL`
   is transaction-scoped, so a pooled connection cannot carry the value into the next request.
4. Resolvers run. The ORM manager filters by tenant; RLS re-filters underneath it. Both must agree —
   agreement is the point, redundancy is the defence.
5. Mutations write their `AuditLog` row inside the same transaction. An audit write that fails rolls the
   mutation back; §4.2 says the trail is non-bypassable, and a mutation that committed without its audit
   row would make that false.
6. The transaction commits; the GUC dies with it.

### 4.2 States and modes

| Mode | Tenant resolution | Notes |
|---|---|---|
| SaaS request | JWT `tid` claim; subdomain cross-checked when present | tenant is **never** a client-settable parameter (§7 Tenancy; ui-compliance §3 "never build") |
| On-prem request | Same code path; exactly one tenant exists | `deployment_mode='on_prem'` — no fork (§3) |
| Celery task | Tenant id travels in the task headers; the task body opens its own transaction and sets the GUC | a task dispatched **without** a tenant id raises at entry — it does not default to "all" |
| Scheduled/beat task | Enumerates tenants explicitly and runs one bounded unit per tenant | never a single cross-tenant query |
| Management command / migration | Explicit `with elevated_tenant_context(...)` or a documented superuser path | the only place the tenant filter is legitimately absent, and it is named in code |
| Anonymous request | Public ATS surfaces ([[M5-recruitment-ats]] `PUB-01..04`) resolve the tenant from the **posting token or hostname**, never from a body field | M5's problem, M0's rule |

### 4.3 Edge cases and error paths

| Situation | Behaviour |
|---|---|
| GUC not set | `current_setting('app.tenant_id', true)` is NULL → the policy predicate is NULL → **zero rows**. Fail closed. A missing tenant context can never widen access |
| Token with a tenant the user has no membership in | 401 `auth_tenant_mismatch`; audited as a security event |
| Tenant suspended | 403 `tenant_suspended`, distinct code so SH-01 can say so in words |
| ORM filter forgotten in hand-written SQL | RLS still filters. The isolation test suite exercises this deliberately by running raw SQL |
| Non-atomic view (a streaming file response) | `SET LOCAL` requires a transaction. Any view outside `ATOMIC_REQUESTS` must use the explicit `tenant_context()` context manager; a CI check flags views that opt out of atomicity without it |
| pgbouncer in transaction pooling | Safe **because** the GUC is `SET LOCAL`. A `SET` (session-scoped) would leak across tenants on a reused connection — this is the single most dangerous plausible mistake in M0 and is covered by a named test |
| Duplicate idempotency key, same body | The stored response is replayed; no second execution |
| Duplicate key, different body | 409 `idempotency_key_reuse` |
| Clock skew / expired refresh | Rotating refresh with **reuse detection**: a replayed refresh token revokes the whole family and audits it |
| Audit write fails | The enclosing mutation rolls back |
| Attempt to UPDATE/DELETE an audit row | DB trigger raises; surfaced as 500-class internal error and alerted — this path should be unreachable from application code |

### 4.4 Concurrency

- Mutable records use `ETag` / `If-Match`; a mismatch is 412 `precondition_failed` with the standard
  "someone else changed this — reload" contract the screen inventory assumes on every edit action.
- Money and statutory actions additionally require an idempotency key (§7).
- Effective-dated records do not "update" at all — they supersede (§4.3, O18). M0 ships the base class;
  overlap prevention is the owning module's constraint ([[M3-core-hr-people]] uses a Postgres `EXCLUDE`
  constraint; [[M10-payroll-core]] and [[M11a-statutory-config-versioning]] reuse the same base).

### 4.5 PII and logging

- A **sensitive-field registry** is declared per model (`Meta.sensitive_fields`). Two consumers:
  1. the audit redactor — a diff on a registered field records `{"field": "bank_account", "changed": true}`
     and **never the old or new value** (§8, O3, GA-08 "must NOT contain PII values in plain text");
  2. the log filter — a structured-logging processor that drops any record whose payload contains a
     registered field name or a value matching PAN/Aadhaar/UAN/ESIC/IFSC/account/phone shapes.
- Logs identify subjects by **opaque UUID only**. Not `emp_code`, not name (`guard-pii-logging`, O11).
- Backend responses carry machine-readable `code`s; human copy is the client's, from i18n files
  (`guard-i18n-strings`). The exceptions — where the backend renders the artefact — are notification
  bodies ([[M14-notifications]]) and generated PDFs ([[M10-payroll-core]], [[M11-statutory-compliance]]),
  and those carry their own Hindi/English obligation.

### 4.6 i18n and a11y obligations of M0

- **i18n:** every error the API returns has a stable `code` plus optional `field`; no user-facing English
  sentence is the contract. `Accept-Language` is parsed and stored on the request context so any
  backend-rendered artefact can honour it. Hindi + English parity (O12) is a client obligation that M0
  must not make impossible by returning prose.
- **a11y:** M0 has no UI. Its obligation is to keep a11y *achievable*: pagination is cursor-based and
  stable (a screen reader re-reading a list must not see rows shuffle), errors are field-addressable so a
  form can move focus to the offending input, and long operations expose a poll-able status rather than
  requiring the client to spin blind.

### 4.7 Why the token carries no permissions

The design (GA-04) currently says permissions "apply on the next token refresh". A 15-minute window in
which a revoked Group Admin still holds `payroll.approve` is a security defect, not a caching strategy.
M0's token therefore carries identity + tenant only; **[[M2-identity-access]] resolves permissions server-side per request**,
cached against a per-user `assignment_epoch` that any grant/revoke bumps. Revocation is immediate.
*This changes one line of GA-04's copy — flagged in §8 as OQ-M0-06 rather than applied unilaterally.*

---

## 5 · Acceptance criteria

| # | Acceptance criterion | Spec citation |
|---|---|---|
| M0-AC-01 | The Django project boots against Postgres and Redis from `docker compose up` with no manual step, and the same image runs with `deployment_mode='on_prem'` and a single tenant. | §3, §10 |
| M0-AC-02 | `Tenant` exists with `deployment_mode`, `status`, `data_region`, and carries no `tenant_id` column. | §6.1 |
| M0-AC-03 | Every tenant-owned table carries a NOT-NULL `tenant_id` FK **and** `ENABLE`+`FORCE ROW LEVEL SECURITY` **and** a `USING`+`WITH CHECK` policy, all created in the **same migration** as the model. | §3, `guard-rls-policy`, O7 |
| M0-AC-04 | A repo-wide **conformance test** reflects over every concrete model inheriting `TenantScopedModel`, queries `pg_class`/`pg_policies`, and fails naming any table lacking `relrowsecurity`, `relforcerowsecurity`, or a policy. Adding a model without a policy fails CI even if the guard hook is bypassed. | §3, §11, O7 |
| M0-AC-05 | With the ORM tenant filter deliberately disabled, a raw SQL `SELECT` for tenant B's rows executed in tenant A's context returns **zero rows**; the same `INSERT` with tenant B's id is **rejected** by the `WITH CHECK` predicate. | §3, §11 "tenant-isolation tests", O7 |
| M0-AC-06 | With no `app.tenant_id` set, every tenant-owned table returns zero rows and every insert is rejected. Absence of context never widens access. | §3, O7 |
| M0-AC-07 | The application database role has neither `BYPASSRLS` nor ownership of the tenant-owned tables; a test asserts this against `pg_roles`. | §3, §8 |
| M0-AC-08 | The tenant GUC is set with `SET LOCAL` inside the request transaction; a test running two sequential requests for different tenants over one pooled connection proves no leakage. | §3, §7 |
| M0-AC-09 | Tenant is resolved from the JWT claim (and cross-checked against the subdomain when present) and is never readable from a request body or query parameter; a request attempting to set it is rejected. | §7 Tenancy |
| M0-AC-10 | A Celery task dispatched without a tenant id raises at entry rather than executing; a task with one runs inside a transaction with the GUC set. | §3, §2 |
| M0-AC-11 | JWT access tokens expire in ~15 minutes; refresh tokens rotate; replay of a used refresh token revokes the token family and writes an audited security event. | §7 Auth, §8 Auth hardening, O16 |
| M0-AC-12 | Failed logins are rate-limited and lock out after N attempts; the failure response is non-enumerating (identical for unknown staff ID and wrong password); every login attempt is audited. | §8 Auth hardening, O16 |
| M0-AC-13 | Every mutating operation writes an `AuditLog` row in the same transaction; a forced audit-write failure rolls the mutation back. | §4.2, O6 |
| M0-AC-14 | `UPDATE` and `DELETE` on `audit_log` are refused by a database trigger **and** by revoked privileges — proven by a test that attempts both as the application role. | §4.2, M15 §Acceptance, O6 |
| M0-AC-15 | An audit diff on a registered sensitive field records that the field changed and **never** the old or new value; a test asserts no PAN/Aadhaar/bank value can be recovered from `audit_log`. | §8, GA-08 must-NOT-contain, O3, O6 |
| M0-AC-16 | The structured-logging filter drops PAN, Aadhaar, UAN, ESIC, bank account, IFSC, salary, DOB and phone from any log record; subjects appear as opaque UUIDs. | `guard-pii-logging`, §8, O11 |
| M0-AC-17 | Monetary fields use a `Decimal`-backed column type; a `FloatField` on a monetary field fails CI. | `guard-money-float`, M10 §Business rules |
| M0-AC-18 | The GraphQL schema exports to a committed `backend/schema.graphql` and the REST edge to a committed `backend/openapi.json`; CI fails on drift between source and artefact. | §7 Contract, `check-contract-sync` |
| M0-AC-19 | TypeScript and Dart clients are generated from both artefacts and compile in CI; a breaking schema change fails the build. | §7, §11 Contract |
| M0-AC-20 | GraphQL resolvers run under `DjangoOptimizerExtension`; a test asserts a two-level relation traversal issues a bounded number of queries. | §7, `guard-missing-dataloader` |
| M0-AC-21 | Errors are RFC-7807 problem+json with a stable machine-readable `code` and field-level validation detail; no user-facing English sentence is the contract. | §7 Errors |
| M0-AC-22 | List endpoints paginate by cursor; a stable sort key is required and an unstable one is rejected at schema-build time. | §7 Pagination |
| M0-AC-23 | Mutable records support `ETag`/`If-Match`; a stale `If-Match` returns 412 `precondition_failed`. | §7 Concurrency, O18 |
| M0-AC-24 | An action declared idempotent replays its stored response for a repeated key with the same body, and returns 409 for the same key with a different body. | §7 Concurrency, O17 |
| M0-AC-25 | `mypy` with `django-stubs` runs as a **blocking** CI gate; all public functions carry type hints. | `CLAUDE.md` Type safety, §10 |
| M0-AC-26 | CI runs ruff/black, unit + integration tests, migration check, contract diff and client generation; merge is blocked on any red. | §10 |
| M0-AC-27 | Object-storage keys are namespaced per tenant and access is by short-lived signed URL; a signed URL issued for tenant A's key cannot be minted from tenant B's context. | §2, §8 Encryption, O7, O10 |
| M0-AC-28 | The effective-dating base provides supersession (never in-place edit) and is the pattern contracts ([[M3-core-hr-people]]), salary ([[M10-payroll-core]]) and `StatutoryConfig` ([[M11a-statutory-config-versioning]]) reuse. | §4.3, O18 |
| M0-AC-29 | The test suite ships a **two-tenant** factory fixture; every isolation test uses it and no isolation test constructs its own second tenant ad hoc. | §11 Data fixtures |
| M0-AC-30 | Unit tests are marked `db`/`slow`/`postgres` so the fast suite runs without a database where the behaviour is not persistence. | `CLAUDE.md` Testing standards |

---

## 6 · Testing

| Level | Owner | What it proves |
|---|---|---|
| Unit | **deathstroke** | `tenant_context()` sets and unsets the GUC; the manager refuses a foreign-tenant `save()`; JWT encode/decode incl. expiry and rotation; refresh-reuse detection; the PII log filter against a table of realistic-shaped values (PAN `ABCDE1234F`, IFSC, 12-digit Aadhaar, 10-digit phone); the audit redactor against a model with and without a sensitive registry; `MoneyField` quantisation and refusal of `float`; idempotency fingerprint canonicalisation; RFC-7807 serialisation; cursor encode/decode stability |
| Integration / RLS | **bane** | **The isolation matrix**: for each tenant-owned table × {select, insert, update, delete} × {ORM, raw SQL}, tenant A's context reaches zero of tenant B's rows and writes none. Zero-context queries return nothing. Connection-reuse test across two tenants on one pooled connection. App role has no `BYPASSRLS` and is not the table owner. Celery task without a tenant header raises; with one, isolates. Audit `UPDATE`/`DELETE` raise. A mutation whose audit write fails leaves no committed row. Signed-URL cross-tenant mint refused |
| Conformance | **bane** | The reflective sweep of AC-04, run in CI on every migration — the assertion that makes a missing policy impossible rather than merely discouraged |
| Contract | **cyborg** + CI | SDL and OpenAPI artefacts match the live schema; generated TS compiles under `strict`; generated Dart analyses clean under `strict-casts`/`strict-inference`/`strict-raw-types` |
| Performance smoke | **bane** | A 10k-row scoped list query uses the `(tenant_id, …)` index — RLS predicates must not degrade to a sequential scan, because every later module's list screen inherits this plan |

Assertions reference the source of truth — model metadata, `pg_catalog`, the sensitive registry, the
factories — never a re-typed literal (`CLAUDE.md` Testing standards).

---

## 7 · Proposed stories

Sprint 0 throughout. Owners per `docs/development-specification.md` module ownership.

| # | Title | Intent | Owner | Pts | Depends on |
|---|---|---|---|---|---|
| M0-S01 | Monorepo skeleton, uv toolchain and Django 5 project | A `backend/` that boots, with per-environment settings and `backend/CLAUDE.md`. | oracle | 3 | — |
| M0-S02 | Docker Compose local stack | Postgres, Redis, app, worker, beat, MinIO — one command, no manual step. | cyborg | 3 | M0-S01 |
| M0-S03 | `Tenant` model and bootstrap | The isolation boundary itself, plus an on-prem single-tenant bootstrap command. | oracle | 3 | M0-S01 |
| M0-S04 | **RLS substrate: GUC, roles, policy helper, migration operation** | `current_tenant()`, the non-owner app role, and a reusable migration operation that emits ENABLE+FORCE+policy so a model author cannot forget. | wonder-woman | 8 | M0-S03 |
| M0-S05 | `TenantScopedModel`, manager and `tenant_context()` | The ORM half of the layered defence, and the only sanctioned way to leave tenant scope. | oracle | 5 | M0-S04 |
| M0-S06 | Tenant-resolution middleware + `SET LOCAL` in the request transaction | Token → tenant → GUC, fail-closed, with the atomicity rule enforced. | wonder-woman | 5 | M0-S05 |
| M0-S07 | **RLS conformance test + cross-tenant isolation matrix** | The test that makes a missing policy a CI failure, and the raw-SQL proof that the backstop holds. | bane | 8 | M0-S06 |
| M0-S08 | JWT access/refresh with rotation and reuse detection | Token machinery M2 will configure; lockout and rate limiting on the primitive. | wonder-woman | 5 | M0-S01 |
| M0-S09 | `AuditLog` table, write path and DB-level append-only | The trail, made unrewritable by the database rather than by discipline. | oracle | 5 | M0-S04 |
| M0-S10 | Sensitive-field registry, audit redactor and PII log filter | A diff records *that* a sensitive field changed; no log line can carry PII. | wonder-woman | 5 | M0-S09 |
| M0-S11 | strawberry-django schema entry point, context and optimizer | The GraphQL front door, tenancy-scoped and N+1-resistant from the first resolver. | cyborg | 5 | M0-S06 |
| M0-S12 | DRF REST edge, RFC-7807 errors, cursor pagination, ETag | The REST half and the cross-cutting API conventions every module reuses. | cyborg | 5 | M0-S06 |
| M0-S13 | Idempotency-key middleware and store | A retry on a money action never double-processes — built now, consumed in Sprint 7. | cyborg | 3 | M0-S12 |
| M0-S14 | Celery + beat with tenant propagation; Channels skeleton | Async work that cannot run tenant-blind. | cyborg | 5 | M0-S06 |
| M0-S15 | Contract pipeline: SDL + OpenAPI artefacts, TS + Dart codegen, drift gate | Generated clients, never hand-written, with CI failing on drift. | cyborg | 5 | M0-S11, M0-S12 |
| M0-S16 | `MoneyField`, effective-dating base, per-tenant object storage | The three shared primitives later modules must not reinvent. | oracle | 3 | M0-S05 |
| M0-S17 | CI pipeline incl. blocking mypy + django-stubs | Lint, types, tests, migration check, contract diff — merge blocked on red. | cyborg | 5 | M0-S15 |
| M0-S18 | Test foundation: factories, two-tenant fixture, pytest markers | The fixture every isolation test in the product will use. | deathstroke | 3 | M0-S05 |

**Total: 18 stories, 84 points.**

---

## 8 · Open questions & conflicts

| # | Question / conflict | Why it matters | Recommendation (not applied) |
|---|---|---|---|
| OQ-M0-01 | **Is `AuditLog` partitioned, and what is its retention?** §4.2 mandates the trail; §8 mandates DPDP retention windows; nothing says how long audit rows live or how they are archived. GA-08 already renders a `[proposed]` "retention boundary reached" state. | An unpartitioned audit table on a 2,000-staff group becomes the largest table in the product within a year, and a retention rule invented later cannot be applied retroactively without violating append-only. | Monthly range partitioning on `created_at` from day one; retention as a *policy record* ([[M15-reporting-platform]], GA-12) rather than a delete. Needs a legal call on minimum retention. |
| OQ-M0-02 | **Does an on-prem install still enforce RLS?** §3 says on-prem is the identical image with one tenant. With one tenant, RLS is inert — but disabling it "because on-prem" would fork the security model. | If on-prem quietly runs without RLS, the isolation tests stop testing the shipped configuration. | Keep RLS enabled and identical in both modes. No configuration flag exists to disable it. Confirming. |
| OQ-M0-03 | **Who owns tenant provisioning?** No module in M1–M17 creates a `Tenant`. SaaS signup, trial, suspension and closure are unowned. | Sprint 0 needs *some* way to create a tenant, and "a management command" is a decision, not an absence. | M0 ships a management command + an internal-only endpoint; a customer-facing provisioning surface is out of MVP and should be recorded as such. |
| OQ-M0-04 | **Service tokens for ingestion** ([[M9-attendance]] `POST …/attendance/ingest`, [[M16-integrations]]) need a tenant and a scope but are not users. §6.2 has no service-principal entity. | Attendance ingestion is Sprint 6; if the token model is invented then, it will not carry a tenant the same way and RLS will be reasoned about twice. | Define `ServiceToken` (tenant, label, scopes, secret hash, last_used_at, revoked_at) in M0 alongside JWT, even though its consumers arrive later. |
| OQ-M0-05 | **Is `Tenant.status='suspended'` read-only or fully closed?** SH-01 promises a tenant-level message; nothing says whether a suspended tenant's payroll data is still readable by its own admins. | A billing suspension that also hides a school's statutory records is a compliance problem, not a commercial lever. | Suspended = no write, read allowed for statutory artefacts. Needs a product ruling. |
| OQ-M0-06 | **Permission freshness in the token.** GA-04's copy says role changes apply "on the next token refresh"; M0 recommends server-side resolution so revocation is immediate. | A 15-minute window of stale `payroll.approve` after a revocation is the exact failure the maker-checker control exists to prevent. | Resolve permissions per request against an `assignment_epoch`; update GA-04's copy to "applies immediately". **Design copy change — needs BATMAN's sign-off** (see [[M2-identity-access]] §8). |
| OQ-M0-07 | **Do we run one database role per tenant, or one app role for all?** D7 locks row-level multi-tenancy, which implies one role. | A future SaaS enterprise demanding hard DB isolation (D7's own "revisit only if") would need a different connection strategy. | One app role for MVP, as D7 says. Record it as a knowingly-taken decision so the revisit is cheap. |
| OQ-M0-08 | **Where does `request_id` come from, and is it propagated to Celery and the clients?** §10 requires observability but names no correlation id. | Without one, a payroll run spanning API + 12 tasks cannot be reconstructed from logs — and the logs are all we have, because they carry no PII. | Generate at the edge, echo in the problem+json envelope and every audit row, propagate through task headers. |

**No conflict found between M0 and the built design screens.** M0 has no UI. The one design-facing
consequence is OQ-M0-06.

---

*Written by tn-alfred, 2026-09-07. No application code was written. Stories are proposals for BATMAN to
file; `create_work_item` is denied to this agent by design.*
