---
name: dashboard-page-register-composition
description: Lessons from composing pages/dashboard.jsx (Employee Home) from kit.jsx's ActionBar/Masthead/Register/StatusFooter primitives on a light content canvas
metadata:
  type: project
---

Built `design/v2/pages/dashboard.jsx` (`window.Pages2.Dashboard`) — the
full-bleed Employee Home/Dashboard rebuilt to the register-grammar
skeleton (ActionBar → Masthead → Today strip / month Register / leave
strip / one open field → StatusFooter), replacing the old centred
card-grid Home. Content-only file; a separate wiring agent mounts it
inside the approved `variants/home-a.jsx` rail shell. See
[[register_grammar_kit]] for the primitives this composes.

Two things worth carrying into the next screen built the same way:

1. **`UI2.LangSwitcher` assumes a dark chrome backdrop unconditionally**
   — it hardcodes `color: c.shell` / `c.onShellMuted` regardless of
   where it's mounted, because until now it only ever sat in
   `home-a.jsx`'s dark `TopBar`. `ActionBar` (the register-grammar
   skeleton's element "a") sits directly on the light content canvas
   with no background of its own, so dropping `LangSwitcher` straight
   into it made the inactive-language label unreadable (near-white on
   near-white). Fix used: wrap it in a small local `background:
   c.shell` capsule (page-local, not a kit.jsx edit — out of scope
   per this dispatch's rules). **Next time:** either keep using this
   capsule wrapper pattern for any `ActionBar` on a light canvas, or —
   better — flag to whoever owns kit.jsx that `LangSwitcher` needs a
   `variant`/`onDark` prop like `ThemeToggle` already has, so every
   future light-canvas `ActionBar` doesn't reinvent the same capsule.

2. **The "one accent per screen" rule (design tokens spec) is a hard
   budget, and `Masthead`/`Register` already spend two of the four
   slots for you automatically** — `Masthead`'s 2px bottom rule and
   `Register`'s left gutter rule are both accent-coloured by the kit
   components themselves, with zero extra styling from the page. That
   leaves only "the active nav item" (owned by the rail, not this
   page) and "the one open field" (rule 6) available to spend. First
   draft of this page used `tone="accent"` on a Mark for an
   in-progress attendance row ("today, still clocked in") — caught in
   self-review as a 4th, non-canonical accent use and swapped to
   `tone="inkMuted"` (matching the kit's own `Pending`/`Processing`
   convention). **Rule of thumb for future registers:** before adding
   *any* `c.accent` reference on a data screen, count what the kit's
   own primitives already spent it on — Masthead + Register almost
   always already used it twice before your own JSX runs.

Also reconfirmed the `register_grammar_kit` memory's fonts rule in
practice: every custom (non-kit-primitive) text node in this file
reads `window.UI2.Fonts.{sans,deva,display,mono}`, never `G2.sans`/
`G2.deva` — kept consistent even though the sibling
`variants/home-a.jsx` (written before the kit.jsx rework) still reads
`G.sans`/`G.deva`/`G.t()` directly and wasn't touched to fix that
(out of scope — not this file).
