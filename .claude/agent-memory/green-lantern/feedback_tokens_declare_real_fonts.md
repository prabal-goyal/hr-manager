---
name: tokens-declare-real-fonts
description: the token file must declare the families actually shipping — v2 declared Figtree/Mukta while kit.jsx used Anek/Hanken via local constants, so anything reading tokens got the wrong type
metadata:
  type: feedback
---

A token file's `font`/`sans`/`deva` fields must name the faces the UI actually renders. Never let a kit or screen reach the real family through a local `const F = {...}` while the token file still names an older stack.

**Why:** `design/v2/tokens.jsx` declared `sans: Figtree` / `deva: Mukta`, but every shipped v2 surface used Anek Latin / Anek Devanagari / Hanken Grotesk through private constants in `kit.jsx` and in each `explore/*.jsx`. Result: `G2.t(role, script)` — the token file's own type helper — returned the wrong `fontFamily`, so any consumer that trusted tokens alone silently rendered off-brand type. The user called this out by name as "a real bug in v2 you must fix" when commissioning v3.

**How to apply:** when a design dispatch changes a typeface, change it in the token file *first* and delete the local font constants; grep for `fontFamily:` string literals in `kit.jsx`/`screens*.jsx` before finishing. In v3 (`G3.font` + `G3.t()` + `G3.fig()`) the kit reads tokens for every family — keep it that way. Same rule applies to the future real frontend: families belong in the Tailwind/CSS-variable token layer, not inline in components. Related: [[v3-canonical-peacock]].
