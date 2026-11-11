---
name: v3-groupadmin-screens
description: design/v3/pages/groupadmin.jsx — GA-01 Group overview, GA-04 Users & role assignments, GA-08 Audit log; the maker-checker-as-employee-visible-state pattern extended to privilege escalation.
metadata:
  type: project
---

Built `design/v3/pages/groupadmin.jsx` (`window.Pages3.{GAHome,GAUsers,GAAudit}`), all three composed only from `G3`/`UI3`. Fictional tenant: "Sunrise Education Trust", 4 campuses in 2 states (Indiranagar/Whitefield/Yelahanka Karnataka, Hyderabad Telangana — satisfies M1 §Acceptance's "≥2 campuses in different states"). Names/campuses/reasons all route through `t()` (proper nouns get Devanagari transliterations too, matching kit's `user.name` precedent) — 328 EN/HI keys, exact parity verified programmatically (extract the `en:`/`hi:` object literals, diff their key sets) rather than eyeballed.

**GA-04's privilege-escalation flow is the highest-value pattern here**, extending [[v3-leave-payslips]]'s "maker-checker rendered as an employee-visible state" idea one step further — into a state the *grantor* also experiences as blocked: `ROLE_CATALOG[key].secondApproval` (true for Group Admin/Payroll Operator/Accountant — anything reaching `payroll.approve`-shaped or `people.pii.read`) makes a grant land `pending`, and the CURRENT session (Ananya Rao) can never see an "Approve" control on her own pending grants — only a static "awaiting another Group Admin" line. A SEEDED grant from a second admin (Devansh Kulkarni) is the only one with a live Approve/Decline control, so both halves of "a distinct individual, never the grantor" are demonstrated without faking a second login session.

**GA-08's audit diff renders sensitive fields as "Changed" only** — no masked-format value, no value at all, per `M15 §Acceptance` "the audit must record that a value changed without re-exposing it" (stricter than Profile/Documents' `••••1234` masking, which still allows a reveal). Each diff row has a `sensitive: true/false` flag; sensitive rows render `StatusChip` + a note, never `before`/`after` text.

**Promotion candidates (2nd+ appearance, same as the memory convention elsewhere):**
- `Segmented` — a pill-group switch generalised from `LangSwitcher`'s exact visual pattern (accent-filled active pill) to an arbitrary option list. Used here for GA-01's period/scenario pickers.
- `StatusChip` — `Chip` + an EXPLICIT icon, for governance vocabulary (invited/pending/revoked/no-role/maker+checker/high-sensitivity) that has no attendance-state analogue, so `StatusMark`'s auto-inferred glyph (keyed to attendance/leave role names) is the wrong tool for this vocabulary.

GA-01's "shape before number" (DESIGN principle 3) is a Meter-bar comparison card ABOVE the Register, with an explicit inline caveat when campus sizes differ ≥3x ("comparison misleading" state) computed from the data, not hardcoded. Group totals are `reduce()`d from the same campus array the Register renders, never a separately-typed figure — and a campus with `payroll: null` (no run yet) is excluded from the sum with a visible footnote, demonstrating the spec's "partial data" state inside the default scenario rather than a separate one.

See [[feedback_row_menu_promises_subflow]] for a wiring bug this build caught and fixed via interaction testing.
