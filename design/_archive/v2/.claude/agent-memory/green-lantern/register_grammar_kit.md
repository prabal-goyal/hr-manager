---
name: register-grammar-kit
description: How design/v2/kit.jsx implements the Naveya register grammar (Register/Masthead/ActionBar/StatusFooter/Mark), and the tokens.jsx font gap workaround
metadata:
  type: project
---

`design/v2/kit.jsx` (window.UI2) was reworked to express the "Register
grammar" from `design/mockups/Naveya Design System.dc.html` +
`design/mockups/SubstitutionBoard.dc.html` (the user's approved
reference — payroll register, not a card dashboard). Landed 2026-08-11.

**tokens.jsx (window.G2) does NOT carry the Anek/Hanken Grotesk type
family** — it still ships `sans: Figtree`, `deva: Mukta` (only
JetBrains Mono/colour/spacing/radius were updated to "peacock ink").
Per dispatch instructions tokens.jsx was NOT to be edited. Fix: kit.jsx
defines its own local `FONT_SANS` ("Hanken Grotesk"), `FONT_DEVA`
("Anek Devanagari"), `FONT_DISPLAY` ("Anek Latin"), `FONT_MONO` (=
`G.mono`, already correct) and a `typeStyle(role, script)` wrapper
around `G2.t()` that keeps G2's size/line-height/weight scale but
overrides the family. **Every consumer of kit.jsx must keep reading
fonts through `window.UI2.Fonts.{sans,deva,display,mono}` (exported)
or through kit components, never through `window.G2.sans`/`G2.deva`
directly** — those two tokens are stale until a future pass updates
tokens.jsx itself. If/when tokens.jsx IS updated to carry Anek/Hanken,
delete the local FONT_* consts in kit.jsx and route through G2 again.

**Radius is already 0 for `G.r.{none,xs,sm,md,lg,xl,2xl}` in tokens.jsx**
(only `G.r.pill` = 9999 remains) — so most components didn't need a
radius edit, only an audit for the few that shouldn't be pills anymore
(Chip, DayLogRow) and the couple with truly hardcoded literals (Seal,
now an intentional `borderRadius:"50%"` circle — literal circles for
genuine iconography, like a stamp or Avatar, are NOT a grammar
violation; the ban is on rounded CARD/DATA-ROW chrome).

New primitives added to `window.UI2` (see [[green-lantern memory
index]] for the file map): `Register` (full-bleed table shell — 2px
accent + numbered gutter, hairline alternating rows, double-rule
totals footer via `borderTop` + an offset `boxShadow` line trick —
`border-style:double` at 2px does not render two visible hairlines,
don't reach for it), `Masthead`, `ActionBar`, `StatusFooter`, `Mark`
(mono glyph + coloured word — retires filled pills for record/workflow
state; `RECORD_STATE_MARKS` maps Filed/Verified/Approved/Held/Rejected/
"In review"/Pending/Draft), `MusterMark` (P/A/L/H/· attendance swatch,
always square), `inr(n, decimals)` (Indian lakh-crore grouping,
hand-rolled digit grouping — NOT `toLocaleString("en-IN")`, kept
independent of Intl per the dispatch brief and matching the shipped
mockups' own `inr` helper), and `fitFontSize`/`isDevanagariText`
(measure-independent auto-fit: computed from string length × an
estimated per-char em-width vs. available px width — no DOM
measurement/ResizeObserver, correct on first paint).

`Card`'s default elevation changed from level 1 (shadow) to level 0
(flat, hairline `c.rule` border) — grammar rule "no shadow inside
data". Existing callers (`variants/home-a.jsx`'s TodayModule,
LeaveBalances, WeekPattern, PaydayMoment) get the flat look for free
with no prop changes; a genuine floating layer (popover/modal) must
now explicitly pass `level={3+}` to opt back into a shadow.

Verified with the puppeteer-core + cached Chrome technique (see
[[reference_puppeteer_verification]]) against `design/v2-a.html`
(light + dark + Hindi) — zero page errors (the one recurring
`console.error` is a `/favicon.ico` 404, pre-existing, unrelated to
kit.jsx). New primitives aren't wired into any shipped screen yet
(only `variants/home-a.jsx` renders today, and it doesn't use them) —
verified separately with a throwaway smoke-test HTML page created,
screenshotted, and deleted before finishing (not committed).
