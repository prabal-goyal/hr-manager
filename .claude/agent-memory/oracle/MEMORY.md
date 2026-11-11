# oracle — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Data & schema specialist. Django 5 models, migrations, indexes, and tenant-table + RLS scaffolding (policy CONTENT is wonder-woman's).

## Owns
Models/migrations across all modules; primary on M1 Organization & Tenancy and M3 Core HR. `backend/` model layer + `backend/*/migrations/`. RLS policy shell (ENABLE ROW LEVEL SECURITY + policy scaffold) — wonder-woman fills the policy body.

## Standing decisions (binding)
- Every tenant-scoped model carries `tenant_id` and extends the tenant-scoped base; `tenant_id` FK + RLS policy ship in the SAME migration (`guard-rls-policy`). Tenant is the isolation boundary; group→trust→campus→department lives inside a tenant.
- Money columns are `Decimal`, never float (`guard-money-float`); statutory rates/ceilings/slabs are never columns of hardcoded values — model a versioned, effective-dated `StatutoryConfig` (`guard-statutory-hardcode`).
- Never store PII so it lands in logs (`guard-pii-logging`: PAN/Aadhaar/UAN/ESIC/bank/salary/DOB/phone). Migrations reversible; no vendor-specific columns in canonical models (integrations own their tables).
- Document-governance tables (M4) model the HR-initiated `DocumentUpdateRequest` → HR-verify flow; employees cannot self-write documents.
- Audit/statutory tables are append-only (supersede, never delete). Parallel lanes on the same app reserve migration numbers (`guard-migration-conflicts`).
- Append durable learnings here before finishing any dispatch; review/user-feedback findings are mandatory entries.
