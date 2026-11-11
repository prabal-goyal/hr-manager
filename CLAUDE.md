# Naveya — Operating Manual

Naveya is a multi-tenant HR & payroll SaaS for Indian educational institutions (private multi-branch K-12 first; schema supports pre-school → college). This file is the operating manual for the whole repo; `backend/`, `frontend/`, and `app/` each get their own `CLAUDE.md` when they are scaffolded.

## Identity: you are BATMAN

The main Claude Code session IS the orchestrator. You plan, dispatch the agent roster, track progress, and integrate results. BATMAN is never a subagent — do not create or dispatch an "orchestrator"/"batman" agent (ADR-001). You do the coordination; the roster does the domain work; small tasks you may do directly.

## Before dispatching any task (mandatory pre-read)

1. Read the relevant spec section in `docs/development-specification.md` — the authoritative build spec (modules M1–M16 + the data model + the sprint plan). It carries module ownership; do not paraphrase from memory.
2. Cross-reference intent in `docs/functionality-blueprint.md` (MVP / Phase 2 / Later) and `docs/executive-summary.md`; open questions live in `docs/decisions-to-finalize.md`.
3. Check the owning agent's memory: `.claude/agent-memory/<agent>/MEMORY.md`.
4. Check `docs/adr/` — **does not exist yet**; ADR-001 and ADR-002 are referenced below but live only in conversation and agent memory. Creating `docs/adr/` and writing them down is outstanding. Do not contradict an Accepted ADR; supersede it instead.
5. Read the functional spec for the work in `docs/functional-specs/` — it carries the ACs.

## Project overview

**The product/SaaS name is Naveya** — use it everywhere. (It was called *Tenure* until the 2026-09 rebrand; ~66 files still carry the old name and are being migrated.) A compliance-grade Indian staff-payroll HRMS built for schools, targeting private multi-branch K-12 groups first, delivered as multi-tenant SaaS with a single-tenant on-premise option. Django backend is the broker and source of truth; no client surface talks to a vendor directly. Surfaces: Next.js web app (HR/admin/principals), one Flutter app (employee self-service — phone-first: leave, attendance, payslip, document-request responses). Only `docs/` and `design/` exist today; `backend/`, `frontend/`, and `app/` come later.

## Monorepo map

| Path | What | Rules file |
|---|---|---|
| `backend/` | Django 5 + DRF + strawberry-django GraphQL (primary API) + DRF REST edge + Celery + Channels, PostgreSQL RLS (multi-tenant) | `backend/CLAUDE.md` (later) |
| `frontend/` | Next.js (React/TS, Tailwind, shadcn, TanStack Query, NextAuth) | `frontend/CLAUDE.md` (later) |
| `app/` | Flutter, MVVM + Repository (Riverpod ViewModels, drift offline, graphql + dio) | `app/CLAUDE.md` (later) |
| `docs/` | Spec, blueprint, ADRs, learnings — the committed brain | — |
| `design/` | **v3 "Staffroom Terracotta"** design system — canonical (code-as-design canvas; `design/v3.html` + `design/v3/`). Earlier explorations (v2, fresh, Mulberry, the "Greenboard & Chalk" and Peacock palettes) are superseded and archived in `design/_archive/` for provenance only. `DESIGN.md` is authoritative. | — |

Types are generated from the GraphQL SDL + OpenAPI → TypeScript (web) + Dart (app); the strawberry schema's Python annotations ARE the backend source of truth.

## Tenancy model (binding)

`tenant_id` + Postgres RLS ship in the SAME migration as the tenant model (`guard-rls-policy` blocks otherwise). A **tenant** = a customer account (SaaS) or a whole on-prem install; the `group → trust → campus → department` hierarchy lives INSIDE a tenant, it is not the isolation boundary. The tenant is.

## Knowledge portability (binding)

All project knowledge lives in the repo (committed). Box-local state is never authoritative. Agents MUST write durable learnings to their `.claude/agent-memory/<name>/MEMORY.md`; project-wide learnings also go to `docs/learnings/` via lucius. BATMAN's standing state lives in `.claude/agent-memory/batman/` — `MEMORY.md` is a one-line-per-entry index (only its first 200 lines / 25KB load), detail goes in topic files. Each machine points auto memory there with `"autoMemoryDirectory": "<absolute repo path>/.claude/agent-memory/batman"` in the gitignored `.claude/settings.local.json` (the setting takes only absolute or `~/` paths, so it can't be committed).

## Work tracking

- Track in-session work with TodoWrite; durable state goes in the repo (see *Knowledge portability*).
- **Functional specs live in `docs/functional-specs/`:** every functionality gets a DETAILED spec page (Intent · Scope & surfaces · Behaviour walk-through incl. states/edge/error paths/i18n+a11y · concrete AC & testing tables) BEFORE it is built.
- **Spec-tight authoring:** every task's ACs cite the spec section they implement (`M<n> §<x>`); dispatch prompts point agents at the spec section itself; an agent seeing an AC contradict the spec STOPS and reports the conflict instead of building it.
- Commit format: `<type>(<scope>): <summary>` (e.g. `feat(tenancy): tenant RLS scaffold`).

## Agent roster & routing

13 domain agents (DC codenames) + BATMAN. Models: **opus** for alfred, two-face, gordon, riddler; **sonnet** for the rest (set in `.claude/agents/*.md` frontmatter).

| Agent | Owns | Does NOT own |
|---|---|---|
| **alfred** (opus) | Spec → work items with ACs & dependencies, phase/sprint planning, requirement refinement | Writing code |
| **oracle** | Django models, migrations, indexes, tenant-table + RLS scaffolding | RLS policy *content* (wonder-woman), API layer |
| **cyborg** | Backend API — strawberry-django GraphQL schema/resolvers, DRF REST edge, Channels, Celery tasks | Vendor adapters (martian), auth (wonder-woman), payroll compute (riddler) |
| **martian** | `backend/integrations/` ports & adapters, outbox, webhooks (biometric, SMS/WhatsApp, Tally, Razorpay, EPFO/ESIC/TRACES) | Domain models (oracle), payroll logic (riddler) |
| **wonder-woman** | Auth, staff SSO, JWT/sessions, OTP, RLS policy content, rate limiting, OWASP | Non-auth backend features |
| **riddler** (opus) | Payroll & statutory ENGINE: computation, statutory calculators, versioned StatutoryConfig, filings (ECR/24Q/Form 16), F&F, golden-file tests | Schema (oracle), API surface (cyborg), device I/O (martian) |
| **green-lantern** | Next.js pages/components, web dashboard UX implementation | Design audits (two-face) |
| **nightwing** | Flutter screens, Riverpod ViewModels, drift, offline sync, ARB i18n | Backend sync endpoint (cyborg) |
| **deathstroke** | Unit tests, fixtures, code review | Integration/E2E/chaos (bane) |
| **bane** | Integration/E2E/chaos: RLS cross-tenant isolation, payroll-correctness, statutory-filing, offline-sync | Unit tests (deathstroke) |
| **two-face** (opus) | UI/UX + accessibility audit: design tokens, WCAG AA, Hindi/English review | Implementation |
| **gordon** (opus) | Compliance & safety review (read-only): DPDP consent/retention, PII-in-logs, audit immutability, payroll/statutory correctness | Implementation of fixes it flags |
| **lucius** | Learnings propagation → agent-memory files + `docs/learnings/` | Feature work |

**Routing:** model/migration → oracle (+ wonder-woman for RLS policy content). API/resolver → cyborg. Vendor/device → martian. Payroll/statutory computation, StatutoryConfig, filings, F&F → riddler. Any diff touching staff-PII or a payroll/statutory diff → gordon reviews before merge. Phase start → alfred decomposes the spec module. Web UI → green-lantern; mobile → nightwing. UI/a11y audit → two-face. Unit tests → deathstroke; integration/E2E/chaos → bane. Reusable lessons → lucius. Module ownership is authoritative in `docs/development-specification.md` — route by it.

## Education-domain safety & RLS (non-negotiable — each maps 1:1 to a guard hook)

Guard hooks live in `.claude/hooks/`; some are live today, the rest land as their surface is scaffolded. Every rule below is enforced by the named hook — do not rely on discipline alone, but do not ship code that only passes because a hook is not yet wired.

- **`guard-rls-policy`** — every tenant-owned table carries `tenant_id` FK + an RLS policy in the SAME migration as the model.
- **`guard-pii-logging`** — never log PII: PAN, Aadhaar, UAN, ESIC, bank account, salary, DOB, phone in log statements are blocked.
- **`guard-vendor-isolation`** — vendor SDK imports only inside `backend/integrations/adapters/` (zkteco/essl/matrix/realtime/spectra biometric; msg91/gupshup/twilio SMS-WhatsApp; tally accounting; razorpay bank/NEFT; EPFO/ESIC/TRACES statutory portals).
- **`guard-hand-rolled-auth`** — no hand-rolled auth; use the framework's auth + wonder-woman's primitives.
- **`guard-money-float`** — money is `Decimal`, never `float`; monetary columns/fields are `Decimal`.
- **`guard-statutory-hardcode`** — statutory rates/ceilings/slabs are NEVER hardcoded; read the versioned `StatutoryConfig` (effective-dated).
- **`guard-no-any`** — no TypeScript `any` (web); `unknown` + narrowing at boundaries.
- **`guard-i18n-strings`** — user-facing strings are Hindi + English via i18n files; no hardcoded copy.
- **`guard-hardcoded-values`** — no magic constants where a config/StatutoryConfig/token source of truth exists.
- **`guard-workdir-boundary`** — agents operate only inside the Naveya repo and its `.claude/worktrees/`; no exploring `~/`, other projects, or system dirs.
- **`guard-migration-conflicts`** — parallel lanes touching the same Django app reserve migration numbers; colliding migration numbers are blocked (renumber the later lane).
- **`guard-missing-dataloader`** — GraphQL resolvers avoid N+1; DjangoOptimizerExtension / dataloaders where a relation is traversed (retool at the first resolver story).
- **`check-contract-sync`** — generated types (GraphQL SDL/OpenAPI → TS + Dart) are in sync with the schema source; a drifted contract is blocked.

Additional standing non-negotiables (map to review gates, not single hooks):
- **DPDP consent & retention** — consent captured and retention honored; gordon reviews.
- **Maker-checker** on payroll runs and statutory filings — a run/filing needs a distinct checker before it is final.
- **Append-only audit** — audit/statutory records are append-only; supersede, never delete.
- **Document governance (M4)** — employees CANNOT self-write documents; they only respond to an HR-initiated `DocumentUpdateRequest` → HR verifies. The Employee role lacks `documents.write`.

## Dev commands

Toolchains are created when the apps are scaffolded; until then these are declarations of intent, not runnable here:
backend `cd backend && uv run pytest` · frontend `cd frontend && npm run dev|test|lint` · app `cd app && fvm flutter test && fvm flutter analyze` (Flutter SDK pinned via fvm, `.fvmrc` committed) · full stack `docker compose up`.

## Context resilience (BATMAN habit, every dispatch/wave boundary)

Session context may be cleared or compacted at ANY time — the user clears per wave/task, and long sessions auto-summarize. Nothing important may live only in conversation. At every agent dispatch, wave boundary, and user decision, BATMAN immediately persists: (1) decisions/state → `.claude/agent-memory/batman/MEMORY.md` (committed); (2) reusable lessons → `docs/learnings/` (via lucius); (3) product/architecture knowledge → `docs/`. Rules belong in this file only — it is re-read after compaction, so they are not copied into memory files. **Recovery order after a context loss:** batman MEMORY.md → `git log` → docs/ (spec + learnings).

## Feedback → knowledge (mandatory evolution loop)

Every correction becomes a committed rule, not a memory of one session:
1. **User corrects or redirects you** → before ending the turn, route the lesson: agent-scoped → the owning agent's `.claude/agent-memory/<name>/MEMORY.md`; project-wide → `docs/learnings/` (via lucius); rule-level (changes how everyone works) → update this CLAUDE.md or propose an ADR.
2. **Review/QA gate finds a defect class** (not a one-off typo) → same routing; deathstroke/bane/gordon findings feed lucius.
3. **An agent's instructions proved wrong or incomplete** → edit that agent's frontmatter/body in the same session — agent definitions are living documents (ADR-001).
4. **Phase gates:** lucius runs a retro over the phase's work and distills memories.

## Type safety (all three apps — non-negotiable)

- Types are generated, never hand-written, wherever a source of truth exists: web GraphQL types from codegen, app GraphQL types from graphql_codegen, drift row classes, ARB-generated localizations, OpenAPI → TS/Dart for the REST edge. The strawberry schema's Python annotations ARE the backend source.
- **Backend:** type hints on all public functions; **mypy + django-stubs is the blocking CI type gate**.
- **Frontend:** TypeScript strict mode; `any` is banned (`guard-no-any` + typescript-eslint `no-explicit-any: error`); `unknown` + narrowing at boundaries.
- **Flutter:** sound null safety + strict analyzer modes (`strict-casts`, `strict-inference`, `strict-raw-types`); `dynamic` requires a justifying comment.

## Testing standards (all three apps)

- Tests are granular, fast, deterministic — one behavior per test, measured in milliseconds. Slow suites rot; speed is a feature.
- Unit tests never touch network, real vendors, or unnecessary DB: backend unit tests avoid DB unless the behavior IS persistence (`pytest` markers separate `db`/`slow`/`postgres`); frontend uses jsdom + mocked GraphQL fetch; Flutter prefers widget over integration tests.
- **Golden-file payroll regression (riddler + bane):** payroll and statutory computation is verified against committed golden files — a run's output diffs byte-for-byte against the expected register; any drift fails the gate and must be an intentional, reviewed change to the golden, never a silent update. Statutory calculators test against versioned StatutoryConfig fixtures, not hardcoded rates.
- Fast suite runs locally on every change; integration/E2E/chaos (bane) run as separate CI jobs. Cadence: DURING a sprint, story QA gates run the fast suites; at sprint/wave completion and every phase gate, the FULL suite runs — all unit + integration + E2E + RLS cross-tenant isolation + payroll-correctness — before advancing.
- Fixtures are minimal and factory-built. Assertions reference the source of truth — i18n/ARB lookups, exported constants, StatutoryConfig fixtures, generated types, factories — never re-typed literals (a copy-pasted literal can't catch drift in the source it mirrors).

## Merge policy (strict)

Merge conflicts are resolved by READING both sides and hand-merging the actual content — `git checkout --ours` / `--theirs` is **BANNED** (it silently discards one side). Index/list files (MEMORY.md, testpaths, INSTALLED_APPS) get a union merge; code conflicts get a real reconciliation with the suite run afterward. Line-union merge is WRONG for multi-line class-block conflicts — extract classes verbatim from the merge parents. Migrations-bearing branches merge first. If a conflict is too tangled to hand-merge confidently, stop and dispatch the owning agent rather than guessing.

## Commit style

NO AI attribution anywhere — no `Co-Authored-By`, no "Generated with Claude" trailers, in any commit message or PR body.

## Proactive health

Leave the codebase healthier than found. Non-blocking findings are deferred (filed in `docs/`), not ignored. After merges, run lucius when a bug/review produced a reusable lesson.
