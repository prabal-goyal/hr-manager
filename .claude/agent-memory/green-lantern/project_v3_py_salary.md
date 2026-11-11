---
name: v3-py-salary
description: design/v3/pages/py-salary.jsx — PY-02..06, the section that DEFINES pay; structure rules are authored so they reproduce payslips.jsx's real payslip, and the excluded-allowance limit is read from the pinned config
metadata:
  type: project
---

`design/v3/pages/py-salary.jsx` (`window.Pages3.PYSalary`, route `?role=payrollOfficer&screen=pySalary`) is PY-02 pay groups, PY-03 structure editor, PY-04 honorarium rules, PY-05 employee salary + revisions, PY-06 proposed-revisions queue — one file, one dataset, one tablist.

**Why these choices, for the next payroll screen:**

- **A structure carries RULES, never a person's number.** `PayComponent.calc_type` is modelled as `grade` (the basic sits on the EmploymentContract, M3 §6.3 — a school runs a pay scale), `pct` (share of another component), `flat`, `balance` (closes to the gross). That combination is what lets ONE structure serve people at 68,400 and 94,800 without a negative special allowance — an earlier attempt with a flat BASIC produced `SPL = −5,280` for the lower-paid teacher. `priceComponents()` evaluates in authored order and `balance` closes last.
- **The rules are checked against a sibling's shipped payslip, in code.** At Ananya Rao's grade basic they must yield BASIC 39,500 · DA 7,900 · HRA 19,750 · ACAD 6,530 · SPL 21,120 — `pages/payslips.jsx`'s July payslip. A `PAYSLIP_CHECK` constant asserts it at render and shows a drift warning if it ever stops holding. Do the same wherever a new screen re-derives a figure another screen already issued ([[cross-screen-mock-constants]]).
- **The Labour Code 50% limit is a config field, not copy.** `WAGE_RULE = { excludedMaxPctOfTotal: 50, cfg: CFG_PINNED }`, rendered with version + effective date + publisher, exactly the way `payroll.jsx` renders its variance gate. `wages = components with pf_applicable`, `excluded = the rest`, verdict derived. The in-use teaching structure lands at **exactly 50.00%** — a live "at the limit" state that makes the rule legible; the draft v4 (DA cut to 10%, a CONV allowance added) is **over by 3,950.00** and the save is genuinely refused with the overage and the offending components named.
- **A revision names the run it lands in.** `PERIODS` is the single lock table every date control reads: Apr–Jul paid, Aug computed and with the checker, Sep open. Back-dating builds an arrears schedule month by month, each row carrying **that month's own pinned config version** (June → v2026.2, July/Aug → v2026.3), priced on that month's paid days, totalling in code, posting into `PR-2026-09` because August cannot take it. A revision effective in August is refused outright and names both the run and Rajiv Menon.
- **The lock check runs BEFORE the reason check** in the submit validator: a date that cannot be used is the blocking fact, and asking for a reason first hides it behind a second click.
- **PY-06 rows must reconcile too.** The `change` column derives from the figure the row *actually stands for* (`accepted ?? proposed`), so `today + change = proposed` holds even on the row a person already modified — the first version showed the accepted figure beside the original recommendation's delta and the arithmetic was wrong on screen while every test passed.
- **Honorarium units have no automatic source** (period attendance is P2-deferred). Rendered as a manual, two-person, attributed entry (Kavita Sharma enters, Sunita Kulkarni approves) that is **locked by PR-2026-08** — the "Enter monthly units" primary is a disabled-with-reason control routing to the run console.
- **Layout:** every 7+ column register wants FULL width. Two-column rows starved the first column to ~90px on the honorarium tab; the fix was to give each table its own full-width row and put the short cards in a 3-across row of their own.

New demo people introduced (fresh staff ids, checked against every sibling): **Ritika Chawla NAV-0431** (joins 1 Sep, deliberately unassigned so PY-01's "everyone has a salary" for the August run stays true), **Bhavna Rege NAV-0284**, **Tarun Chaubey NAV-0291** (visiting faculty). Everyone else is reused from `payroll.jsx` / `hr.jsx`.

Related: [[v3-payroll-console]], [[colorcard-dark-ink-inversion]], [[dynamic-i18n-key-range]], [[gate-threshold-from-config]], [[absent-vs-disabled-capability]].
