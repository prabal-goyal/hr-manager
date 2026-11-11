---
name: project-ess-content-screens-attendance
description: design/screens/{documents,payslips,attendance}.jsx are the growing set of ESS content screens plugged into EmployeeShell's nav; attendance.jsx defines a 10-state arrival-mark taxonomy worth promoting to kit.jsx later
metadata:
  type: project
---

As of 2026-07-22, `design/screens/` holds per-route ESS content components alongside the original `design/screens.jsx` (Login/EmployeeHome/EmployeeShell/AdminStub): `documents.jsx` (`window.Screens.Documents`), `payslips.jsx` (`window.Screens.Payslips`, list->detail with Ledger + employer contributions + YTD + masked bank reveal), and `attendance.jsx` (`window.Screens.Attendance`, the day-list + adjacent Day Timecard "ledger that computes pay"). Each follows the same shape: private helper components documented inline as "candidates for the shared kit later," a content root taking shell-provided callback props (`onViewAttendance`, `onViewPayslips`), exported via the `window.Screens = window.Screens || {}` load-order-safe guard. `EmployeeShell`'s nav key for attendance is `"attendance"` (icon `"clock"`) in `design/screens.jsx`'s `EMP_NAV` — the wiring agent plugs `Screens.Attendance` in at that route.

`attendance.jsx` defines a 10-state arrival-mark taxonomy (onTime/late/missingSwipe/absent/weeklyOff/workedOnWeeklyOff/onLeave/holiday/half/today/future) as a private `ArrivalMark`/`MARK_CONFIG`/`MarkGlyph` set — richer than kit.jsx's `Mark` (P/A/L/H only). It also introduces a punch-tick convention (brass-colored ticks marking biometric in/out punches, tying to DESIGN.md's "brass = verified/on-the-record" semantic) and a day-timeline pattern (worked segments in teal, break tinted warning-alpha) that mirrors `screens.jsx`'s `TodayModule` bar almost exactly.

**Why:** future ESS screens (Leave is the next likely ask per [design dispatch scope](feedback_design_dispatch_scope.md)'s product-priority note) will want the same day-status vocabulary (leave/holiday/weekly-off all recur), and a future kit-promotion pass should look at `attendance.jsx`'s `ArrivalMark` + brass-punch-tick + `MiniTimeline`/`BigTimeline` pair as the reference implementation rather than re-deriving it.

**How to apply:** when building the next ESS content screen, check `design/screens/` for an existing extracted view before writing new markup (per [naveya component kit](project_naveya_component_kit.md)'s "check for an existing extracted view" rule), and reuse `attendance.jsx`'s mark taxonomy / timeline helpers by reference (copy the pattern, since they're currently private to that file) rather than inventing a third status vocabulary.
