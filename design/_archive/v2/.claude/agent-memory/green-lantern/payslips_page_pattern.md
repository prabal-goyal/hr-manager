---
name: payslips-page-pattern
description: How payslips.jsx composes the Register grammar for a single-employee payroll register + history register, and the page-local i18n pattern used when copy isn't in kit.jsx's shared STRINGS table
metadata:
  type: project
---

`design/v2/pages/payslips.jsx` (window.Pages2.Payslips) is the first page built on top of kit.jsx's Register/Masthead/ActionBar/StatusFooter grammar (register_grammar_kit.md) — worth reusing as the reference for the next dense register page (AttendanceMuster, SubstitutionBoard, PayrollRegister-admin ports).

**Pattern for page-local i18n on top of the shared LangProvider:** kit.jsx's `useLang().t()` only knows kit.jsx's own STRINGS table, and pages must NOT edit kit.jsx. So a page with its own copy defines a local `STR2 = { en: {...}, hi: {...} }` dict plus a tiny `useL()` hook that reads the SAME shared `lang` from `useLang()` and looks up the local table — this keeps the ONE global language switcher authoritative over page-local copy too, without ever touching kit.jsx. Verify en/hi key parity with a quick regex diff before finishing (a missing hi key silently falls back to English, which passes the guard hook but breaks the actual translation).

**Register composition for a "one employee's payslip" screen:** a single Register holds earnings rows, a bold "Gross Earnings" subtotal row, deduction rows, a bold "Total Deductions" subtotal row, and the Register's own `totals` prop carries the double-rule NET PAY footer (labelSpan across the identity/basis/type/statutory columns, amount in the last column). This reads as one continuous ledger that still obeys "everything sums" at both the subtotal and grand-total level, without inventing a second grammar primitive.

**Colour discipline learned from PayrollRegister.dc.html (the actual shipped mock, not assumption):** earnings amounts stay **plain ink**, never green — the design system's colour rule is "brass marks money that is verified/accrued, red is reserved for deductions/absence/held." So: Type chip = `tone="neutral"` for EARNING, `tone="danger"` for DEDUCTION (red only appears on the deduction side); statutory row marks (PF/ESI/PT/TDS) use `tone="seal"` (brass) as the "official/statutory" identifier, not red. Only the deduction `Figure` amounts use `negative` (which auto-colors `c.danger`). Statutory abbreviations (PF/ESI/PT/TDS) are left untranslated in both en and hi — real Indian Hindi payslips print the same scheme codes.

**Avoid half-wired interactivity in a static design canvas:** started with a period-switcher `Select` in the ActionBar that didn't actually recompute the register (no per-period earnings data), then removed it — a control that looks interactive but silently no-ops is worse than not having it. If a control can't be fully wired with real state changes, either fully wire it with the minimal data needed (e.g., the period *history* Register, which only needs net-pay + status per row) or leave it out.
