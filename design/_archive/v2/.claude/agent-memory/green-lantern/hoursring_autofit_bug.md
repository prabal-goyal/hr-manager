---
name: hoursring-autofit-bug
description: Root cause + fix pattern for the HoursRing centred-figure overflow bug reported 2026-08-11
metadata:
  type: feedback
---

Coordinator-reported bug: the `HoursRing` centre figure ("3h 14m") in
`design/v2/kit.jsx` could overflow the ring / read off-centre. Root
cause was NOT a flex-centring bug (the wrapping div was already
`position:absolute; inset:0; display:flex; alignItems:center;
justifyContent:center`) — it was a **fixed font size as a flat
fraction of the ring diameter** (`fontSize: s * 0.24`) that ignored
the string's actual length, so a 6-7 character value ("3h 14m") could
be visually much wider than a 2-3 character one ("8h") at the exact
same size, and a stray trailing space (`{m ? \`${m}m\` : ""}` leaves a
trailing space when `m` is 0) skewed the visual centroid.

**Why:** any centred metric with a variable-length string (hours,
money, a name) needs its font size computed FROM the string, not
fixed relative to the container. This applies broadly — the same
class of bug can recur in `LeaveDonut`'s centre value or any future
"figure in a fixed shape" component.

**How to apply / the fix pattern used:** added `fitFontSize(text,
maxWidthPx, maxSize, charWidthEm, minSize)` — a MEASURE-INDEPENDENT
auto-fit (no DOM `getBoundingClientRect`/`ResizeObserver`; purely
`maxWidthPx / (text.length * charWidthEm)`, clamped to
`[minSize, maxSize]`). This is deliberately not a real text-measurement
API: it's correct on the FIRST paint (no layout-then-correct flash)
and works identically in a headless/SSR-ish context. Compute the
available width as the largest square inscribed in the ring's inner
circle (`innerR * Math.SQRT2`), feed the value string and the label
string through `fitFontSize` separately (label gets a larger
`charWidthEm` when `isDevanagariText()` matches — Devanagari conjuncts
are wider per character than Latin), and always build the value string
with no trailing whitespace. Re-verified centred + non-overflowing in
English AND Hindi, light AND dark, via puppeteer screenshot diff.
