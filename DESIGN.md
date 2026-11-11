# Design

> **A COLOUR VARIATION exists and is NOT canonical: "Slate & Mulberry".** `design/_archive/v3-mulberry.html` + `design/_archive/tokens-mulberry.jsx` (archived 2026-11-07) are **v3 with one file added** — the palette. Same rail, same layouts, same Warm Grotesk type, same components, the same 52 screens, the same code; only `G3.light` / `G3.dark` are overlaid. Formal dashboard scheme: a warm-neutral grey field (chroma 0.003–0.012), a warm near-black rail `#231C22`, and **colour only where you act** — mulberry `#782F74` on primary buttons, the active rail item, selection, focus and links. State is a small low-chroma mark in one tonal band; **avatars draw from a six-tint bank picked by name** (`avatarBank` + `UI3.avatarTone`) so a register of people is not a wall of brand colour; **green is v3's own green, verbatim** (`present` #2F6B42, bar #34935A) — the one hue borrowed from the canonical palette, because attendance already had a green that works. Verified AA in both themes.
>
>
> Naveya's visual system — **v3 "Staffroom Terracotta", canonical**. Product register, web-first (Flutter mobile later), **light default with dark at parity**, **bilingual Hindi + English from the start** (user ruling 2026-11-07, supersedes the earlier "English only" note — PRODUCT.md "Bilingual by construction" is binding).
> Living source: `design/v3/tokens.jsx` (`window.G3`) + `design/v3/kit.jsx` (`window.UI3`). Reference build: `design/v3.html` (`?screen=login|home|attendance`, `?theme=`, `?lang=`).
> **Supersedes** the earlier "register grammar" direction (radius-0, hairlines-not-cards, no shadow in data) and, as of 2026-09-03, the "Peacock" palette/type that v3 first shipped with. That rebase changed **tokens only** — the approved information architecture of Login, Home and My Attendance is unchanged, and the rail keeps its Keka shape. The 11 principles below are untouched. On **2026-09-16 (NA-61)** the type moved from Young Serif / Wix Madefor Text / Mukta / Spline Sans Mono to the **"Warm Grotesk"** system below — again a token change only; colour, layout and IA did not move.

---

## Design principles

These come from what actually went wrong across the design rounds, not from theory. Apply them before presenting any screen.

1. **Every element earns its place.** Every page needs *X* things; for each one ask *"would she open the app for this?"* If no, it goes behind the nav. Cut on sight: anything shown twice, empty-state cards holding permanent space, legends restating adjacent values, home-screen tables that duplicate a nav destination, and "nice" content that's never acted on.
2. **One screen, one question.** Home answers *"what needs me today?"*. Attendance answers *"what's my record?"*. A screen answering two questions is two screens.
3. **Show the shape, then the number.** Ring, timeline, bar, donut first; the exact figure second. This is what pulled us out of "too many numbers" — the data didn't shrink, it got a form.
4. **Money is sacred.** Exact, tabular, **Indian lakh-crore grouped** (₹1,26,44,180.00 — never 12,644,180, never 1.26Cr), never truncated. Figures in a set must sum. A wrong-*looking* number destroys trust as fast as a wrong one.
5. **Density is a function of role, not taste.** A teacher's home is nearly empty; a payroll officer's home is a work queue. Design per role — the same "dashboard" means different things to different people.
6. **Show provenance for anything consequential.** *"Marked by biometric · Gate 2 · eSSL K30"*, *"Run PR-2026-07 · approved 29 July"*. For attendance and money, where the number came from matters as much as the number.
7. **The empty state is a designed state** — warm, human, and it says what will appear here. Never "no data". But it doesn't earn permanent space: render it only when the section is genuinely present.
8. **Never state by colour alone.** Mark or word *plus* colour, always. ~8% of the male audience is red-green colour-blind and this product decides pay.
9. **Don't offer what governance forbids.** Employees cannot self-edit documents, so there is no Edit button — only *Respond* to an HR-initiated request. Never imply a permission the system won't honour.
10. **Nothing irreversible in one click.** Payroll runs and statutory filings require maker-checker; the interface must actively refuse to let one person release money.
11. **One language.** English, everywhere, with no switcher — the Devanagari half came out on 2026-10-12. Copy still goes through `t()`, so a second language is a file rather than a rebuild, but nothing in the UI offers one until there is one to offer.

---

## Theme

A **cream** field (`#FAF3EA`) with white cards, a **cocoa** chrome (rail + welcome band), and a single **clay** accent, supported by sage and honey. It is a staffroom, not a console: warm paper, warm ink, warm shadow. Warmth comes from the ground and from containment and craft — real cards with soft 20px radius, real padding, gentle cocoa-tinted depth — not from ornament. The state palette is reserved for data meaning; honey marks money that is verified or accrued; a deep crimson (distinct from the clay accent) is reserved for overdue, absence and deductions.

**Light is the default.** Staffroom Terracotta is a light-first palette and a teacher opens this on a school desktop in daylight; we deliberately do *not* follow `prefers-color-scheme`. Dark is a designed sibling and it is **warm** — espresso grounds with a lifted clay accent, never a cold blue-grey inversion; a warm system with a cold dark mode reads broken. Reachable by toggle, `?theme=dark`, or stored preference.

**The rail deliberately stays Keka-shaped.** Only its hue moved (peacock ink → cocoa). Narrow (~84px), icon over label, one soft active fill, calm and receding. It is chrome, not a brand slab — the oversized saturated sidebar was the rejected v2 sin, and re-colouring the system does not reopen it.

Colour strategy: **restrained chrome, expressive data.** The chrome stays quiet; colour energy lives in rings, donuts, timelines, marks and state chips. This was the fix for "the colour is all over".

## Color

Read from `window.G3` — never hardcode hex in screens.

| Role | Light | Dark | Notes |
|---|---|---|---|
| page | `#FAF3EA` cream | `#1D1410` espresso | |
| card / surface | `#FFFFFF` | `#2A1E18` | ink on card 13.7:1 / 13.5:1 |
| raised | `#FFF9F1` | `#33241C` | |
| gutter / sunken | `#F1E3D1` / `#F3E9DB` | `#16100D` | |
| rail (chrome) | `#3E2A1F` cocoa | `#150E0B` | on-rail ink 11.3:1 / 15.3:1 |
| rail accent | `#E68153` | `#F0946A` | 4.9:1 on cocoa — light clay would be 2.8:1 |
| ink | `#3A2A21` | `#F5E9DC` | 12.4:1 on page |
| ink-muted | `#77614F` | `#C0A793` | 5.3:1 / 7.1:1 |
| ink-faint | `#826B58` | `#9B8470` | 4.6:1 — still AA body, unlike the old faint |
| border | `#EBDCCB` | `#453329` | |
| **accent** (clay — fills, rings, marks) | `#C14D29` | `#E68153` | 4.4:1 on cream, 4.8:1 on card |
| accent-soft | `#F9E7DC` | `#38231A` | |
| **action** (deep clay — all accent TEXT) | `#A03D1D` | `#F0946A` | 6.0:1 on cream, 6.6:1 on card |
| brass / honey (verified, accrued, holiday) | `#7E5306` | `#E9BE68` | 6.1:1 / 9.3:1 |
| success / present (sage) | `#2F6B42` | `#6FC087` | 5.8:1 / 7.4:1 |
| danger (overdue/absence/deduction) | `#B3243C` | `#F0736F` | 5.9:1 / 5.7:1 |

**Clay has two shades on purpose.** `accent` is the brand clay and is used for *fills, rings, bars, active marks and icons* (≥3:1, the UI-graphic threshold). Any **text** in the accent colour uses `action`, the deeper clay, which clears 4.5:1 on both cream and white. Never set body copy in `accent`.

Data roles ship solid + tint + AA text shade each (every `*Text` on its own `*Tint` measures 6.5–7.5:1 light, 8.9–10.3:1 dark): `present · late · absent · leave` and `off · holiday · missing · penalty`, plus four **leave-type** colours (`ltEL · ltCasual · ltSick · ltComp`) used only for the balance donuts — a leave donut's colour says *which leave type*, never *present/absent*.

## Typography

**Two faces, two jobs** (chosen 2026-10-12 from a five-way trial on `design/_archive/v3-type.html`). One family
carries every word and a second carries every figure — so the only thing a second webfont buys is the one
thing it is actually for.

- **Inter** — **every word**: greeting, page titles, card headings, body, labels, nav, buttons. Heads sit at
  **600** with slight negative tracking (−0.02em at hero, easing to ~0 at h3); body is **400**. One family
  for both is the point, not a shortcut: the type scale already separates them by weight and tracking, which
  is the whole of the difference a single family needs.
- **Roboto** with `tnum` + `lnum` — **every** figure: money, times, counts, IDs. It is **not** a monospace,
  and it does not need to be: what lines a money column up is tabular lining figures, which `G3.fig()` asks
  for by name, so every digit takes the same advance width. It does not carry ₹, so the figure chain ends
  in **Hind**; the rupee always renders.
- **Hind** — the last link in every fallback chain, and nothing else. (It drew the Devanagari until the
  second language came out on 2026-10-12; it stays for ₹.)

**A size step is a claim about rank.** Make it where the rank is real — a figure against its own label, a
section head against its body. Four peer totals in a row are four readings of one thing: same size, same
baseline, and let the labels do the distinguishing.

*Superseded:* Bricolage Grotesque + Hanken Grotesk + Red Hat Mono (2026-09-16 → 2026-10-12); before them
Young Serif + Wix Madefor Text + Mukta + Spline Sans Mono. Also considered and not chosen: an all-Helvetica
system (licensed — most Windows and Android devices would show Arial), Newsreader + Helvetica, Anek Latin +
Mukta, and on the 2026-10-12 trial Figtree + IBM Plex Sans, Public Sans + Archivo, Space Grotesk + Barlow.

Tokens must declare the *real* families — whatever `design/v3.html`'s font link loads is exactly what
`G3.font` names, and the pairing is a contract across three files (`tokens.jsx` names them, the page loads
them, the kit reads them). v2 shipped a bug where `tokens.jsx` named Figtree/Mukta while the actual faces
lived in local kit constants — anything reading tokens silently got the wrong font.

## Shape, layout, motion

**Cards win, and they round.** `G3.r.card` = **20px** — the warm system's baseline. Controls and inputs 12px, popovers and inner boxes 16px, the welcome band 26px. Real padding, subtle border plus a **cocoa-tinted** soft shadow, generous breathing room. Tables and registers live **inside** cards with proper card headers — never naked on the canvas.

Left **rail** ~84px, cocoa, icon above a small label, one soft active fill. Same shape as before the rebase — only the hue moved. The rail is **role-filtered**: one app, `navItemsFor(role)` hides what a role can't reach. Sign-in has no rail.

**Navigation shell (2026-11-07, from the industry-benchmark critique).** The rail holds **at most eight sections** (`sectionsFor(role)` in kit.jsx): related screens share a section (HR *People* = Staff · Staff logins · Lifecycle; *Time* = Attendance · Leave admin; Accountant *Dues*, *Filings*), and an operator's own self-service folds into one **Me** section after a hairline — an employee keeps those as top-level places. Rail and tab labels are **12px minimum**. A fixed **top bar** (`design/v3/shell.jsx`, mounted by `Rail`, so every screen gets it) carries: **search** (button + Ctrl/⌘ K or `/` — a command palette over the role's pages, shortcut actions, and people from the shared staff register for roles allowed to read it), **notifications** (bell with an unread count in words for screen readers; *Needs you* / *Updates*; facts must match what other screens already show), and the **account menu** (name + title, My profile, theme, Sign out — the theme toggle lives here now; per-page toggles are hidden by the stylesheet). A section with more than one screen shows **sub-tabs** under the bar. **Phone (<768px):** the rail becomes a bottom tab bar of four sections + *More* (a sheet of the rest), the top bar keeps search/bell/avatar as icons, the gutter is 16px, side panels drop under their column, six-column boards stack, and tables scroll inside their card. Tokens: `layout.topBarH/subTabsH/searchW/phoneMax/tabBarH/tabSlots/phonePadX`, `G3.z`.

**Welcome band** — full-width cocoa hero: figure-face kicker, Inter greeting + identity meta on the left, the headline figure on the right, with the *Corridor Study* artwork and the same **curved ripple linework** used on the sign-in brand panel, so the two cocoa surfaces share one motif.

Content sits in a padded container (~1560 max) with real gutters — never edge-to-edge naked, never a narrow column stranded in dead margins. Motion: 120–280ms, exponential ease-out, full `prefers-reduced-motion` alternative.

## Signature components (`window.UI3`)

`Rail` (role-filtered) · `WelcomeBand` · `Card` / `ColorCard` / `Register` (a table inside a card, with header + totals) · `Ring` (hours) · `Donut` (leave type) · `DayTimeline` · `Chip` / `StatusMark` (glyph + word) · `Tabs` + `TabPanel` (**always paired** — a tablist with no tabpanel is a broken pattern; roving tabindex, arrow/Home/End, `aria-controls`/`aria-labelledby` wired) · `ActionMenu` (portal popover; a disabled item stays visible with its reason in words) · `Switch` · `Figure` / `inr()` · `Seal` (honey verification stamp) · `EmptyState` (illustrated) · `Motif` (low-opacity page ground) · `BoatMark` (the authored *nāv* — hull, mast, sail-curve, a star to steer by) · `Meter` (horizontal quantity bar, optional pinned knob — how much of a whole) · `TitleMark` (the small tinted rounded-square subject icon beside a card's serif title; `Card`/`CardHeader` take `icon` + `iconTone`) · `Tip` (a small explanation on hover AND on focus, portalled so a card's overflow cannot clip it — it explains, it never informs: whatever it says must also be legible on the page for somebody who is not hovering) · `SegmentDonut` (a whole divided into named parts — a roll of teachers, a queue by state. One arc per slice with a hairline gap, the headline figure in the middle, and the legend beside it carrying the same facts in words: **a donut with four slices and no legend is decoration**) · `SideScreen` (**the one side panel**: every "ask for something" — apply for leave, ask for a day to be corrected, make a claim, choose what to do with a request — happens here rather than unrolling a form down the page beneath the record it is about to join. Escape closes, Tab is trapped, the page behind stops scrolling, focus returns to whatever opened it; a screen that opens one keeps showing the record underneath. It takes an optional `back` — **a named return above the title**, for a screen reached by a jump from elsewhere: *Close* is not *back*, because after a cross-tab jump close drops the reader wherever the tab happens to sit. A second-level decision opened FROM a side screen is a **centred pop-up above it**, never a second side screen sliding over the first. It takes an optional `avatar` — **a person's face
goes beside their name, not beside their status**: an avatar next to an *Active* chip reads as decoration on
a state rather than as who this record is) · `Rail` groups: a role's own work leads, that person's self-service follows, and the two are **separated by a hairline** (superseded 2026-11-07: self-service is now one *Me* section; the “Yours” heading is gone) — without it "Leave admin" and "Leave" sit four pixels apart meaning entirely different things. The rail scrolls when a role carries more items than fit rather than crushing them · `BackBar` (**a named return at page level** — an internal screen that REPLACES the page is not a dialog: Escape does not close it and the rail's active item still says where you are, so it says where back goes in words: *"Back to the group overview"*, never a bare arrow. `SideScreen`'s `back` is the same promise for a panel) · `FileField` (**the one way to take a file**: a real `<input type="file">` behind a button, with the chosen name beside it — a text box asking for a file NAME is a lie about what the screen does, which is how this control came to be promoted out of `emp-tasks.jsx` in the first place) · `ActionMenu` items take `tone: "danger"` for the one item that destroys something (cancel a request, initiate an exit) — **the word still carries the meaning; the colour is the second signal, never the only one** · `Avatar` (a person in a list: initials, never a photograph — the canvas has no photographs and a grey silhouette says less than two letters do; `aria-hidden`, because the name is always beside it. **A list of people is a table** — avatar, name, what they do — never a wrapped run of names separated by interpuncts) · `SchoolScene` / `RequestArt` (flat authored illustrations — schoolhouse-and-sun for the home hero, form-in-an-envelope for an HR request; every fill is a token role, the two picture-only tokens are `illoWall` / `illoSun`).

**Sign-in** is ONE CENTRED CARD on the page ground (designer, 2026-10-27, against the Mural reference): the mark above it, the trust named under the mark, the card, and the two legal links. The split it replaced spent half a window on a tagline nobody reads twice. **Work email**, not the staff ID — the designer's call, and it supersedes the earlier ruling in this file: a school already addresses its staff at the address HR issued them. Show/Hide password; a captcha the height of the box beside it, with *Try a different image* under the pair — the picture is a control, not a panel, and at 66px tall it read as a panel with an input stuck under it. Then a one-time code to **email or SMS**, each destination shown MASKED, because §8 classes a phone number as PII and only HR holds it. *(Designer, 2026-10-27: the audio alternative is out. A real build still owes WCAG a non-visual route; on the canvas the refresh is the only way out.)*

**Forgotten is not a different screen, it is a different route through the same one.** Proving it is you is the identical act either way — pick a channel, read six digits back — so the flow forks at the start (an email box, no password, no picture: somebody who cannot get in is not asked to prove they are not a robot before they may ask for help), shares the middle, and rejoins with one extra step, the new password. The entry screen never says whether the address is on the roll: *nobody should learn who works here by typing*.

**A sign-in is a room, not a poster.** The page carries flat illustrations along its bottom edge — a staffroom: a plant, the chair, a desk of exercise books and a mug; the noticeboard, the clock, the sofa, a globe on a stool — cropped by the foot of the window. They sit INSET from the window's edges, not flush to them — pinned to `left:0`/`right:0` the furniture was shoved into the corners and read as two bookends. They are PICTURES: one cocoa outline weight (a warm grey in dark, because a near-black outline on espresso is a hole and not a line), flat fills from the categorical ramp and the two picture tokens, no gradient and no shading, `aria-hidden` and `pointer-events:none`. They leave the page entirely under 1120px, where there is no room beside the card and the furniture would be standing on the footer links.

**One address, one account** (designer, 2026-10-27). The work email is the sign-in everywhere the product touches an account: the sign-in screen, HR's staff-login register (the address is the row's headline and the phone is only the second place a code can land), and Add an employee, where it is a REQUIRED field in *The person* and the thing group 6 echoes back. **An account is created by HR and finished by the employee**: it is born *Invited, not signed in*, and the FIRST SIGN-IN is what turns it *Active* — nobody in the office can flip that word on somebody's behalf, which is the whole reason the word is worth printing. A screen that says what will happen says that too, before the button.

**One clock in the product** (2026-10-27). Home and My Attendance render the SAME clock card from the same
store, because two surfaces reporting one fact will eventually disagree about it. What it owes the reader
is the time they came in, what is left of the day, and the one button that is theirs to press — and the
button is there only when the punch was made here, since a gate punch is undone at the gate. Break,
effective-so-far and expected-out are not facts about a day you are standing in the middle of; they are the
record's, once the day closes.

**A self-service page does not quote your own staff ID back at you.** The breadcrumb names the screen and
the school, the rail carries who is signed in, and the register under the title is the person's own. What
belongs under the title is the thing the screen is read against — the session, the month, the year — not
post, code, name and campus restated on every page. (Designer, 2026-10-27: the identity chips came off My
Attendance, Leave and Payslips.)

**A row is a reading; the panel beside it is the desk.** Any button living in the last cell of a register
row — withdraw, approve, a menu — is a desk hidden inside a reading, and it crowds the row that was meant
to be scanned. Put the act in the detail panel the row opens, and let the row carry only what it says. The
one exception the product makes is a **question asked of the reader**: a cover request's Accept / Decline
is the answer to a question, not an operation on a record, and it stays on the row — with no second column
repeating the state the two buttons already are.

**A counter is not a fact about today.** A clock ticking down the hours left of a working day is a number
nobody can act on, and it re-renders the page once a second to say so. What a day card owes its reader is
when they came in, what they are rostered for, and the one button that is theirs to press — facts beside
the act, each state ADDING a block rather than changing the card's shape.

**A card stretched to its neighbour ends on a rule, not on a hole.** Where two cards share a height, the
shorter one's last element — a link, a footnote — goes to the foot with `marginTop: auto`. Content that
stops halfway down a stretched card is what reads as broken.

**Two cards that share a row share a height.** Side by side at different heights they read as one card and
a fragment, not as a pair; `alignItems: stretch` is the whole fix.

**A card is sized by what it holds, not by the row it sits in.** `flex: 1` hands a pair of cards half the
canvas each, and at 1560 that is 728 apiece — a clock time at one end of a field with nothing at the
other, and measuring bars too long to measure anything. Give them the basis their content wants
(`flex: 0 1 440px`, the narrow column this canvas already uses for a column of facts) and let the row end
early: empty canvas on the right is not a hole, it is the margin of the page. Inside a column that narrow,
two readings stack — side by side each one loses the width it needs to BE a reading, and height is the
wrong thing to buy with it.

**A key is a footnote, so it sits at the end of the line.** The colour key under a strip or a calendar is
read once, when something is unfamiliar; given a line of its own above the control that opens the rest of
the data, it takes the rank of a heading. Put it at the far end of the row the control is already on.

**A form that overwrites a record shows the record.** A correction panel that asks which day, and then
will not say what that day currently reads, is asking somebody to overwrite something they cannot see —
and it leaves the question the date field just created ("did I pick the right day?") unanswered until after
it has been saved. Put the record beside the picker, read-only, and let it change with the date; let the
fields it fills follow the date too, because a form still holding another day's values is a trap.

**A correction is filed against a day, not against a person.** The moment a panel can be pointed at any
date, an edit stored under the person alone redraws whatever day the register happens to be showing: put
Thursday right and Tuesday claims to have been corrected. Key it by both.

**A detail panel is sticky and never absent.** A panel that unmounts when nothing is selected makes the
table beside it jump sideways the first time somebody picks a row; one that scrolls away from its table
stops being beside it. Render the placeholder ("Pick a day", "Pick a request"), keep the width, and pin it.

### Ranking a panel's footer

A row of identical secondary buttons has no rank, so the reader has to read all four to find the one they
came for. One **primary** for the act the panel exists for, **secondary** for the others, and the exit
last. An exit may wear the danger COLOUR but never the danger WEIGHT: outlined, never filled — a filled
red button is what this product uses for something that cannot be undone, and closing a panel undoes
nothing.

An **add** wears a plus. A tick is the glyph for a thing already done.

A **choice that changes a record** states what each option DOES, not just what it is called: "Half a day —
half a paid day, the other half unpaid and on the record as such", not "Half day".

A **wall of checkbox pills is a list pretending to be a control.** Past about five options, pick from a
select and list what has been chosen, each removable.

**A route out of a screen does not belong in the footer of a long table.** Nobody scrolls past the last
row to find it. It goes where the sentence that justifies it already lives.

**Say the wait in days, not in policy.** "Five days so far" is a fact a person can feel; "80% of a 24-hour
business-hours SLA" is an apparatus. Keep the promise in configuration and out of the queue. And do not
dress a thing asked this morning in the same alert as one left five days — if everything is a warning,
nothing is.

**A register row you can act on lifts under the pointer; one you cannot stays flat.** That difference is
the whole point of the hover — it tells the reader which rows are live before they press one. Where a row
carries an actions menu, **the menu does not get a hover of its own** (designer ruling, 2026-09-30): a
second surface under the actions cell reads as a different colour bleeding out of the right-hand end of the
row. A row is one object and highlights as one. (An inline `background` on the row beats any stylesheet
rule and will silently kill the hover.)

**One verb, one screen.** Before adding a queue or an action to a screen, ask which other screen already
owns that verb. Two surfaces that both act on the same record are worse than either one alone: they
disagree, and the reader has to know which one is authoritative. Show the problem in both places if it
matters in both; let only one of them fix it, and say so on the other.

**Before designing a tracker, ask whether the thing tracked happens inside the product at all.** If the
decision is taken in a room — an appraisal, a disciplinary conversation, a board approval — the surface is
a RECORD of what was decided, not a stepper through how. And a reminder about work that happens elsewhere
is a reminder about nothing.

**A shared seed identity is a constant until two roles need it for different reasons.** Self-service
screens show *whoever is signed in*; an admin screen shows *whoever is being looked at*. The moment both
read the same object, it has to become a lookup — or a Group Admin's own profile will tell them they teach
Physics to class 12.

**A rule travels with the person, not with the screen.** Whether somebody accrues earned leave, may see
full identifiers, needs a second approver — put it on the record the screens read, so every screen gets the
same answer without knowing the rule.

**A yes/no question about somebody's category reads as a hole when the answer is no.** "Teaching staff: No"
→ "Staff type: Non-teaching." Name the axis and give its value.

**A refusal belongs where the thing is attempted.** "We don't offer that breakdown" goes in the dialog
where somebody is choosing a breakdown, not on a banner over the result. Same for a lock, a permission, or
a disabled control: state it at the point of the attempt, with the reason, in words.

**A result is a thing you read and close.** A report's output, a trace, a computed answer — it opens over
the list that produced it, never unrolled below it, or choosing the next one means scrolling back past the
last one's answer.

**Build scaffolding is not UI.** Inventory codes on tabs, spec section references in body copy, file names
in hints: notes to whoever is building the screen, printed on the screen. The reader cannot act on any of
them. Say the same thing in the reader's own words, or say nothing.

**A figure with no provenance is the one nobody can defend later.** Pay, a rating, a paid-day count: every
line says what put it there and who. Where the figure is also PII, it is a **revealed field** — masked by
default, opened deliberately, and the opening is on the record — never simply absent and never simply
printed.

**A mark the subject can award themselves carries no information.** Self-declared priority, self-rated
urgency, self-reported effort — every raiser's own request is urgent. Derive the signal (how long it has
waited) instead of collecting the claim.

**A module's vocabulary is its information architecture.** If the words on screen are not the words the
reader's job uses, the fix is not the layout.

A **banner that never changes stops being read.** A standing explanation parked above the work belongs on
the rows it explains, or in the detail of the thing it is about.

**A count is not a description.** "3 permissions", "12 rules", "4 fields" tell a reader nothing about the
decision in front of them. Say what the thing *reaches*: "The whole group, every setting, and who else can
get in" · "Their own record, and nothing else." The count belongs behind the row, if anywhere.

**Detail unrolled under every row is a table that has given up.** A wrap of chips, five identifiers and a
list under each of five rows is a page you scroll to read eight facts. Four columns, then the row's own
pop-up for everything else — a campus is a campus; its seven departments are what you open it to find.

**A screen shows what its reader can act on.** A number the reader can neither produce nor approve reads as
theirs and is not — a group admin shown the payroll cost owns none of it. Removing it is not hiding
information; leaving it is misattributing responsibility. What they *do* answer for (what the trust owes)
stays.

**A comparison you cannot open is a report, not a dashboard.** Five campuses ranked side by side with no way
into any of them ends the reader's journey at the exact moment it became interesting. Every row that names
a group of people has a way to see them — read-only, masked, wherever the record is somebody else's to
change.

**Seed data that two screens read is a store, in a file of its own — and a global that two files both
consider theirs is a race decided by load order.** The holiday calendar is defined by the group admin and
read by HR and by leave; one list, or they drift and neither is wrong. Merge into a shared global
(`Object.assign`), never assign over it.

**A category with three real members does not get squeezed into two.** A school's year has days it is
closed, days the office is open and a person may take *two from a list*, and days that apply to named
campuses only. Collapsing that into holiday/not-holiday loses the rule that makes the third kind exist.
Allowances are numbers in the store, not sentences in a component.

**Warn where a value is legal but means nothing.** Marking a Sunday closed changes no count and quietly
misstates the year. The control accepts it and says so.

**A jump into another role's screen hands the reader that role's powers.** A campus row that opens the
principal's home puts Approve and Decline in front of somebody who decides no leave; a queue that routes to
the accountant's liability screen shows money to somebody who owns none of it. A screen may NAME another
desk's work — "HR verifies this", "the accountant approves the run" — and must not take the reader there.
Every route out of a screen lands somewhere its reader can act.

**A confirmation printed after the fact is not a confirmation.** "Deactivate this device? It stops
accepting pushes immediately" belongs in the dialog before the press, not in the toast that follows it. And
an action whose outcome depends on something outside the product states BOTH outcomes first: asking a
silent reader for its punches will time out, and saying so beats reporting a success that did not happen.

**Say what an action does NOT do, when that is the surprising half.** Correcting a reader's clock fixes
tomorrow and re-reads nothing; a fixed term ending exits nobody; withdrawing consent cannot delete a record
the law requires. The consequence a reader assumes wrongly is the one worth printing.

**What EXISTS is not what it SAYS.** A record can show that a file is complete — 12 of 12 documents, PAN on
file, bank account on file — without showing one character of what is in it. Existence is an
administrative fact; the value is a revealed field. Conflating them is how a read-only screen leaks.

**An incident is a list of people.** "11 records held" cannot be acted on; eleven names can. Wherever a
count stands for people whose day, pay or record is wrong, the detail behind it names them.

**A side panel beside a register is wrong for a record and right for a log.** A record is a thing you act
on — it opens OVER the list. An audit line is one entry in a sequence you are *reading*, and opening it
must not cost you your place in that sequence, so it opens beside it and the panel sticks. The test is
whether the reader is working through the list or working on one row of it.

**A detail panel leads with what changed, not with a field called "Action".** Heading = what happened;
then the change, because that is the only reason anybody opened it; then who, when, where and why as
supporting facts. And **an absent value is a fact, not a missing row**: "no reason was required for this
kind of change" beats leaving the row out.

**Design the case that is not the ordinary one.** 531 people accepted the notice and nothing follows from
that; the screen is for the other six — and among those six, "has not accepted yet" and "has no phone
number on record" are different problems with different actions, not one list with one button. A section
that only handles the happy path has no reason to exist.

**One object, one screen — a second reader gets a MODE, not a copy.** When another role needs to see a
record that already has a screen, that screen runs read-only for them: same header, same tabs, same
masking, same copy. A second screen describing the same object is drift by construction — it rots, and the
day the first one gains a field the second silently does not. What may differ is only what must: which rail
item is lit, where the named return goes, and that the controls are off.

**Read-only means OFF, not HIDDEN.** Every control stays where the owning role sees it, disabled, so the
reader can see what would be done and by whom — a missing button teaches nothing. The reason is said ONCE,
where the reader lands, not on eighteen controls. And a control that already carries its own reason keeps
it: that reason is a fact about the record, and both readers should get the same fact.

**Opening a masked field is an act, not a way of looking.** It is written down against the name that did
it, so it is off wherever the rest is off. Reading is free; revealing never is.

**A prop named `disabled` that only styles is worse than no prop** — it makes every caller believe a guard
exists. If a control can be disabled, the disabled state sets the real attribute, drops the handler, and
changes the cursor. Fading a button to 55% and leaving it live is a lie told to the next author, not to
the user.

**Before building a tracker, ask not only whether the THING happens in the product, but whether the GATE
does.** An approval step for a role that needs no approval is a whole tab of waiting: it models a
permission that does not exist, and a screen that asks for permission nobody needs teaches people to wait
for it. Delete the gate, not just the steps around it.

**A record of work done elsewhere must accept the past.** If the deciding happened in a room — an
interview, a conversation, a phone call — the surface has to let somebody be entered at ANY stage, on ANY
past date, because the event was Tuesday and the typing is Friday. A form that forces stage one makes
people lie to it, and then the record is worth nothing.

**Say what the product does NOT do, where somebody might assume it does.** Marking a candidate "not taken"
does not tell them; raising an outage does not tell anybody; putting an opening on hold tells nobody. Every
dialog that could be mistaken for a message says, in its own words, that nothing was sent — otherwise
somebody goes home believing a person was answered.

**Two terminal states that feel the same are usually different facts.** "We did not take them" and "they
went elsewhere" collapse easily into "rejected" — and a school that loses three people to better pay has a
different problem from one that turns three away. Keep them apart wherever the difference is about you
rather than about them.

**Moving backwards is a real event, so label it rather than block it.** A second interview, a resume looked
at again, a day re-opened: the control allows it, names it ("this moves them back a stage"), and keeps both
lines on the record.

**A summary band is a picture plus the thing to do about it, never a row of bare figures.** "Longest open:
32 days" cannot be acted on, because it never says which one. Put the whole on the left as a donut whose
centre is the figure that matters and whose legend carries the counts in words, and on the right the
RANKED LIST that names them — each row a link into the thing itself. And where a legend can also be the
filter, make it the filter: a chart beside a separate row of buttons saying the same thing is two objects
doing one job.

**A ranking bar is capped in width.** A bar that runs the full card reads as progress towards 100%, not as
"this one is longer than that one". Cap the column so the comparison is the thing the eye does.

**When the product cannot observe an event, do not model it as observed.** An offer leaves somebody's own
email client and the reply comes back to it; nothing in the product sees either. So the status does not
change because the system learned something — it changes because somebody ATTACHED the evidence, the
dialog says exactly that, and it refuses to proceed without it. **A status with nothing behind it is a
rumour.** Where two pieces of evidence are weaker apart than together — a forwarded message and a
screenshot of it — require both and say why.

**Flag the mismatch, then say it is probably nothing.** A reply arriving from a different address than the
one written to is worth noticing and worth a line explaining how you know it is them — and the screen
should also say that people answer from work addresses all the time, so the reader is not taught to treat
an ordinary thing as fraud.

**A tick is the glyph for a thing already done.** An action that writes something down wears the document
glyph; an action that completes something wears the tick. Reusing the tick for both makes "record what
happened" look like "mark it done".

**A summary band is a stacked bar over a row of measured figures.** The whole, divided, across the full
width — one segment per part, a legend under it carrying each part's count and name, and a zero part keeping
its legend row so "none at this stage" stays visible. Then the figures, each with a thin bar measuring it
against its own whole and the denominator in words. **Prefer the stacked bar to a donut**: a donut tells its
parts apart by colour alone, and a circle in a wide card leaves most of the card empty.

**No lists and no names in a summary band.** A ranked list of titles or people belongs in the register
below it. What the ranking was FOR survives as metrics that say the same thing — the average, the longest,
and how many are past the line.

**Check that two status roles are not the same colour before putting them in one chart.** In this palette
`late`, `holiday` and `ltComp` are one amber, so a bar built from three of them has three segments nobody
can tell apart. A ladder should walk through genuinely different hues and end on green where the good
outcome is.

**A filter is not a metric.** Search boxes and selects sit on the register they filter, not in the band
that measures it.

**A chip colour and a chart fill are different colours of the same thing.** A status chip wants the
text-tuned variant so the word stays readable on its tint; a bar or an arc wants a fill, and a text-tuned
colour in a bar is mud. Every state that appears in both places carries both: one token for the chip, one
for the chart. Chart fills may be saturated precisely because nothing is ever read off them — the count and
the word live in the legend.

**A categorical ramp is named by hue, not by meaning** — `chartBlue`, `chartAmber`, `chartTeal` — because
the meaning changes per chart and the ramp does not. Order the slots so adjacent ones differ in hue *and*
in lightness; that is what makes four segments side by side readable, and it is what keeps the bar legible
to somebody who cannot separate two of the hues at all.

**Two surfaces that watch the same kind of deadline are one surface.** A probation end and a contract end
differ in what the decision is *called* — confirm or extend, renew or end — not in the work: watch the
date, get the view, decide before it arrives. Splitting them means checking two lists for one deadline, and
anybody who is on both appears twice with two clocks.

**A summary band is read at a glance, so its bars stay thin.** Around 10px for a stacked bar and 4px for a
bullet under a figure; thicker than that and a bar starts reading as a control somebody could drag.

**A figure is ink; the bar beneath it carries the judgement.** Tinting the number with the same colour as
its bar makes a row of metrics read as a row of warnings, and a figure that changes colour as the data
moves is harder to compare against the one beside it — six and four should look like the same kind of thing
even when one of them is late. Put the state in the bar and in a word underneath, never in the digits.

**A checklist is grouped by who is holding it up, not by the order it was written.** An owner chip on each
of seven identical rows is data; "yours to do / waiting on somebody else / done" is the answer to the
question somebody actually opened the screen with. And the group that may never be skipped — safeguarding,
a statutory clearance — comes out of the list entirely and sits where it cannot be scrolled past.

**A task states its condition once.** One glyph and one line: due on a date, N days past it, blocked by a
named other task, or done by somebody on a date. Red text *and* a "pending" chip saying the same thing is
the same fact twice, and the reader stops trusting either.

**A module is named after what is inside it, never after what is left over.** "Operations", "Misc",
"Other" and "General" are the names a navigation reaches for when nobody decided what the module is for,
and a reader cannot tell from such a name whether the thing they want is inside. If a container needs a
name like that, it is not a module — it is several, and they should be split until each one can be named
after its contents.

**Tabs do not nest.** A tablist inside a tablist means the outer tab was a word invented to hold the inner
ones. Promote the inner tabs to peers, or give the group a rail item of its own.

**A figure is only believable if the screen shows how it was reached.** Money especially: a gross is a
column of components that sums, each saying how it was derived; a deduction names its basis (12% of basic
and DA, not of gross); a statutory line names the config version it came from. A single large number with
no arithmetic behind it is an assertion, and the reader has no way to check it.

**When two roles share a fact, they share one object, not two copies.** If HR's record and payroll's
register each carried their own idea of whether somebody has been priced, they would disagree the first
time one was edited. One state, read by both screens, and the act that changes it on one screen changes
what the other sees.

**A field the reader may not fill is absent and says who fills it.** Not disabled, not blank, not a
placeholder: a block that names the other role and what will appear once they have acted. A blank where a
figure belongs reads as a data-entry failure; "the payroll officer sets this" reads as somebody else's
turn.

**A register with a detail puts the detail beside the list, and opens it by clicking the row.** Underneath
the table means scrolling past every other row to read one, and losing your place in the list you were
reading. A row is the target; a four-pixel arrow at the end of it is not.

**Read-only is not disabled.** A disabled control says "you may do this, later". When a role will never
be allowed to do a thing, remove the control, say whose it is, and offer the thing they CAN do instead —
usually asking, in writing, against the record. A greyed-out Edit button on somebody else's figure is a
promise the product has no intention of keeping.

**Each desk owns the layer it can be held to.** A judgement about a person (a rating, a percentage, a
recommendation) belongs to whoever had the conversation. The money that judgement becomes belongs to
whoever answers for the arithmetic. Splitting on that line is what stops a well-meant percentage from
quietly breaking a statutory ceiling.

**A queue of three is a list of cards, not a register.** Columns, bulk checkboxes and row menus earn their
weight at fifty rows; at three they are furniture around a decision. Show the facts that decide it and one
primary action.

**Two objects that cannot be read apart belong on one surface.** A pay group without its structure
prices nobody; a structure without its group applies to nobody. When splitting them forces the reader to
hold numbers in their head and walk to another tab, the split was the inventory's convenience and not the
reader's.

**Simplifying is not the same as removing data.** A nine-column workbench for a three-row queue is wrong,
but so is a row of cards with no totals. Keep the figures that decide the question — including the ones
that only exist in aggregate, like what a queue of rises adds to the monthly bill — and cut the controls
nobody at that volume needs.

**Use the kit's table.** A hand-rolled row of divs has no card, no header, no totals row and no tone
handling, and it will drift from every other register in the product. If a thing is a table, it is the
`Register`.

**An unknown key fails silently, so check it against its source.** A style object with a key the
component does not read, or a token name the palette does not define, throws nothing and logs nothing —
it just renders invisibly or grey. Three bugs in this product came from exactly that: `fill` instead of
`color`, `c.card` instead of `c.surface`, `role="ok"` instead of `role="present"`. Grep the new name
against `tokens.jsx` or the component's own source before using it.

**A page action does not belong in a row menu.** "New pay group" on the row for Teaching has nothing to
do with Teaching. Row actions act on their row; the page's own actions live in the page header.

**An editor for an existing record opens on that record's values.** An empty form where the product
already holds the figures makes the user re-key what it knows, and invites a typo into the one place a
typo costs money.

**An action opens over its subject, never under its list.** A panel stacked beneath a register pushes
the row it belongs to off screen, and by the second one nothing says which record is being acted on. The
row opens a record; the record carries its own actions; the subject's name is in the title the whole time.

**Two options that are not the same must not look the same.** Defer and waive differ on whether the money
is still owed. Side-by-side buttons with similar labels invite the wrong one; each gets its own labelled
choice with the difference written out.

**Symmetrical insets, or the outer item looks broken.** Padding on a grid container *and* on its inner
cells double-insets everything except the first, so one edge sits tight against the outline while the
other floats. Put the inset on the cells alone.

**One elapsed count cannot stand in for several deadlines.** Where an event starts more than one clock —
three statutes, three windows — a single "days since" figure tells the reader nothing about which one is
about to break. Show each clock with its own limit, its own bar and the rule that sets it, and let the
register column say *which* deadline is next rather than how old the event is.

**A size that is not in the scale falls silently to the smallest one.** `G3.fig("xxl")` is not a figure
size, so it renders at `sm` — 13.5px where 34 was meant. Same family as `fill` for `color`, `c.card` for
`c.surface`, and `role="ok"` for a palette role: an unknown key never throws. Check the name against
`tokens.jsx` before using it, every time.

**Two quantities that should be compared need one denominator.** A meter measured against itself is always
full, so two of them side by side say the two figures are equal when one is twenty times the other. Scale
both against the larger.

**A label has to follow the sign.** "Net payable" over a negative number is a wrong sentence, not a minus
figure. When a total can go either way, the heading changes with it — *net payable* or *net recoverable
from them* — and the figure is printed without the minus.

**A prop a component does not accept is dropped without a word.** `<EmptyState title icon>` renders an
empty state with no heading, because the component reads `head` and `art`. Same silence as an unknown token
or an unknown figure size: read the component's parameter list before passing a name that merely sounds
right, and grep the whole tree when one instance turns up — there were six.

**A handler that does nothing is worse than no handler.** `onClick={function () { }}` draws a live-looking
control that fails silently on every press. Either wire it or do not draw it.

**A hint that repeats the placeholder is noise.** Say it once, in the hint, where it stays visible after
the reader starts typing.

**Different subjects that share one workflow share one status vocabulary.** A claim, a loan, an overtime
sheet and a pay rise have nothing in common except the desks they cross — which is exactly what the reader
is asking about. Give them one chain, one strip, one set of words for where a thing has got to, and the
operator learns it once instead of four times.

**A request that left the workflow must not be drawn as progress.** Returned and declined are breaks, not
stages: ring the stop it died at, leave the rest hollow, and say at whose desk. A half-filled bar reads as
"nearly there" to everyone who glances at it.

**A reduction needs a reason before it is allowed, not after.** Where one person can cut a number another
person stated — verified hours below detected hours, a settlement below what was computed — the control
stays disabled until the reason is typed. Asking afterwards means it is never asked.

**A formatter rounds, and rounding is a decision.** `num()` is right for people and days and wrong for
anything measured in halves: six rows of 3.5 printed as 4 made the evidence contradict its own total. Check
what a shared formatter does to your unit before reusing it.

**A record is two columns, not one stack.** What the thing *is* goes left; where it has got to and what you
can do about it go right. One full-width card per fact turns fifteen facts into two screens of scrolling,
and the reader loses the subject before they reach the actions.

**If two components answer the same question, they are one component.** A progress strip and a written
history are the same object seen twice. Merge them into a rail whose stops carry their own dates and
actors, and the duplicate card disappears with the duplicate reading.

**A figure needs a denominator drawn, not stated.** An amount against its cap, hours against the roster, a
rise against the salary it lifts — the bar says "how much of what" before the eye reaches the number.
Shape first, number second.

**Draw the fact that carries the decision.** "A loan is already running for this person" set smaller than
the campus is a decision buried in a fact cell. Whatever the reader is actually weighing gets the chart,
and the rest gets the fact strip.

**Separators need a geometry you control.** A rule on every third cell of an `auto-fit` grid lands wherever
the viewport decides. Group by whitespace instead — proximity is correct at every width.

**Say it once.** When a panel already carries a condition in full, the margin note repeating it is noise;
suppress the duplicate rather than letting the reader check whether the two agree.

**Colour the two decisions in a menu, and nothing else.** The accepting act is green, the refusing one is
red, and both carry the colour on the icon, the label and the row's tint once it is active — a decision is a
state, not text in a colour. Everything else in the menu stays neutral: colour three items and none of them
is emphasised. The tints are the same pairings the status marks use, so the green that means *approved* on
a chip is the green that means *approve* in a menu.

**One filled button per surface, and it is the act you can actually perform.** `Button`'s default kind is
outlined, so a confirm written without a `kind` carries the same weight as the Cancel beside it — two equal
choices where there was meant to be a decision. And when the obvious primary is disabled, promote the act
that is still possible: a disabled button in the primary slot outranks the one the reader can really use.

**A panel that refuses still needs a primary.** Filling it with the accent says *proceed* in the colour
every other proceed uses; filling it in danger says what it is. Outlining it to match Cancel says nothing.

**A lone chip at the far end of a header is an orphan.** A status belongs beside the identity it describes,
not pushed to the opposite margin because the header has a right-hand slot. Proximity beats the grid.

**One act is one stop.** A chain that draws "raised by X" and then "approved by X" on the same date for
the same act has invented an approver. Count the people who actually decide, and start the chain at the
first of them.

**A derived figure must not sit where an entered one would.** Leading a record with an amount nobody typed
reads as an amount somebody set. Lead with what was entered — the percentage, the hours, the claim — and
put the arithmetic beneath it, labelled as arithmetic.

**A missing input is a stated condition, not a default.** A rate that falls back to a constant prices every
person identically and looks like it worked. Return nothing, say which fact is absent and where it comes
from, and disable the act that depended on it.

**Two ages of one object share one home.** A loan request and the loan it becomes belong on the same tab,
the incoming queue above the standing register. A second module for the earlier state means guessing which
one holds the record you want.

**Two bordered boxes cannot pretend to be one.** Stripping a border off the bottom of one and squaring its
corners does not join it to the card beneath — that card still draws its own rounded top, and the seam shows
on both sides. Put the notice inside the card.

**A view that rebuilds its rows cannot be written to.** An adapter that maps another store's records into
fresh objects on every read will swallow any mutation of what it just returned. Route the write to where
the record actually lives; that is also what keeps the other surface in step.

**A process is not a register, and its stages are the page.** Where a screen answers "how far has this got",
the pipeline runs across the top and the rest of the page changes with the stage you are standing in. A
spine drawn as one card among many turns a sequence into a status field.

**Options that do different things to the money get drawn as different things.** Three ways not to pay
somebody are three described choices, not three entries in a dropdown that make them look interchangeable.
Where one of them has legal weight, the screen says so at the moment it is chosen, and its confirm is
filled in danger rather than in the colour every other proceed uses.

**A late input is carried, by name.** Anything arriving after a cut-off is listed with where it goes next —
an arrear, a reverse LOP, next month's run — because the alternative is that somebody discovers it in a
payslip.

**A screen that consumes other modules should read them, not restate them.** Totals retyped from another
surface are a second opinion about the same fact. Read the source and show the line.

**A blocking condition means different things at different stages.** "The compute is blocked" under a run
that is already computed is a sentence that cannot be true. Name what it blocks *now*.

**A wrong link is worse than a dead one.** A dead key throws; a link to a plausible neighbour lands
somewhere that looks reasonable and is not what was asked for. When a module is restructured, check what
each CTA *means*, not merely that it resolves.

**Restructuring a rail orphans whatever the old screens composed.** Components that were only ever reached
through a screen that no longer exists are unreachable, and nothing errors. After moving modules around,
list what composes each part and find the ones nothing does.

**A count of problems is not a route to them.** "1 unresolved" is a dead number unless the row names who and
carries the way to fix it. Read the count from the source so the names come with it, and hand the id across
so the reader lands on the thing, not on the list that contains it.

**A gate belongs on the act, not on the door.** Hiding the way into a screen because one control on it is
not yet permitted makes the whole screen unreachable. Let the screen state its own precondition.

**The act that creates the thing deserves the page, not a corner of it.** Where a screen shows one object
and that object has to be made first, the empty state is a real screen: what making it does, what it fixes
in place, and what can still be undone afterwards.

**A warning that does not stop anything is decoration.** Where the rule is "warn, do not block", the warning
holds the control until it is acknowledged — otherwise it is a sentence nobody reads on the way past.

**Something made of periods needs the periods on screen.** A month-at-a-time object shown one month at a
time hides whether the one before it is finished, which is exactly what the reader needs before starting
the next.

**A number is not deliverable without its provenance.** A register states the period it covers, the source
it derives from, the version that source pinned, and the line that reconciles it. Four facts, on the report
and on the export, or the reader is defending it from memory a year later.

**Provisional is a property of the figure, not a footnote on the page.** Where a source is unapproved,
every figure drawn from it carries that state — in the catalogue, on the opened register, and on what
leaves the building.

**Fifteen things of one kind are a catalogue, not a tab bar.** Tabs make the reader learn a layout per
subject and hide the one they came for. List them with what each answers and let the row open it.

**One renderer for a family of lists.** Where a screen shows many registers, each supplies columns, rows,
totals and its reconciling line, and a single component draws them. Otherwise the tenth one quietly grows
its own layout.

**A landing screen answers one question, not all of them.** Mirroring every module back at the reader
makes a second, worse copy of each and teaches them to scroll past it. Admit one rule — it is here only if
it is waiting on this person, or if not knowing it would cost them the day — and let that rule delete
things.

**A queue is sorted by how long it has waited, not by which module it came from.** The reader's morning is
not organised the way the product is. Collapse the queues into one list, oldest first, each row carrying
its own way in.

**Late is not pending, and must not look like it.** A deadline already breached gets its own treatment and
its own names; folding it into the same amber as "waiting" loses the only distinction that matters.

**Do not greet with something the screen cannot know.** "Good morning" is false at nine in the evening.
Name the place or the person instead.

**A tint on a whole card stops meaning urgent.** Flood a section with danger and it reads as a category,
not an alarm. Carry the colour on a mark, a dot and the figures, and leave the surface alone.

**Danger-filled is for refusing or destroying, never for navigating.** A button that merely takes the
reader somewhere is the ordinary primary, whatever the mood of the panel around it.

**A tile that spans the full width lays its detail across, not down.** One column of text beside an empty
field is worse than the narrow tile it replaced.

**Bento rows are declared, not inferred.** Sizing tiles only by flex-basis lets an extra one slip onto a
row at some widths and not others, so the composition changes with the window. Say which tiles share a
row.

**Draw a chart only where the shape says something the number cannot.** "Every panel gets a chart" turns
several different questions into one chart repeated, and a stacked bar answers *how many of each* badly.
Ask what the panel is for: *what proportion* earns a bar; *how far one thing is past another* earns a bar;
*how many of each* is a figure above a label and nothing else.

**One chart per screen is usually the right number.** Where several panels could carry one, the one that
keeps it should be the panel whose question is genuinely about shape — and the rest get denser figures
instead.

**Take the red from the system, not from the chart palette.** Chart colours are tuned to sit beside each
other in a series; a bar that means danger takes `danger`, the same red the rest of the product refuses
things in.

**A legend is the same colour as the thing it labels, or it is a second list.** The dot on the row and the
segment in the bar must match, so the two read as one object rather than as a chart and a table that happen
to be adjacent.

**When a panel stretches to its neighbour, give it more to say.** Letting the row go ragged fixes the gap
and breaks the grid. Find the thing the panel should have been showing anyway.

**Sections are not always headings.** When the content *is* the page, a heading above it adds a label
nobody needed and a rule the eye has to cross.

**Six tiles in one grid need six shapes, or they are one tile printed six times.** Pick the shape from
what the module *is* — a pipeline for a sequence, groups for two kinds of fact, a roster for a list of
groups, a quadrant for four subjects. Tiles that differ only in their words read as a single block of
wallpaper, and the reader stops scanning them.

**A stepper starts where its panel starts.** Equal centred cells put the first stop a fraction of the way
in and leave the first dot under the middle of nothing. Lay each stop out from its own dot, flush with the
content above, and run the connector dot to dot.

**When a panel stretches past its content, close the gap with a footer, not with a ragged row.** A rule
and the panel's last line turn dead surface into structure. A grid whose cells can simply take the height
(a quadrant, a pair) should stretch instead.

**A sequence in a narrow box runs down it, not across it.** Four stages laid horizontally in a
400-pixel tile wrap every label onto two lines and leave the markers lining up with nothing. The same four
stages down the left rail read in one pass and leave room for a second line per stage.

**Put an exception on the row it belongs to, not in a footer.** A count of what has gone wrong, parked at
the bottom of a panel, says the number and not the where. On the row, it says both and costs nothing.

**A list of counts should say what each one covers and whether it can be used.** Four bare numbers are the
shape of a catalogue without its substance. The state — provisional, final, blocked — is usually the only
question anybody is actually asking, and it is almost always derivable rather than typed.

**A figure needs something to be measured against.** "62 days lost" is not a fact until the screen says
out of how many days and across how many people. If a tile has room, that is what the room is for.

**A landing screen mentions a module once.** If a thing already has a named block and a row in the
queue, a third tile restating it is not coverage, it is repetition the reader has to re-read before
realising it says nothing new. Count the mentions before adding the tile.

**Never spread a group to the ends of a box whose height something else set.** `space-between` inside a
stretched panel pushes related lists apart until they stop reading as one thing. Keep the content together
and give the leftover space a footer.

**A wide tile lays its content across, not down.** A half-empty column beside a field of nothing is worse
than the narrow tile it replaced. If content cannot be laid across the width, the tile should not have the
width.

**If a card opens something, it lifts under the pointer.** An arrow says where it goes; the lift confirms
the pointer is on it. Reuse the hover the product already has for live rows rather than inventing a second
one.

**Two things that rank the same list must share the sort.** A summary that names "the top three" beside a
table of the same rows will disagree with it the moment either changes. Compute the ordering once and let
both read it.

**When a figure cannot honour the filter above it, say whose figure it is.** Silently showing a
school-wide number under a campus switch is worse than not showing it: the reader has no way to tell. One
clause on the tile fixes it.

**The band is the product's way of opening a screen with figures.** A header, the mix across the top as
a stacked bar with a colour-coded legend, then the figures beneath it, each over a rule in the colour of
what it counts. Reuse it rather than inventing a second figures-row; a reader who has learned it on one
screen should not have to learn it again on the next.

**Withdraw an export when its reader goes.** A published figure nothing reads is a second opinion waiting
to happen: the next screen that needs the number finds it there, stale, and uses it.

**A control that cannot be used is shown refused, with the reason, not hidden.** Hiding it teaches
nothing and makes the screen look broken when the state changes. Disabled plus one clause — *the August
payroll is not approved, so this would be a false return* — teaches the rule in the place it applies.

**Some screens earn a stated absence.** A register of computed outputs has no edit control, and saying so
on the screen is what stops one being added later. Write the reason into the footer, not into a comment
nobody reading the UI will see.

**Where a canvas cannot deep-link, route one step short and say so.** Landing somebody on a record that is
not the one they asked for is worse than landing them on the list it is found in. Change the label to
match where the control actually goes.

**A whole row is clickable only when opening it is harmless.** A register whose rows open something to
read should open on the row. A register whose rows start work — generating a government return, releasing
money — should not: put every act in the row's menu and let each name itself, so a stray click costs
nothing.

**An act belongs in a dialog over the thing it acts on, not in a form at the foot of the page.** A reader
who scrolls to reach a control has lost sight of the figure they are deciding about. The dialog restates
what it is about to act on; a confirm with no facts in it is a confirm nobody can check.

**A menu that opens a workspace should hand over the act, not just the object.** Picking *mark it filed*
and landing on a page where you must find that control again is two steps where the reader asked for one.

**A report screen asks what and for how long; it does not keep a shelf.** A catalogue of ready reports
is a catalogue of figures that were true once, and it invites somebody to take the stale one. Build on
request, and state what the artefact will contain before producing it.

**A range is a question about more than dates.** Ask one and the screen must answer what the range crosses:
a change of rules the artefact has to name version by version, or a period that is not final yet. A
report that averages silently across either will not reconcile against the thing it is checked by.

**Constraints on one request belong in one box.** What, over what, and for whom are not three questions
— they are one, filled in a single pass. A card per constraint puts a heading and a rule between the
reader and the next field, and makes the screen taller than the decision inside it. The preview of what
will be produced is that same box's footer.

**List what the system made beside what the person made.** A reader looking for last month's register does
not care whether a clock or a colleague produced it — only whether it is final and what it covers. One
list, with a column that says which.

**A shelf and a request are two tabs, not one screen.** Browsing what already exists and asking for
something to be built are different acts with different controls; merging them makes a filter strip that
has to mean two things. Put them side by side in the module a reader goes to for either, and leave the
existing half alone.

**A figure and the rule under it are one object.** If a figure is drawn in a warning colour, the rule
beneath it wears the same one; red text over an amber rule reads as two facts about the same number. And
a count of work waiting is not an alarm — only a count of something going wrong is.

**When a section appears on a sixth screen, it is a component.** Hand-rolling it again is how a reader
ends up learning the same thing twice, with the spacing slightly different each time.

**A legend with no chart beside it is a chart that went missing.** If a screen carries a colour key, the
thing it keys must be on the screen; otherwise the key is teaching a vocabulary nobody can use there.

**A donut that only restates a bar costs a third of the row.** Both say what proportion; only one leaves
the rest of the row usable. Keep the donut for a single proportion that IS the subject, and use the bar
when the mix introduces something else.

**A state that is neither of the two obvious ones gets its own segment.** "Not read yet" is not present
and not absent; folding it into either makes the screen state something nobody knows.

**An empty handler is worse than a missing control.** A control that neither acts nor refuses tells the
reader the thing happened. If an act is not built, the control is disabled with the reason; if it cannot be
built, it is not drawn. Sweep for `() => {}` AND `function () { }` — they are the same defect, and the
second one hides from the first one's search.

**`onChange={() => {}}` on a visible field is a dead control with a cursor in it.** A value that cannot
change is not a field: give `Input` `readOnly` or `Select` `disabled`, so the box says what it is before
somebody types into it. A one-option select is a value wearing a control's clothes.

**The padding is the touch target; a negative margin gives it back to the layout.** An inline link, a
clickable line, a row-opening name: each can reach 28px without moving a pixel on the screen. There is no
trade-off to make here, so there is no reason for any control to be 19px.

**A number that joins two roles must have one value.** A staff number, a run id, a filing id: if one screen
says NAV-0104 and the other says NAV-0021 for the same person, every reader who compares them is right to
stop trusting both. Read it from the one table that owns it.

**A self-service screen belongs to whoever is signed in, not to the employee.** Every role carries the
YOURS group, because an officer is also a member of staff. Key those screens on `profileFor(role)`; a role
with no rows in the fixture gets the empty state, never somebody else's figures.

**Build both ends of a chain, or neither.** A screen that raises something nobody receives, or receives
something nobody can raise, reads as finished and is not. Three of this product's chains began in the
middle for exactly as long as the screen at one end went unbuilt.

**A merged row must be indistinguishable from a seeded one.** When a store feeds rows into a list that
already has its own, normalise them at the boundary — including minting an i18n key for a name the store
holds as a string. Otherwise every one of the twelve places that renders the row needs a second branch, and
one of them will be forgotten.

**Two questions want two boxes.** A section that answers "how much" and a section that answers "who" are
different jobs, and one border around both gives the reader nowhere to stop. Children inside a band are for
the thing the figures describe — not for a second subject that happens to be adjacent.

**A second section shape must be built from different parts, not the same parts rearranged.** If the new box
has a bar, a metric strip and horizontal rules, it is a band with different content and the reader will read
it as one. Change the vocabulary: counts in a chip instead of figures over rules, a vertical division instead
of horizontal ones, a tint on one half instead of equal treatment of all.

**Asymmetry is how a box says which half is work.** Treating two groups identically is correct only when they
are two readings of one thing. When one of them is a queue and the other is not, the queue gets the tint, the
tone and the verdict — and the other gets left alone.

**A tint goes on the heading strip, not the column, and never carries a stroke.** A whole tinted panel reads
as an alarm; a tinted strip reads as a label. The stroke on top of the tint is what makes it look broken.

**A CSS class cannot override an inline style, so a hover rule in a stylesheet loses to every element that
sets its own background inline.** This product styles inline, so `.thing:hover{background:…}` is dead on
arrival unless it carries `!important`. It fails silently: the element still looks clickable and simply
never answers the pointer. Add it to the silent-failure family alongside the unknown prop and the unknown
token.

**Two halves are two halves.** A section shape built for a pair takes exactly two; the third entry is a
table, and it should be built as one.

**Say the thing, then stop.** A caption earns its place by telling the reader something they cannot work
out from the screen. The sentence after that one — the sentence explaining why the rule is a good rule —
is for the design document, not the product. "This cannot be undone" belongs on the screen; "which is the
fastest way to lose a school's trust" does not.

**A screen does not tell the reader who they are.** They signed in. The rail carries their name. "Signed in
as …" under a page title is a line of chrome that says nothing the reader did not already know.

**One language until there are two.** Carrying a second string table, a switcher, a font conditional and a
second line-height per role for a script the product does not ship costs every page and every future edit.
Add the second script when it ships, not before — and keep `t()` and `ty()` at the call sites either way,
so adding it later touches the provider and nothing else.

**A heading does not need a line under it explaining the heading.** "Campus attendance" followed by "where
the attendance problems are today, by department" says one thing twice. The reader opened the screen on
purpose; they know what they opened. Delete the second line unless it states a fact the screen cannot show.

**The rhetorical page question is scaffolding, not copy.** "What is a person paid, what is it made of, and
from when?" is how the screen was designed, not what the reader needs at the top of it. It belongs in the
design note.

**A screen does not need a scope banner.** The rail says which desk this is and the title says which screen.
"Scoped to this campus only — not the group, not another campus" is a third telling.

**The test for a line of copy is not its length — it is whether removing it costs the reader anything.**
Provenance, masking, append-only, a count, a refusal's reason and an empty state all survive that test at
any length. A restatement of the heading fails it at six words.

**A legend under a bar is banned when the strip below repeats it.** A swatch, a figure and a label, and then
the same label and the same figure two inches down, is one reading printed twice. Keep the key only where it
names something the figures below do not.

**Three jobs in one block need three treatments.** A decision, a quotation and a record of who entered it are
not the same kind of text, and setting them at one size and one indent tells the reader nothing. Give each
its own place: the decision reads first, the quotation sits behind a rule in the muted ink, and the record
closes the line with the state and the action.

**A quotation is not the loudest thing on a screen.** Somebody's sentence set at body size, above the figures
it explains, inverts the hierarchy: the softest fact in the section becomes the largest text in it.

**Rows beat paragraphs when there is an action behind each one.** Four warnings written as prose are four
things to read; four rows of state, subject, date and verb are four things to do.

**A chart and the figures under it must be one list, not two.** Where a component takes its segments and its
metrics separately, nothing stops them drifting, and sooner or later a bar is drawing one thing over a strip
counting another. Derive the bar FROM the figures: same numbers, same colours, same order, by construction.

**A total is never a slice of its own bar.** If one figure is the sum of the others, putting it in the bar
draws everything twice. Find it (`n × 2 === whole`) rather than asking every call site to remember.

**A figure with no count does not belong in a bar.** Money, a word, a date: they can sit in the strip, but a
rupee total is not a share of a headcount and drawing it as one is a lie about proportion.

**A colour key earns its place only where it decodes something unlabelled.** Beside a strip that already
names each figure it is the same reading printed twice; beside bars with no text on them it is the only way
in. Beside a tile with no chart at all it is decoration.

**A local copy of a kit component is a fix that will not land.** Four pages declared their own `Band`, which
shadowed the imported one — so three kept drawing a key the kit had stopped drawing, and none received the
behaviour that replaced it. If a page needs something the kit's component cannot do, change the kit.

**A scale with nothing to measure against is not a chart.** One wide bar over a list that repeats the same
figures is decoration above data. Give each row its own bar instead: the length is the figure, the colour is
the subject, and the row becomes the chart.

**Where the figures are money, a date or a version, there is no bar to draw.** A proportion needs one
population counted more than once. Drawing a mix of something else above those figures is not a chart with
the wrong colours — it is two unrelated readings stacked, and the fix is to remove the bar, not to recolour
it.

**Check a rule by measuring the rendered page, not by reading the code.** "Every bar takes its colour from a
figure below it" is checkable: walk the screens, read each slice's computed colour and each figure's rule,
and compare. That sweep found six sections the source-level change had never reached, because they had their
own copy of the component.

**A typeface pairing is a contract between the tokens, the page and the kit.** The tokens name the family,
the page loads it, the kit reads it — change one and the others go with it in the same commit. Naming a face
the page never loads is a silent failure: the screen renders in a fallback nobody chose.

**Headings and body can be one family.** A scale that gives a head 600 at a negative tracking against a body
at 400 has already made the distinction; a second face for it is a webfont bought for nothing.

**A row's name column is a name, not a summary.** If a register, report or return needs a sentence under its
name in a table, the columns beside it are not carrying their weight — add the column that answers the
question, or trust the name. Fifteen rows each with a sub-line is a paragraph wearing a table's clothes.

**Delete the string, not just the render.** Copy that nothing draws any more is copy that drifts out of date
without anyone noticing, and it reads as live when the next person greps for it.

**A sweep that matches literal keys misses the keys built by concatenation.** `q={t("pyr.view." + view + "Q")}`
is invisible to a search for `"pyr.view.registerQ"`. After a copy sweep, re-check by walking the rendered
screens, not by grepping the source.

**Scope lives in the top strip, once.** A campus switch (or any other scope control) sits beside the theme
toggle, with the crumb naming the scope in words, and the whole screen below answers it. Not in a filter row,
where it hides among four dropdowns, and never twice on one screen: doc control had a scope in its strip and
another inside each of two tabs, so the heading could say Indiranagar over a table showing both.

**Scope the data once, at the top of the screen, not card by card.** Narrow the list every card reads and a
card added later is in scope without being told the control exists. A card that filters for itself is a card
somebody will forget.

**A control that does not change the numbers is decoration.** If a switch cannot narrow a screen honestly,
say why rather than wiring it to nothing — a payroll run is one run, a statutory return is filed for the
establishment. Both keep the switch for the PEOPLE lists on them and leave the establishment figures alone.

**One identifier, one answer.** This product had three spellings of "Indiranagar" and two filters written
against the wrong one silently matched nothing. Where two stores disagree, pick the identifier every module
already carries — here the staff number — and put the lookup in one place.

**A row with no scope is in every scope.** A rule that names no campus applies to the trust, so treating a
missing value as "nowhere" makes every existing record vanish the moment a scope is chosen.

**A scope control goes in the strip only when it is the only thing scoping the screen.** When the screen
already narrows by entity, period, kind or type, the campus is one more axis of the same question and
belongs in that row with them — a reader looking for Whitefield looks where the other narrowing lives, not
in the page furniture above the heading. On a screen that WRITES something rather than showing it, scope is
not a scope at all: it is a field of the thing being written, and it has to come out the other end — in the
preview, in the record, in the artefact's own description.

**A scope that is actually a different object is navigation, not a filter.** Two campuses' payroll runs have
different identifiers, different cut-offs and different stages; narrowing one screen to a campus printed one
run's totals under another run's name. Where the "filtered" view is a different object, make it a place you
go, name it, and say what state the one you left is in.

**Two modules may not share a string prefix.** `addStrings` merges into one dictionary, so the file that
loads last wins: pay rules and the payroll run both wrote `pyr.title`, and a module with no month rendered
`{mon} 2026 payroll`, placeholder and all. One prefix, one module, checked by intersecting the key sets.

**Give a control something true to narrow, or do not draw it.** Three filters added this pass each needed a
fact first — which campus a return covers, which campus a payslip behind a liability is at, which campus a
one-person approval belongs to. A control among controls that does nothing reads as broken, not as absent.

**A process screen shows the step you are standing in and nothing else.** Four steps, one resting state
each, one primary action each — so the reader never decides what to do next, because the screen has already
decided and the button says it. What the other steps hold is a word in the stepper, not a card on the page.
The old version of this screen put every stage's content on at once and needed a paragraph under each to say
which one mattered.

**A row of repeated things is a table, not a stack of cards.** Cards stack their contents, so rows with
different-length contents become different heights, and a reader scanning down them has nothing to scan
along. The moment two of anything are listed with the same fields, the fields are columns.

**Say a thing's state once per row.** A status mark beside a rail whose current stop is labelled prints the
same word twice. Pick the one that carries more — the rail says where in the sequence as well as what — and
delete the other.

**Lay a stepper out on equal columns, with the rule drawn between circle centres.** Flexing the connector to
fill what the label leaves over makes the gap after a short label half the gap after a long one, and the
unevenness reads as a bug in the data.

**Nothing on a list screen may be a given.** If two of something are always there, no screen explains what
they are or how a third would appear. Make the thing CREATED, show the act that creates it, and let the list
be of what has been made.

**A split figure is rounded to the unit people quote.** Pro-rata splitting a round total produces paise;
round each share and give the remainder to one of them, so the parts still add to the whole exactly and no
figure carries a fraction anybody would have to explain.

**An object screen states the object's facts, on every view of it.** How many people, how many groups, which
version, who made it and when — a label-over-value bar, no prose. "How many is this?" does not stop being a
question after the figures arrive, and a screen that answers it only at one step has no scale at the step
where the reader is deciding whether to proceed.

**An act on a fact belongs under the fact, not in a card of its own.** A panel whose title is a date already
in the facts bar, and whose only other content is a sentence saying there is nothing to show, is a surface
that exists to hold a button. Put the button under the date and delete the surface.

**Blockers and warnings are different things and must look different.** A blocker makes the result wrong and
disables the act; a warning makes it incomplete and says what it will cost. Collapsing both into a count
tells the reader neither which they are facing nor where to go. List only what is not ready — a checklist of
ticks is a wall a reader learns to skip — and give each row the act that clears it.

**Write the singular.** A count that can be one needs "One person has no salary assignment", not "1 people".
An error message is the last place to look careless.

**A step is a stage of the thing; a condition is not.** Form 24Q's file-validation utility was a fifth stop
on a spine every other return walked in four, so the stepper changed shape depending on which return you
opened. If it gates an act rather than being one, it belongs inside the step whose act it gates, and the
sequence stays the same for every instance of the object.

**A decision leaves the list of things to do.** An excluded exception, a waived check, a dismissed warning —
once somebody has decided it, it is a fact in the trail, not a row still demanding attention. Leaving it in
the list greyed out keeps the count wrong and the panel long.

**Two different questions need two columns.** "23 days late" is about the due date; "Validate" is about how
far the work has got. A register that answers only one of them leaves the reader unable to tell a thing
nobody has started from a thing waiting on its last step.

**Red is for something being wrong, and for nothing else.** A count of what is overdue, locked, rejected,
expired, past its service level or missing may be red. A population, a category, an amount of money, a
duration, a person leaving — none of those is red, however important. `chartAmber` is waiting and a clock
running; `chartGreen` is done; blue, teal, purple and sand are plain categories. The test is whether a
reader should feel something has gone wrong; if not, the colour is lying.

**The accent is the colour of an ACTION, never of a QUANTITY.** `accent` and `chartClay` are the same
terracotta, and terracotta beside crimson reads as a second alarm — so a band that paints a plain population
in one and a failure in the other shows two reds, the bigger of which means nothing. Buttons, links, the
pressed segment of a switch: yes. Bars, meters, donut slices, metric underlines: never.
`design/v3/check-chart-accent.py` enforces it.

**A strip of figures gets ONE chart, and it is a bar under all of them.** The mark beside a figure has now
been four things, and three of them tried to say something about that figure alone: a rule under the number
(a bar drawn at full width whatever the number said), an arc (a share — and half the figures on this product
are not a share of anything, so the ring closed and a strip read "full here, half there"), a sparkline (a
history). Three times out of six there was nothing true to say about one figure on its own.

So the mark beside a figure is a **swatch** — the colour it is, which is always true — and the shape of the
set is **one seamless bar across the full width beneath them**, each band in the colour of the figure above
it. The swatch is the key, so there is no legend: a legend would print every count a second time, which is
what made the old one clutter.

**The bar is seamless and full-width on purpose.** It is one statement about one population; a row of gapped
segments reads as several charts.

**A figure that takes no band is drawn hollow.** A sum of the others (`total: true`) and a value that cannot
be added to its neighbours (`bar: false` — a duration, an average, a percentage) stay out of the bar, because
drawing either would count the same thing twice or add days to people. An outlined swatch says so, so nobody
hunts the bar for a colour that was never going to be there.

**A bar may only lay ONE KIND of thing end to end.** Five lakh rupees beside five settlements is not a
composition, it is a rounding error with a colour — and it filled nine bars across the product with a single
band before anyone looked. `MetricStrip` reads the kind off the value (money if it is formatted as money, a
unit if the value carries one, a plain count otherwise), groups the candidates and draws the largest group.
Mixed strips get a bar of their counts; all-money strips get a bar of their money.

**`bar: false` is for what no rule can see.** A version number is a number: `2026.3` beside nine open returns
drew a bar that was 99% configuration. Four pay groups covering four hundred staff are two populations
wearing the same shape. An average of the figures beside it is not a fourth part of them.

**Where a bar would lie, there is no bar.** A before/step/after (what it is, what it goes up by, what it
becomes) and a multiplication (hours × rate × multiple = value) are arithmetic, not composition: laid end to
end they would count the same salary three times. Those strips are the same cell without a bar, and that is
the point of one component deciding — a strip stops being six opinions about its own chart.

**A figure is not explained by a chip under it.** "These are the ones holding people up" under a red count of
overdue tasks is the label, the note and the colour told a fourth time, louder.

**A card whose rows open with an avatar takes no heading icon.** Both are round tinted tiles of about the
same size, stacked down the same edge; the heading's names nobody, so it reads as one more person. A card
whose rows open with a square date tile keeps its icon — round is a person, square is a day.

**A module about people opens on the people.** A payroll run that opens on four totals, with the staff four
clicks away behind a register of samples, has answered a question nobody asked. The table is the spine; the
totals are its foot.

**Every exception carries an owner, so the reader never works out whose job it is.** On the run, HR owns what
happened to a PERSON — days, leave, bank details, the salary — and payroll owns what stands against the MONEY
— a claim, an arrear, a loan instalment. The row therefore offers exactly one action: *Ask HR to fix* or
*Fix it here*.

**A figure that means nothing cannot sit beside a warning that contradicts it.** "No salary set" next to a net
of 85,500 is the one thing it cannot mean. Somebody who has not been priced is paid nothing, and their share
goes to the rest of the roll.

**Presence, never the reason for an absence.** My team shows who is in, who was late, who is on leave
and who has not been marked — and never the KIND of leave. Medical leave is health data, a colleague has
no business reading it, and *On leave* is the whole of what anybody is told. The head of department reads
the reason on the screens where she is the approver and has a cause to. **A roster shows a state, not a
reason.**

**A day wears the leave balance's clothes.** The shape is settled, and it is the one the leave module
already had: each figure takes a column divided by a hairline — its name over it, the count and what it is
out of, **its own bar**, and one line underneath. One meter a column, never one stacked bar across them:
these columns are not parts of each other, they are four readings of the same roll. The hairline sits
BETWEEN columns and never down the edge — every block carries its rule on the left and the strip is pulled
a pixel left inside a clipping box, so the first block of every row, not just the first row, has its rule
trimmed.

**Do not model a conversation the product is not in.** HR and a head of department settle a probation in a corridor, a staffroom and a phone call. A screen that offers to *ask the head for a recommendation* and then *record what they said* is building a correspondence that never passes through here — so it went, and what is left is what HR actually does: read what the person is on and when it ends, then confirm, extend, renew or end it. **The same test as the police certificate: hold the artefact, not an imaginary workflow.**

**Piles sorted by a value that is already a column are a table.** The joining checklist was a progress card, a safeguarding card and three grouped lists — four containers for one object: a task, whose job it is, when it is due, whether it is done. One table says all of it, sorted so the overdue and the undone are at the top, and the reader counts nothing.

**One module, one subject.** Offers was a rail item of its own, which made an offer a place rather than the last thing that happens to a candidate. It is Hiring's third tab now, next to the posts and the people, and *Record an offer* on a candidate moves the reader one tab along rather than across the rail.

**A spec code is for the people who wrote the spec.** HR-26, HR-27, HR-28 sat beside the tab names of a screen a school's HR officer reads every morning. A tab says what is behind it.

**A pile is not a row.** Days to fix listed a device outage as one row reading *grouped · 11*, and a roster of shiftless staff as another reading *grouped · 2* — two rows the reader had to open to find out whose day was wrong. A day is put right for a PERSON, so the person is the row: the incident survives as the reason inside the row, and the eleven people it happened to are eleven lines with eleven names.

**The past belongs on the screen that changes it.** Every queue in the product had a present tense and no other: today's roll, this month's regularisations, the open overtime, the shifts as they stand. HR is asked about last Tuesday as often as about this morning. So the day is a DATE, not a heading; every queue carries a window (*this month · the last three months · everything on record*); a person opened from the roll shows the fortnight behind the day they were opened on; and shifts — which have no dates of their own — carry a dated record of what moved and when.

**Figures count what the table counts.** The pay-requests band ranged over every kind of request and every campus, above a register showing one kind on one campus, so *6 waiting on you* sat over two rows and nothing on the screen accounted for the other four. A band reads the same slice its register does. A whole-desk number belongs on the rail, where it is a whole-desk claim.

**A figure of nothing needs its reason.** Four zeros on a Sunday are not an empty screen, they are a weekly off — so the band says which, in the one line under the figures, and the reader stops looking for the fault.

**Room is hierarchy.** One leave request in a side screen was five blocks fourteen pixels apart, each with its own internal rhythm, which reads as one dense slab however good the parts are. The dates lead at figure size, the reason is a block of its own, the facts are a list with air between them, and the signatures carry a label. Nothing was removed; it was given room.

**A scheduling tool is not a shift screen.** Shifts and rosters drew a duty grid of E / L / O letters, a cycle length and a panel for rebuilding the pattern — a rota planner wearing an HR screen's clothes. What HR reads and changes is a timing, a grace, a weekly off and the people on it. The pattern went with its panel.

**An advance is the one thing in a run that moves the other way.** Every other line on a payroll run is money coming back — an instalment off a salary — and an advance is money going OUT before the salary it belongs to. The product had both under one word, one table and one total, so the step could not answer “how much did we hand out this month” at all. The run's loans step now opens on *recovered this run* against *paid out this run*, the two sharing a bar because reading one against the other IS the question; an advance paid out names the month that starts taking it back; HR's record calls it an advance and says it is paid before the salary it comes out of; PY-13 counts loans and advances apart; and the payslip line that recovers one says *Advance recovery*, not *Loan recovery*.

**A form that hides a field believes something the rest of the product does not.** Asking for an advance hid the months field and divided the amount by one, which says an advance always comes out of one salary — while the register beside it showed advances running over three and four months and payroll sanctioned them that way. Both kinds now answer the same two questions, each with the range it actually uses: a loan over 6–36 months, an advance over 1–6.

**The scope of the figures is not part of the figures.** The contributions band drew *Period* and *Entity* in its own corner, so the two controls that decide WHICH figures these are sat inside them, and the third control that narrowed the table below lived in a third place. Scope is a question, and questions go in the row of questions.

**A landing screen may not hold an opinion a module owns.** The payroll home drew ONE trust-wide August run, hard-coded to the stage *approval*, and told the officer “nothing changes while the accountant holds it”. The run module says a run is PER CAMPUS: Indiranagar was still being checked on that officer’s own desk while Whitefield had gone to the accountant. The landing screen was telling somebody there was nothing to do while ₹1.55 crore of their own work sat waiting. It reads the run store now and shows the rows PY-07 shows, in PY-07’s words. (Its four invented step labels had been printing as raw keys — `pyr.s.*` exists nowhere in the product — which is how long it had been since anybody could read that strip.)

**No box is a button.** A tile that lights up on hover tells the reader every pixel of it is a target, and then takes them somewhere only one word of it named — and a whole-card hover is a hit area nobody can aim at, because there is nothing to aim at. Designer ruling: *no full-box hover state; text next to an arrow icon to view more.* Every way off a landing screen is a LINK — text, underlined, with an arrow beside it — and the box around it is just a box.

**A bar may only compare one kind of thing — and PARTS OF ONE WHOLE are the only honest bar.** The waiting list drew six independent bars whose lengths were counts, so one reimbursement was measured against three appraisal rises: two magnitudes on one scale that were never the same quantity. The six ARE one population — things waiting on this officer — so there is one bar now and they are its segments, each row carrying its segment's colour. The same test retired the run's figure band: net and deductions make the gross and share a bar, while employer cost sits ON TOP of the gross and held-back pay is a different population again, so neither is drawn as a slice of it.

**A queue with no date may not claim one.** Nothing in the product records when a person stopped having a salary, so *People with no salary assigned · came in today* was a date the screen made up to fill a column. The column says *blocks the run* instead — which is both true and the reason the row is red.

**A button with no flow behind it is a drawing of a button.** *Change the rule* sat on the pay-group page as a SECONDARY button wired to nothing — the one act the module owns, drawn as an afterthought. It is the page's only primary now, and behind it is the flow the act actually needs. A pay rule prices 268 people, so typing a new percentage and pressing Save would be the whole of it on screen and none of it in the officer's head. Four steps make them read, in order, the three things a form hides: **what changes** (the parts priced at one real person's basic, so the edit reads as money and not as algebra, with the delta beside each), **from when** (the one answer that decides whether anybody is owed back pay — and the one date that is refused, because a run somebody is working cannot have the rule move under it), and **what it does** (the salary does NOT move, because the balance part absorbs it; what moves is the wage base, and with it everything PF is worked out on). Then a checker, because payroll's maker cannot approve payroll's maker.

**A refusal names the amount and the parts, or it is not a refusal.** A rule change that pushes the excluded allowances past the share the Code allows does not fail quietly at save: the step that shows the impact says *excluded allowances come to 57% of the salary; the Code allows 50%, so this is ₹6,320.00 too much — in House rent allowance, Academic and books allowance, Special allowance.* The limit is read from the pinned StatutoryConfig, never written into the sentence.

**Never disable the button that owes an explanation.** A greyed-out *Next* swallows the click that would have said why, which this codebase has now learned three times. Every step's forward button stays live and answers: *nothing has changed yet*, *the parts come to ₹X more than the salary*, *say why — a rule change with no reason cannot be reviewed*.

**A landing screen is not titled after the person reading it.** “Sunita's desk” told Sunita something she knew, under a subtitle explaining the page to the one person who never needed it explained. A greeting at least carries the time of day, and the sections underneath say what they are.

**A heading goes over several panels only when they are one subject; otherwise a panel names itself.** Five unrelated registers — adjustments, the roll, exits, pay rules, registers — were bundled under *the rest of the desk*, which is not a category but an admission that the board had run out of places to put them, and it cost all five of them their identity: one row of equal boxes, each with the same two little stat tiles, none of them answering its own question. The umbrella is gone. The only heading left on the board sits over the three campus panels, because those ARE three parts of one run, and it spans the grid rather than starting a grid of its own.

**One shape repeated is a vocabulary; one shape imposed is a uniform.** The sibling of the law above, and the correction to it: a board should repeat a small vocabulary, but each panel takes from it the shape ITS subject wants. Recoveries and the roll are populations, so each is a split bar with its segments named beneath it; a settlement is a sequence, so exits are a split in the order one travels; pay rules are three named things, so they are three rows and no bar at all; registers are a readiness, so they are a gauge. Same three shapes, five different questions — distinct without being foreign, which is what makes a board readable rather than a wall.

**A dashboard is a few shapes repeated, not a shape per panel.** The payroll home shipped six bespoke layouts in one row — a roster, a grouped list, a pair, a chip wall, a catalogue, a bar chart — which is not a dashboard but six of them, and the reader has to learn the grammar again at every box. **The answer to “too complex” is fewer shapes, not fewer figures**: stripping the board back to three stacked tables was read straight back as *“I need a dashboard with sections and data, not like this”*, and the designer was right — density is a function of role, and a payroll officer's home is a board. It now repeats exactly three: a FIGURE (what it is), a GAUGE (how far through it is — one bar, one whole), and a SPLIT (what it is made of — one bar, many parts). Five module panels, one shape between them.

**Money is never truncated to make a layout work, so the layout gives way.** Four crore-sized rupee figures at the figure band's 34px collide the moment the window is narrower than a desk monitor, and the fix is never ₹2.54Cr. The money row is drawn at 22px from the board's own parts instead — same swatches, same hollow swatch for a figure the bar leaves out, same seamless bar — and wraps instead of overlapping. A component that cannot hold the product's real numbers is the thing that gives.

**A superlative is not a fact.** “Longest Ananya Rao, 5 days” spends its first word telling the reader which end of a sort they are looking at, which the figure’s label already said. Where the word carried meaning it became *oldest* — a fact about a date; where it carried none it went.

**A queue needs a door for the days it cannot finish.** Days to fix offered one button — *Correct this record* — so a day waiting on a device engineer and a day nobody had looked at yet were the same row, forever, and the only way to stop one shouting was to put it right or leave it rotting. Two more acts, both of which the filter already listed as states nothing could reach: **put it on hold** (with a date it comes back and what it is waiting for) and **lock it as it stands** (the run takes the day as the reader has it, with a reason and a name on it, and the person who closed that door can open it again).

**A pill switch carrying counts is a band in disguise.** The helpdesk and the appraisals tab each put their totals inside a segmented control: numbers at 11px, two of the three greyed out because they were not selected, and nothing anywhere saying how long the oldest one had waited. The counts are figures with a bar under them, and the switch becomes what it always was — one more question in the filter row.

**A component declared inside a render is a new component every time.** Two detail panes built their own shell with `const Shell = bare ? function () {…} : function () {…}` inside the render. React compares component IDENTITY, so a fresh function each render means the entire subtree unmounts and remounts on every state change — which is why the reason box on *Correct this record* had never, in any round, been able to hold more than one character. A shell is one stable component, told what to draw.

**A tone is a colour, never a role.** Three bands in staff attendance were handed `tone: "late"` and `tone: "off"` — the names StatusMark answers to — where a band metric wants a chart colour. CSS cannot resolve a word like that, so the swatch and every segment of the bar beneath it painted nothing, and a designer read the result as "no coloured bars". A quantity's colour comes from the chart palette and from nowhere else.

**A figure counts one kind of thing.** "Hours claimed" stood between two counts of claims, so the bar under the row had to choose a unit and drew whichever group was bigger — a shape answering a question nobody asked. Days to fix led with "13½", a sum of loss-of-pay fractions printed where a count belongs, over a table of whole rows. A band is one population cut into parts that add up to it; the second unit lives in the line underneath, where it can be read without being compared.

**The line under a figure says what the figure cannot.** "Nothing from the reader yet" explains the label the reader has just read; "Meera Joshi" tells them whose day is wrong. So a line carries a name, a date, a total in rupees or hours, the run something is locked inside — and where there is nothing to carry it says so plainly ("nobody past the grace"), because a figure of zero still owes its reader a sentence.

**An act that belongs to one list goes in that list’s header.** A band may hold the act of the whole SCREEN — an export, a re-run — but shifts and rosters put *Create a shift* in the band’s corner and a shiftless-staff notice in a block beneath its figures, so four numbers sat in the middle of a card twice their height and the table began below the fold. The button moved to the register’s header, where the shifts are; the notice moved to the line above that register, where the fault is.

**A band of figures carries no heading, anywhere in the product.** Each figure has a label and a line of its own; a title over the row of them, an icon beside the title and a sentence under it were the band saying three times what the figures already say. The head survives as the section’s accessible name and the action keeps its corner — everything else goes, on every screen that draws figures. With the heading gone the strip is re-seated so the air above the labels matches the air under the bar.

**A side screen’s foot sits on the right.** That is where every dialog in the product puts the hand that is about to press something; a row of controls hanging off the left of a 660px sheet reads as unfinished. The stage select and its date go with them.

**An attachment looks like an attachment.** A filename in grey type is a fact ABOUT a file. A chip with the file’s own mark on it and a download beside it IS the file — which is what a reader is reaching for when the whole point of the record is the evidence.

**A way in is a way back.** Opening a candidate from inside an opening names its own return: *Back to PGT Physics, grades 11–12*. A sheet that replaced another sheet and left no way to the first is a dead end wearing a close button.

**An action sits with the thing it acts on.** *Move to another opening* as a button at the foot never said which opening they are in; on the row that names the opening, *Move* needs no sentence at all.

**Three dots over a sheet is a menu drawn behind it.** An overflow menu earns its place when a surface has more actions than it has room for. A side screen has a footer; five buttons fit in it, wrap when they must, and can be counted without being opened — so hiring’s openings, its candidates and the offers all carry their actions in the sheet. **If the actions fit, they are not overflow.**

**One question, one control.** Where somebody stands is a single answer, so it is a select and a date, not four buttons competing to be pressed — and the two ends of the ladder (*Not selected*, *Withdrew*) are answers to that same question, so they live in the same list rather than as rival CTAs. A destructive action that must stay a button is outlined in danger, never filled beside a filled primary: two shouts are one too many.

**An action appears when it is possible.** *Record an offer* shows once there has been an interview, and says so quietly before then. A control that is always visible and usually wrong teaches a reader to ignore it.

**A history is a list of facts.** What happened, when, and whose hand it was. The sentences somebody typed at the time belong to the record that holds them, not to a trail that is read at a glance — so the trails on hiring and offers carry the status, the date and the name, and nothing else.

**Do not build a request for something that happens on paper.** Police verification is carried out at a
station, and the certificate comes back in an envelope. A product that offers to "raise a verification
request" against an employee is modelling a conversation that never happens in it — so there is no request
to raise, only a certificate to add, with its dates and the authority that issued it. The same test
applies anywhere the work is done off the system: hold the artefact, not an imaginary workflow.

**An offer is sent from somebody's mailbox, and recorded here.** Naveya never sends it and never reads the
reply. What it keeps is the letter that went, the address it went to, the date, and the screenshot of what
came back — so the dialog asks for the PDF first and is called *Record the offer you sent*, not *Send*.
Where a product cannot do the thing, it should say so by the shape of its form.

**A row opens where the rest of the product opens things.** An actions column whose only item was "open"
is a menu standing in for a click; a page of its own behind it is a place the reader has to find their way
back from. Openings, candidates and offers each open in the side screen now, over the register they were
clicked in — and the sheet holds only what the row could not: who is in the running, what is on file, what
has happened, and the decision at the foot.

**A list is not a file, and seniority does not change that.** A principal and a director can see who
works for them — the name, what they do, which department, which campus, how they are employed and whether
they are still on the roll. They cannot see salary, bank, PAN, UAN, Aadhaar, phone, e-mail, date of birth
or a single document, and no row opens onto them. The staff FILE belongs to HR, who keeps it and answers
for it; being senior to somebody is not a reason to hold their identifiers. **Scope grows with the role;
depth does not.**

**One register, read at three depths.** HR's staff register is exported rather than copied, so the
principal's list, the director's list and HR's own screen cannot disagree about a name, a designation or a
resignation. Each sees fewer columns than the one before it, and nobody keeps a second roll.

**A chip that repeats the card is not a status, it is noise.** "With you" is exactly what the Approve button beneath it means, so it is drawn only when the request is on somebody ELSE’s desk, where it is news. "Long leave" is the rung the panel is already on — the director reads nothing but long leave — and the day count three lines down is the fact behind it. The verdict box under a settled request names the hand that settled it, so the signature list stops one short of it.

**The person is the heading.** A decision panel headed *Request LR-0331* leads with the one fact nobody
decides anything by. The name takes the title, the designation the subtitle, and the reference goes quietly
to the corner where an auditor can still find it.

**A panel that size holds no headings.** *Where it stands* over six lines and *Your decision* over two
turned a 400px column into a form with sections. The state chip, the signatures and the buttons say what
they are. What is left is the order a decision is actually made in: what is asked, why, what it costs, who
has already signed, decide.

**Carry the signature, not the chain.** The trail said who applied (the byline says that), whose desk it is
on (the chip says that) and who comes next (the line under the buttons says that). The one fact it alone
held was the name already signed — so that is all it is now: *Anjali Deshpande approved · 10 August*. **If
every line of a block is printed somewhere else on the same screen, the block is the thing to cut.**

**A line that outruns its figure is worse than no line.** *Settled 7* over "4 approved, 2 not approved"
is six, and a reader who adds them up has caught the screen lying. Every outcome the figure counts is
named, or none is: *4 approved, 2 not approved, 1 withdrawn*. The same rule caught *Absent 1* naming two
people on the register.

**The line under a figure is informational, never explanatory.** "In before the grace period closed"
explains what the figure means, which its own name already said; *Karan Mehta* tells the reader something
the figure cannot. A figure says how many, the line says WHO — two names, then a count of the rest,
because a column is not a list. Where naming people says nothing (nobody is "on time" in a way worth
listing), the line carries the other fact about the same figure: *3 marked remotely*, *5 on time, 1 late*.
And the line names only the people its own figure counts — an *Absent 1* over two names is a worse error
than no line at all.

**Three instruments, and a day is the third one.** A `MetricStrip` deals each figure a column, an
uppercase label, a rule and a line of explanation — right for four readings a reader must weigh against
each other, and five sparse columns of single digits when it is not. A single line of big figures is the
other extreme: dense, but a row of numbers with no structure and nothing to read down. `FigureBoard` is
the third: the states that cannot overlap drawn ONCE as a ring with the one ratio that matters in the
middle of it, and the figures as ledger rows — dot, word, count, each on its own rule — wrapping into as
many columns as the card is wide. My team's morning, the head of department's morning and her
department's day are all boards, because all three were asking the same question about the same roll.

**A figure does not explain where it came from.** "Counted from the same day-by-day record Dept attendance
draws, so the two can never disagree" is a promise the product keeps by construction; printing it under the
figures only tells a reader that somebody was worried. The provenance line is gone from the head of
department's home and from her register. The rule that survives is the one that changes what she does: *a
correction belongs on the person's row, not here*.

**Two questions, two sentences.** The head of department's home band put one figure about this morning
beside four about the month, drew a bar across the four and then needed a foot to explain which was which.
The morning is now its own line of figures over its own bar; the month follows in words under a rule.

**Names left, dates right, and the space between them is the column the eye travels.** The team
calendar pins its discs to the card's right edge and leaves the names on the left, so the last date lands
on the same line as the card's own edge and the row reads as one measured sweep rather than a block of
colour hung off a label. The month in words sits under the name it belongs to.

**A roster is read sideways, so give the dates room and stop them at today.** The team calendar showed
thirty-one columns, twenty of which nobody had lived through yet — they took the room the days that
happened needed. It now runs 1 to today, the discs are wider, the names stand well clear of the grid, and
the month in words sits at the right-hand edge where the unlived dates used to be. **The reader is not on
it:** her own month is her own screen, with the actions on it; this one is for the people around her.

**One person, one row, the whole month across it.** A month per person belongs in a row, not in a grid
and not in a card: thirty-one discs along the page, the weekday in two letters over each column, the date
inside the disc and the state as a tint behind it, today ringed and its column dotted, and a day the month
has not reached dimmed. The rows share a fixed name column, so every row's 14th sits under every other
row's — which is the whole reason the shape of a department's month is legible at a glance. Under about
1100px the strip scrolls inside its own card; a month does not fold, and the page never scrolls sideways.

**A key, and only to what is drawn.** The legend under the calendar names the states the drawn rows are
actually in — nobody is absent this month, so *Not in* is not keyed. A legend that names a state nobody is
in is a riddle with no answer in the room. Its dots are the solid colours the figures at the top of the
screen use, so one colour means one thing on the whole screen.

**A fact is labelled, or it is a guess.** The roster card states what it holds: *Department : Science*,
*Campus : Indiranagar campus*, *Joined : July 2014*. A quiet label, a colon, the fact — a reader knows what
they are looking at before they read it, and two cards' facts line up down the page. What the card does
NOT hold is the half of the reference it was drawn from: no e-mail, no phone, no date of birth, no staff
number. **A colleague directory is not consent to circulate contact details.**

**A mark is not part of a name.** *You* sits in the corner with the day, not beside the name. A chip
beside a name is a chip inside the one line that must never fold, and the one card that folded it was the
reader's own — so the reader's card was always the odd one out. In the corner the column is shorter than
the facts beside it, and nothing it holds can make one card taller than its neighbours. Every card in the
grid is 152px, at every width, in both themes.

**The reading first, the roster second.** The month is what the screen is FOR; the people are who it is
about, and they are the longer of the two. Figures, filter, calendar, then the cards — and the roster's
own heading counts only when the filter has cut it down, because the page heading already counted the
department.

**One line of identity, and it never wraps.** A roster card carries the name and the designation and
nothing else: the campus made the second line long enough to fold on the longer names, and one card an
inch taller than the two beside it is the whole of what "not proper" means. Two lines, a 52px face, 16px
of padding, 86px tall, the same on every card in the grid.

**One card, one question.** A roster card answers "who is this, and are they in" — and the day is the
half of that a reader came for, so it sits BESIDE the name on the right, not under it: a card is read
across before it is read down. Everything that is not that question left: the week moved out to a section
of its own, and the department went with it, because the page heading and the designation each already say
it and a third printing is not a third fact. The card is then wide enough to hold a name and a state on
one line, which is worth a column — three to a row at 1440 rather than four.

**Three deep, and the rest a click away.** Ten people's weeks, open, on a screen whose question is who is
in today, is a register nobody asked for; three rows is enough to see the shape of a week and to know what
the rest look like. The expander says how many it is holding back, and the whole list is one click rather
than another page. The weekday letters head the column once, on the first row: ten repetitions of
"S M T W T F S" is a texture, not a label.

**A roster is glanced at; a month is studied.** A card showing somebody's whole month — first as
thirty-one bars, then as a seven-column calendar — was both times the wrong size of answer: ten of them on
one page makes every card a dense little document on a screen nobody opens anything from. The card carries
the WEEK the reader is standing in: seven cells, the weekday above, the date inside, the state as a tint
behind it, today ringed. The month follows in words on one line — "August so far · 5 present · 1 late · 1
leave" — because a grid of colour is not a statement and a count of nought is not news. The whole month,
day by day, belongs to the register that is opened to study it. **Match the instrument to the glance.**

**A figure that is a subset does not get a band.** The strip's bar is drawn from the four states that
cannot overlap. *Marked remotely* counts people the bar has already counted once, so it is a figure with
no band of its own — a stacked bar whose segments overlap is a picture of something that does not exist.

**A band is for figures a reader must weigh; a morning is one sentence.** The metric band gives every figure
a column, an uppercase label, a rule and a line of explanation underneath — right when four readings have to
be held against each other, and wrong for five mostly-single digits that say one thing about one morning.
Five sparse columns of white space is what "it looks empty" means. So the count and its word sit on one
baseline, with a dot in the colour the calendars below use, and the four states that cannot overlap are
drawn once as a bar. A figure at nought is faded rather than dropped, because "nobody is late" is an answer
and a missing column is not.

**A state should be readable without being read.** On the clock is green — the word, the time and the
counter under the rule all take the present colour while she is in, and go back to ink once she has
clocked out, because clocked out is a record and not a state. The counter lost its caption: a number
falling under a clock-in time is hours left, and the sentence beside it was spelling that out.

**A directory that leads somewhere is a different screen.** My team is a grid of whole answers — face,
name, what they do, department, campus, the year they joined — and nothing opens. No panel, no row menu,
no route to a record, no chevron, because an affordance that leads nowhere is worse than none. The staff
register, with PII and edit rights, is HR's screen and stays HR's screen. **Build the summary as a
summary, or it becomes a worse version of the thing behind it.**

**What a roster must not publish.** No phone, no email, no date of birth, no staff number — a colleague
directory is not consent to circulate contact details. And no leave, no absence, no who-is-out: a shared
out-list leaks absence and, worse, leave TYPE, and medical leave is health data. The head of department
reads absence on the screens where she is the approver and has a reason to.

**A card beside a page title has come loose.** The clock card was hung to the right of the greeting,
which put it at the height of an `h1` with nothing under it, left a column of bare page beneath the
greeting, and made it the only card on Home with no icon chip and no title — three ways of saying the
same thing, which is that it was not in the field. It is a card among cards now, first in the right-hand
column. **A card's place in the grid is part of what it says; one outside the grid says it is an
accident.**

**A column is an idea, not a leftover.** Home's three now read: her record (the month, then her
colleagues' dates), what is coming (leave, holidays, last month's payslip), and what is live right now
(her clock, HR's requests, her colleagues' cover requests). The payslip moved because it is last month's
and waits for nobody — and because it evened the three columns to within 190px of each other.

**Columns that cannot wrap do not get narrower, they get worse.** At `flex: 1 1 0` with no wrap, a
1024px window gave three ribbons: a card title broke under its own status chip and "Bank account proof ·
Due 25 August" came out a word per line. Each column has a floor now (360 / 340 / 340) — the width the cards in it actually need — the row
wraps below 1252px, and the live column carries the product's one breakpoint so that a wrapped field
puts it first instead of last. A status mark inside a card does the same thing one level down: it sits
beside the document when there is room for both and drops under it when there is not. **Below the width a layout was drawn for, it must rearrange, not compress.**

**A 44px date block cannot hold "August".** The celebrations card used the full month name in a block the
same size as the holidays card's, which sits beside it on Home and uses the short one. Both say *Aug*.

**One day, one clock.** Home opened on a full-width strip reading *Clocked in 07:52 · Face scan, Gate 1*
while My Attendance, two clicks away, said *Not clocked in yet* about the same Tuesday. Both were
hard-coded; neither was wrong on its own screen. The clock is one store now, owned by the screen that
owns the punch, and Home renders a card off it. **Two screens describing one fact must read it from one
place — a teacher who catches them disagreeing once stops believing both.**

**A strip of four facts about a day she is standing in.** Clocked in, effective so far, expected out, and
a bar for how much of the day had passed — full width, above everything. Three of them are My
Attendance's to answer properly and the fourth is the only one Home is for. What is left is a card
beside the greeting: when she came in, a live countdown of what is left, and the one button that is hers.
**A screen's width is a claim about importance, and most facts are not making it.**

**A menu on every row is an invitation to leave the reading.** The attendance record carried a kebab on
each of thirty-one rows — three items, usually two of them disabled — and the attendance-request table
carried one holding a single item. Selecting a row already opens the panel on the right, so the acts for
a day live in that panel, under *What you can do*, with the reason under each one that is closed. Where
a table has exactly one answer to give, it is a button on the row: **Accept** and **Decline** on a
colleague's cover request, **Withdraw** on a request still pending. **Count the clicks between a decision
and the control that takes it; if it is more than none, the control is in the wrong place.**

**A sentence standing where a button would be is a button-shaped absence with words in it.** Five of
eight rows in the leave list opened a panel that ended *"Approved leave has already moved your paid
days. Ask HR to cancel it."* — an answer to a question the reader had not asked, in the place they were
looking for an action. A decided request ends on its trail.

**A subtitle that defines its own title has spent a line saying nothing.** *Holidays ahead / School stays
closed on these days.* *Your document file / What the school holds for you, and what it does not.* *Your
reimbursement claims / Everything you have claimed this financial year.* Eight of these came out of the
employee's screens in one pass. The ones that stayed carry a rule, a provenance or a consequence — never
a restatement.

**The accent is not a quantity, on any screen.** My Attendance drew its two stat bars — hours a day
against the roster, on-time arrivals — in the brand clay, which on that same screen means *act here* on
four links and a button. They are sage now, like every other bar on the page that measures a worked day.

**An opened register is a reading, not a desk.** Three of the fifteen registers opened as the run's own
working screens: a variance gate you could edit, a verification you could run, a bank file you could
release. Three desks inside a reading room, and three second places the same decision could be taken.
They are read now off the roll the run prices people on — one source, two readings — and every act they
offered stayed on the run. **A screen that is half document and half desk is read as neither, and signed
off as both.**

**Fifteen registers, one frame.** Each opens on the figure it answers, the sentence that accounts for it,
the three or four facts a reader asks for next, and then the rows. The table's heading says what a ROW is
— *One row per person*, *One row per campus run*, *One row per contribution* — because the page's own
heading already named the register, and a card that repeats the h1 under the h1 has spent a line saying
nothing.

**A catalogue row and the register it opens are one answer.** The shelf said 31 claims and the register
listed 24; it said 14 loans and the register listed 16; it counted 412 people from one seed and the
register counted them from another. Both numbers are now read from the rows the reader will actually
find. **Any figure printed twice on two screens must be computed once.**

**One figure size inside one section.** A figure that changes size between two rows of the same table is
read as a different KIND of figure, not as a more important one. The pay record's ladder is 17 throughout
— rows, results and component lines — with the two results carried by a tinted band and the weight, and
the component amounts in the same column as the row they add up to. Emphasis is zones and weight; size is
reserved for the one headline figure a screen opens on.

**A filter that empties a table must not take its own controls with it.** A search matching nobody left
the reader with a sentence and a Back button — the search box they would clear had gone with the rows.
The card keeps its heading, its search and its chips, and the empty state inside says what was typed and
what to clear.

**A record opens on the answer, not on the evidence.** Twelve component lines were on screen the moment
the panel opened — basic, DA, HRA, the academic allowance — so the figure the officer is actually asked
about, the net, had to be hunted for among them. The panel opens on **five rows**: what it comes to, what
comes off it, what reaches the bank, what the school adds, what it costs. The twelve lines sit under the row
they add up to and stay shut until somebody asks. **Everything on a screen at rest should be something
every reader of that screen needs; anything only some readers need is one click deep, under the figure it
explains.**

**Hierarchy is zones, weight and silence — in that order.** Four identically outlined boxes down a panel
have no hierarchy, whatever the type inside them does. The fix was three moves, not more decoration: the
summary became a filled slab and the detail stayed outlined on the card surface (zones); the figure scale
went 34 for the gross, 22 for the net on a tinted band, 17 for the rows that feed them, 13.5 for the lines
(weight); and ten rows of table left the resting state entirely (silence). **A screen with nothing hidden
has nothing emphasised.**

**One affordance for "there is more under this."** Three different Show/Hide text links had grown across
this product and no two looked alike. A disclosure is a row you press, with a caret that turns — never a
navigation arrow laid on its side, which reads as a download. The portal a panel renders into sits outside
the app's own stylesheet, so a transition inside one must ask `prefers-reduced-motion` itself rather than
trust the global rule to reach it.

**Three columns side by side are three tables and no arithmetic.** The pay record showed earnings, then
deductions, then the employer's share, in three equal columns across the page. Nothing on the screen said
that the middle one SUBTRACTS from the left one; each closed on its own total and the reader was left to
believe the subtraction had happened somewhere. One table, running top to bottom, is the arithmetic itself:
the earnings come to the gross, the deductions close on the net, the employer lines close on the cost.
**If two groups of figures are related by an operation, they go in one column, in the order of the
operation.**

**A record is a panel, not a page.** One person's pay is read BESIDE the list it was picked from — the row
stays highlighted behind it, closing costs nothing, and the next person is one click away. A page for it
cost a navigation, a back bar, a breadcrumb and a title that repeated the name already in the row.

**Every cell that quotes a figure is a promise the reader can check.** "12% of ₹21,600.00" beside an amount
that is not twelve per cent of ₹21,600.00 is worse than "12% of basic and DA": the specific one is checkable
and wrong, the general one is true of every row. State the RULE in a derivation column, and let the amount
beside it be the arithmetic. (What it caught here: the simulator prices a whole pay group at its sample
person, so the administration group's deductions belong to one member of it. Flagged, not silently
re-priced — re-pricing is a payroll question, not a design one.)

**An absence is not a lack.** Visiting faculty were told "No salary assigned — this person will not be paid
until a salary row exists", on a record that cannot have one: they are paid by the hour, at a rate that
lives in Pay rules. A screen that reads every empty field as a mistake will accuse the people it is
describing — and the band over the register was counting them too, so it promised that two people would
go unpaid while the card above IT named one. **Fix the predicate, not the sentence.**

**A checker needs something to look at.** The approval gate asked one person to release ₹1,55,73,560 of
salary and showed them four summed lines — gross, deductions, holds, net — and not one name. The whole
constitutional point of a second signature is that somebody LOOKED; there was nothing on the screen to
look at. **Where a screen asks for a judgement about people, it shows the people.**

**Two desks, one store.** The gate does not re-seed the run it is approving: it calls the same store the
run console wrote to, so the maker's register and the checker's register cannot drift. The moment a screen
keeps its own copy of another screen's numbers, the two will disagree — and here the disagreement would be
a payment. A filter and a headline that count the same population must also share one predicate, or the
chip says 2 where the sentence says 3.

**Delete the paragraph that explains a visible control.** Seven of them had grown on one screen: "Approve
stays closed until you have opened every tab here", under a Release button already refused with *2 still
unread* printed beside it; "A checker never edits", where no field is editable; "Nothing here changes while
it waits", beside a chip reading *Locked*; "This trail is append-only", under an append-only trail. Copy
that narrates the interface is the interface admitting it does not trust itself.

**A figure nobody can act on is the worst cell on the screen, and a large one is the worst of those.**
A queue band carried `ASKED FOR — ₹5,93,450.00`: four kinds of request added together, minus overtime,
which has no rupee figure at that desk on purpose — so the cell needed a footnote admitting it was
incomplete, and the desk reading it does not approve money anyway. Beside it, `LONGEST WAIT — 58 days`,
where the 58 days belonged to a request sitting with *another* department: the loudest number in the band
read as an accusation and was not even theirs. **Ask of every figure: whose desk is it on, and what do they
press because of it?** The replacements are one population cut three ways — on your desk, with payroll,
back with the employee — which is also exactly what the bar under them can draw.

**A rule goes in the foot, not in a cell.** The one fact that changes which button gets pressed — a claim
with no bill can only be sent back, never verified — is a rule with a count attached, not a metric. It sits
on the band's foot line, and disappears when there is nothing on the desk for it to govern.

**Nothing in a record says the same thing twice.** The first draft of these panels put the cap in the
sentence AND in a fact, the months asked for in the sentence AND in the strip, the evenings and the roster
in the sentence AND in both facts, the new gross in the sentence AND in a fact. That is the bar-and-legend
habit rewritten as prose: the reader checks the second against the first, finds it the same, and has
learned nothing twice. **The sentence under a figure says what the figure IS. The facts say what it is
measured against.** When something moves up into the lead, it comes out of the strip below.

**The panel is the unit of the one-figure rule, not the page.** A rise record carried `+8%` at `fig("xl")`
and, two inches under it, a new gross at the same size — two headlines, and the reader has to decide which
one is the subject. The one the desk acts on wins the size; the other becomes a fact. Which figure that is
depends on whose desk it is: HR agrees a percentage, so HR leads with the percentage; payroll turns it into
components, so payroll leads with the gross those components must add to.

**A layout that works at one width is not a layout.** These figure rows were written for a 1,560-pixel page
and then moved into a 760-pixel panel: four cells of `minmax(140px)` leave about eighty pixels of content
each once their padding and swatch come off, and a rupee figure does not fit in eighty pixels, so it hung
outside the drawer. A record leads with ONE figure at a size the panel can hold and says the rest in words.

**Show the evidence, not the arithmetic.** An overtime claim was four cells — hours, a rate, a multiple, a
total — none of which answers what anybody actually asks about overtime: which evenings somebody stayed and
how late. The register had carried the days all along. The record is the days now (in, out, rostered, over),
and the multiplication is one line under them, which is all a multiplication deserves.

**A panel for a row, a page for a subject.** A record that is one row read in full — a loan's schedule, a
bill, a set of hours — opens beside its list, because you read it, decide, and go back to the row below it,
and replacing the page for that costs your place in the table, your filter and your scroll. A record you
work in for several minutes across several sections earns a page. The question a panel asks opens as a
dialog over it: a drawer over a drawer is two of them fighting.

**An action that describes a consequence must cause it.** The waive panel explained, correctly and well,
that the balance would fall by one instalment — and then set a flash message and left the loan exactly as
it was. Copy that promises what the code does not do is worse than no copy: it is the one kind of bug a
reader cannot see. The panel now shows the two figures that move, before and after, and moves them.

**Offer only what can be done.** Foreclosure sat beside the waiver as an equal option and could not be
taken. A control for a thing the rules forbid teaches the reader that the screen does not know its own
subject.

**In a strip of figures, every cell carries its line or none of them does.** Four bare numbers beside one
with a note read as unfinished: the eye takes the note as the pattern and goes looking for the others. And
a ZERO is the cell that most needs its line, because zero of something means nothing until the reader
knows what the something is and why there is none of it — "0 safe to send" says nothing; "nothing until
PR-2026-08 is approved" says the whole thing.

**A row that names a place opens it.** Run history listed ten runs and gave the reader no way to any of
them. A row hands its campus and its month to the run screen — the same screen the run list opens, one
object with two ways in.

**A module belongs to whoever owns the record, not to whoever reads it.** Paid days left the payroll
officer's rail: they come off attendance and leave, and HR owns both. The officer reads them, and a figure
you read rather than own belongs in the registers, which already carried one.

**A figure slot holds a quantity.** "Provisional" and "2026.3" set at figure size, beside two real counts,
read as data and measure nothing — and the bar under them was 99% configuration. A state is a chip on the
heading; a version is a column where it is useful. What goes in the slot is something you could add up.

**A strip counts what the screen is made of.** A catalogue of registers opened on the month's net pay and
the configuration version: figures that belong to the run, on the screen whose job is to find a report. It
counts REGISTERS now — safe to send, provisional, live — and the three add to the total exactly.

**No word in the interface may be jargon only this codebase uses.** "Pinned configuration" is not a thing
anybody says. The version a month ran on still matters, because two months on different rules cannot be
averaged, so it kept its place in the run history under a heading that says what it is.

**A history of runs lists runs.** It listed months, because once a run was a month. A run has a campus, a
way it was done, a head count and a state of its own; a month is what several of them add up to, and that
is the foot of the table.

**A list a module cannot act on still belongs in it, if it answers the question the module is asked.** The
run shows appraisal rises and cannot pay them — a rise changes what somebody is ON, and every salary in the
run already carries it. It is there because the officer is asked "why did payroll go up", and nowhere else
on the screen answers that. The tab says so in a line, so nobody waits for a button.

**One large figure per screen, and a sentence that accounts for the rest.** Asked for colour and bars on
the figures, I put them on every strip in the module — the run, the loans, the bills, the record, the list,
the pay group — and the designer read five coloured bars on one screen for what they were: wallpaper. A
screen has ONE headline, and under it one line of plain words naming every other figure on it. A row of
equal figures makes the reader rank them; a headline and a sentence does the ranking for them. Nothing is
lost, because every figure is still there — said once, instead of three times in three weights.

**Colour is for state, never for quantity.** A chip that says where something is, a red line that says
something is wrong. A bar of six tints under four numbers is neither.

**A figure strip belongs to a screen that is about figures.** A tab inside a run is a table with a job, and
its own foot already totals what it holds; a four-figure band above it is the same numbers again, larger. A
dashboard earns a band. A working list does not.

**A filter and the figure it changes are one card, not two.** The pay groups moved from chips that named a
cost and did nothing, to cards that each carried their own money and their own meter — four more figures on
a screen that already had four. They are a name and a count now, inside the headline card, because picking
one re-points the headline. A group's money is shown where money lives: once.

**A place you work in gets a screen, and a screen that collects decisions saves them.** A payroll run holds
an hour of somebody's judgement about money. Unfolding it inside the list it came from made it a panel, and
keeping its state in the component that drew it meant walking to another module threw the hour away. It has
its own route, its own back link, a draft that says how many changes are waiting, a Save, and a question
before anybody leaves with unsaved work.

**A part is never a sibling of its whole.** Three times in one afternoon a figure strip drew *earned* beside
*deductions*, which says the month cost the sum of them. The bar is a composition: the total takes no band
and the bands add up to it exactly. Where the officer can add money the run did not earn — a reimbursement,
an advance — the total is what LEAVES on payday and the deduction figure is derived from it, so the identity
cannot be broken by a click.

**Two headline figures that differ by a sum you have just explained is one too many.** The pay-group cards
showed the campus's net including the people being held back, a few inches under a headline that showed the
net without them and a figure naming the difference. A card now shows what its group PAYS, so the cards add
to the headline and there is one big number on the screen.

**A row of figures under a headline is a control or it is clutter.** Three chips naming what each pay group
costs, and nothing to do with them, is a caption. They are the way into a group now: pick one and the
headline, the people, the loans and the bills are that group.

**A mode is asked when somebody commits to the work, not buried in a settings screen.** Running a payroll on
Naveya and running it in a spreadsheet are two different hours, so the question is asked at Start, with both
answers written out in full, and the answer is fixed for that run — half a month done one way and half the
other is not a payroll anybody could audit.

**A thing that is late needs two answers, not one.** A bill owed since last month could only be paid, which
made moving it on look like something the product forbade rather than a decision schools take every month.
Both answers are in the menu, and the one that is a fault — late — is the one that is red.

**A column that says what a row IS belongs in the table.** The loans and the bills named a person and a
staff number and left their pay group to be found elsewhere, which is the first thing an officer filters by.

**A module shows the whole of what it manages, not the biggest part of it.** A payroll run that lists only
salaries has answered a third of the question: a loan instalment, an advance paid out and a reimbursement all
move on the same payday, and an officer who cannot see them from the run goes looking for a second screen.
They are tabs on the run, and the roll's row carries an *Extras* column so a person with something going on
is visible before anything is opened.

**Money the reader moved says so, and offers to put it back.** A headline that silently changes when a claim
is added is a figure nobody can check. It names the base, what was added, what was taken off and how many
changes it took, and every one of them is reversible from the row that made it.

**A list built from a register is the register, not a second opinion of it.** The run's fourteen loans are
PY-13's fourteen loans, and their instalments are the run's published LOAN line to the rupee. Two screens
that each generate their own version of the same money will disagree on the day somebody checks.

**An action's reason survives the action.** "Asked HR today" names neither what was asked nor why, which is
exactly what the reader needs when they come back to the row tomorrow. The row carries the reason and the
note; the record carries both in full.

**A record opens on the person whose row was clicked.** A module that knows four hundred people cannot route
"open pay record" at a screen that knows eleven — it would open the wrong person, or nobody. The screen that
holds the roll holds the record.

**A thing you go into gets a page; a thing you glance at gets a panel.** A pay group holds two hundred people
and a table that pages and scrolls. Forcing that through 820 pixels beside the table it came from is two
screens fighting over one, so opening a group replaces the page and its staff are the bottom half of it.

**A month is a place, not a filter.** Twelve cells across the top of the run, April to March, each saying
whether it is paid, on the desk, or not yet — and opening a paid one opens the same screen, read-only, with
that month's own people and its own figures. History belongs inside the thing it is the history of.

**A guard that cries wolf is worse than no guard.** `/[\u20b9]/` is a regular expression, not JSX text; the
escape check now knows a slash-delimited literal and stops failing on a file nobody touched. The next real
hit has to be believed.

**A label wraps; it is never truncated.** "OVERDUE DOCUMENT REQU…" is not a label, it is a riddle. The cell
reserves two lines for it so the figures beneath stay on one baseline.

**The first figure on a band is the one somebody acts on.** A total of a list printed in full eight inches
below is a number nobody does anything with. Name the line that is actually late.

**Nothing is ever colourless, and `chartSand` is not a colour.** A figure drawn in a grey reads as a figure
that does not matter, and the tan-grey sand reads as a grey. Every metric gets one of the six that mean
something — and no two figures in one strip get the same one, or the colour has stopped identifying
anything.

**A legend is a key to a chart; without the chart it is a row of buttons pretending to be one.** Where a
legend was also the filter — hiring's stages, the lifecycle's, the offers' — the filter moves to a select in
the row that already holds that table's filters.

## Banned

**Gradients of any kind** (designer ruling, 2026-09-23 — a bar, a fill or a background that fades between two token colours asserts a relationship the tokens do not have, and breaks the moment the palette moves) · gradient text · glassmorphism · side-stripe / left-accent-bar callout cards · identical KPI tile rows as a hero · decorative uppercase eyebrows (functional mono column labels are fine) · emoji as UI · Indian kitsch (tricolour, saffron, paisley, rangoli, diya, mandala, temple arches, fake-Devanagari-look Latin) · stock photography · money abbreviated · naked tables on the canvas · radius-0 severity · dead side margins · **a bare figure with nothing to measure it against** (a percentage needs its denominator, an average needs its contracted reference, and both are better for a month-over-month move) · a card padded out with invented metrics instead of context.
