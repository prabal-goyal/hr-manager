---
name: feedback-jsx-prop-string-entities
description: HTML entities (e.g. &amp;) only decode in JSX text children, never inside a JS string passed as a prop value — a silent bug class in the no-build design/*.jsx canvas
metadata:
  type: feedback
---

In `design/*.jsx` (Babel-standalone, classic JSX runtime, no build/lint step — see [design-canvas conventions](project_design_canvas_conventions.md)), writing `<BilingualLabel en="Earnings &amp; deductions" .../>` renders the literal text `Earnings &amp; deductions` on screen, because the attribute value is a plain JS string literal, not JSX text content — HTML entity decoding only happens for text *between* tags (e.g. `<span>Form 16 &amp; tax</span>` is fine and renders `&`). Caught this self-reviewing `design/screens/payslips.jsx` before handoff.

**Why:** there is no build step or headless transpile check for this canvas (confirmed in the conventions memory) — a bug like this is invisible until someone actually opens the page in a browser, so it can ship silently.

**How to apply:** when a JSX prop needs a literal `&` (or other entity-look-alike character), just type the raw character (`"Earnings & deductions"`) in the JS string — never `&amp;`/`&nbsp;` etc. Only use HTML entities inside JSX text children, never inside `attr="..."` string values. Worth a manual grep for `&amp;`/`&lt;`/`&gt;`/`&nbsp;` inside `="..."` prop values as a self-check before finishing any `design/*.jsx` dispatch.
