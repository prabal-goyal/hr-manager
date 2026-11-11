# Naveya — School HRMS Documentation

**Naveya** (*nava* "new" + *nāv* "vessel / to navigate" — "a new vessel that carries a school's people
forward") is an HRMS for Indian educational institutions (pre-school → K-12 → coaching → college/university),
benchmarked against Keka, Zoho People, greytHR, and HROne. Tagline: *Naveya — AI-powered HRMS, built by
schools, for schools.* Built by **Voxturr Labs** in collaboration with **ShriConnect**, the technology arm of
The Shri Ram Schools group.

## Documents
0. **[executive-summary.md](./executive-summary.md)** — business front-matter: opportunity, differentiation, scope, stack, delivery approach.
1. **[competitor-analysis.md](./competitor-analysis.md)** — feature/pricing comparison of the four reference products, a per-module capability matrix, and the gaps none of them close.
2. **[functionality-blueprint.md](./functionality-blueprint.md)** — the candidate functionality set organized into modules + cross-cutting concerns, every item tagged **MVP / Phase 2 / Later**, with a recommended MVP scope.
3. **[decisions-to-finalize.md](./decisions-to-finalize.md)** — scope decisions D1–D7 (all locked) + scope-change log.
4. **[development-specification.md](./development-specification.md)** — **the authoritative build document**: architecture, full data model, per-module functional + technical specs with workflows, API design, security/DPDP, testing, and a sprint-by-sprint build plan. *(Supersedes the earlier foundation-and-workflows draft.)*

5. **[architecture.md](./architecture.md)** — system design + full tech stack for the **production build** (a separate repo): TypeScript end-to-end — NestJS + Drizzle + PostgreSQL RLS + BullMQ + Better Auth, Next.js web, Expo mobile, pnpm/Turborepo monorepo, AWS. Covers tenancy, payroll engine, money, files, outbox, filings, offline sync, deployment (SaaS + on-prem), testing, open decisions D-1–D-12 and first milestones. *Supersedes the prototype's Django/GraphQL/Flutter stack.*

The combined branded PDF of docs 0–4 is generated at **[pdf/school-hrms-product-definition.pdf](./pdf/school-hrms-product-definition.pdf)**.

## Product thesis (one line)
A **compliant Indian staff-payroll HRMS that is unmistakably built for schools** — matching greytHR/Keka
on statutory payroll, while leading with the education gaps competitors can't close: academic-calendar
leave, vacation-staff pay logic, period-level attendance/leave, and substitute-teacher arrangement.

## Tech stack (locked)
Django + DRF · **strawberry-django GraphQL + REST edge** (PostgreSQL) · Next.js web · **Flutter** mobile · GraphQL SDL + OpenAPI → TypeScript + Dart clients ·
multi-tenant SaaS (default) + single-tenant on-prem for enterprise · row-level tenancy, campus-scoped RBAC.
Team: ~2 engineers + AI agents.

## Scope changes since v0.1
- **2026-07-15:** Recruitment/ATS **promoted into the MVP**; **HR-controlled document governance** added
  (HR uploads at enrollment; employees update only via an HR-initiated request → HR verification; no self-update).
- **2026-07-22 (ShriConnect alignment):** five modules pulled **into the MVP** — **Performance Appraisal /
  PAMS** (new module M17), **Loans & Advances**, **Reimbursements / FBP**, **Arrears & retrospective
  pay-revision + statutory/ex-gratia Bonus** (all folded into Payroll/Statutory), and an **HR Helpdesk /
  ticketing** surface. Product named **Naveya**.

## Status
Research + scope (D1–D7 locked) + functionality + **full development specification** complete.
**Next step:** begin implementation from Sprint 0 (foundations) per the build plan in the dev spec.
