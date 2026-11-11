# Scope Decisions to Finalize

Before writing the full technical spec, these choices need to be locked. Each materially changes the
MVP data model, effort, or go-to-market. Answers get folded back into `functionality-blueprint.md`.

## Confirmed / LOCKED
- **Market:** India (full statutory stack: PF, ESI, PT, TDS, gratuity, LWF).
- **Institution scope (north star):** Any educational institution — pre-school, K-12 (single + group/trust), coaching, colleges/universities.
- **D1 — MVP segment: K-12 private / self-financed, MULTI-LOCATION.** ✅ *Group→trust→campus multi-branch hierarchy is IN the MVP (not deferred). Management-CTC payroll; pay-commission/UGC engine stays Phase 2.*
- **D2 — Substitute-teacher module: DEFERRED to Phase 2.** ✅ *Consequence: period-wise attendance/leave and timetable import also move to Phase 2 (they mainly fed substitution/workload). Half-day granularity stays MVP. Launch education-differentiation now rests on academic-calendar leave + vacation-staff logic + multi-scale payroll.*
- **D3 — Statutory: FULL greytHR parity in MVP.** ✅ *Includes gratuity (continuous-service tracking), bonus, LWF, signed Form 16/12BA, eTDS returns. Consequence: the Full & Final settlement engine is now MVP-coupled (gratuity + leave encashment at exit require it).*

## Scope-change log
- **2026-07-22 — Product named "Naveya" + ShriConnect alignment (five modules INTO MVP).** The product is
  officially **Naveya** (*nava* "new" + *nāv* "vessel/navigate" → "a new vessel that carries a school's people
  forward"; tagline *"Naveya — AI-powered HRMS, built by schools, for schools"*), built by **Voxturr Labs** in
  collaboration with **ShriConnect** (technology arm of The Shri Ram Schools group — a collaboration partner,
  not a competitor). Five previously-Phase-2 items are **RESOLVED as MVP**: (1) **Performance Appraisal /
  PAMS** — corporate goal/KRA baseline + 360° + cycles/rating matrix + increment/promotion recommendation +
  dept-wise reports + education extras (classroom-observation/peer, student-result linkage, student/parent
  360); **UGC-API scoring stays Later, CPD/in-service hours stay Phase 2**. New module **M17** in the dev
  spec. (2) **Loans & Advances**, (3) **Reimbursements / FBP**, (4a) **Arrears & retrospective pay-revision**
  → folded into **M10 Payroll**; (4b) **statutory / ex-gratia Bonus** → **M11 Statutory** (rates read from the
  versioned `StatutoryConfig`, never hardcoded). (5) **HR Helpdesk / ticketing & grievance** → **M15**, raised
  from ESS/mobile (M13). All financial finalizations (arrears/bonus runs, reimbursement payout batches) carry
  **maker-checker**. See `functionality-blueprint.md` (2026-07-22 notes) and dev-spec §M10/M11/M13/M15/M17.
- **2026-07-18 — API layer changed to mixed GraphQL + REST.** Supersedes the earlier "DRF REST + OpenAPI" (D6). Now: **strawberry-django GraphQL** primary (query surface + most mutations, DataLoader-batched) + **DRF REST edge** for ingestion/files/auth/integrations. Both feed generated TS + Dart clients (GraphQL SDL via graphql-codegen; REST via OpenAPI/drf-spectacular). Rationale: match the reference stack (recoveryco) and maximize reuse of its agents/skills/guards. See dev-spec §7.
- **2026-07-15 — Recruitment/ATS promoted into MVP.** The hire-to-onboard pipeline (requisition → posting → pipeline → interview → offer → **convert to employee**) is now Phase 1. Rationale: it feeds Core HR directly and gives a complete joiner journey without double data entry. AI resume parsing + recruitment analytics remain Phase 2.
- **2026-07-15 — HR-controlled document governance added (MVP).** HR/admin uploads employee documents at enrollment (or they arrive via ATS conversion). **Employees cannot self-update documents.** The only channel for an employee to supply/update a document is an **HR-initiated `DocumentUpdateRequest`** → employee uploads a response → **HR verifies** (promote) or rejects. Enforced server-side (Employee role lacks `documents.write`). Full spec in `development-specification.md` §M4.

## LOCKED (2026-07-15)

### D4 — SIS/ERP strategy → **(a) LOCKED**
HRMS-only product; **integrate** with existing school ERPs (Fedena, Teachmint, Entab, MasterSoft) via API,
**and own a minimal internal timetable/staff-structure store** so education features work even without a third-party ERP.

### D5 — College/university depth → **(a) LOCKED**
Schema designed to *allow* college/university, but **MVP targets K-12**. Per-lecture honorarium engine is in
MVP (also serves K-12 guest faculty); full UGC pay-matrix / API scoring is Phase 2.

### D6 — Tech / platform stack → **LOCKED**
- **Backend:** Django (Python) — DRF for the API layer. DB: **PostgreSQL** (recommended default given multi-tenancy + JSON config needs).
- **Web frontend:** Next.js (React/TypeScript).
- **Mobile:** **Flutter (Dart)** app + client SDK.
- **SDK / API:** **API-first with an OpenAPI contract** as the single source of truth. Generate **two clients from it** — a **TypeScript client** (Next.js web + ERP integrators) and a **Dart client** (Flutter mobile). DRF + `drf-spectacular` to emit the OpenAPI schema.
- **Hosting:** **primarily multi-tenant SaaS**; **on-prem / single-tenant deployment for enterprise** clients (a school or group of schools that require their own install).
- **Team / timeline:** ~2 engineers working with AI agents. Implies: favour boring, well-trodden tech; minimise custom infra; lean on Django batteries (admin, auth, migrations) and managed services.

### D7 — Multi-tenancy model → **(a) + (b) LOCKED**
Support **both** from one codebase:
- **(a) Multi-tenant SaaS** = default. One **tenant = one customer account**.
- **(b) Single-tenant on-prem** = for enterprise. One **tenant = the whole install**; the enterprise may itself contain sub-schools/branches.
- **Key layering:** the **tenant boundary sits ABOVE** the `Group → Trust/Society → Campus → Department` hierarchy. On-prem = the same app deployed as a single tenant.
> *Recommended build (for a 2-person team): row-level multi-tenancy — shared schema with a mandatory `tenant_id` + campus-scoped RBAC — enforced by a global query layer so no query can leak across tenants. On-prem = single-tenant instance of the identical image. Avoid schema-per-tenant/db-per-tenant complexity in MVP; revisit only if a SaaS enterprise (not on-prem) demands hard DB isolation.*
