---
name: project-leave-ledger-register-reuse
description: How design/v2/pages/leave.jsx composed Register/Masthead/ActionBar/StatusFooter for the first real UI2 register-grammar page, and the gotchas found while doing it
metadata:
  type: project
---

`design/v2/pages/leave.jsx` (`window.Pages2.Leave`) is the FIRST page to
actually consume the register-grammar primitives added to
`design/v2/kit.jsx` in [[register_grammar_kit]] — until this dispatch
they were exported but unused by any screen. Two things worth carrying
forward to the next `Register`-based page:

**1. `Register`'s numbered gutter is fixed-height per row; multi-line
cell content can drift it out of sync.** The gutter column renders
each index at a hardcoded `height: rh` (rowHeight, default 40), but
data rows use `minHeight: rh` and will grow taller than `rh` if a
cell's content wraps to two lines — so a two-line identity cell (title
+ subtitle) can push a row taller than its gutter number slot, and
every following gutter number drifts out of alignment with its row.
Fix used: keep every `Register` cell strictly single-line (`whiteSpace:
nowrap; overflow:hidden; textOverflow:ellipsis` on all cell text, `Mark`
is already nowrap by default) and move any explanatory note OUT of the
row entirely — e.g. leave.jsx's "vacation staff granted EL in lieu"
note is a plain icon+text line placed directly under the register, not
a second line inside the EL row's identity cell. This is a real kit
gap (`Register` should ideally measure/grow the gutter cell with its
row, or expose a `variableHeight` escape hatch) — worth fixing in
`kit.jsx` next time someone touches `Register`, but out of scope for a
content-only page dispatch (rule: never edit kit.jsx from a page task).

**2. `Register` totals-row cells should be plain strings/numbers, not
`<Figure/>` nodes.** The totals row wraps `val` in a div that sets its
own `fontFamily`/`fontSize`/`fontWeight` (bigger when `col.emphasize`
is set) — but `Figure` sets those same properties directly on its own
`<span style>`, which wins over the wrapping div, so an emphasized
totals column silently stays at `Figure`'s own size instead of scaling
up. Use `UI2.inr(n, decimals)` (exported) to build a plain formatted
string for `totals.cells`, and reserve `<Figure/>` for row-level cells
where its own tabular-mono treatment is exactly what you want.

**3. `window.UI2.STRINGS.{en,hi}` is a live mutable object, not a
closed table** — a page file can `Object.assign(UI2.STRINGS.en, {...})`
/ `.hi` at module-load time to register its own namespaced keys (here,
`"leave.*"`) so the SAME shared `useLang()`/`t()` picks them up, rather
than building a second local i18n dictionary. Reuse existing kit keys
where the meaning already matches (`leave.applyLeave`,
`leave.vacationHint`, `leave.daysAvailable`, `leave.na` all predate
this page and were reused rather than redefined) — grep `STRINGS_EN`/
`kit.jsx`'s `STRINGS.en` for near-duplicates before adding a new key.

**4. Masthead's `titleDeva` is a permanent bilingual companion, not
lang-toggle content** — `Masthead` itself has no `useLang()` awareness;
it just renders whatever `title`/`titleDeva` strings it's given. The
convention landed here: `title` goes through `t()` and switches fully
with the toggle, `titleDeva` is only passed when `lang !== "hi"` (to
avoid literally duplicating the same Devanagari string in both slots
once the toggle already switched the main title to Hindi). Follow this
same guard in the next Masthead-using page rather than re-deriving it.

**5. Red/`c.danger` is spec-legal for debit/deduction FIGURES, not just
fills** — the design system's "red is reserved for deductions, absence
and held records" rule reads naturally as permission to tint a debit
`Figure`'s text color `c.danger` (used on every "days taken"/LOP figure
in both the ledger and history registers here), not only as a ban on
red backgrounds. Reserve it for genuine deduction/negative figures —
don't spread it to neutral counts.
