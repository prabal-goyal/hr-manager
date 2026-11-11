---
name: v3-payroll-ops
description: design/v3/pages/py-ops.jsx (PY-09..PY-18) — ten screens grouped into six tabs, the maker-only refusal vocabulary, and the code-asserted cross-screen arithmetic block
metadata:
  type: project
---

`design/v3/pages/py-ops.jsx` (`window.Pages3.PYOps`, route `?role=payrollOfficer&screen=pyOps`) completes the
Payroll Operator role: PY-09 variance, PY-10 payslip register, PY-11 bank file, PY-12 publication,
PY-13 loans, PY-14 payout batches, PY-15 arrears, PY-16 exits, PY-17 F&F, PY-18 reports.

**Grouping (six tabs, two of them nested):** Variance & register (PY-09+10, nested tablist) ·
Pay & publish (PY-11+12, stacked) · Loans & advances (PY-13) · Claims & arrears (PY-14+15, nested
tablist) · Exits & settlements (PY-16 register + PY-17 detail, master/detail) · Reports (PY-18).
Grouped by the *question* each screen answers, not by inventory numbering — "is the run right",
"how does it leave", "what is owed over months", "what is added to a run by a maker", "who is
leaving", "what does someone ask payroll for".

**The one thing worth copying:** a `CHECKS` object at the foot of the file that asserts every
cross-screen figure in code (`window.Pages3.PYOpsChecks` / `PYOpsChecksPass`), then a puppeteer
step reads it. Thirteen assertions — the loan register summing to `payroll.jsx`'s LOAN line, the
arrears posting summing to its ARREAR line, the claim rows summing to `accountant.jsx`'s batch,
the F&F lines summing to its gate item, the bank file plus supplementary file summing to July's
net. A comment claiming consistency rots; an assertion that a screenshot test reads does not.
See [[cross-screen-mock-constants]] for why this was needed.

**Maker-only vocabulary, reused on every tab:** `AbsentNote` (a control that is NOT drawn, plus
"why this is not here") beside `OffAction` (a control that IS drawn, disabled, plus "why this is
off"). Approve appears nowhere on the page in any form; every gate names Rajiv Menon (NAV-0009,
`payroll.approve`) against Sunita Kulkarni (NAV-0031, `payroll.run`). F&F is the single tenant-
configurable exception (M12 amendment C) and is rendered as a *stated mode* plus a demo-only
preview Switch of the other configuration — never a control.

**Domain shapes worth reusing:**
- A loan is authored as a contract (principal, tenure, annual simple rate) and interest / EMI /
  outstanding are all derived; a deferral lengthens the schedule by a month and leaves the
  outstanding formula untouched; the last instalment absorbs the rounding so the schedule's
  column footer equals the principal it claims to repay.
- A recovery that would take net pay below zero is refused with the person's net, the instalment,
  the resulting negative, and the two ways out (lower the amount, lengthen the tenure). Lengthening
  the tenure in the live form clears it.
- A settlement is *allowed* to be negative (a receivable against the leaver, pursued outside
  payroll); a payslip is not. Saying both in the same paragraph is what makes the rule legible.
- Names appear only on the exits tab and on payroll-operator-only registers the inventory
  explicitly requires them on (variance "leaver" cause; loans "outstanding at exit"). The shared
  home board in `payroll.jsx` still reports F&F as a count (`§8-F13`), and this file's two
  "not started" rows ARE that count — asserted in `CHECKS.ffCount`.

**Promotion candidates** (all now at 4+ independent copies across v3): `MiniTable`, `EqRow`,
`ReasonPrompt`, `ConfirmPanel`, `OffAction`, `AbsentNote`, `Panel`, `SignOff`, `Fact`, `RowCheck`.

**Flagged for the coordinator:** `accountant.jsx` gives Imran Qureshi NAV-0206 while `payroll.jsx`
gives Imran Qureshi NAV-0270 (a visiting-faculty variance row). Rather than picking one and
contradicting a sibling file, both are kept and the loans register's row says so in words — the
staff ID is the identity. A real hazard in a 412-person school, turned into copy.
