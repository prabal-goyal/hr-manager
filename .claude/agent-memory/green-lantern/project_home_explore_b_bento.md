---
name: home-explore-b-bento
description: Home exploration B (design/v2/explore/home-b.jsx) — bento-board pattern, fixed-cell table fill trick, always-dark "deep tile" via G2.dark tokens
metadata:
  type: project
---

Home EXPLORATION B "Bento / modular" lives at `design/v2/explore/home-b.jsx` + entry `design/v2-hb.html` (parallel to sibling explorations A/C; user rejected the flat radius-0 dashboard and asked for card-based options with abstract background art).

**Why:** user reaction to the built artefact overrode the shipped design-system rules ("radius 0 / hairline rows / no shadow / density"); explorations deliberately use radius 16, soft `G2.el` shadows, and a low-opacity architectural SVG motif ("drafting compass" — concentric survey rings + ruled bearing fan; NOT Keka's tree).

**How to apply:**
- Bento recipe that worked: 12-col grid, `gridAutoRows: 92`, gap 20, tiles as col+row spans (5x4 hero, 7x6 register, 3x2 + 2x2 satellites, 5x3/4x3/3x3 bottom band summing to 12 cols) — bands align because row-span arithmetic matches (4+2 = 6).
- Fixed-height bento cell containing a table: make the rows container `display:flex; flexDirection:column` and each row `flex:"1 0 auto"` with a minHeight — rows stretch to meet the footer instead of leaving a dead band (same family as [[grid-row-sync-gap]] but the fix is flex-fill INSIDE the cell, not restructuring the grid). Same trick for ring clusters: `flex:1` + `alignItems:center`.
- Token-legal "deep tile" (brass-on-peacock payslip) in BOTH modes: pull `G2.theme("dark")` (`dkc.seal`, `dkc.onShell…`) for the tile while the page uses the live theme; in dark mode swap the fill to `G2.surf[2]` + `G2.surfBorder` so it still reads raised. No hex hardcoded.
- Background motif safety: fixed-position SVG at zIndex 0, strokeOpacity ~0.05, cards opaque at zIndex 1 — motif only ever shows in gutters, so text contrast is untouched by construction.
- Verification note: the only console error on these standalone canvases is the benign `favicon.ico` 404 — distinguish it from real pageerrors before reporting "clean".
