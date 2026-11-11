---
name: v3-hr-reports-setup
description: hr-reports.jsx (HR-08/34/35/36/37) — completes HR; live threshold-gated aggregate suppression, category-edit ceremony scoping, single-source progress numbers across two tabs.
metadata:
  type: project
---

`design/v3/pages/hr-reports.jsx` → `window.Pages3.HRReports`, five tabs (Tabs/TabPanel, one mounted panel each). Completes the HR role — the last of its 30+ screens.

**Aggregates-leak rule demonstrated LIVE, not just asserted.** HR-36 gates score distribution and recommendation counts behind a `FINALIZE_THRESHOLD` (5 finalized reviews) — below it, the aggregate is suppressed with the reason stated; at/above it, it renders in full. Built TWO cycles specifically to prove both branches: the open cycle (4 finalized → suppressed) and a closed probation cycle (6 finalized → shown). A reviewer can flip the cycle picker and watch the rule actually fire, rather than trusting a comment that says it would. Completion-by-stage (self/manager/peer/moderation/finalized counts) is explicitly NOT gated the same way — it's operational (who has started), not evaluative (what they scored) — [[feedback_v3_aggregation_leak_operational_vs_evaluative]].

**HR-08 "Must NOT contain: pay groups" vs the brief's own "usually implies a pay group" reads as tension — resolved by never showing/editing a pay-group value on the category screen, only a cross-reference note ("check Payroll setup, PY-02") when the vacation flag changes.** The screen states the implication without owning the field. Full leave entitlements are similarly out of scope — only the boolean (`is_vacation_staff`) lives here, hr-leaveatt.jsx HR-26 owns the actual day counts.

**The effective-date + recalculate-vs-grandfather ceremony (no default, per hr-leaveatt.jsx HR-26) fires ONLY when the vacation flag itself changes**, not on every category edit. Kind/min-qualification/probation-length edits still apply "going forward, audited" per the Actions table, but skip the ceremony since there's no leave balance to recalculate or grandfather for them. This is a narrower scoping than a literal reading of "editing a category" might suggest — flagged as a judgment call in the file's self-check.

**Single-source progress numbers, even across tabs in the SAME file:** `DEPT_PROGRESS` (5 departments × 5 stages) is the one array; `stageSum()` derives every cycle-level total (self/manager/peer/moderation/finalized) from it, and the Science drill-in's 8 named people (reusing hr-leaveatt.jsx's own roster — same codes/names) each carry one "furthest stage reached" that reconciles exactly to that department's row via `stageDone()`. Nothing is hand-counted twice. `CATEGORIES_SEED`'s 10 active categories sum to 214 — hr.jsx's own `TOTAL_IN_SCOPE`, reused rather than re-derived.

**A genuinely unresolved merge field, seeded on purpose:** `docRequestOverdue`'s template body references `{employee_name}` while the event only provides `{name}` — in BOTH languages, so the editor's validation (`unresolvedField()`, a regex scan for `\{[a-z_]+\}` tokens not in the event's field list) has something real to block on, not a hypothetical. Verified via puppeteer that "Send a test" is genuinely `aria-disabled` for that row.

Verification for a 5-tab, 5-screen file at this scope needs staged puppeteer scripts, not one giant one: a tab/theme/lang smoke pass (panelCount/danglingAria/hscroll/console-errors), then separate small scripts per interactive claim (category-edit no-default, template compliance-lock, report-total reconciliation, appraisal-suppression-threshold). Trying to script all of it in one file made failures hard to localize — [[reference_puppeteer_verification]].

See also [[project_v3_hr_leaveatt]] (the HR-26 ceremony this file matches), [[feedback_selected_row_fallback_and_placeholder_audit]] (cycle-picker/category-list selection pattern reused here), [[feedback_disabled_submit_click_deadend]] (Save stays clickable and reveals the "choose one" error rather than hard-disabling).
