---
name: v3-hr-lifecycle-screens
description: HR-22/23/24/25 (design/v3/pages/hr-lifecycle.jsx) — proper nouns skip t(), and a permission a role never holds is a verb that doesn't exist in that file at all.
metadata:
  type: project
---

Built `design/v3/pages/hr-lifecycle.jsx` — one file, four tabs (`Tabs`/`TabPanel`, single-panel-mounted per [[feedback_tabpanel_lazy_single_instance]]): HR-22 onboarding checklists, HR-23 bulk/seasonal onboarding, HR-24 probation & confirmation, HR-25 renewal & non-renewal.

**Proper nouns and captured free text are NOT run through `t()`.** Re-confirmed by reading `hr.jsx`'s own `STAFF` array (`name: "Ananya Rao"`, `dept: "Science"` rendered as raw JS strings, never `t(s.name)`) and its `DOC_QUEUE.noteText` (a literal English sentence, no Hindi twin). Only structured/controlled vocabulary — state words, action labels, column headers, dialog copy, controlled reason-code options — needs EN/HI parity. This cuts an invented-name transliteration burden that looked mandatory from the "every demo value is authored in both languages" language in file headers, but isn't, per the sibling files' own code.

**Why:** Saved ~40 invented names (joiners, dept heads, contract-holders) from needing Devanagari transliteration, and matches the actual, load-bearing precedent rather than the aspirational header comment.
**How to apply:** Before transliterating an invented person/department name for a new demo dataset, grep a sibling page's existing `STAFF`/similar array for whether names go through `t()`. If not, don't invent that work for yourself.

**A capability a role never holds is a verb that is ABSENT from that role's file entirely — not a disabled stub, and not even a comment-only "principal would see a button here."** HR-25's "Decide: renew / do not renew" belongs to the Principal (`screen-inventory.md` says so explicitly); the HR route (`hr.lifecycle.manage`) is the only way this file is ever reached (checked `kit.jsx`'s `ROLE_PERMISSIONS.principal` — it has no `hr.lifecycle.manage`, so Principal can't even navigate here via the rail). So the file renders zero renew/non-renew buttons anywhere — recommend and execute-once-decided are HR's real verbs — and states the rule in one line of body copy instead. Verified live: grepped rendered body text for the literal string `"Decide:"` and asserted it never appears, rather than trusting the file's own comments.

**Why:** `ui-compliance-requirements.md`'s absent-vs-disabled table is explicit that a role that never holds a right gets no control at all, not a greyed one — a greyed "Decide" button would have leaked the existence of a permission HR doesn't have.
**How to apply:** Any screen-inventory action row whose "Who @ scope" names a DIFFERENT role than the file's own route: grep that other role's `ROLE_PERMISSIONS` entry in `kit.jsx` before assuming a shared screen needs a role-conditional render — if the nav permission proves the other role can never reach this file, the action is simply never built here, and say so in the header comment (screen-inventory HR-25 explicitly says "both roles use this screen, which is why the decision and the execution are separate actions" — the decision-half lives on a Principal-route file this dispatch didn't own).

Also reused, deliberately, rather than re-invented: `hr.jsx`'s Neha Bhatt (NAV-0250, still "no login yet") as HR-22's in-progress joiner, and Rohit Malhotra (NAV-0161, guest faculty, contract ended 31 Mar 2026) as HR-25's flagship "expired contract, still working" compliance-exposure lead — both already existed as facts in a sibling file's mock data ([[feedback_cross_screen_mock_constants]]).

See also [[feedback_reference_screenshots_not_prose]], [[reference_verify_via_cloned_harness]] (used in-flight request-interception instead of an on-disk `v3.html` clone, cleaner — no temp file to remember to delete).
