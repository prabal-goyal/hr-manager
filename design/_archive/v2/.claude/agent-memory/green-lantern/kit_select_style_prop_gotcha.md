---
name: kit-select-style-prop-gotcha
description: window.UI2.Select silently drops its own border/background/radius styling if a caller passes a `style` prop directly — wrap it in a sized div instead
metadata:
  type: project
---

Found while building `design/v2/pages/substitution.jsx` (campus picker in the
ActionBar, needed a narrower `Select` than its 100%-width default).

`UI2.Select` in `design/v2/kit.jsx` spreads `{...rest}` onto the `<select>`
element AFTER its own `style={{...fieldBoxStyle(...), ...}}` attribute:

```
<select
  ...
  style={{ ...fieldBoxStyle(c, focused, false), padding: ..., appearance: ..., cursor: "pointer" }}
  {...rest}
>
```

JSX attribute order matters here: a later `style` prop in `...rest` (i.e. any
`style` the CALLER passes to `<Select style={...}/>`) completely REPLACES the
whole computed style object — not merges with it — silently stripping the
border/background/radius/outline that make it look like a field at all,
leaving a bare unstyled `<select>`. `UI2.Button`, by contrast, destructures
`style` explicitly and spreads `...style` LAST *inside its own style object
literal* (`{ ...builtStyle, ...style }`), so a caller's `style` prop safely
merges/overrides individual keys there — Button is safe to pass `style` to,
Select is NOT.

**Why:** this is a real API inconsistency inside `kit.jsx`, not a usage
mistake alone — two components in the same file handle a caller `style` prop
in opposite (incompatible) ways with no visual signal when you get it wrong
(no error, just quietly broken chrome).

**How to apply:** never pass `style` directly to `UI2.Select` to control its
sizing — wrap it in a plain `<div style={{ width: N }}><Select .../></div>`
instead (Select's own `fieldBoxStyle` is `width:"100%"`, so the wrapper's
width constrains it correctly). If a future pass touches `kit.jsx`, consider
fixing `Select` to destructure `style` and merge it the same way `Button`
does — flag to whoever owns kit.jsx next, don't fix it yourself if you're not
the agent authoring kit.jsx that session (edits to kit.jsx are out of scope
per most page-build dispatches).

Related: when porting a **mockup's own illustrative numbers** into a real
`UI2.Register` page, don't copy a mockup's hardcoded headline figure
verbatim — the shipped `SubstitutionBoard.dc.html` mockup's masthead shows a
static "₹6,300" that does NOT actually reconcile with its own `GRID` array
(the true sum of assigned-cell fees is ₹6,450; the mockup's number was
hand-typed prose, not computed). When rebuilding the same content shape
through `Register`'s `totals` prop, derive every headline figure from the
same data structure the register renders (one `computeTotals(GRID)`-style
function feeding the masthead figure AND the register's totals footer AND
any status-chip counts) so the numbers on screen are guaranteed to actually
add up — "everything sums" (grammar rule 3) should be read as a literal
correctness constraint, not just a footer-row visual convention.
