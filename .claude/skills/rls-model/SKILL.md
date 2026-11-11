---
name: rls-model
description: Use when creating any tenant-owned Django model in Naveya — scaffolds the tenant-scoped model, the RLS policy migration, and the cross-tenant isolation test as one unit.
---

# RLS Model (tenant-owned table)

Dispatch **oracle** (model + migration) + **wonder-woman** (RLS policy) together. One unit of work — see the tenancy rules in `docs/development-specification.md` and `backend/CLAUDE.md`.

1. **Model:** extends the tenant-scoped base model (`tenant_id` FK, tenant-scoped default manager, e.g. `.for_tenant(...)`). Never a bare `models.Model` for tenant data. Money fields are `Decimal`; PII fields (PAN/Aadhaar/UAN/ESIC/bank/salary/DOB/phone) are never logged and are masked at the API layer.

2. **Migration:** the **SAME** migration includes the `RunSQL`/`RunPython` that `ENABLE ROW LEVEL SECURITY` and creates the tenant policy. Canonical pattern:
   `USING (tenant_id = NULLIF(current_setting('tenure.tenant_id', true), '')::uuid)`.
   Both wrappers matter, not just one:
   - `current_setting(name, true)` (missing_ok=true), never the one-arg form — the one-arg form raises when the var is unset (any unauthenticated / fail-closed request), turning a correctly-denied read into a 500.
   - `NULLIF(..., '')` around it — missing_ok's NULL guarantee only holds for a connection that has *never* referenced this GUC name. Once any request on a reused/pooled connection has bound tenant context (`TenancyMiddleware` / `bind_tenant_rls`), Postgres remembers it as a backend-local placeholder, and every RESET/clear after that returns `''` (empty string), not NULL, for the rest of that connection's life — and `''::uuid` raises instead of denying. `NULLIF` collapses both "never set" and "set-then-cleared" to NULL before the cast so the policy stays fail-closed either way (Django uses persistent/pooled connections, so this is the normal case). Record the verified Postgres version in the migration comment. See `.claude/agent-memory/wonder-woman/rls-session-var-pattern.md`.
   `guard-rls-policy` blocks migrations that skip this. Truly global tables (StatutoryConfig templates, country reference data) get `# rls: exempt` + a comment justifying it.

3. **Isolation test, TDD-style:** add the model to bane's cross-tenant suite — create rows in tenant A, assert tenant B's session sees zero via BOTH the ORM path (`.for_tenant`) AND raw SQL (RLS backstop). This test failing is a CI gate, not a warning.

4. **Gate:** deathstroke review; migration reversible; `docs/adr/` note only if the model changes tenancy assumptions.
