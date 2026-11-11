---
name: explore-home-f-signal
description: "Free exploration F ('Signal'): dark-first vivid product-tool Home at design/v2/explore/home-f.jsx + design/v2-hf.html — palette/type choices and the dead-space fixes that made it feel crafted"
metadata:
  type: project
---

Free exploration F of the employee Home ("design system is kicked" round, 2026-08-11) lives at `design/v2/explore/home-f.jsx` (exports `window.HomeExplore.F`, self-contained IIFE with its own themes + i18n, no kit/tokens deps) with standalone entry `design/v2-hf.html`. Sibling agents built `home-a`/`home-b` in the same directory in parallel.

**Why:** user said earlier systems "look basic" vs Keka; this lane targeted Linear/Raycast/Vercel-grade craft with vivid colour-as-signal.

**How to apply:** if this direction is picked, its system is: dark-first tinted-indigo canvas (#0A0D14 with radial washes), four surface layers (canvas → rail #0D111B → surface #10151F → raised/inset), hairlines at 7%/14% alpha; semantic colour mapping green=presence, violet=leave, amber=money, coral=action-needed, blue=brand; Manrope UI + JetBrains Mono for every number/micro-label + Anek Devanagari for hi (hi-first font ordering when lang=hi). Engineered-data modules instead of KPI tiles: div-based shift timeline (percent-positioned ticks/band/elapsed/now-chip), 31-cell month register strip (letter marks P/L/H/W/A, Devanagari marks उ/अव/छु/स/अन in hi, amber underline = late), segmented leave gauges, SVG net-pay sparkline, proportional earning/deduction bars.

Craft lessons proven here (beyond [[naveya-content-width-balance]]):
- Side-panel bottom dead space: spread content with `justifyContent:"space-evenly"` on gauge stacks and `flex:"1 0 auto"` on list rows so hairline-separated rows fill the panel — don't leave top-packed lists in stretch-matched flex rows.
- A card's empty middle should be filled with *meaningful* content, not padding: the doc-request card gained a 2-step "you upload → HR verifies" stepper that both fixed the gap and surfaced the M4 governance truth.
- Payslip row labels truncating (`House rent allowance` → ellipsis) read as broken craft: shorten copy (`House rent (HRA)`) rather than shrinking the amount column — money column width is sacred.
