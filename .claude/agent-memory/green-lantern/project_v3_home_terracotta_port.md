---
name: v3-home-terracotta-port
description: design/v3 Home is a port of exploration D (home-d.jsx) — light cream hero + 3 flex columns + calendar-grid attendance; the kit gained Meter/TitleMark/SchoolScene/RequestArt
metadata:
  type: project
---

On 2026-09-03 the user pointed at a screenshot of their own `design/v2/explore/home-d.jsx` and said **"make more like this"** — so `Screens3.Home` in `design/v3/screens.jsx` was **rebuilt as a port of exploration D**, re-expressed in `window.G3` tokens + the `window.UI3` kit. See [[explore-home-d-terracotta]] for the exploration and [[v3-staffroom-terracotta]] for the palette.

**The shape that won:**
- **Light cream hero band** (`c.raised`, radius `r.card`) with a serif greeting, a date/campus line, two small pills (role, staff ID in mono) and the `SchoolScene` illustration anchored right. It **replaced** the cocoa `WelcomeBand` — which is now used by no v3 screen, though it stays exported.
- **Three independent flex columns**, not a CSS grid (see [[grid-row-sync-gap]]), ratios `1.32 / 1.05 / 0.98`: (Today at school + August attendance) · (July payslip + Leave you can take) · (A request needs you + Upcoming holidays).
- Every card = white, `r.card` 20, soft border, **small tinted rounded-square icon beside a serif title**. That mark is now `UI3.TitleMark`, reachable as `Card`'s optional `icon` + `iconTone` props (`iconTone` names a DATA ROLE — accent/present/brass/leave/off/info — so the mark inherits the system's tint/text pair instead of a bespoke colour).
- Exactly **one coloured card** — the honey `brassSoft` document-request card. It is the only thing demanding action, so it is the only thing shouting.

**Kit additions this pass:** `Meter` (horizontal quantity bar, optional pinned knob), `TitleMark`, `SchoolScene`, `RequestArt`, icons `arrowUp` / `festival` / `mail`. Tokens gained `illoWall` / `illoSun` — declared as *picture* colours that sit outside the contrast system on purpose, because everything else in an illustration reuses a semantic role (clay roof, sage foliage, cocoa trunk).

**The reference wins on VOICE, not just colour.** "A request needs you", "It takes about two minutes", "School stays closed on these days", "All good — today's attendance is already marked for you". Carry that register into any new warm-lane surface; a neutral restatement of the same facts loses the direction.

**How to apply:** when a future v3 screen needs a warm dashboard surface, copy this composition's grammar (light hero → icon-titled cards → one coloured action card → flex columns), not the old ColorCard-heavy Home. Related: [[v3-attendance-screen]], [[v3-kit-actionmenu-icons]], [[dead-space-relocates]].
