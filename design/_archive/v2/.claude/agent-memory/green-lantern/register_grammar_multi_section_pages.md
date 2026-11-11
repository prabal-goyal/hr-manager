---
name: register-grammar-multi-section-pages
description: Patterns learned building docsprofile.jsx (Documents + Profile, M4/M3) — stacking multiple Registers, non-money totals, Chip/Mark tone gotchas
metadata:
  type: project
---

Built `design/v2/pages/docsprofile.jsx` (`window.Pages2.Documents`,
`.Profile`, `.DocsProfile`) as the first consumer of the reworked
register-grammar `kit.jsx` primitives on a real content page (Register/
Masthead/ActionBar/StatusFooter had only been smoke-tested standalone
before — see [[register_grammar_kit]]). Durable findings for the next
page that composes from `window.UI2`:

**Multiple `Register`s can be stacked vertically on one page** (one per
logical section — Employment / Qualifications / Statutory IDs / Service
Record on the Profile page) with a plain mono-caps `SectionTitle` label
between them. Each `Register` restarts its left-gutter numbering at 01 —
that reads correctly as "each section is its own ledger," not a bug.

**`Register`'s `totals` footer isn't money-only.** Rule 3 ("everything
sums") is satisfied by any closing figure appropriate to the register:
plain counts as strings (`"7 verified"`, `"3"`) for non-monetary
registers, or a real `Figure`/`inr()` value for a register that IS
money (Service Record's footer shows the employee's *current* CTC via
`<Figure value={984000} .../>` in the totals cell — closing a career
timeline on "where the number ends up" reads naturally as a total, no
literal addition required).

**`Masthead`'s `right` slot isn't money-only either** — pass a custom
node (not `figureValue`) for a plain count. `Figure`/`figureValue`
always prefixes `₹` and forces 2 decimals via `inr()`; for a
non-monetary headline number (e.g. "09 records on file", "6y 4m length
of service") build a small local component that copies Masthead's own
kicker/figure/sub layout but reads `window.UI2.Fonts.mono` directly
instead of routing through `Figure`.

**Tone-key gotcha: `Chip`/`toneColors()` vs `Mark`/`toneColor()` resolve
tones differently.** `toneColor(c, tone)` (used by `Mark`) checks
`c[tone]` directly first, so `tone="seal"` or any real `G2.c` key works.
`toneColors(c, tone)` (used by `Chip`, `MusterMark` via `TONE_KEYS`)
only recognizes the fixed `TONE_KEYS` map (present/late/absent/leave/
off/holiday/missing/penalty/success/warning/danger/info/neutral) and
silently falls back to neutral gray for anything else — `tone="seal"` on
a `Chip` renders as a plain gray chip, not brass. Use `Mark` (or the
`Seal` component directly) for brass/seal states; reserve `Chip` for
the tones actually in `TONE_KEYS`.

**The brass `Seal` reads fine at compact sizes inside a dense register
row** (used at `size={30-34}` in a `rowHeight={44-56}` row, vs. its
`size={86}` default for a hero placement) — the inner label/date text
shrinks below comfortable reading size at that scale, but `Seal`'s
`role="img" aria-label` carries the full "Verified · date" text, so the
compact seal stays accessible even though it's visually more icon than
label at that size. Bumped `Register`'s `rowHeight` prop above the
40px register default (used 56 for the Documents register, which pairs
a two-line document cell with a compact Seal) — `rowHeight` is a
per-register override, not a global metric change.

**M4 document-governance UI pattern that worked well:** model the
*one* open `DocumentUpdateRequest` as a normal register row with
`row.flagged=true` (grammar rule 6's accent ring) whose STATE column
renders a `Button` ("Upload response") instead of a `Mark`/`Seal` — every
other row in the same register is fully read-only. This makes the
one-writable-thing-on-the-page pattern visually self-evident without
a separate "requests" panel.
