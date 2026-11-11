---
name: feedback-design-dispatch-scope
description: charter says green-lantern doesn't own design audits, but direct dispatches can still assign code-level work inside design/ (e.g. building an Icon component in the mockup JSX)
metadata:
  type: feedback
---

The standing charter note "NOT design audits (two-face)" refers to visual/design-QA review work, not to all touches of `design/`. A dispatch directly assigned building an inline-SVG Icon component and replacing unicode emoji/glyphs across `design/hi-fi/hi-fi.jsx` and `design/design-canvas.jsx` — i.e., writing React/JSX code inside the code-as-design canvas.

**Why:** these are ordinary JSX code edits (component authoring, glyph→icon swap), which is squarely an engineering task even though the file happens to live under `design/` rather than `frontend/`.

**How to apply:** don't self-block or flag scope conflict when a dispatch explicitly targets `design/*.jsx` for code changes — only push back if asked to do a *visual design audit/critique* (that's [[two-face]]'s lane). Follow [[project-design-canvas-conventions]] for the file's syntax constraints.
