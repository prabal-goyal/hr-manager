---
name: v3-staffroom-terracotta
description: design/v3's canonical palette+type is "Staffroom Terracotta" (rebased 2026-09-03) — cream/cocoa/clay, Young Serif + Wix Madefor + Mukta + Spline Sans Mono, 20px cards; IA unchanged
metadata:
  type: project
---

On 2026-09-03 the user redirected v3 from "Peacock" to **"Staffroom Terracotta"**: *"let's change directions to Warm — 'Staffroom Terracotta' color and font and dashboard style, but the sidebar remains the same style as keka as we discussed."* The source of the direction is the winning free exploration `design/v2/explore/home-d.jsx` (see [[explore-home-d-terracotta]]).

**It was a TOKEN REBASE, not a redesign** — `design/v3/tokens.jsx` + the font link in `design/v3.html` carried ~95% of it. The IA of Login/Home/Attendance and the structure of the rail were explicitly out of scope. Everything else in [[v3-canonical-peacock]] still stands (canonical status, split login, cards-not-hairlines, no `design/v2/` additions) — only its palette/type/radius claims are retired.

**Ground rules that came out of the rebase (keep them):**
- **Clay has two shades on purpose.** `accent` `#C14D29` is 4.37:1 on cream — legal for a fill/ring/icon (3:1) but NOT for body text. `action` `#A03D1D` (6.0:1) is the text-safe clay. Any accent-coloured *text* (LinkButton, "Show", ActionLink) must use `action`. This asymmetry is the single easiest AA regression to reintroduce.
- **A dark rail in a light theme needs its own accent token.** Light clay on cocoa is 2.8:1 (fails the 3:1 UI-graphic bar), so `railAccent` = the *lifted* clay `#E68153` (4.9:1). Any brand colour drawn on the rail reads it, not `accent`.
- **Warm system ⇒ warm dark mode.** Espresso grounds `#1D1410`/`#2A1E18`, lifted clay, cocoa-tinted shadows (`rgba(83,49,29,…)`, never a neutral/cold drop). A cold dark sibling makes the whole system read broken.
- **Young Serif ships one weight (400).** Head type roles therefore carry BOTH `w: 400` (Latin/Young Serif) and `wDeva: 700` (Mukta must supply the weight the serif can't); `G3.t()` picks by script. Never push a Latin heading past 400 — you only get synthetic bold.
- **`ui`/`mono` fallback chains end in Mukta.** That single choice fixes two things at once: the ₹ glyph (Spline Sans Mono has no rupee) and every legacy `fontFamily: G3.font.ui` call site that hardcoded the Latin stack — Devanagari now resolves without touching those call sites.
- Radius: `G3.r.card` = **20**. Introduced as its own key because `r.lg` was also on rail items and popovers, where 20 is wrong.
- New token families added so screens stay hex-free: `onAccent*`/`onBrass*` (text + linework drawn on a solid clay/honey ColorCard fill), `rail*` (border/line/plane alphas for cocoa surfaces), `motif*` (the Corridor Study page ground), `knob`/`knobShadow`.

**How to apply:** rebasing colour in this system means editing `design/v3/tokens.jsx` + the `<link>` and boot `style.background` in `design/v3.html`, then grepping `kit.jsx`/`screens.jsx`/`pages/*.jsx` for `#hex|rgba(` — that grep should return NOTHING when you finish.

**SUPERSEDED TYPE (2026-09-16, NA-61):** the type notes above are history. v3 now uses Bricolage Grotesque (heads, `w: 600`, slight negative tracking), Hanken Grotesk (UI), Hind (all Devanagari, `wDeva: 700`, and Hind has no 800), and Red Hat Mono (figures, chain ends in Hind for ₹). The palette notes above still hold. See DESIGN.md Typography.
