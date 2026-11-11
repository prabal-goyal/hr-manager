---
name: project-v3-depthead-screens
description: DH-01/02/03 Department Head build (design/v3/pages/depthead.jsx) — cross-page data reuse, new overlay primitives, and the temp-harness verification technique for unwired role routes.
metadata:
  type: project
---

Built `design/v3/pages/depthead.jsx` (`window.Pages3.{DHHome,DHLeave,DHAttendance}`) implementing DH-01/DH-02/DH-03 from `docs/screen-inventory.md`, persona Anjali Deshpande (Head of Department, Science, Sunrise Public School). Single self-contained file, per dispatch boundary — did not touch `kit.jsx`/`tokens.jsx`/`screens.jsx`/`v3.html`/sibling `pages/*.jsx`.

**Why:** these three screens are the approver's counterpart to the employee ESS surfaces already built (`attendance.jsx`, `leave.jsx`), and the dispatch required the domain realities (cover arrangement, blackout windows, LOP consequence, department-only scope) to be real interaction states, not copy.

**Cross-page fact reuse (deliberate, verified by grep before writing).** Ananya Rao's exact `LR-0219` leave request (id, dates, amount, reason key `lv.r.wedding`) from `leave.jsx` is the same request Anjali decides on DH-02 — same `TODAY_ISO = "2026-08-11"`, same CL balance numbers (opening 12/used 4/balance 8). Month names (`lv.mon.*`), weekday abbreviations (`att.d0..6`), and status words (`att.stPresent/stLate/stLeave/stOff`, `att2.stAbsent/stMissing`) were all reused via `t()` rather than re-authored — these keys are globally merged by `addStrings` regardless of which page's `<script>` tag loads first, so cross-file reuse is safe as long as both files are present before React renders. See [[feedback_cross_screen_mock_constants]].

**How to apply:** before inventing a persona/date/balance for a new role page, grep sibling `pages/*.jsx` and `screens.jsx` for the same employee/date — the product reads as one coherent school specifically because these numbers agree everywhere.

**New primitives this dispatch needed (kit.jsx has no modal, only `ActionMenu`'s anchored popover):**
- `ConfirmDialog` — a centered, portal-rendered dialog (backdrop is a *sibling* absolutely-positioned div using `c.rail` + CSS `opacity`, never a `rgba()` literal — the dialog box must NOT be a child of the backdrop or the opacity bleeds into it). Used for bulk-approve confirm+result and export-scope confirm.
- `RowCheck` — a styled checkbox button (kit has no checkbox primitive at all).
- `PillGroup` — the generic form of `leave.jsx`'s page-local `FilterPills` (label+count pill row), reusable for any status/type filter.
- `TypeMark`, `VerifyChip`, `ScopeBanner`, `PersonLine` — small local composites.
All five are promotion candidates for `kit.jsx` on its next touch (third dispatch to independently need a checkbox-shaped filter row, after `leave.jsx` and `attendance.jsx`'s own local versions).

**Self-caught guard violation, fixed before finishing:** building `ConfirmDialog` and a day-cell popover, I reached for `rgba(20,12,8,.45)` (backdrop) and `boxShadow: "...rgba(0,0,0,.18)"` (popover) out of habit — both are banned raw-colour literals. Fixed by using `c.rail` + `opacity` for the backdrop and `shadow(step)` from `useTheme()` for the popover. **Why this recurs:** kit.jsx's own components never need this because they're pre-built; a NEW overlay/modal primitive is exactly where a raw literal sneaks in. **How to apply:** run the `grep -E "#[0-9A-Fa-f]{3,6}|rgba?\("` self-check especially hard on any file that adds a modal/backdrop/popover, not just at the end reflexively.

**Bulk-approve interaction shape (verified with puppeteer clicks, not just screenshots):** selecting ≥2 pending rows and confirming runs each row through its own precondition check; blocked rows (locked month, cover-needed, blackout) fail individually with the exact stated reason while valid rows approve — "any row invalid → that row fails with a named reason, the rest proceed" (DH-02 spec). This per-row-transactional simulation pattern is the one to reuse for DH-04 (regularisation) and DH-07 (reimbursement) bulk actions when they're built.

See [[feedback_v3_role_pages_not_wired]] for the verification-harness technique this dispatch needed since `v3.html`'s script tags for role pages were not actually present despite the dispatch brief.
