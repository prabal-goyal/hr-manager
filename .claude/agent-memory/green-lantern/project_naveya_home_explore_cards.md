---
name: naveya-home-explore-cards
description: 2026-08-11 card-based Home explorations (design/v2/explore/) — user rejected the flat "radius 0 / hairline rows" system; Keka is the benchmark
metadata:
  type: project
---

The user saw the built flat Home (`design/v2/pages/dashboard.jsx`, strict to the shipped design system's "radius 0 · rows are hairlines · no shadow in data") and rejected it: "still design looks basic, let's put things in cards like figma… keka looks so clean." Three parallel Home explorations were dispatched; mine is **A — Keka-faithful**: `design/v2/explore/home-a.jsx` (`window.HomeExplore.A`) + entry `design/v2-ha.html`.

**Why:** the user's reaction to the built artefact beats the written spec — the flat-density rules are deliberately overridden for this direction. Keka pattern that reads "clean" to them: padded container (not edge-to-edge), white cards radius ~12 + soft shadow floating on a light canvas, narrow-left/wide-right two-column, 2–3 colour-blocked filled cards (Today = accent fill, Holidays = brass seal fill), leave balances as rings, illustrated quiet state, and a very-low-opacity abstract page-ground motif (ours: an architectural colonnade of arches in SVG, opacity .07/.10 — NOT a tree, NOT kitsch).

**How to apply:** if this direction wins, expect `G2.r` (all-zero radius) and the hairline-row register motif to be revised; don't keep building flat surfaces against stale rules without checking which direction was chosen. Tokens stayed authoritative for COLOUR (all hex read from `window.G2`; rail accent marks read `G2.dark.accent` in both modes since the rail is always dark — a token read, not a hardcode). Fonts for the exploration were brief-mandated Anek Latin/Anek Devanagari/Hanken Grotesk (not G2's Figtree/Mukta).

**CSS gotcha (reusable, cost one render pass):** an absolutely-positioned background motif inside a scroll container (`main{position:relative; overflow-y:auto}`) anchors `bottom:0` to the container's PADDING BOX (viewport height), not the scroll-content bottom — it ends up occluded/mispositioned once content scrolls. Fix: put the motif inside the full-height content wrapper (`position:relative` inner div) so `bottom:0` means true content bottom. Related: [[grid-row-sync-gap]] — verify placement with full-page (tall-viewport) screenshots, not just the fold.
