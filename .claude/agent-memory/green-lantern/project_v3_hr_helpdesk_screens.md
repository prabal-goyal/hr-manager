---
name: v3-hr-helpdesk-screens
description: design/v3/pages/hr-helpdesk.jsx (HR-31/32/33) — computed SLA state machine, restricted-role gap, catName() free-text-category pattern, no-campus-scope choice
metadata:
  type: project
---

Built `window.Pages3.HRHelp` for **HR-31** (helpdesk queue), **HR-32** (ticket
detail, rendered as the queue's own detail pane — same shape `hr.jsx`'s
HRDocs/HR-09 already uses), **HR-33** (categories & SLA, setup). Two tabs
(`Queue`, `Categories & SLA`) via `UI3.Tabs`/`TabPanel`, one tablist, one
mounted panel at a time.

**SLA state is computed, never hand-set.** `hoursBetween`/`slaStateFor` derive
comfortable/at-risk/breached/paused/met-on-time/met-late from a ticket's
`raisedISO/raisedHour`, its category's `slaHours`, and a fixed demo clock
(`TODAY_ISO="2026-08-11"`, `NOW_HOUR=15`) — the same ISO-string-parsed-as-local-date
pattern as [[project_v3_hr_leaveatt]]'s CLOCK block. A ticket's own pause instant
(`pausedOnISO`) or resolution instant (`resolvedOnISO`) is used as the evaluation
point instead of "now" when applicable, so a resolved/closed/paused ticket's
SLA words don't silently drift as an unrelated demo clock changes elsewhere.

**Two flagged gaps, not invented around** (see the file's own header comment
and end-of-file SELF-CHECK for the full reasoning):
1. **Grievance access has no permission distinct from `hr.helpdesk.manage`**
   in `kit.jsx`'s `ROLE_PERMISSIONS` — M15.1 names a restricted role separate
   from general helpdesk management, but the whole build only has one `hr`
   role. This file treats Meera Iyer (the one HR persona rendered) as the
   restricted-role holder so the "grievance ticket, visually distinct" state
   is actually demonstrable, but still marks every grievance ticket
   "Restricted — confidential handling" (glyph + word) — a real build needs
   its own `hr.helpdesk.grievance`-shaped permission.
2. **No campus scope** — HR-31/32/33's screen-inventory entries never
   mention campus, unlike every sibling HR screen (HR-01/02/09/26-30). Treated
   as school-wide by choice; each ticket still carries `raiserCampusKey` as
   data, there's just no switcher. A genuine "spec was silent, here's the
   choice and why" — see [[feedback_spec_silent_choices_hr_leaveatt]] for the
   house pattern of naming this in the report rather than defaulting quietly.

**`catName(t, cat)` pattern** — a category added at runtime via the "Add a
category" form carries a free-text `name` (no i18n key exists for a string
the operator just typed), while every seeded category carries an i18n
`nameKey`. Every render site reads through `catName()` rather than calling
`t(cat.nameKey)` directly, so a user-added category never shows a raw i18n
key string or blank label. Any future page mixing seeded/i18n'd config with
user-typed-at-runtime config should use the same fallback-through-a-helper
shape rather than forcing everything through `t()`.

**Promotion candidates** (kit.jsx untouched, listed for a future kit pass):
`RestrictedBadge` (paired lock-glyph + "Restricted" word — likely reusable
anywhere else M15.1 grievance handling surfaces, e.g. a future EMP-15) and
`PriorityChip` (three-value role-tinted chip: low/normal/high — generic
enough for onboarding tasks, document requests, any future priority field).
`Callout`/`Flash`/`ReasonField`/`ConfirmDialog`/`Panel`/`Actions`/`DefRow`/
`Trail`/`RowCheck` are byte-for-byte the same shape as
[[project_v3_hr_leaveatt]]'s local copies — third-plus sighting, worth
promoting together on the next kit-touching dispatch.

**Business-hours vs calendar-hours** is stored/displayed as real category
configuration (`basis: "business"|"calendar"`), but this file's own elapsed/
remaining arithmetic always uses calendar hours — a true business-hours
ticking clock (skip nights/Sundays) is a backend computation this design
mock does not attempt to simulate. Flagged in the file's own SELF-CHECK
comment, not hidden.
