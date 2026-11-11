---
name: project-public-token-screens
description: design/v3/pages/public.jsx (PUB-01/03/04) — the no-Rail, no-tablist pattern for anonymous/bearer-token screens, and the PUB-03-vs-PUB-04 PII asymmetry
metadata:
  type: project
---

Built `design/v3/pages/public.jsx` → `window.Pages3.Public({ view })` for NA-12: PUB-01 careers
listing (anonymous), PUB-03 pre-boarding upload (bearer token, pre-`User`), PUB-04 offer
acceptance (bearer token, pre-`User`). These are the only screens with no authenticated user, and
that fact drives the whole shape:

- **No `Rail`** — a rail is role-scoped nav and none of these visitors have a role. A plain
  `PublicHeader` carries the *tenant's* branding (school name) front and centre; the platform
  (Naveya) is a quiet byline underneath, not the other way round.
- **No `role="tablist"` anywhere.** Three screens that would never really be tabs of one session
  (a careers page, a mailed upload link, a mailed offer link — three different personas) are
  switched, in the canvas only, by a floating `role="group"` `ScreenSwitch` styled after v3.html's
  own `RoleSwitch`. Per-screen state previews (PUB-03's six token states; PUB-01's loading/empty/
  error; PUB-04's five offer states) reuse the `groupadmin.jsx`/`principal.jsx` `Segmented`
  scenario-preview idiom — also `role="group"`, never a tablist. Net effect: an AC requiring "one
  tabpanel per tablist" can be satisfied by having **zero** tablists, on purpose, when the screens
  genuinely aren't tabs of each other. Don't reach for `Tabs`/`TabPanel` just because a multi-screen
  file is the norm elsewhere (`hr-hiring.jsx` uses real tabs because its three tabs ARE one HR
  operator's different work areas — a materially different case).
- **PUB-03 (pre-boarding upload) is deliberately MORE data-free than the literal spec text
  requires.** Screen-inventory's own "must NOT contain" only says "any view of the staff record",
  but the brief's framing — a bearer token can be forwarded to the wrong person, so there must be
  nothing on the page worth stealing — is the stronger bar. Built it showing no name, no staff ID,
  no campus, no role/designation at all, even though a joiner would already know all of that.
- **PUB-04 (offer acceptance) is the mirror case** — it DOES show the candidate's name and the
  role/campus/CTC/join date, because screen-inventory's "must contain" requires exactly those
  fields and PUB-04 carries no equivalent data-free rule. Don't over-generalize PUB-03's caution
  onto a screen whose whole job is showing someone their own offer terms.
- Money-move/record-creating actions (PUB-04 accept) still get the two-step, never-one-click
  treatment even with no rail/no dashboard around them: Accept opens an inline confirm panel on
  the SAME page restating the terms, and idempotency is handled by removing the Accept/Decline
  controls entirely once a status is set (rather than trying to detect a race).

See [naveya leave screen pattern](project_naveya_leave_screen_pattern.md) for the Register-record
motif this file also follows for the careers listing, and
[disabled-submit-click-deadend](feedback_disabled_submit_click_deadend.md) for why the offer
accept/decline confirm buttons are never hard-disabled even though they gate on required fields.
