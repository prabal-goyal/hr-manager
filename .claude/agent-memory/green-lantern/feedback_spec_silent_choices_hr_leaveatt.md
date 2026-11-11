---
name: spec-silent-choices-hr-leaveatt
description: where docs/screen-inventory.md leaves a question open (Q9, Q23, balance-adjust permission), render the question as an explicit user choice rather than picking a silent default
metadata:
  type: feedback
---

When the spec flags its own ambiguity, the UI's job is to make the ambiguity **visible and answerable**, not to resolve it quietly.

- **Q23 — "when a leave type changes mid-year, are existing balances recalculated or grandfathered?"** The activation dialog on HR-26 refuses to commit until the user picks one, with the consequence of each spelled out ("balances go up for 214 staff" vs "accrual before 1 Sep stays on the old cap"). Copy: *"There is no safe default here."*
- **Q9 — "does HR's direct attendance edit need a second pair of eyes?"** Implemented as a state, not a gate: a correction lands as *"Corrected · awaiting a second look"*, attributed, before and after both kept. HR is never blocked (`attendance.manage` is genuinely theirs) but the edit is never invisible either.
- **`applies_to_vacation_staff` has NO default** anywhere, including in the "add a leave type" form — the spec says "no default — this is the education-differentiating switch", so the form errors rather than pre-selecting.
- **Statutory values are not campus policy.** Maternity's 182 days is read from an effective-dated `STAT_CFG` (version + in-force date + the Act named) and its "Supersede" menu item is disabled with *"changed centrally, not per campus"* — `guard-statutory-hardcode` expressed as an affordance instead of a lint rule.

**Why:** a designed default in these four places is a policy decision made by the frontend on a compliance officer's behalf; that is exactly the class of thing gordon's review exists to catch.

**How to apply:** grep the target screens' rows in `docs/screen-inventory.md` for `[proposed]` and the `§11` open-question table before building — each one is either a required choice, a stated state, or a disabled control with a first-person reason. Never a default.
