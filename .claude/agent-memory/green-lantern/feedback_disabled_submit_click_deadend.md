---
name: feedback-disabled-submit-click-deadend
description: never gate a form's submit button with the native `disabled` attribute purely for client-side "disable-until-valid" UX — it silently blocks the click needed to reveal the validation errors in the first place.
metadata:
  type: feedback
---

A hard-disabled (`disabled={!valid}`) submit `<button>` cannot be clicked at all — not by mouse (the browser suppresses the click event before it ever reaches React) and not reliably by Enter either (a form's native implicit submission via a disabled submit control is inconsistent across browsers). This was NOT a theoretical concern: it was caught live, mid-dispatch, by a puppeteer test that clicked Naveya Login's Continue button while the email/password fields were empty and observed the validation-error text never appear — because the click literally never fired.

**Why:** the naive reading of "disable-until-valid on Continue" (Naveya Login, impeccable-critique fix sweep, 2026-07-22) is to set the button's `disabled` prop from a validity boolean. That produces a dead end: a first-time user with an invalid/empty form has no way to discover *why* nothing happens — the button LOOKS clickable-adjacent (mystery-meat disabled state) but the errors that would explain it can never render, since the click that would set `touched=true` is swallowed before it starts.

**How to apply:** keep the submit control always a real, clickable `<button>` (only gate it with `disabled` while an async submission is genuinely in flight, e.g. `loading`/`submitting`). Validate ON click (and on Enter, wired explicitly via the input's `onKeyDown` rather than relying on native form-implicit-submission), revealing field errors via a `touched` flag. Simulate "looks disabled until valid" purely visually (reduced `opacity` in the button's own `style` override) so the affordance still communicates intent without blocking the interaction that explains it. Verify this class of bug with a real click-driven puppeteer test, not just a code read — reading the JSX would not have caught it, since `disabled={!canSubmit}` reads as obviously-correct until you actually click it.
