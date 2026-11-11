---
name: dead-space-relocates
description: filling one card's dead space in an equal-height card row just moves the hole to the next-shortest sibling — measure content-bottom vs card-bottom for EVERY card in the row
metadata:
  type: feedback
---

When a review says "this card has ~45% dead space", fix the **row**, not the card. In a `display:flex; align-items:stretch` card row every card is as tall as the tallest one, so enriching the flagged card just promotes it to tallest and relocates the hole to whichever sibling is now shortest.

**Why:** the My Attendance three-card row (Attendance stats · Timings · Actions). Stats was flagged at 45% dead; I gave its two figures real context and re-measured — Stats 0%, **Timings 45%**, exactly the defect I had been asked to remove, one card to the right. Only a per-card measurement caught it; the screenshot alone read "much better".

**How to apply:** measure programmatically before declaring done —
`max(child.getBoundingClientRect().bottom) - card.top` vs `card.height - cardPad` for each card in the row. Target every card near 0% except one with ordinary breathing room (~15% is fine; a card can't be padding-perfect). Fix a genuinely thin card either by *distributing* its content (anchor one block top, one bottom — Keka's own Timings card does this) or by giving it the reference data its own title implies (the rostered week under a "Timings" title), never by inventing a metric. Related: [[elapsed-vs-future-summary-leak]] for the same "verify by DOM reconciliation, not eyeballing" habit.
