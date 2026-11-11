---
name: kit-button-disabled-not-native
description: kit.jsx's Button component's `disabled` prop only dims opacity + sets aria-disabled — it does NOT set a native disabled attribute, so a `disabled` Button with an onClick still fires on click
metadata:
  type: reference
---

`kit.jsx`'s `Button` (`function Button({ kind, size, full, onClick, children, type, onDark, iconLeft, iconRight, disabled })`) renders `<button onClick={onClick} aria-disabled={disabled ? "true" : undefined} style={{..., opacity: disabled ? 0.55 : 1}}>` — there is no native `disabled` attribute set on the DOM node. A click on a visually-dimmed `disabled` Button that still has an `onClick` prop attached WILL fire that handler; this is invisible reading the JSX (`disabled` reads as obviously-correct) and only shows up in a real click-driven test. Contrast `ActionMenu`'s menu items, which DO guard correctly (`onClick={() => { if (it.disabled) return; ... }}`).

**Why:** every existing use of `Button`'s `disabled` prop across the codebase (e.g. `attendance.jsx`'s `<Button kind="primary" full disabled={meta.locked}>` for the day-detail regularise stub) simply omits `onClick` entirely when the button is meant to be inert — the dimming is cosmetic-only by construction, not enforced by the component.

**How to apply:** never rely on `Button`'s `disabled` prop alone to prevent an action. Either (a) omit `onClick` entirely for a purely decorative/future-wired disabled state, or (b) if the button is genuinely clickable-but-momentarily-inert (e.g. "no open punch today" on `emp-tasks.jsx`'s Mark-attendance tab), keep `disabled` for the visual dimming but design the surrounding copy so the click, if it does fire, cannot corrupt state (or omit `onClick` and explain the precondition in adjacent text instead, which is what `emp-tasks.jsx` does). Related: [[feedback-disabled-submit-click-deadend]] (a different but adjacent lesson — that one is about hard-disabling a *submit* button for validity-gating specifically).
