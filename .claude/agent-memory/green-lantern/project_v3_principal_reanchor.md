---
name: v3-principal-reanchor
description: principal.jsx re-anchored from 15 Sep to 11 Aug 2026 to match the role-switcher's shared TODAY_ISO; live-blackout-state-without-moving-the-clock pattern.
metadata:
  type: project
---

`design/v3/pages/principal.jsx` originally anchored "today" to 15 Sep 2026 (day 2 of the Term-1 exam blackout) so PR-01's blackout banner and PR-03's override flow would render "live" rather than hypothetical. Once `design/v3.html` grew a role switcher, that made every other role's screen (all anchored 2026-08-11, see [[project_v3_canonical_peacock]] siblings) jump five weeks when a reviewer flipped to Principal. Re-anchored to `TODAY_ISO = "2026-08-11"` (Tuesday), matching screens.jsx/attendance.jsx/leave.jsx/depthead.jsx/payroll.jsx/accountant.jsx.

**Key pattern for "we want a state that's only true on a date outside the anchor": don't move the clock, add a demo-only preview toggle.** `BlackoutBanner` now computes `daysBetween(TODAY_ISO, BLACKOUT_START_ISO)` and renders an honest "starts in 34 days" (`pr.blackout.upcoming`) by default, with a local-state `Switch` ("Preview: treat as live") that swaps in the original `pr.blackout.live` copy for review — never touching TODAY_ISO. This mirrors groupadmin.jsx's scenario `Segmented` for loading/error/first-run, but as a plain kit `Switch` since it's binary. The override flow itself (justification requirement) was ALREADY decoupled from "today" — it triggers off an escalation row's own `cause === "blackout"` + its leave dates falling in the window, so it needed zero logic changes, only the banner copy needed the toggle.

**Hardcoded-date traps found and fixed while re-dating a mock, worth re-checking on any future re-anchor task:**
- A "coverage that week" note (`pr.lv.coverage.overlap`) had the colleague's overlap dates hand-typed as literal ISO strings in the JSX call site, coincidentally equal to another mock array's "on leave today" entry for the same person — once TODAY_ISO moved, that coincidence broke (the colleague's "today" leave is now a different date than the coverage note implied). Fixed by extracting a dedicated `LR0288_COVERAGE` const, decoupled from `ON_LEAVE_TODAY`.
- Two more hardcoded ISO literals lived inside event handlers, not the mock-data block: `decide()`'s `const now = "2026-09-15"` and a `fmtDate(t, "2026-09-15")` call inside the reassign-done message. Both are exactly the "pre-formatted date baked into mock content" bug class from [[feedback_i18n_demo_content_leaks]] — grep for the literal ISO string across the WHOLE file, not just the top mock-data block, when re-dating.

`agedDays` honesty rule confirmed generalizable: `agedDays = today − escalatedOn` in days, and this file's own `overdue` threshold is derivable from its visible copy (`pr.lv.sla`: "expected within 48 hours" → overdue iff `agedDays > 2` while still pending). When re-dating any escalation/aging mock, look for the SLA copy the file already displays before inventing a new rule.

Verified via puppeteer against the shared 8934 server (see [[reference_puppeteer_verification]]): 12 role/screen/theme/lang combos zero pageerrors/console errors; grepped rendered body text for `pr\.[a-zA-Z0-9_.]+` to catch untranslated/missing-key leakage (found none); clicked through approve/reject/reassign/override flows and confirmed the resulting date stamps are `TODAY_ISO`-derived, not stale literals.
