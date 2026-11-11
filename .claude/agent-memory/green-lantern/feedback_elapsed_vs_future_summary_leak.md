---
name: feedback-elapsed-vs-future-summary-leak
description: a month/register view that shows calendar-known future off-days and holidays (for shape/preview) must exclude them from summary counts and totals — caught via puppeteer DOM reconciliation on the Attendance page, not visually
metadata:
  type: feedback
---

Building `design/v3/pages/attendance.jsx`'s month register, the first pass computed a day's `status` (present/late/off/holiday/leave/...) purely from the calendar (weekday, holiday list, overrides) without tracking whether that day had actually elapsed. Weekly-offs and gazetted holidays are calendar-known regardless of whether they're in the future, so the naive version assigned them a real status even 20 days ahead of "today". The Register's summary chips (`Present/Late/Leave/Off`) and totals row were built from `rows.filter(status != null)` — which silently included those future off/holiday days, inflating the "Off" chip from the correct 2 (elapsed Sundays) to 5 (2 elapsed + 3 future Sundays not yet reached).

This did not show up visually — the register still looked plausible — and was only caught by the puppeteer reconciliation pass (scraping chip counts + summing the Hours column vs the totals-row figure and diffing).

**Why:** attendance-as-money means a summary count has to mean "what happened", not "what's scheduled" — a payroll-adjacent number that's wrong by construction (counting the future as already-elapsed) is worse than an obviously-broken one, because it looks correct.

**How to apply:** whenever a calendar/register view mixes "known in advance" (holidays, weekly-offs, roster) with "only knowable after it happens" (attendance, punches), give every day an explicit `elapsed` boolean at generation time and filter the register/summary/totals by it — even though the same day can still be legitimately previewed (dimmed, non-authoritative) in a shape/calendar overview above the register. Verify with an actual DOM-scraped reconciliation (chip count == row count, sum of row figures == totals-row figure), not eyeballing the screenshot — this class of bug is invisible to the eye. See [[project-v3-canonical-peacock]] for the design system this page is built on.
