# BATMAN memory (main-session orchestrator)

Index of the orchestrator's standing state. Rules that apply to everyone live in the root `CLAUDE.md` (always loaded) — do not restate them here. One line per entry; detail goes in topic files. Supersede or delete stale entries; git keeps the history.

**Recovery order after context loss:** this file → `git log` → `docs/` (development-specification.md + learnings).

## Standing decisions (binding, only recorded here)

- **Product name = Naveya** (OFFICIAL, product-facing — from the client deck `docs/Naveya-School-HRMS-Voxturrlabs.pdf`; nava "new" + nāv "vessel/navigate"). The old name "Tenure" (pre-2026-09 rebrand) is being migrated out everywhere — do not use it. Design wordmarks already switched to Naveya (2026-07-22). Multi-tenant HR & payroll SaaS for Indian educational institutions; private multi-branch K-12 first; schema supports pre-school → college. On-prem single-tenant option. **Built by Voxturr Labs in collaboration with ShriConnect** (technology arm of The Shri Ram Schools group) — ShriConnect is a COLLABORATION PARTNER, not a competitor; `docs/123.png` is their feature expectation (5 modules), treated as partner requirements.
- **Scope change 2026-07-22 (ShriConnect alignment):** five items pulled INTO MVP — (1) Performance Appraisal / PAMS baseline (goal/KRA-KPI, self+manager review, 360, cycles+rating matrix, increment/promotion recs, reports + edu extras: classroom obs, result linkage, parent 360; UGC-API & CPD stay Later/P2), (2) Loans & Advances, (3) Reimbursements/FBP + ESS claims, (4) Arrears/retro pay-revision + statutory/ex-gratia Bonus, (5) HR Helpdesk/ticketing. Reflected in `docs/functionality-blueprint.md`; still needs propagating into `docs/development-specification.md` (M10/M13/M15 + a PAMS module) at dev start via alfred.
- **Stack:** Django 5 + DRF + strawberry-django GraphQL (primary API) + DRF REST edge + Celery + Channels + PostgreSQL RLS. Frontend Next.js (React/TS, Tailwind, shadcn, TanStack, NextAuth). Mobile Flutter (MVVM + Repository, Riverpod, drift, graphql/dio). Monorepo `backend/ frontend/ app/` — none scaffolded yet; only `docs/` + `design/` exist. Types generated from GraphQL SDL + OpenAPI → TS + Dart. _(prototype plan — superseded for production by the 2026-11-09 architecture below)_
- **Architecture 2026-11-09 (BASELINE for the production build):** this repo is a PROTOTYPE; the real product is built in a separate new repo. User chose **TypeScript end-to-end**: NestJS 11 (Fastify) + Drizzle + PostgreSQL RLS + BullMQ/Valkey + transactional outbox + Better Auth; Next.js web (same-origin /api via CloudFront, no NextAuth); Expo mobile (recommended, D-1 open); REST + Zod→OpenAPI only (no GraphQL); pure `packages/payroll-engine` with decimal.js Money; AWS Mumbai + Hyderabad DR on ECS Fargate. Full doc: `docs/architecture.md` (portable — meant to be copied into the new repo). Open decisions D-1..D-12 (§27), incl. Form 16 signing method (D-7) and Better Auth week-1 spike (D-11).

## Doc index

- `docs/development-specification.md` — authoritative build spec: modules M1–M16 (M1 Org/Tenancy, M2 Identity/Roles/Access, M3 Core HR, M4 Document Governance ★, M5 Recruitment/ATS ★ now MVP, M6 Onboarding, M7 Academic Calendar, M8 Leave, M9 Attendance, M10 Payroll, M11 Statutory, M12 F&F, M13 ESS/Mobile, M14 Notifications, M15 Reporting/Platform, M16 Integrations) + data model + sprint plan.
- `docs/functionality-blueprint.md` — MVP / Phase 2 / Later scope.
- `docs/executive-summary.md` — product intent. `docs/competitor-analysis.md` — market.
- `docs/decisions-to-finalize.md` — open-questions parking lot.
- `DESIGN.md` + `design/v3/` — canonical v3 "Staffroom Terracotta" design system.

## Open — needs a human ruling

- PII self-view contradiction, consent-vs-legal basis, ESS self-serve profile, cover scope — see "OPEN RULINGS" in [v3 build history](history-v3-build-2026-09.md).
- PY-07 / AC-02 approve control (hidden vs disabled-with-reason) must be written into the compliance doc — see "OPEN SPEC CONFLICT" in [design rounds](history-design-rounds-2026-09-10.md).
- Kit `Tabs` lacks `role="tabpanel"`/`aria-controls` — see "OPEN" in [v3 build history](history-v3-build-2026-09.md); verify whether a later round fixed it.
- Parked Keka typography items (weight restraint, column headers, density) — see "PARKED" in [v1/v2 history](history-design-v1-v2-2026-07-08.md).

## Current work

- [UI fix programme 2026-11](project-ui-fix-programme-2026-11.md) — critique 25/40; M1 phone + M2 nav shell done; M3–M5 pending; bilingual Hindi+English ruling.
- [Prototype vs real repo](project-prototype-vs-real-repo.md) — this repo is prototype only; production is a separate TypeScript repo.

## Decisions & feedback

- [TrackFlow removed](decision-trackflow-removed.md) — 2026-11-07; TodoWrite + repo state only.
- [Subagent tools list is exhaustive](feedback_subagent_tools_list_is_exhaustive.md) — naming any tool excludes MCP.

## History (read on demand)

- [Design v1/v2, Jul–Aug 2026](history-design-v1-v2-2026-07-08.md) — Peacock, Staffroom v2 reset, Keka capture, role model lock.
- [v3 build, Sep 2026](history-v3-build-2026-09.md) — Terracotta direction, Wave 1 role screens, Warm Grotesk type, palette rounds.
- [Designer rounds 10–143, Sep–Oct 2026](history-design-rounds-2026-09-10.md) — per-screen rulings; the **bold** phrases are durable design rules worth distilling into DESIGN.md.

## Wave / sprint checkpoint

_Status: scope-finalization stage — no dev sprint started; backend/ frontend/ app/ not yet scaffolded._

When dev begins, replace this section with the live checkpoint: active sprint UUID + dates, in-flight work items and their owning agents, running worktrees (never touch a live one), the merge queue, and the NEXT action after current lanes drain. Update it at every dispatch, wave boundary, and user decision — this is the first thing a resumed session reads.
