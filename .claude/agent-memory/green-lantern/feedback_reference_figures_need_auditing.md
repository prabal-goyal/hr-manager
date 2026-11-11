---
name: reference-figures-need-auditing
description: mock figures lifted from an exploration are design, not data — audit them for arithmetic and for governance before porting them into the live system
metadata:
  type: feedback
---

An approved exploration's *numbers* have not been reviewed the way its *layout* has. When porting one, re-derive every figure in code and check it against the story the copy tells.

Caught while porting `design/v2/explore/home-d.jsx` into v3 Home:
- **YTD didn't reconcile.** The exploration showed take-home ₹78,432 for July plus "paid to you this year so far ₹8,61,204" — roughly eleven months of pay inside a four-month financial year (Apr–Jul). Replaced with ₹3,09,978 = 3 × June's ₹77,182 + July's ₹78,432, which is consistent with the very next chip ("₹1,250.00 more than June"), and the label now names the range. The gross-minus-deductions → take-home chain is now computed (`PAY_NET` is derived, never re-typed) so it cannot drift.
- **An illustration can imply a forbidden affordance.** The exploration's document-request art carried a clay `+` badge. On a document card a plus reads "add a document" — which document governance (M4) forbids; the employee only ever *responds* to an HR-initiated `DocumentUpdateRequest`. Swapped for a clock badge ("awaiting"), which is also what the card's chip says.
- **A role colour can mean the wrong thing.** The exploration drew all three leave meters in sage. Sage is `present`/success in this system, so leave balances now read from the leave-TYPE token space (`ltCasual` / `ltEL` / `ltSick`) — the colour says *which leave*, never "present".

**How to apply:** on any port, derive totals in code, assert them in the browser (`gross + deductions === shown net`, in both languages), and read every glyph as an affordance before shipping it. Related: [[reference-screenshots-not-prose]], [[v3-home-terracotta-port]].
