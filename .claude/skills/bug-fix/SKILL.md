---
name: bug-fix
description: Orchestrate a Naveya bug fix from triage through investigation, fix, test, and verification. Routes to oracle/cyborg (backend), riddler (payroll/statutory), green-lantern (dashboard), or nightwing (Flutter app) based on the bug domain.
---

# /bug-fix — Orchestrated Bug Fix Workflow

## Purpose

Orchestrates bug fixes through: triage → investigate → fix → test → verify. Bugs are diagnosed before fixes are attempted, and verified before marked complete.

## Prerequisites

- A bug report, error message, or user-reported issue
- Enough context to identify the affected domain (backend, payroll/statutory, dashboard, Flutter app, or a combination)

## Orchestration Flow

BATMAN (the main session = orchestrator, never a subagent) runs this flow directly.

### Step 0: Create Tracking Checklist (TodoWrite)
- [ ] Triage + TodoWrite entry — BATMAN
- [ ] Investigation — deathstroke
- [ ] Fix — oracle/cyborg (backend), riddler (payroll/statutory), green-lantern (dashboard), or nightwing (app)
- [ ] Verification — bane
- [ ] TodoWrite marked done

### Step 1: Triage

1. **Read the bug report** — error messages, affected pages/screens, endpoints.
2. **Search codebase** — Glob/Grep for relevant files.
3. **Classify domain**:
   - Backend (Django, GraphQL, DRF edge, services, Celery) → oracle (model/RLS bugs) or cyborg (resolver/service/API bugs)
   - **Payroll/statutory** (wrong PF/ESI/PT/TDS/gratuity/bonus/LWF, StatutoryConfig mis-versioning, rounding, filing output) → **riddler**
   - Frontend dashboard (Next.js, React, TanStack Query, UI) → green-lantern
   - Flutter app (screens, ViewModels, offline sync) → nightwing
   - Full-stack → dispatch each owning agent
4. **Record tracking** — add the bug to TodoWrite and mark it in progress.

### Pre-Dispatch Protocol Reminder
1. **Pre-read**: relevant `docs/development-specification.md` section, owning agent's `.claude/agent-memory/<agent>/MEMORY.md`, `docs/adr/`.
2. **Story Context**: include the task context and prior review comments in every prompt.

### Step 2: Investigation (Deathstroke)

```
Task(
  subagent_type="deathstroke",
  description="Investigate bug: <BUG_DESCRIPTION>",
  prompt="You are DEATHSTROKE. Investigate this bug — do NOT fix it, just diagnose.

  Bug report: <PASTE BUG REPORT>

  Steps:
  1. Find the relevant files (Glob/Grep)
  2. Read the code paths involved
  3. Identify the root cause
  4. Determine blast radius (including cross-tenant leakage if it's a query bug, or mis-calculation across payroll runs if it's a payroll bug)
  5. Suggest the minimal fix approach

  Output:
  - Root cause with file:line references
  - Affected files list
  - Recommended fix approach + risk assessment
  - **Definition of Fixed** (AC): Given <trigger scenario>, When <correct behavior>, Then <observable result proving it's fixed>
    — the fixing agent MUST write a regression test against this definition, not their own interpretation.
    For payroll bugs, the regression test is a golden-file case pinned to the affected StatutoryConfig version."
)
```

### Step 3: Fix Implementation

**Backend bug → Oracle (model/RLS) or Cyborg (resolver/service/Celery):**
```
Task(
  subagent_type="cyborg",
  description="Fix backend bug: <BUG_DESCRIPTION>",
  prompt="You are CYBORG. Fix this backend bug.

  Deathstroke's investigation: <PASTE DIAGNOSIS>
  Definition of Fixed (AC): <PASTE>

  Requirements:
  1. Fix the root cause (not symptoms)
  2. Regression test against the Definition of Fixed — NOT your own interpretation
  3. Tenancy (tenant_id scoping) not violated; no PII in logs
  4. Service layer pattern maintained
  5. Test protocol — targeted during red-green, full suite once at end:
     - Red/Green: `cd backend && uv run pytest <path>::<TestClass> -x`
     - Verification (ONCE): `cd backend && uv run pytest` + `cd backend && uv run python manage.py check`

  Report: what you changed and why."
)
```

**Payroll/statutory bug → Riddler:**
```
Task(
  subagent_type="riddler",
  description="Fix payroll/statutory bug: <BUG_DESCRIPTION>",
  prompt="You are RIDDLER. Fix this payroll/statutory bug (see payroll-statutory skill).

  Deathstroke's investigation: <PASTE DIAGNOSIS>
  Definition of Fixed (AC): <PASTE — the golden-file case + config version>

  Requirements:
  1. Fix the root cause; money stays Decimal; rounding explicit
  2. Rates read from versioned StatutoryConfig — never hardcode a fix
  3. Add/repair the golden-file regression case pinned to the affected config version — a wrong prior golden value is itself a finding
  4. Maker-checker and append-only audit paths intact
  5. `cd backend && uv run pytest <payroll test path> -x`, then full suite once

  Report: what you changed, which config version, and the corrected golden value."
)
```

**Frontend dashboard bug → Green-Lantern:**
```
Task(
  subagent_type="green-lantern",
  description="Fix frontend bug: <BUG_DESCRIPTION>",
  prompt="You are GREEN LANTERN. Fix this dashboard bug.

  Deathstroke's investigation: <PASTE DIAGNOSIS>
  Definition of Fixed (AC): <PASTE>

  Requirements:
  1. Fix the root cause (not symptoms)
  2. Regression test against the Definition of Fixed
  3. No `any` types (guard-no-any); design tokens from DESIGN.md (v3 Staffroom Terracotta), Hindi+English i18n intact
  4. Proper error/loading state handling
  5. Run: cd frontend && npm run build && npm run lint

  Report: what you changed and why."
)
```

**Flutter app bug → Nightwing:**
```
Task(
  subagent_type="nightwing",
  description="Fix app bug: <BUG_DESCRIPTION>",
  prompt="You are NIGHTWING. Fix this Flutter app bug.

  Deathstroke's investigation: <PASTE DIAGNOSIS>
  Definition of Fixed (AC): <PASTE>

  Requirements:
  1. Fix the root cause — widgets never call repositories directly
  2. Regression test against the Definition of Fixed
  3. Run: cd app && flutter analyze && dart format --set-exit-if-changed .

  Report: what you changed and why."
)
```

**Full-stack bug → each owning agent (parallel if independent):**
```
Task(subagent_type="cyborg", run_in_background=true, ...)
Task(subagent_type="green-lantern", run_in_background=true, ...)
```

### Step 4: Verification (Bane)

```
Task(
  subagent_type="bane",
  description="Verify bug fix: <BUG_DESCRIPTION>",
  prompt="You are BANE. Verify the bug fix for <BUG_DESCRIPTION>.

  Original bug: <PASTE>
  Fix applied by <cyborg/riddler/green-lantern/nightwing>: <PASTE FIX REPORT>

  Verify:
  1. cd backend && uv run pytest (if backend/payroll touched)
  2. cd frontend && npm run build && npm run lint (if dashboard touched)
  3. cd app && flutter test (if app touched)
  4. Check the specific scenario in the bug report (for payroll, the golden-file case)
  5. Verify no regressions, no cross-tenant leakage, no mis-calculation ripple

  Issue PASS or BLOCK verdict."
)
```

### Step 5: Update Tracking

**On PASS:** mark the TodoWrite item done; dispatch lucius to file a learning about the root cause (mandatory after every bug fix).

**On BLOCK:** read bane's issues, delegate back to the fixing agent, re-run step 4.

## Severity-Based Fast Path

**Trivial bugs** (typo, off-by-one, missing import): skip deathstroke, fix directly with the owning agent, still verify with bane.

**Critical bugs** (data loss, cross-tenant leakage, wrong statutory/payroll amount, document-governance breach, crash): escalate immediately — no skipping. Deathstroke investigation mandatory; bane verification mandatory. If **PII, payroll/statutory output, or employee documents** are implicated, also dispatch gordon (`/compliance-check`).

## Notes
- Always pass deathstroke's diagnosis to the fixing agent — don't let them re-investigate.
- Each Task call must include full context (agents don't remember previous steps).
- Payroll bugs are critical by default — a wrong salary or statutory filing is never "trivial".
