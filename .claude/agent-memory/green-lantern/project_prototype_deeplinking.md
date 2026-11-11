---
name: project-prototype-deeplinking
description: design/v2/prototype.jsx supports ?route=/?screen=login/?theme=/?lang= query-param deep-linking into any employee route without a click-through
metadata:
  type: project
---

`design/v2/prototype.jsx` (loaded by `design/v2-prototype.html`) reads `window.location.search` on mount and can boot straight into any of the seven `Pages2.*` routes (`home`, `attendance`, `leave`, `payslips`, `documents`, `profile`, `substitution`) via `?route=<name>`, skipping `Login` — e.g. `v2-prototype.html?route=attendance`. `?screen=login` (or no params at all) still shows Login first, preserving the original click-through flow exactly. `?theme=dark|light` and `?lang=en|hi` seed `ThemeProvider`/`LangProvider`'s initial state (still user-toggleable after load, not locked).

**Why:** added so `design/canvas.jsx` (the role-swimlane coverage board, see [[project-role-canvas-iframe-board]]) could embed each employee screen as its own standalone URL/iframe instead of re-implementing or requiring manual click-through per screen.

**How to apply:** any future canvas/board/screenshot-automation work that needs a specific employee screen state should use this query-param contract rather than adding new deep-linking mechanisms. If new routes are added to `ROUTES` in `prototype.jsx`, they automatically become deep-linkable for free — no extra wiring needed per route.
