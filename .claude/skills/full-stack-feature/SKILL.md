---
name: full-stack-feature
description: Orchestrate a full-stack Naveya feature using the multi-agent workflow. Coordinates alfred, oracle, cyborg, riddler (for any payroll/statutory step), green-lantern, two-face, deathstroke, bane, and gordon.
---

# /full-stack-feature — Multi-Agent Feature Orchestration

## Purpose

Orchestrates complete full-stack feature implementation for Naveya (multi-tenant HR & payroll SaaS for Indian educational institutions) across all relevant agents.

## Prerequisites

- A clear feature description or user story
- Understanding of which domains are affected (backend, frontend dashboard, or the Flutter app — use `/flutter-feature` if the app is the primary surface)
- Whether the feature touches **payroll or statutory** logic (PF/ESI/PT/TDS/gratuity/bonus/LWF, StatutoryConfig, filings) — if so, **riddler is mandatory**

## Orchestration Flow

BATMAN (the main session = orchestrator) runs this flow directly — there is no dispatchable orchestrator agent, and Batman is never a subagent.

### Step 0: Tracking + Story Setup

**0a. Product Story (if not already defined):**

```
Task(
  subagent_type="alfred",
  description="Decompose spec into story for: <FEATURE>",
  prompt="You are ALFRED. Decompose <FEATURE> into a story.
  Produce: user story, acceptance criteria (Given/When/Then), scope in/out, risks, dependencies,
  module ownership per docs/development-specification.md (M1–M16), and whether payroll/statutory logic is in scope (→ riddler)."
)
```

**0b. Create Tracking Checklist (TodoWrite):**
- [ ] Story defined (alfred)
- [ ] Model/migration + RLS changes (oracle) — skip if no schema change
- [ ] Payroll/statutory engine (riddler) — **only if payroll/statutory logic in scope**
- [ ] Backend GraphQL/REST/Celery (cyborg)
- [ ] Frontend implementation (green-lantern)
- [ ] Visual + accessibility audit (two-face)
- [ ] Code review (deathstroke)
- [ ] QA gate (bane)
- [ ] Compliance check (gordon) — if PII / payroll / statutory / documents / consent touched
- [ ] TodoWrite marked done

### Pre-Dispatch Protocol Reminder

**BATMAN MUST follow these at every step — not optional:**

1. **Pre-read**: read the relevant `docs/development-specification.md` module section and `docs/functionality-blueprint.md`, check the owning agent's `.claude/agent-memory/<agent>/MEMORY.md`, and check `docs/adr/` before dispatching any agent.
2. **Story Context**: include the task context and any comments from prior review cycles in every agent prompt.

### Step 1: Model / Migration + RLS (Oracle)

Skip if the feature needs no new or changed models.

```
Task(
  subagent_type="oracle",
  description="Model/migration for: <FEATURE>",
  prompt="You are ORACLE. Define the Django model(s) for <FEATURE>.

  Story from alfred:
  <PASTE STORY>

  Produce:
  1. Model(s) extending the tenant-scoped base model (tenant_id FK + tenant-scoped default manager) if tenant-owned
  2. Migration, including the RLS policy RunSQL in the SAME migration if tenant-owned (guard-rls-policy blocks otherwise — see the rls-model skill)
  3. Indexes for expected query patterns
  4. Money fields as Decimal; never log PII

  Reference backend/CLAUDE.md and docs/development-specification.md for module layout and tenancy rules."
)
```

### Step 2: Payroll / Statutory Engine (Riddler) — CONDITIONAL

**Dispatch riddler BEFORE cyborg whenever the feature computes pay, deductions, statutory contributions, or filings** (PF/ESI/PT/TDS/gratuity/bonus/LWF, StatutoryConfig versioning, maker-checker on payroll runs).

```
Task(
  subagent_type="riddler",
  description="Payroll/statutory engine for: <FEATURE>",
  prompt="You are RIDDLER. Implement the payroll/statutory calculation for <FEATURE>.

  Story: <PASTE STORY>
  Model/migration from oracle (if applicable): <PASTE ORACLE'S OUTPUT>

  Requirements (see the payroll-statutory skill):
  0. MANDATORY: invoke superpowers:test-driven-development first — golden-file regression tests per StatutoryConfig version
  1. Money is Decimal, never float; rounding rules explicit and documented
  2. Statutory rates read from versioned StatutoryConfig — NEVER hardcoded
  3. Maker-checker on any payroll run / filing output; append-only audit
  4. Expose calculation results to cyborg as a service API (no API/UI work here)

  Report the service surface cyborg will wrap."
)
```

Pass riddler's service surface to cyborg. Mark the riddler step complete.

### Step 3: Backend + Frontend (Parallel where independent)

**Cyborg — GraphQL/REST/Celery:**
```
Task(
  subagent_type="cyborg",
  run_in_background=true,
  description="Implement backend for: <FEATURE>",
  prompt="You are CYBORG. Implement the strawberry-django GraphQL (and DRF REST edge / Celery tasks if needed) for <FEATURE>. Follow the strawberry-api skill.

  Story: <PASTE STORY>
  Model/migration from oracle (if applicable): <PASTE>
  Payroll/statutory service from riddler (if applicable): <PASTE RIDDLER'S SERVICE SURFACE>

  Requirements:
  0. MANDATORY: invoke superpowers:test-driven-development before any resolver/service code — tests first, against the AC
  1. Service/business logic outside resolvers; payroll math stays in riddler's service — cyborg only exposes it
  2. Tenancy: every query scoped to tenant_id
  3. Authorization via wonder-woman's layer, never hand-rolled
  4. DataLoaders for every nested relation resolver (mandatory N+1 rule)
  5. Pagination on list queries
  6. No PII in logs; money is Decimal
  7. Note if the GraphQL schema changed — frontend codegen will be needed."
)
```

**Green-Lantern — Frontend implementation:**
```
Task(
  subagent_type="green-lantern",
  run_in_background=true,
  description="Implement frontend for: <FEATURE>",
  prompt="You are GREEN LANTERN. Implement the Next.js dashboard UI for <FEATURE>.

  Story: <PASTE STORY>
  Expected API shape (from cyborg once available; proceed against the story's contract if cyborg hasn't finished): <PASTE QUERY/MUTATION/REST SIGNATURES>

  Requirements:
  0. MANDATORY: invoke superpowers:test-driven-development before any component code
  1. No `any` types (guard-no-any)
  2. Server state via TanStack Query against /graphql (and the REST edge where used) — no ad-hoc fetch
  3. shadcn/ui components only — never hand-write what the generator provides (see the shadcn skill)
  4. Every component handles loading, error, empty states
  5. Design tokens from the canonical design system in `DESIGN.md` (v3 "Staffroom Terracotta"; tokens live in `design/v3/tokens.jsx`, components in `design/v3/kit.jsx`) — read values from there, never re-type hex codes or font names — no hardcoded values
  6. User-facing strings through the Hindi+English i18n layer (never English-only)
  7. Never render raw PII where the design masks it; run 'cd frontend && npm run codegen' once cyborg's schema changes land"
)
```

Wait for both. Update TodoWrite.

### Step 4: Visual + Accessibility Audit (Two-Face)

```
Task(
  subagent_type="two-face",
  description="Design/accessibility audit for: <FEATURE>",
  prompt="You are TWO-FACE. Audit the pages/components affected by <FEATURE>.

  What green-lantern implemented: <PASTE SUMMARY — which pages/components changed>

  Check:
  1. Design tokens (the canonical design system in `DESIGN.md` (v3 "Staffroom Terracotta"; tokens live in `design/v3/tokens.jsx`, components in `design/v3/kit.jsx`) — read values from there, never re-type hex codes or font names) used correctly, no hardcoded values (guard-hardcoded-values)
  2. WCAG 2.1 AA compliance
  3. Hindi/English string coverage (guard-i18n-strings)
  4. PII never shown unmasked where it shouldn't be
  5. Produce your audit report (CRITICAL / WARNING / INFO / PASSED)

  CRITICAL issues must be fixed by green-lantern before bane runs."
)
```

If two-face reports CRITICAL issues, delegate fixes to green-lantern before proceeding.

### Step 5: Run Codegen (if schema changed)
```bash
cd frontend && npm run codegen
cd frontend && npm run typecheck
```

### Step 6: Code Review (Deathstroke)

```
Task(
  subagent_type="deathstroke",
  description="Review implementation of: <FEATURE>",
  prompt="You are DEATHSTROKE. Review the full implementation of <FEATURE>.

  Check recently changed files against:
  - Backend: service layer, tenant scoping, wonder-woman auth, DataLoaders, pagination, tests
  - Payroll/statutory (if touched): Decimal money, StatutoryConfig-sourced rates, golden-file tests, maker-checker, append-only audit
  - Frontend: no any, TanStack Query patterns, state handling, design tokens, i18n
  - No PII in logs (guard-pii-logging)

  Report CRITICAL / WARNING / INFO issues with file:line references."
)
```

If CRITICAL, delegate fixes to the owning agent, then optionally re-review.

### Step 7: QA Gate (Bane)

```
Task(
  subagent_type="bane",
  description="QA gate for: <FEATURE>",
  prompt="You are BANE. Run the full QA checklist for <FEATURE>.

  Run:
  1. cd backend && uv run pytest
  2. cd frontend && npm run build
  3. cd frontend && npm run lint
  4. cd frontend && npm run typecheck

  Then check: backend, frontend, UI-API contract, accessibility, security, tenant isolation (add to the cross-tenant suite if a new tenant-owned model was introduced), and payroll golden-file regressions if payroll changed.

  Issue a formal PASS or BLOCK verdict."
)
```

If the feature touches **PII, payroll, statutory output, employee documents, consent, or audit**, also dispatch gordon (`/compliance-check`) — its PASS/BLOCK is required before merge, in addition to bane's.

Update TodoWrite with verdict(s).

### On PASS

**Step 8: Mark the Feature Done** Record bane's (and gordon's, if run) verdict in the summary. Optionally proceed to `/release-gate`.

### On BLOCK

Read the blocking issues. Delegate fixes to the appropriate agent (oracle/riddler/cyborg for backend, green-lantern for frontend). Re-run the QA gate. Story stays In Progress.

### Post-Pipeline Steps

**On PASS:** dispatch lucius to propagate reusable learnings to the owning agents' MEMORY.md and `docs/learnings/` (mandatory after every completed feature). If PII/payroll/document paths changed and gordon hasn't reviewed, dispatch gordon.

**On BLOCK:** dispatch lucius to file a learning about the root cause (mandatory after every bane/gordon BLOCK).

## Notes

- Replace `<FEATURE>` with the actual feature description throughout.
- Each Task call must include full context — agents don't remember previous steps.
- **riddler is mandatory for any payroll/statutory step** and runs before cyborg.
- Use `run_in_background=true` only for truly independent parallel tasks (Step 3).
- Always pass one agent's output as input context to the next.
