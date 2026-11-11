---
name: naveya-screens-directory
description: design/screens/<name>.jsx is now a sharding convention for individual employee-surface screens, distinct from the older monolithic design/screens.jsx.
metadata:
  type: project
---

Newer dispatches (documents.jsx, profile.jsx, and likely more to follow) write ONE content component per file under `design/screens/<name>.jsx`, exposing it as `window.Screens.<Name>` via the load-order-safe guard `window.Screens = window.Screens || {}; window.Screens.<Name> = <Component>;`. This coexists with the older `design/screens.jsx` (which exposes `{ Login, Employee, AdminStub }` for the shell/router) — see [naveya component kit](project_naveya_component_kit.md). Each sharded screen is a CONTENT component only (renders inside `EmployeeShell`'s main content column, ~960–1100px wide); it does not rebuild the top bar or left nav, and does not touch kit.jsx or other screens' files.

**Why:** splitting per-screen work across dispatches (one agent per screen: home, documents, profile, ...) needs file-level isolation so parallel/sequential dispatches don't collide on one giant screens.jsx.

**How to apply:** when asked to build a new employee-surface screen, create `design/screens/<name>.jsx` (not edits to `design/screens.jsx`), compose only from `window.UI` + `window.G`, and build any one-off private component inside that file rather than editing kit.jsx. Check `design/screens/` for sibling files first (e.g. documents.jsx) to reuse established private patterns like `MaskedValue` (see [naveya masked pii pattern](project_naveya_masked_pii_pattern.md)) rather than inventing a divergent shape.
