---
name: v3-canonical-peacock
description: design/v3 is the CANONICAL Naveya design system (approved 2026-08-11) — supersedes window.G/G2; cards-not-hairlines; split login. ITS PALETTE+TYPE were rebased to Staffroom Terracotta on 2026-09-03
metadata:
  type: project
---

> **Palette/type update:** the "Peacock" colour + type described below were replaced on 2026-09-03 by "Staffroom Terracotta" — see [[v3-staffroom-terracotta]]. Everything else here (canonical status, the A+C+clean-room *composition*, the split login, cards-not-hairlines) still holds.

`design/v3/` (`window.G3` tokens · `window.UI3` kit · `window.Screens3` · entry `design/v3.html`) is the **canonical** Naveya design system. It supersedes `design/tokens.jsx` (`window.G`, "Peacock & Slate") and `design/v2/tokens.jsx` (`window.G2`, "STAFFROOM") — neither of those was edited, they are frozen history.

**The approved synthesis (user, verbatim):** *"Clean room login works. Peacock wins. A and C looked good but A was better — take A mostly, but yeah welcome band from C."*
- Palette + type = PEACOCK · layout language = `v2/explore/home-a.jsx` (Keka-style cards) · hero = the welcome band from `v2/explore/home-c.jsx` · sign-in composition/content = `design/fresh/login.html` re-skinned peacock.
- **Sign-in is the left/right split** ("Login left and right way was really good") — full-height peacock brand panel LEFT vs plain form panel RIGHT. Never centre the form on one background, never collapse to one column on desktop. In dark the panel goes *deeper* (`rail #08100F`) and needs a `borderStrong` hairline on the seam, otherwise the split visually disappears against `page #0D1417`.

**Explicitly overridden from the old shipped spec:** "radius 0 · rows are hairlines not cards · no shadow inside data" produced the version the user rejected as *"looks basic"*. In v3 radius is non-zero (20 cards / 12 controls / 26 hero, after the terracotta rebase), cards carry border + soft shadow + real padding, and tables only exist inside `<Register>` which lives inside a Card.

**Why:** several rejected explorations preceded this; the user picked one specific combination and said "follow it exactly, do not reinterpret". Reopening flat/radius-0 or a centred login would re-litigate a settled decision.

**How to apply:** build every new Naveya web surface out of `UI3` on `G3`. Do not add screens to `design/v2/`. See [[tokens-declare-real-fonts]] for the token-file rule this system fixed, and [[naveya-token-system]] for the retired direction.
