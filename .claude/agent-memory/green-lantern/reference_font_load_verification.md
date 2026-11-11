---
name: font-load-verification
description: document.fonts.check() gives false negatives (defaults to weight 400, and unicode-range subsets load lazily) — prove a webfont really loaded by width-diffing against the generic fallback
metadata:
  type: reference
---

To prove a Google Fonts link actually loaded — the failure mode where a dead link silently renders `system-ui` and the whole design looks wrong-but-plausible — **do not** trust `document.fonts.check('16px "Family"')`. It lies in two ways:

1. It defaults to **weight 400**. Spline Sans Mono rendered only at 500/600 reports `false` at 400 while being perfectly loaded (`check('500 16px "Spline Sans Mono"')` → `true`).
2. Google serves each family as many `unicode-range` subsets that load **on demand**. Mukta on an English page is `unloaded` because no Devanagari glyph was painted — a correct state that reads as a failure.

The reliable probe: inject two offscreen spans with the same sample text, one `font-family: "Family", monospace`, one `font-family: monospace`, `await document.fonts.ready`, then compare `getBoundingClientRect().width`. Different width ⇒ the webfont is really being used; identical ⇒ it silently fell back. Insertion also *forces* a lazy subset to load, so this works for a family the page doesn't currently paint (which is how you verify a fallback-chain link like Mukta being the ₹ carrier).

Other gotchas from the same pass:
- Puppeteer's `page.screenshot({ clip })` takes **page** coordinates, but a portal popover positioned `fixed` reports **viewport** coordinates from `getBoundingClientRect()`. On a scrolled page the clip lands somewhere else entirely and you screenshot the wrong region — add `window.scrollY/scrollX`, or just take a full-viewport shot with the menu open.
- Console errors logged as `JSHandle@error` hide the real message; re-read them with `m.args().map(a => a.evaluate(x => x.stack || String(x)))` or you will "pass" a run whose errors you never saw.

Companion to [[reference-puppeteer-verification]] (Chrome path, server, favicon 404, below-the-fold clicks).
