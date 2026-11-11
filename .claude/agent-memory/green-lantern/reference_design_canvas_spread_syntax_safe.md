---
name: reference-design-canvas-spread-syntax-safe
description: object-literal spread ({...obj, k:v}) and function rest params (...rest) are already proven-safe in the design/*.jsx Babel-standalone preset — no need for ES5 merge helpers
metadata:
  type: reference
---

Before writing `design/screens/attendance.jsx` I second-guessed whether object-literal spread syntax (`{ ...cellBase, background: c.accent }`) and rest params (`function Input({ value, ...rest })`) would parse under the custom "tenure" classic-JSX-runtime Babel preset, and defensively hand-rolled an ES5 `extend(base, extra)` merge helper instead of just spreading.

Turns out this was unnecessary caution: `grep '\.\.\.' design/kit.jsx design/screens.jsx` shows both patterns already used pervasively and working (`kit.jsx` L245-246, L297-298, L435, L449, L545, L557-594; `Input`/`Select`/`Search` rest-param destructuring at L289/303/333). The preset clearly includes the object-rest-spread transform alongside JSX.

**Why:** wasted effort re-deriving safety of syntax the codebase had already settled — a 30-second `grep` before assuming "untested" would have skipped writing the ES5 fallback entirely.

**How to apply:** for future `design/*.jsx` work, freely use `{ ...obj, key: val }` and `function f({ a, ...rest })` — both are safe here. Only genuinely newer/rarer syntax (optional chaining `?.`, nullish coalescing `??`, which no existing `design/*.jsx` file uses yet) is worth a quick grep-first sanity check before assuming safety.
