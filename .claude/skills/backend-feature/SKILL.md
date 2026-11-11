---
name: backend-feature
description: Orchestrate a backend-only Naveya feature. Simpler than full-stack — skips frontend agents. Routes through oracle (models+RLS), riddler (payroll/statutory, if in scope), cyborg (GraphQL/REST/Celery), deathstroke (review), bane (QA).
---

# /backend-feature — Backend-Only Feature Orchestration

## Purpose

Orchestrates backend-only features (new GraphQL types/resolvers, DRF REST edge, service logic, model+RLS changes, payroll/statutory engine work, Celery tasks) without involving frontend agents. A streamlined `/full-stack-feature`.

## Prerequisites

- A clear feature description affecting only `backend/`
- No frontend UI changes (if UI is needed, use `/full-stack-feature`)
- Whether payroll/statutory logic is in scope (→ riddler mandatory)

## Orchestration Flow

BATMAN (the main session = orchestrator, never a subagent) runs this flow directly.

### Step 0: Create Tracking Checklist (TodoWrite)
- [ ] Feature added to TodoWrite / in progress
- [ ] Model/migration + RLS — oracle (skip if no schema change)
- [ ] Payroll/statutory engine — riddler (**only if payroll/statutory in scope**)
- [ ] GraphQL/REST/Celery — cyborg
- [ ] Code review — deathstroke
- [ ] QA gate — bane
- [ ] TodoWrite updated + learnings filed

### Step 1: Tracking Entry
Add the feature to the TodoWrite checklist below and mark it in progress.

### Pre-Dispatch Protocol Reminder

**BATMAN MUST, at every step:**
1. **Pre-read**: the relevant `docs/development-specification.md` module section, the owning agent's `.claude/agent-memory/<agent>/MEMORY.md`, and `docs/adr/`.
2. **Story Context**: include the task context and prior review comments in every prompt.

### Step 2: Model / Migration + RLS (Oracle)

Skip if no new/changed models.

```
Task(
  subagent_type="oracle",
  description="Model/migration for: <FEATURE>",
  prompt="You are ORACLE. Define the Django model(s) for <FEATURE>.

  Produce:
  1. Model(s) extending the tenant-scoped base model (tenant_id FK + tenant-scoped default manager) if tenant-owned
  2. Migration, including the RLS policy RunSQL in the SAME migration if tenant-owned (guard-rls-policy blocks otherwise — see rls-model skill)
  3. Indexes for expected query patterns; money as Decimal; never log PII

  Reference backend/CLAUDE.md and docs/development-specification.md for module layout and tenancy rules."
)
```

### Step 3: Payroll / Statutory Engine (Riddler) — CONDITIONAL

Dispatch **before cyborg** whenever the feature computes pay, deductions, statutory contributions, or filings.

```
Task(
  subagent_type="riddler",
  description="Payroll/statutory engine for: <FEATURE>",
  prompt="You are RIDDLER. Implement the payroll/statutory calculation for <FEATURE> (see payroll-statutory skill).

  Model/migration from oracle (if applicable): <PASTE>

  Requirements:
  0. MANDATORY: superpowers:test-driven-development first — golden-file regression tests per StatutoryConfig version
  1. Money is Decimal, never float; explicit documented rounding
  2. Statutory rates from versioned StatutoryConfig — NEVER hardcoded
  3. Maker-checker on payroll runs/filings; append-only audit
  4. Expose a service API for cyborg (no API/UI work here)"
)
```

### Step 4: GraphQL/REST/Celery (Cyborg)

```
Task(
  subagent_type="cyborg",
  description="Implement backend: <FEATURE>",
  prompt="You are CYBORG. Implement the strawberry-django GraphQL (and DRF REST edge / Celery if needed) for <FEATURE>. Follow the strawberry-api skill.

  Model/migration from oracle (if applicable): <PASTE>
  Payroll/statutory service from riddler (if applicable): <PASTE>

  Requirements:
  0. MANDATORY: superpowers:test-driven-development before any resolver/service code
  0a. Write tests against the spec's Acceptance Criteria — NOT your own interpretation
  1. Service/business logic outside resolvers; payroll math stays in riddler's service — cyborg only exposes it
  2. Tenancy: every query scoped to tenant_id, never Model.objects.all()
  3. Authorization: wonder-woman's layer — never hand-rolled (guard-hand-rolled-auth)
  4. DataLoaders for every nested relation resolver (guard-missing-dataloader)
  5. Pagination on list queries
  6. No PII in logs (guard-pii-logging); money is Decimal
  7. Test protocol — targeted during red-green, full suite once at the end:
     - Red/Green: `cd backend && uv run pytest <path>::<TestClass> -x`
     - Verification (ONCE): `cd backend && uv run pytest` + `cd backend && uv run python manage.py check`
     Do NOT run the full suite repeatedly during red-green — bane runs the authoritative full suite.
  8. Note if the GraphQL schema changed — frontend codegen needed when frontend catches up."
)
```

### Step 5: Code Review (Deathstroke)

```
Task(
  subagent_type="deathstroke",
  description="Review backend: <FEATURE>",
  prompt="You are DEATHSTROKE. Review cyborg's (oracle's, riddler's) implementation of <FEATURE>.

  Check:
  - Service layer pattern (no logic in resolvers)
  - Tenancy (all queries scoped to tenant_id)
  - Authorization (wonder-woman's layer, not hand-rolled)
  - DataLoaders present for nested relations; pagination present
  - Payroll/statutory (if touched): Decimal money, StatutoryConfig-sourced rates, golden-file tests, maker-checker, append-only audit
  - Tests written and passing; no PII in logs (guard-pii-logging)

  Report CRITICAL / WARNING / INFO with file:line references."
)
```

If CRITICAL, delegate fixes to cyborg/oracle/riddler, then optionally re-review.

### Step 6: QA Gate (Bane)

```
Task(
  subagent_type="bane",
  description="QA gate for backend: <FEATURE>",
  prompt="You are BANE. Run backend QA for <FEATURE>.

  Run:
  1. cd backend && uv run pytest
  2. cd backend && uv run python manage.py check

  Verify: service layer; tenancy enforcement (add to the cross-tenant isolation suite if a new tenant-owned model was introduced); authorization; input validation; payroll golden-file regressions (if payroll changed); tests pass; no security issues.

  Issue a formal PASS or BLOCK verdict."
)
```

If the feature touches **PII, payroll, statutory output, employee documents, consent, or audit**, also run `/compliance-check` (gordon) before merge.

### On PASS
1. Dispatch lucius to propagate the learning to the owning agent's MEMORY.md and `docs/learnings/`.

### On BLOCK
Read bane's issues; delegate fixes to cyborg/oracle/riddler; re-run the QA gate. Dispatch lucius to file a learning about the root cause.

## When to Use Full-Stack Instead
- Frontend UI changes are needed
- New GraphQL/REST consumed by the Next.js dashboard or Flutter app
- Design/accessibility work is needed (two-face)

## Notes
- Backend-only features still benefit from a model/schema plan — don't skip oracle when models change.
- riddler is mandatory for any payroll/statutory step and runs before cyborg.
- If the schema changes, remind the team `npm run codegen` will be needed in `frontend/` later.
- Each Task call must include full context — agents don't remember previous steps.
- No orphan commits, no AI-attribution trailers.
