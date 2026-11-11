---
name: v3-accountant-screens
description: AC-01/02/03 (design/v3/pages/accountant.jsx) — the single maker-checker gate, the three-number statutory reconciliation, and the derive-money-from-the-sibling-file discipline that keeps figures identical across screens.
metadata:
  type: project
---

`design/v3/pages/accountant.jsx` (~3.2k lines, one IIFE) ships `window.Pages3.ACHome / ACGate / ACLiability` — the Accountant's wave-1 surface, built 2026-09-03.

## What is load-bearing

**One gate, not five.** AC-02 is a single queue of every financial finalisation — payroll run, reimbursement batch, loan sanction, arrears posting, bonus run, F&F — because a checker experiences maker-checker as *one question* even though the spec spreads it across five modules. Recorded in `.claude/agent-memory/alfred/screen-inventory-decomposition.md`; do not split it later.

**The release ritual (compliance A38).** Evidence tabs must ALL be opened before Approve un-refuses → one click opens a restatement (type, period, exact ₹, payee count, maker, entity) → the checker must **type the period code** *and* re-authenticate → only then does it commit. Nothing irreversible in one click, and no confirm button is ever hard-`disabled` (it refuses out loud — see [[feedback_disabled_submit_click_deadend]]).

**Three numbers, not one.** AC-03's spine is `computed (StatutoryContribution) − deposited (recorded challans) = outstanding`, with **declared in a return** as a third, separate column: money can be deposited and still undeclared (a TDS challan paid in August whose 24Q return is not due until October). Modelling `filed` as a flag on the payment, not a status on the head, is what makes that visible.

**Recording a payment is itself a maker-checker item.** A payment that did not happen hides a default, so the form's submit says "Send it for a second check", not "Record".

## The money discipline that actually worked

Every figure is **reduced from parts at render time**, and the run's parts are the SAME per-pay-group component aggregates `pages/payroll.jsx` sums its console from. Result: gross 3,10,21,350 / deductions 54,18,500 / net 2,56,02,850 / held 1,09,100 / leaves-the-bank 2,54,93,750 / employer 18,32,780 / 412 staff / 410 payees are identical on both screens *by construction*, not by copying. A `RECONCILES` boolean at the bottom of the file asserts every identity at load and `console.warn`s if one ever breaks.

Two cross-screen wins worth repeating: the run's employee-side statutory lines sum exactly to `deductions − loans`; and AC-01's liability headline is `Σ AC-03 payable` over both entities, so the home page cannot quote a number the reconciliation disagrees with. **Grep every sibling page for a constant before authoring one** — the batch had to be payroll.jsx's `REIMB` (31 claims, ₹2,68,450) and the posted arrears had to be its `ARREAR` line (₹1,86,400, 4 people), or the gate would have double-counted money already inside the run.

## Caveats found in the sibling files

The v3 pages do **not** share one "today": payslips/payroll sit at ~12 Aug 2026, groupadmin at 3 Sep, principal at 15 Sep. I anchored to payroll's timeline because AC-02's content *is* PR-2026-08. `groupadmin.jsx` also carries campus headcounts (537 across 4 campuses) that disagree with payroll's 412-staff run — I avoided printing any per-state headcount rather than adding a third number to the argument. Legal entities are payroll.jsx's two (`Sunrise Education Trust`, `Sunrise Foundation (Pre-school)`), and the overdue filing is Telangana professional tax, matching GA-01's exception kind and campus.

## Promotion candidates for kit.jsx

`SignOff` (two-panel maker/checker, the empty panel IS the control) · `MiniTable` (dense sub-table with a computed footer — used 9× here) · `Trail` (append-only activity) · `RefusedAction` (a disabled control with its reason beside it, the standing convention made reusable) · `ReasonPrompt` (reason code + note, shape shared with payroll.jsx — should be ONE component) · `Fact` / `DefRow` (label-over-value and label·value·rule). `Shell` (rail + motif + crumb + title + as-at line) is a per-role page frame every satellite page re-implements; worth extracting.

## Deliberate refusals

No Approve for the maker under any circumstance and no break-glass path; no Edit on a pending item; no Delete anywhere (asserted by a puppeteer sweep over every control label in both languages); no filing artefacts (AC-04/05) or rate configuration (GA-07); no rate, ceiling, slab or percentage printed as copy — every statutory line is an amount that names its pinned config version, and an arrears line names the version pinned to ITS month.

See [[feedback_absent_vs_disabled_capability]], [[project_v3_leave_payslips]], [[feedback_cross_screen_mock_constants]].
