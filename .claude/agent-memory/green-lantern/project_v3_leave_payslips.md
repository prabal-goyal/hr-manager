---
name: v3-leave-payslips-screens
description: design/v3/pages/{leave,payslips}.jsx — the consequence-panel recipe for a request form, and the "maker-checker as an employee-visible state" pattern for an un-released payroll month
metadata:
  type: project
---

Built 2026-09-03 as `Pages3.Leave` and `Pages3.Payslips`, following [[project-v3-attendance-screen]]'s satellite-page convention (own file, own `lv.*` / `ps.*` string namespace, composed only from `window.G3`/`window.UI3`, reusing `att.d*` weekday names from screens.jsx). Spec: **M8 §"Leave" + §6.7**, **M10 §"Payroll" + §6.9**, **M11/§4.4** for statutory presentation, **M7** for the term/blackout frame.

**Two patterns worth reusing.**

1. **The consequence panel on a request form.** The form itself is ordinary (type / dates / half-day / reason); the value is a live "What this means" list rendered under it, one row per real constraint — day count (Sundays + campus holidays excluded), balance, **loss of pay in rupees with its basis stated**, blackout-window clearance, term-vs-vacation, the cover arrangement, and the approval route. Every row is `tint + icon + WORD + sentence`, so a blocked request says "Blocked" in words. This is how A26's "disabled+reason, with the rule stated" becomes a designed surface rather than a rejection after the fact. The submit button is **never** hard-disabled (see [[disabled-submit-click-deadend]]); a blackout sets a `role="alert"` strip on submit instead.

2. **Maker-checker rendered as an employee-facing *state*, not a control.** The un-released month's payslip is replaced by a four-step stepper — prepared → signed by the person who prepared it → **approved by a different person** (current) → released — with the copy "it needs a second approver, someone other than her". The employee has no button anywhere; the governance is still legible. This answers "where is my payslip?" honestly and satisfies O5/DESIGN 10 on a read-only surface.

**Domain calls made, each traceable:**
- **Earned leave is refused, not offered.** M8's acceptance criterion is "a teacher (vacation staff) cannot accrue EL", so EL is absent from the type picker and appears on the balance card only as a *rule* ("your paid break is the school vacation"). This **contradicts Home's `LeaveCard`**, which still shows a PGT with 14.5/20 EL — reported to batman, not fixed here (screens.jsx is out of scope).
- **No invented year-end projection.** `LeaveBalance` (§6.7) has opening/accrued/used/balance and `LeaveType` has `accrual_rule`; a projected figure is shown only for the monthly-accruing type, where the rule makes it deterministic, and labelled "if you take none".
- **No statutory rate anywhere on the payslip** — only amounts plus the pinned version, and April–June deliberately pin `v2026.2` while July pins `v2026.3` (M11: "a prior month re-opened still computes on its original version"). ESI is *named* as not applicable with its ceiling attributed to the config, rather than silently omitted.
- Payslip download states password-protection + what opens it + that the download is recorded — closes gordon's §8-F16 against Home's payslip card.

**How to apply:** the consequence-panel recipe belongs on any employee request form (regularisation, reimbursement claim, investment declaration); the stepper belongs anywhere an employee reads the output of a maker-checker process. Promotion candidates left local in the page files: `TextArea`, `CheckRow`, `CodeMark`, `TrailStep`/timeline, `EqRow` (the gross − deductions = net ledger). Related: [[v3-attendance-keka-rebuild]], [[cross-screen-mock-constants]].
