---
name: cross-screen-mock-constants
description: before deriving money on a new v3 page, grep the other pages for the same constant — a comment claiming "taken from Home's payslip mock" was wrong by 10k
metadata:
  type: feedback
---

When a new screen derives a figure from an existing mock (a day rate from a monthly gross, a YTD from monthly nets), **grep every sibling page for the same quantity and reconcile before writing a line of layout** — do not trust a code comment that names its source.

**Why:** `design/v3/pages/attendance.jsx` declares `MONTHLY_GROSS_REF = 104600.0` with the comment *"same employee's July gross, from Home's payslip mock"* — but `design/v3/screens.jsx` actually has `PAY.gross = 94800.0`. The LOP day rate on My Attendance is therefore ₹3,486.67 while the same teacher's Leave screen would say ₹3,160.00 for the same unpaid day. A reader adding up two screens finds the product lying about money, which DESIGN 4 says destroys trust as fast as a wrong number. The comment was confident and wrong.

**How to apply:** treat `screens.jsx` (Home) as the canonical mock ledger — it is the screen every reviewer opens first — and derive from it (`GROSS = sum(EARNINGS)`, `net = gross − Σdeductions`, `YTD = Σ paid months`) so the arithmetic is the code's, never a retyped literal. Where a sibling page already disagrees, say so in the dispatch report instead of silently picking a side. Related: [[v3-leave-payslips-screens]], [[reference-figures-need-auditing]].
