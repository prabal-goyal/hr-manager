---
name: rule-on-every-row-is-a-footnote
description: an explanatory sentence that is true of most rows in a register must sit once in the card footer, with the row carrying only its chip — per-row repetition buries the rows that are actually different
metadata:
  type: feedback
---

In a register, give a row a secondary note only when that note is **specific to that row**. A rule
that holds for the majority of rows belongs in the card's footer, said once.

**Why:** `py-ops.jsx`'s loans register rendered "Interest-free, so a perquisite value is computed by
the run from v2026.3 and appears on the payslip..." under eleven of nineteen names. The screenshot
was a wall of identical grey text, and the genuinely row-specific notes — one deferred instalment,
two balances moving to a settlement, one loan awaiting a sanction, one foreclosure with a waiver —
were invisible inside it. Moving the perquisite sentence to the footer and leaving only the
`Perquisite` chip on the row made those five exceptions the only prose on the surface, which is
what a reader is scanning for. This is the register form of the user's standing
"every element earns its place" rule.

**How to apply:** when writing a `rowNote(row)` helper, make the default return `null`. Ask "would
this sentence differ between two arbitrary rows?" — if not, it is a footnote. Verify by counting:
if the same string appears more than twice in a full-page screenshot's text, it is in the wrong
place. The same test caught a card whose title repeated its own body verbatim.
