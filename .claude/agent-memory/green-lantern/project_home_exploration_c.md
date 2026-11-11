---
name: home-exploration-c
description: design/v2/explore/home-c.jsx + v2-hc.html — card-based "welcome band" Home exploration; radius-0/no-cards rules deliberately overridden per user feedback 2026-08-11
metadata:
  type: project
---

Home EXPLORATION C ("welcome band + sectioned cards, most atmospheric") lives at `design/v2/explore/home-c.jsx` (`window.HomeExplore.C`) with standalone entry `design/v2-hc.html`. Three explorations (A/B/C) were built in PARALLEL by sibling agents, each owning only its own two files.

**Why:** user saw the shipped register-flat Home (`design/v2/pages/dashboard.jsx`) and rejected the design system's own rules — "still design looks basic, let's put things in cards like figma… keka looks so clean". The written system's "radius 0 / rows are hairlines not cards / no shadow inside data" was DELIBERATELY overridden: the user's reaction to the built artefact beats the written spec. They also asked for abstract background art (Keka-style low-contrast watermark).

**How to apply:**
- Treat `G2.r` (all zeros) as superseded for exploration work — soft radius 10–14, card headers (title + link action), `G2.el[mode][1..2]` depth are the new baseline unless the user re-locks flatness.
- Composition that landed: always-dark peacock hero band (uses `c.shell` + `G2.dark` accents so art pops in BOTH modes) carrying greeting/identity/net-pay; below, grid `minmax(0,1fr) 430px` — primary column (Today ring+timeline, attendance table in a card, illustrated quiet state) + support column (brass-filled `sealSoft` action card, leave rings, accent-filled payslip card, holidays). Two colour-filled cards (accent + brass) give rhythm without a field of white boxes.
- Invented artwork "Corridor Study" (nested corridor arches + offset paper planes + ledger rules + register ticks) is colour-parameterised — same SVG serves the hero (brass/teal on ink) and the ~5%-alpha page-ground motif. Reusable pattern: parameterise art colours, don't fork the drawing.
- Dispatch overrode tokens.jsx's Figtree/Mukta with Anek Latin/Anek Devanagari/Hanken Grotesk — I kept `G2.t()` metrics (esp. Devanagari line-heights) and swapped only `fontFamily`, via a local `tp(role, lang)` wrapper. Add 'Anek Devanagari' into the mono fallback chain so mixed strings like "5घं 45मि" keep JetBrains digits with proper Devanagari fallback.
- Related: [[naveya-experiments-console-overview]], [[staffroom-v2-build]], [[disabled-submit-click-deadend]].
