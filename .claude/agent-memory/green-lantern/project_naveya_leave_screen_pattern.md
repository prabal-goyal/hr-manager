---
name: project-naveya-leave-screen-pattern
description: design/screens/leave.jsx built the ESS Leave screen — the Register record-rule motif extends into ruled leave ledgers, not just attendance; two private kit-candidate primitives (Textarea, segmented day-type toggle) were needed.
metadata:
  type: project
---

Built `design/screens/leave.jsx` -> `window.Screens.Leave` (content-only, mounts inside `EmployeeShell`, see [naveya component kit](project_naveya_component_kit.md)). Structure: balances ledger (ruled, structural teal record-rule column per row — DESIGN.md explicitly scopes "the register" motif to "attendance, leave, payroll, and documents", so leave balances/history reuse the same 6px accent rule-column grid pattern `Register`/`Ledger` use internally, built locally since neither kit component fit a heterogeneous-row balance table) -> apply-leave panel (Card with a two-column split: form left, live preview right — approver, paid/LOP day computation, exam-blackout overlap warning) -> history ledger (same ruled/record-rule pattern, `StatusPill` per row).

Two private components had no kit equivalent and were built locally in the screen file: a `Textarea` (mirrors `Input`'s focus-ring/border treatment manually since kit only exports single-line `Input`) and a `DaySegmented` control (Full day / Half day / Period-level three-way toggle, active segment filled `c.accent`/`c.onAccent`). Both are candidates to promote into `kit.jsx` if a second screen needs them.

**Why:** kept as private (not added to kit) per dispatch instructions — screens may build private one-offs but must never edit `kit.jsx` directly; promotion is a separate, deliberate decision.

**How to apply:** when building payroll/documents screens that also claim "the register" hero surface, default to the same ruled-grid + record-rule-column pattern rather than inventing a new ledger shape; if a screen needs a textarea or segmented toggle again, promote these two into `kit.jsx` instead of re-authoring a third private copy.
