---
name: feedback-react18-batched-setstate-ref-race
description: pan/zoom drag handlers that read a ref inside a setState updater function can crash-unmount the whole app under React 18 automatic batching
metadata:
  type: feedback
---

`design/design-canvas.jsx`'s pan/zoom drag pattern (also used as the explicit "reuse this interaction model" reference for `design/canvas.jsx`) reads a mutable ref inside the `setState` updater function itself:
```js
const onPointerMove = (e) => {
  if (!drag.current) return;
  setT((p) => ({ ...p, x: drag.current.ox + (e.clientX - drag.current.x), ... }));
};
```
This is a live race: React 18 automatic batching can defer running the updater function until after other same-tick handlers finish — including a same-tick `onPointerUp` that nulls `drag.current`. When that happens the updater throws `Cannot read properties of null (reading 'ox')`, and with no error boundary the whole React tree unmounts (body goes empty). Reproduced 100% of the time with Puppeteer's `mouse.move(..., {steps: N})` + `mouse.up()` in quick succession (no real per-frame timing gap); real human dragging is far less likely to hit it but it's not impossible.

**Why:** caught via mandatory puppeteer pan-drag verification on `design/canvas.jsx` (green-lantern, 2026-08-11) — the board rendered fine until the first drag-pan gesture, then silently went blank.

**How to apply:** when writing (or copying) this drag pattern, snapshot the ref into a local const BEFORE calling `setT`, and close over the local const in the updater — never re-read `ref.current` inside a `setState` updater:
```js
const onPointerMove = (e) => {
  const d = drag.current;
  if (!d) return;
  const nx = d.ox + (e.clientX - d.x), ny = d.oy + (e.clientY - d.y);
  setT((p) => ({ ...p, x: nx, y: ny }));
};
```
`design/design-canvas.jsx` itself still has the buggy version (out of scope to fix unless directly dispatched — "write your own file, do NOT edit design-canvas.jsx" was the explicit instruction on the canvas.jsx dispatch). Flag it if a future dispatch touches that file's pan/zoom code.
