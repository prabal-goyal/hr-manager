---
name: release-gate
description: Run the QA gate and release sign-off before a Naveya deployment. Orchestrates bane, deathstroke, gordon (and riddler for payroll releases); deployment itself is executed by BATMAN (the main session) — Naveya has no dedicated deploy agent.
---

# /release-gate — QA + Governance + Deploy Pipeline

## Purpose

Runs the complete release pipeline enforcing the rule that nothing deploys without a **bane PASS** (and a **gordon PASS** whenever PII, payroll, statutory output, or employee documents are in scope).

**Agent mapping note:** `green-lantern` is Naveya's Next.js frontend implementer, not a DevOps agent. Deployment is executed directly by BATMAN (the main session) — Naveya's roster has no dedicated CI/CD agent.

## Prerequisites
- Feature implementation complete (oracle/riddler/cyborg and green-lantern finished)
- Code review by deathstroke completed (recommended)

## Orchestration Flow

BATMAN (the main session = orchestrator, never a subagent) runs this flow directly.

### Step 0: Create Tracking Checklist (TodoWrite)
- [ ] QA gate — bane
- [ ] Compliance check — gordon (if PII / payroll / statutory / documents in scope)
- [ ] Release sign-off recorded — BATMAN
- [ ] Deployment — BATMAN
- [ ] Post-deploy verification

### Pre-Dispatch Protocol Reminder
1. **Pre-read**: the relevant `docs/development-specification.md` section and `docs/adr/`.
2. **Story Context**: include the task context and prior review comments in every prompt.

### Step 1: QA Gate (Bane)
```
Task(
  subagent_type="bane",
  description="Release QA gate for <RELEASE_NAME>",
  prompt="You are BANE. Run the full release QA checklist.

  Run:
  1. cd backend && uv run pytest
  2. cd frontend && npm run build
  3. cd frontend && npm run lint
  4. cd frontend && npm run typecheck
  5. cd app && flutter test && flutter analyze (if the app changed)

  Then verify:
  - Backend: service layer, tenancy, wonder-woman auth, DataLoaders, pagination, tests
  - Payroll/statutory (if in scope): golden-file regressions pass per StatutoryConfig version
  - Frontend: TypeScript strict (no any), TanStack Query patterns, state handling, design tokens, Hindi+English i18n
  - UI-API contract: GraphQL/REST alignment
  - Accessibility: WCAG AA
  - Security: no secrets, auth required, RLS isolation intact, no PII in logs

  Issue a formal PASS or BLOCK verdict with specific findings."
)
```

### Step 2: Compliance Check (Gordon) — if PII / payroll / statutory / documents in scope
Mandatory when in scope; its PASS is required in addition to bane's.
```
Task(
  subagent_type="gordon",
  description="Compliance check for <RELEASE_NAME>",
  prompt="You are GORDON. Run /compliance-check over everything in this release.
  Check DPDP consent, PII-in-logs, append-only audit, payroll/statutory correctness (Decimal money,
  StatutoryConfig-sourced rates, maker-checker), document governance (M4), tenancy escape.
  Issue PASS or BLOCK with findings."
)
```

### Step 3: Handle Verdict
- **If BLOCK (bane or gordon):** stop the pipeline. Report the blocking issues (files + issues). Do NOT proceed. Fix and re-invoke `/release-gate`.
- **If PASS (all required verdicts):** continue.

### Step 4: Release Sign-off
Record the release sign-off in the PR/release notes, attaching bane's (and gordon's, if run) verdict as evidence. This unlocks deployment.

### Step 5: Deployment
BATMAN runs the deployment checklist directly:
1. Verify tests pass: `cd backend && uv run pytest`
2. Verify frontend builds: `cd frontend && npm run build`
3. Verify migrations are backwards-compatible and reversible (RLS policies included)
4. Document the rollback plan
5. Execute deployment
6. Run post-deploy smoke tests (including a tenant-isolation smoke check and, for payroll releases, a golden-file spot check)
7. Record DEPLOYED or ROLLBACK NEEDED in the release notes

### Step 6: Post-Deploy Governance
- If DEPLOYED: note it in the release notes.
- If ROLLBACK NEEDED: note why in the release notes and reopen the work.


Update TodoWrite with final status.

## Post-Pipeline Steps
After the pipeline completes (PASS or BLOCK), dispatch lucius to propagate any learnings discovered during the release gate.

## Failure Modes
- **Bane BLOCK:** pipeline halts. Fix, re-run `/release-gate`. lucius files a learning about the root cause.
- **Gordon BLOCK:** pipeline halts — PII/payroll/statutory/document-affecting releases never ship on a compliance BLOCK. Fix per gordon's findings (owned by the implementing agent, not gordon), re-run.
- **Rollback needed:** reopen the work. Investigate and fix. Release report still recorded.
