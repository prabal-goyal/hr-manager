---
name: nested-tab-branch-never-clicked
description: a tab matrix that only clicks the OUTER tablist reports "ALL PASS" while a nested sub-screen crashes the whole app on first render — click every nested branch too
metadata:
  type: feedback
---

A verification matrix that walks the outer tabs and screenshots each one will pass cleanly even
when a nested sub-tab's screen throws on mount and unmounts the entire React tree.

**Why:** building `design/v3/pages/py-ops.jsx`, the matrix reported "ALL PASS: 6 tabs x light|dark x
en|hi, 0 pageerrors" — because the Variance & register tab's default inner tab was *variance*, and
the matrix never clicked *register*. `RegisterScreen` destructured `const { t, ty } = useLang()`
but used `lang` in one footer string, so clicking that inner tab threw `lang is not defined`,
React unmounted everything, and `document.querySelectorAll('[role="tablist"]').length` went to 0.
The same class of bug then hid a second time in the Claims & arrears tab (`isDraft is not defined`,
from a partially-applied edit). Neither was visible in any screenshot, in the per-tablist ARIA
assertions, or in the console-error count — because the failing branch was never rendered.

**How to apply:**
1. The matrix must enumerate `outer tab x inner tab`, not outer tabs. Every leaf surface gets a
   click, an error check and a screenshot.
2. Before finishing, run a static pass over the file: for every `function <Component>`, if the body
   references `lang` (or `ty`, `dur`, `script`) but its `useLang()` destructure omits it, that is a
   guaranteed runtime crash the moment the component mounts. A five-line python/regex check finds
   it faster than any browser.
3. Treat `tablists === 0` / `panels === 0` as a crash signal, not as "no tabs here" — a healthy v3
   page always has at least one.
