---
name: overused-font-hook
description: impeccable hook flags Inter/Roboto/Fraunces/Plus Jakarta/Space Grotesk/Geist as overused — pick distinctive faces upfront in explorations
metadata:
  type: feedback
---

The `impeccable` design hook flags Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, and Space Grotesk as "overused" (AI-default) faces on any `design/*` write. Pick distinctive faces at authoring time instead of defaulting to these.

**Why:** the whole point of the free-exploration dispatches is escaping "basic"-looking output; converging on the same faces every AI UI uses undercuts that. Confirmed in the Home-D dispatch — swapped Fraunces/Plus Jakarta → Young Serif (single chunky 400; set explicit weight 400 to avoid synthetic bold) + Wix Madefor Text, and the hook cleared.

**How to apply:** before wiring Google Fonts into any new design canvas, choose faces off the flagged list (warm-human picks that worked: Young Serif, Wix Madefor Text; Indian-script pair: Mukta). For money glyphs, keep an Indian-script font (Mukta) in the fallback chain so ₹ renders even if the Latin face lacks it.
