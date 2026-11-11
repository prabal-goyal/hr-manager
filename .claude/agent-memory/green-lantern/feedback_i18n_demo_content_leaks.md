---
name: feedback-i18n-demo-content-leaks
description: mock/demo row content (arrival times, log-entry descriptions) is as translatable as chrome labels and easy to forget
metadata:
  type: feedback
---

Building STAFFROOM v2's "Recent days" row list (design/v2/screens.jsx), I wired `SectionHeader`/pill labels through `t()` but left the row `title`/`subtitle` mock strings ("Wed, 20 Jul", "Arrived 9:42 · 42 min late", "Missing swipe — flagged for HR review") as raw English literals passed straight into `DayLogRow` props. It rendered fine in English and looked complete, but switching to Hindi left three full English sentences sitting inside an otherwise-Hindi card — exactly the "robotic/inconsistent" failure mode the whole v2 direction exists to fix, and it was easy to miss by eye because the surrounding chrome (headers, pills, nav) WAS correctly translated.

**Why:** it's tempting to treat sample/demo row content as "just data" (like a name or a date) rather than UI copy, especially when it's colocated in the same component call as real chrome strings that already go through `t()`.

**How to apply:** when a screen has any list of demo/mock content rows (attendance log entries, notification text, activity feed), audit each row's prose fields individually — don't assume "I called t() somewhere in this component" means every string in it is covered. Verify with an automated check, not eyeballing: script a puppeteer pass that captures `document.body.innerText` in each language and asserts none of the OTHER language's known literal strings appear (e.g. `bodyText.includes("Arrived")` while Hindi is selected) — caught this exact bug that way in this dispatch. Numeric/proper-noun exceptions (school name, "PGT", short month-abbrev dates like "15 Aug") are fine to leave as-is per existing convention; multi-word sentences are not.
