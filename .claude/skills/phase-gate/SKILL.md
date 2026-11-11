---
name: phase-gate
description: Use when all stories in a Naveya phase are done. Runs the full test suite, security/isolation audit, and payroll+compliance sweep, then records a phase-level PASS/BLOCK verdict before advancing.
---

# /phase-gate — Phase Completion Gate

## When to Use
- All stories in a phase show status 'done'
- Before moving to the next phase
- Before merging phase work to main

## Steps

### 1. Verify All Stories Complete
Confirm every story in the phase (per `docs/development-specification.md` module scope, M1–M16) is Done or Cancelled. No incomplete stories.

### 2. Verify All Pipeline Stages Passed
Confirm every work item has a recorded PASS from its review + QA gates (deathstroke / bane / gordon, plus riddler sign-off on any payroll/statutory story). No open BLOCK verdicts.

### 3. Run Full Test Suite
Dispatch DEATHSTROKE:
```
Agent tool:
  prompt: "Run ALL tests (cd backend && uv run pytest; cd frontend && npm test; cd app && flutter test — as applicable). Include the payroll golden-file regression suite. Report full results."
  run_in_background: true
```

### 4. Security, Isolation & Compliance Audit
Dispatch BANE (security/isolation) and GORDON (compliance) in parallel:
```
Agent tool (bane):
  prompt: "Run the cross-tenant RLS isolation suite and a security audit on all code from phase <PHASE>.
           Check RLS policies, wonder-woman auth, input validation, vendor isolation, tenant escape.
           Report findings."
  run_in_background: true

Agent tool (gordon):
  prompt: "Run /compliance-check over all diffs merged in phase <PHASE>.
           Check DPDP consent, PII-in-logs, append-only audit, payroll/statutory correctness (Decimal money,
           StatutoryConfig-sourced rates, maker-checker, golden-file coverage), document governance, tenancy escape.
           Report PASS or BLOCK with findings."
  run_in_background: true
```
If the phase includes payroll/statutory modules, also have **riddler** confirm golden-file coverage per StatutoryConfig version.

### 5. Record Phase Verdict
Record the phase-completion verdict (PASS or BLOCK) with evidence: `Tests: X pass, Y fail. Security: Z findings. Payroll goldens: pass/fail. Compliance: PASS/BLOCK.`

### 6. Phase Retrospective (MANDATORY before advancing)
- BATMAN (the main session) + lucius run the retro: what worked, what didn't, what to change. Fold in gordon's findings if any BLOCK occurred.
- Record retro at `docs/retros/PH-<id>-retro.md`.
- lucius propagates action items into the owning agents' `.claude/agent-memory/<name>/MEMORY.md` and `docs/learnings/` before the next phase starts.

### 7. If PASS
- Record the phase as done in `docs/retros/`.
- Merge phase work to main per the team's git workflow.
- Dispatch LUCIUS for batch learning propagation (if not already done in step 6).
- Alfred decomposes the next phase's `docs/development-specification.md` module section.

### 8. If BLOCK
- Phase stays in_progress.
- File tracking items for blocking issues.
- Re-dispatch the owning agents (oracle/riddler/cyborg/green-lantern/nightwing) to fix.
- Re-run /phase-gate after fixes.

## Rules
- NEVER skip phase-gate — even if all stories passed individual QA.
- DEATHSTROKE (tests), BANE (security/isolation), and GORDON (compliance) must all run; riddler confirms payroll goldens when payroll modules are in the phase.
- The phase-gate verdict is recorded for the audit trail.
