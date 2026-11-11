---
name: colorcard-dark-ink-inversion
description: never set color to c.onBrass / c.onAccent inside a kit ColorCard — those inks only hold in light mode and go near-black-on-near-black in dark; inherit the card's resolved tone instead
metadata:
  type: feedback
---

Inside `UI3.ColorCard`, do NOT write `color: c.onBrass` / `color={c.onAccent}` on child text or `<Figure>`. Use `"inherit"` (the `Card` already applies the correctly resolved `tone` as the section's `color`) or `c.onBrassMuted` / `c.onAccentMuted` for secondary text.

**Why:** `ColorCard` flips its fill per theme — light mode fills with the SOLID `c.brass` / `c.accent`, dark mode fills with `c.brassSoft` (#33270F) / `c.accentSoft` (#38231A). `onBrass`/`onAccent` are the "ink on a solid fill" tokens: light `#FFFFFF`, dark `#241905` / `#2B1207`. So in dark mode an explicit `c.onBrass` paints near-black text on a near-black fill and the paragraph disappears. `ColorCard` already computes the right ink and passes it to `Card` as `tone`; overriding it is what breaks. Same trap for a `Button` placed on a ColorCard: `kind="ghost"` uses `c.ink`, which is dark-on-brass in LIGHT mode — pass `onDark` so it uses `c.onRail`, which is correct on both fills.

**How to apply:** after building any screen with a ColorCard, screenshot it in **dark** and read the body copy, not just the heading — the heading uses `tone` and looks fine while the paragraph underneath is invisible. A DOM/text assertion will not catch this; only the picture will. Caught on `design/v3/pages/py-salary.jsx`'s honey and clay cover cards. Related: [[v3-staffroom-terracotta]].
