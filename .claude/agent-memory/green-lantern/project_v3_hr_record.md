---
name: v3-hr-record
description: HR-03..07 employee record — the subject-shell-with-tabs recipe, the two-tall-columns layout fix, and the PII/governance patterns it settled
metadata:
  type: project
---

`design/v3/pages/hr-record.jsx` (`window.Pages3.HRRecord`) is the deepest PII surface in the
product: HR-03 shell (identity + at-a-glance state row + alerts) with HR-04..07 as tab facets.

**Why it is one file with tabs, not four screens:** a record genuinely has many facets but one
subject. alfred's decomposition settled it, and the tab strip is what keeps "one screen, one
question" true — each facet prints its own question under the strip.

**How to apply — patterns worth reusing:**

- **Only the active facet is mounted.** That makes "leaving a tab re-masks whatever was open"
  structural rather than a promise, and it is why the kit's `Tabs` never has a dangling
  `aria-controls` (it points only at the panel actually in the document).
- **State that two facets share is lifted to the page**, not duplicated. Verifying a document
  response on the Documents facet moves the register, the required-type checklist AND the shell's
  alert band, because all three read one flag. A page that can contradict itself will.
- **Every span, countdown and "days over" is derived from `TODAY` + an ISO literal**, never typed.
  Add a named horizon (`EXPIRY_HORIZON_DAYS = 180`) so a 2033 certificate does not print
  "in 2,351 days" — a countdown is information near the edge and noise far from it.
- **Two tall columns beat one tall card plus one short card.** Pairing tall+short only moves the
  hole (see [[dead-space-relocates]]); stacking the registers on the left and the panels that
  explain them on the right closed a 420px gap to a 1px spread. Measure it — walk `<section>`
  rects, group by `x`, compare each column's bottom.
- **Actions can live beside the terms they act on** rather than inside them ("Changing this
  contract", "Adding to the service book"). It reads well AND it is what balanced the columns.
- **The correcting entry sits ABOVE the entry it corrects** because the service book is ordered by
  when each line was WRITTEN, not by when it takes effect. Both stay readable and each names the
  other — that is what makes append-only legible instead of merely true.

**Cross-file defects found while building (not mine to fix):** `design/v3/pages/documents.jsx`
carries hand-typed day counts that are 2 off the 11 Aug 2026 clock (62 vs 64, 74 vs 72) and shows
the employee responding on 12 Aug 2026, a day in the future. `design/v3.html` has no script tag
for `hr-record.jsx` (see [[v3-role-pages-not-wired]]) — one line, owner's call.

Promotion candidates now at 3+ independent definitions: `MaskedField`, `DefRow`, `Trail`,
`Dialog`, `ChoiceGroup` (a radio group with NO default, for answers that move money).
See [[naveya-masked-pii-pattern]], [[absent-vs-disabled-capability]],
[[dom-dump-includes-jsx-source]].
