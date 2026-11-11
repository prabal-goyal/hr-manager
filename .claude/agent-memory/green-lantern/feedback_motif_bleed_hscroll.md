---
name: motif-bleed-hscroll
description: the v3 page Motif is drawn 70px past the right edge and silently gives every screen a horizontal scrollbar — main needs overflowX clip
metadata:
  type: feedback
---

`UI3.Motif` is positioned `right: -70` inside the screen's `<main>` on purpose (the Corridor Study is meant to bleed off the edge). Without containment that bleed becomes **70px of real document horizontal scroll on every v3 screen** — `document.documentElement.scrollWidth - clientWidth === 70` at 1440 / 1680 / 1920 alike.

Fix: `<main style={{ ..., overflowX: "clip" }}>`. Use **`clip`, not `hidden`** — `hidden` would make `main` a scroll container, which changes how sticky/absolute descendants and programmatic scrolling behave; `clip` just clips.

**Why:** this shipped undetected in both `screens.jsx` Home and `pages/attendance.jsx` because the scrollbar is an overlay on macOS and a full-page screenshot renders the page at its full scrollWidth — **the screenshot looks perfect while the page scrolls sideways**. It was only caught by measuring `scrollWidth - clientWidth` in puppeteer.

**How to apply:** every new v3 screen that renders `<Motif />` needs the same `overflowX: "clip"` on its `main`. And more generally: prove "no horizontal scroll" by *measuring* it, never by looking at a screenshot — same class of lie as [[dead-space-relocates]].
