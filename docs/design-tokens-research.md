<!-- Generated 2026-07-22 by a 5-researcher + synthesis Workflow (token architecture · color/OKLCH · typography · space/motion · brand/anti-slop). -->
<!-- STATUS: v1 — color direction CHOSEN 2026-07-22 = "Peacock & Slate" (Alternate A in §2). The research recommended "Bahi & Brass"; the user selected Peacock & Slate. The chosen system is now canonical in design/tokens.jsx and DESIGN.md. Bahi & Brass / Jamun & Ash retained below as record. -->

# Naveya — Design Token System (v1 Proposal)

> This is the research output that replaces the retired "Greenboard & Chalk" system. It proposes a **fresh, distinct, product-register** visual language for Naveya, **light + dark at parity**, authored in **OKLCH**, with **Hindi/Devanagari as a first-class script**. The color section offers a recommended primary direction plus two alternates — **that pick is the open decision.**

## 1. Direction summary

Naveya's visual system is a **product register, not a dashboard**. It takes the one artifact no Indian HRMS competitor owns — the ruled *bahi-khata* muster where the attendance grid resolves rightward into net pay — and makes it the hero surface of every screen (attendance, leave ledger, payroll register, statutory filing, document vault). The system is **calm through structure** (hairline rules and row rhythm do the work, shadows are near-absent, one brand chroma), **trustworthy through figures** (every rupee is tabular, decimal-aligned, full-Decimal-precision, never gradient'd or truncated), and **rooted through grammar, not ornament** (a barely-warm khadi-paper neutral, a single desaturated lac-red "record rule," Devanagari as a weight-matched equal to Latin — never saffron, paisley, rangoli, or diya kitsch). It reads as *of India's education sector* and *at Linear/Stripe craft*, while stepping cleanly out of the entire incumbent field's interchangeable blue/teal card-grid monoculture. Light and dark ship at parity from day one, authored in OKLCH, verified for WCAG AA.

---

## 2. Color

### PRIMARY PICK — "Bahi & Brass"

A near-monochrome **warm khadi-paper** field (not cream, not clinical gray), **ink-graphite** primary actions, and a single desaturated **lac-red** reserved as the structural *record rule* and interactive/focus accent. All chromatic energy on chrome is spent on "the record"; the full success/warning/danger/info set stays free for payroll data semantics.

**Why this over the alternates (the one report disagreement resolved):** the color report picked Peacock teal to dodge SaaS-blue; the brand report picked the lac-red register. Teal sits only ~10° from the retired greenboard and leaves a *cool* neutral that kills the "rooted warmth." Bahi & Brass is the more ownable, more anti-slop answer — but it resolves the color report's valid objection (red-primary collides with danger) by **spending lac-red as structure/rule/focus, never as the primary button fill (that's ink), and giving danger a distinct hotter, more-saturated red.** Best of both reports.

All values OKLCH; hex is the render fallback; ratios are computed sRGB→WCAG.

#### Light

| Token | OKLCH | Hex | Contrast (AA) |
|---|---|---|---|
| `bg` (khadi canvas) | `oklch(0.988 0.004 90)` | `#FCFBF8` | — |
| `surface` | `oklch(0.995 0.003 90)` | `#FEFDFB` | — |
| `surface-raised` | `oklch(1.000 0 0)` | `#FFFFFF` | — |
| `border` | `oklch(0.908 0.006 88)` | `#E2E0DC` | 1.24:1 vs bg (non-text) |
| `ink` | `oklch(0.255 0.012 70)` | `#27221D` | **15.3:1** on bg (AAA) |
| `ink-muted` | `oklch(0.520 0.012 72)` | `#6D6862` | **5.33:1** on bg (AA) |
| `accent` (lac-red) | `oklch(0.520 0.170 25)` | `#B63132` | **5.81:1** as text / **6.01:1** white-on-fill (AA) |
| `success` | `oklch(0.520 0.110 150)` | `#317A45` | **5.06:1** on bg / 5.23:1 white-on (AA) |
| `warning` | `oklch(0.640 0.135 75)` | `#BB7E00` | 3.32:1 — **fill only, dark ink text on it** (see note) |
| `danger` | `oklch(0.575 0.205 27)` | `#D72E2D` | **4.68:1** on bg / 4.85:1 white-on (AA) |
| `info` | `oklch(0.520 0.090 235)` | `#2A7195` | **5.23:1** on bg / 5.41:1 white-on (AA) |
| `brass` (verified signal) | `oklch(0.640 0.110 80)` | `#AF8433` | 4.9:1 as text on bg (AA) |

#### Dark (cool graphite base, chroma tapered on saturated steps per the Radix method)

| Token | OKLCH | Hex | Contrast (AA) |
|---|---|---|---|
| `bg` | `oklch(0.185 0.012 265)` | `#101318` | — |
| `surface` | `oklch(0.220 0.014 265)` | `#171B21` | — |
| `surface-raised` | `oklch(0.258 0.016 265)` | `#20242B` | — |
| `border` | `oklch(0.320 0.016 264)` | `#2F333B` | non-text |
| `ink` | `oklch(0.945 0.004 90)` | `#EEEDEA` | **15.9:1** on bg (AAA) |
| `ink-muted` | `oklch(0.720 0.010 260)` | `#A1A5AB` | **7.52:1** on bg (AAA) |
| `accent` (lac-red) | `oklch(0.640 0.150 27)` | `#D86258` | **5.17:1** on bg / 4.81:1 on surface (AA) |
| `success` | `oklch(0.760 0.115 155)` | `#71C791` | **9.10:1** on bg |
| `warning` | `oklch(0.800 0.130 80)` | `#E9B452` | **9.86:1** on bg |
| `danger` | `oklch(0.680 0.170 27)` | `#EF675C` | **6.00:1** on bg / 5.57:1 on surface |
| `info` | `oklch(0.740 0.090 232)` | `#6DB5DA` | **8.24:1** on bg |
| `brass` | `oklch(0.790 0.110 82)` | `#DEB464` | 11.1:1 on bg |

**Load-bearing notes (implementers must honor):**
- **Warning is a fill, not text.** Amber fails AA as small text on any light bg. Use `warning` as a badge/chip fill with **ink** text on it, or as an icon — never as caption color. (Dark `warning` as text is fine at 9.86:1.)
- **`accent` (lac-red) vs `danger` never collide by role:** accent = structure/rule/focus/active-record; danger = error/debit, always paired with an icon or `−` sign. They are also 3 hue-degrees and one chroma-step apart so they read as distinct materials.
- **Primary buttons use `ink` fill + paper text** (collision-free, Stripe/Linear-premium), not the accent. This is a component decision documented in §5.
- **Color-blind safeguard:** credit/present/success and debit/absent/danger are **never encoded by hue alone** — always `+`/`−`, an icon, or a P/A mark. ~8% of male staff have red-green deficiency; this is a money product.
- **Focus ring** = `accent` at ~0.55 alpha, 2px ring + 2px offset; verified ≥3:1 against both bg and surface.

### ALTERNATE A — "Peacock & Slate" (safest chromatic pick)
Deep peacock-teal action `oklch(0.520 0.115 205)` `#007B88` (light) / `oklch(0.720 0.115 200)` `#28BAC1` (dark), on cool teal-tinted slate neutrals. Trustworthy-like-blue without being SaaS-blue; leaves red/amber/green free for data. Trade-off: ~10° from the retired greenboard (perception risk to verify) and a *cool* neutral that sacrifices the khadi warmth. Accent-as-text is only 4.79:1 — lock it to fills, don't shrink it into captions.

### ALTERNATE B — "Jamun & Ash"
Deep jamun/aubergine plum action `oklch(0.480 0.130 330)` `#853E80` (light) / `oklch(0.700 0.120 332)` `#CA82C0` (dark), with a cool-teal interactive signal `#008687`, on warm-cool mauve-ash neutrals. Gender-neutral, orthogonal to *every* edu reflex (neither blue nor cream), genuinely distinctive. Trade-off: plum is the least "financial/compliance-serious" of the three and the mauve neutral is the hardest to keep from tipping decorative.

---

## 3. Typography

**Recommended pairing** (both scripts as first-class equals; both OFL, variable, Flutter-embeddable):

- **Latin UI sans:** **Hanken Grotesk** — warm neo-grotesque, true tabular figures, crisp at 12–14px in dense tables; more character than Inter while staying calm.
- **Devanagari companion:** **Mukta** (Ek Type, Mumbai) — humanist monolinear, drawn for UI/body, high legibility at small sizes; matras/shirorekha/x-height harmonized by one hand. Auto-switched via `@font-face` `unicode-range` (U+0900–097F, U+A8E0–A8FF).
- **Display / brand voice (≥26px only):** **Anek** (Anek Latin + Anek Devanagari, Ek Type) — variable multi-width, contemporary Indian character. Wordmark, page titles, empty-state hero numerals. **Never** in tables.
- **Mono / figures:** **JetBrains Mono** (fallback IBM Plex Mono) with `'tnum' 1, 'lnum' 1` — money columns, ledger amounts, fixed IDs (PAN/UAN/ESIC/bank a/c).

**Single-family fallback** (if two-foundry metric-matching proves fiddly): Mukta for *both* scripts — it ships a tuned Latin, guaranteeing cross-script harmony with zero pairing work. **Retreat position** (one-vendor bandwidth crunch): IBM Plex Sans + Plex Sans Devanagari + Plex Mono — script-tuned and complete, but treat as retreat, not brand (it reads as the retired system).

**Money is always Western-Arabic numerals in tabular treatment.** Devanagari digits are offered as a first-class *display* toggle for counts/labels, never for computed amounts.

### Type scale — Latin

| Role | px | line-height | weight | letter-spacing | features |
|---|---|---|---|---|---|
| display | 40 | 44 | 600 | −0.02em | — |
| h1 | 26 | 32 | 600 | −0.01em | — |
| h2 | 20 | 28 | 600 | −0.005em | — |
| h3 | 16 | 24 | 600 | 0 | — |
| body | 14 | 20 | 400 | 0 | — |
| caption | 12.5 | 18 | 400 | +0.004em | — |
| table-cell | 13 | 18 | 400 (header 500) | 0 | `tnum` `lnum` |
| mono-figure | 13 | 18 | 500 | 0 | `tnum` `lnum` |

### Type scale — Devanagari companion (same px, roomier line-box, letter-spacing **always 0**)

| Role | px | line-height (Deva) |
|---|---|---|
| display | 40 | 52 |
| h1 | 26 | 38 |
| h2 | 20 | 32 |
| h3 | 16 | 28 |
| body | 14 | 24 |
| caption | 12.5 | 20 (never render <12px) |
| table-cell | 13 | 22 |

**Devanagari rules (must be wired, not just documented):** every role carries **two** line-heights (Deva ≈ +20% for shirorekha + upper/lower matras + conjuncts); Devanagari **never** inherits a Latin-tight line-box or `overflow:hidden` single-line clamp; letter-spacing is **exactly 0** for all Deva roles (negative tracking collapses conjuncts — only Latin display/h1 get negative tracking). Optionally render Hindi at 0.97× to balance Mukta's larger x-height. Validate `ink`/`ink-muted` against a real Devanagari specimen (it reads denser than Latin at small sizes).

---

## 4. Space / radius / elevation / motion

### Spacing — 4px base, keys = px/4 (Tailwind 1:1)

```
{0:0, px:1, 0.5:2, 1:4, 1.5:6, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, 20:80, 24:96}
```
The `px` (1px) and `0.5` (2px) rungs exist for table-cell insets and hairline focus offsets. **Density lives in rows, breathing room lives in section gaps.**

**Two density modes off one scale** (per-surface, *not* a global toggle):
- **Compact** (payroll registers, leave ledgers, attendance): row 36px, cell padding `2`/`3` (8v/12h). Payroll = compact.
- **Comfortable** (forms, detail panes, self-service app): row 44px, padding `3`/`4`. Fields `4` (16) apart; groups `6`–`8` (24–32); sections `8`–`10`.

### Radius — crisp controls, soft surfaces, concentric nesting

```
{none:0, xs:4, sm:6, md:8, lg:12, xl:16, 2xl:20, pill:9999}
```
Controls (inputs/buttons/selects) sit at **6px** (not the ubiquitous 8) for instrument-panel precision; cards/panels `lg:12`, modals/sheets `xl:16`. **Rule:** `inner = outer − padding` (a 6px control in a 12px card with 12px inset stays parallel).

### Elevation — per-theme (light = soft cool shadow; dark = surface ladder + hairline)

**Light** (cool-tinted `rgba(22,28,45,·)`, never pure black — two-layer ambient+key):
```
0: none
1: 0 1px 2px -1px rgba(22,28,45,.08), 0 1px 3px rgba(22,28,45,.06)        // resting card
2: 0 4px 8px -2px rgba(22,28,45,.10), 0 2px 4px -2px rgba(22,28,45,.06)   // hover/raised
3: 0 12px 24px -6px rgba(22,28,45,.14), 0 4px 8px -4px rgba(22,28,45,.08) // dropdown/popover
4: 0 24px 48px -12px rgba(22,28,45,.22), 0 8px 16px -8px rgba(22,28,45,.12) // modal
5: 0 32px 64px -16px rgba(22,28,45,.28), 0 12px 24px -12px rgba(22,28,45,.16) // toast
```
**Dark** — shadow is near-invisible, so elevation = **lighter surface** + top-lit hairline; real shadows only for floating layers:
```
surf ladder: canvas .185 → 1:.22 (card) → 2:.258 (popover) → 3:.30 (modal) → 4:.33 (toast)  [OKLCH L, hue 265]
surfBorder (top-lit hairline): oklch(1 0 0 / .07)
el.dark 1: inset 0 1px 0 oklch(1 0 0 /.05)
       2: inset 0 1px 0 oklch(1 0 0 /.06), 0 4px 12px rgba(0,0,0,.4)
       3: inset 0 1px 0 oklch(1 0 0 /.07), 0 16px 40px rgba(0,0,0,.5)
       4: 0 24px 56px rgba(0,0,0,.6)
```
**Data rows never get elevation** — elevation is for floating layers only; registers use rules/borders.

### Motion — snappy productivity ramp

```
dur  = {instant:75, fast:120, base:180, slow:280, slower:420}   // ms
ease = {
  outQuart:  cubic-bezier(.25,1,.5,1),
  outQuint:  cubic-bezier(.22,1,.36,1),
  outExpo:   cubic-bezier(.16,1,.3,1),
  inOutQuart:cubic-bezier(.76,0,.24,1),
  standard:  cubic-bezier(.2,0,0,1),      // Material emphasized, symmetric moves
  outBack:   cubic-bezier(.34,1.56,.64,1) // ONLY on toggle/checkmark confirms, never layout
}
```
Named semantic motions (ship ready-made so nobody re-derives): `hover 120ms outQuart` · `press 90ms outQuart (scale .98)` · `enter 180ms outExpo (opacity + translateY 6→0 + scale .98→1)` · `exit 140ms outQuart (faster than enter)` · `expand 200ms inOutQuart` · `page 280ms inOutQuart` · `modal 280ms outExpo`. Anything triggered dozens of times/day (hover, row-select, toggle) stays ≤120ms.

**Reduced-motion** (`prefers-reduced-motion` / Flutter `disableAnimations`) — swap the whole map, don't global-kill: strip *all* transform, keep opacity-only crossfades ≤100ms, press → 0ms, `outBack` disabled.
```
reduced = {hover:'80ms linear', press:'0ms', enter:'80ms linear', exit:'80ms linear', expand:'0ms', page:'100ms linear', modal:'100ms linear'}
```

---

## 5. Token taxonomy

Adopt **Material 3's ref → sys → comp** vocabulary verbatim, flattened to Naveya's dot-access idiom as `G.ref` / `G.sys` / `G.cmp`. **The universal rule: primitives never flip; semantics do.** Mode is decided **only at the `sys` tier**. Component code may read `G.sys.*` and `G.cmp.*` **only** — never `G.ref.*`, never a raw hex.

| Tier | Job | Worked example (color / space / radius / elevation) |
|---|---|---|
| **ref** (primitive) | Raw material, no context. Two full neutral ramps (light+dark) live as siblings. | `G.ref.color.lac[9]` · `G.ref.space[4]` · `G.ref.radius.lg` · `G.ref.shadow[2]` |
| **sys** (semantic) | Roles on the fg/bg/border axis; **where light/dark is chosen**. | `G.sys.color.accent.solid → {ref.color.lac.9}` (light) / `{lac.10}` (dark) · `G.sys.space.gutter → {ref.space.4}` · `G.sys.radius.control → {ref.radius.sm}` · `G.sys.elevation.raised → {ref.shadow.2}` |
| **cmp** (component) | Per-component props, authored **once** (inherit the flip for free). Mint only when a component genuinely deviates from a sys role. | `G.cmp.button.primary.bg → {sys.color.ink.solid}` · `G.cmp.button.paddingX → {ref.space.3}` · `G.cmp.button.radius → {sys.radius.control}` · `G.cmp.dialog.shadow → {sys.elevation.overlay}` |

**Single source of authority:** author once in a **DTCG** file (`$value`/`$type` + `{alias}` strings); `window.G` becomes a **build output**, not the source. Codegen resolves aliases and emits every target — no target is hand-authored (that reintroduces exactly the drift `check-contract-sync` exists to block).

**Portability mapping:**

| Target | ref | sys | cmp |
|---|---|---|---|
| **window.G (now)** | `G.ref.color.lac[9]` (resolved hex+oklch for active mode) | `G.sys.color.accent.solid` (already correct for `G.mode`) | `G.cmp.button.primary.bg` |
| **CSS + Tailwind v4** | plain vars **outside** `@theme`: `--ref-color-lac-9` | **only tier in `@theme`**, namespace-shaped leaves: `--color-accent-solid`, `--spacing-gutter`, `--radius-control`, `--shadow-raised` → auto-generates `bg-accent-solid`/`p-gutter`/`rounded-control`/`shadow-raised`. Dark via `:root[data-theme=dark]{…}` | scoped vars inside shadcn component CSS: `--btn-primary-bg` |
| **Flutter (later)** | `const RefColors`/`RefSpace` classes | `ThemeExtension NaveyaColors` with light/dark factory constructors | component themes reading the extension. OKLCH pre-converted to ARGB at codegen. |

Keep `@theme` to the **semantic tier only** (primitives in `@theme` balloon output with hundreds of junk utilities). Primitive ramps are generated in OKLCH on the Radix 12-step contract (1-2 bg · 3-5 component states · 6-8 borders · 9-10 solids · 11 low-contrast text · 12 high-contrast text), with an sRGB/hex fallback alongside each `oklch()`, and **AA asserted in CI** at steps 11/12.

**Two guards to add** (analogous to `guard-hardcoded-values`): (1) fail any canvas/component code reading `G.ref.*` or a raw hex — keeps dark mode from silently breaking; (2) wire codegen under `check-contract-sync` so a hand-edited target is blocked. **Migrate every `G.sh.board`/`G.marigold`/`G.r.lg` call site to `G.sys`/`G.cmp` *before* adding the dark palette** (tier leakage is the top risk). Ship a back-compat shim during migration, then delete it.

---

## 6. Signature moves & anti-references

### Ownable signature moves
1. **The Register is the hero object** — every primary surface is a ruled *staff × period* grid with a fixed identity column, a scrolling body, and a **summing footer** (the ledger sum-line under totals), resolving rightward into Present → Net pay → Status. Not a card dashboard. Carry the retired system's muster *structure*; discard 100% of its greenboard/marigold/serif skin.
2. **The red margin rule ("laal kinaara")** — a single desaturated lac-red vertical rule (`sys.color.accent`) delimits "the official record": the identity column, the locked/audited region, the maker-checker boundary. Structural, rooted, non-kitsch. Promote it to a system primitive (`<RecordRule/>`).
3. **Figures as the brand's face** — every rupee/count/statutory figure in tabular-lining mono with the currency mark, decimal-column alignment, and a thin rule under totals. Money is Decimal, shown as Decimal, never truncated, never gradient'd.
4. **Devanagari-first bilingualism** — a designed bilingual label pattern (English line / Devanagari companion at **equal weight**), danda (।) or hairline as separator instead of bullets. A signature competitors structurally can't copy without re-typesetting.
5. **The seal/stamp ("mudra") as verification affordance** — maker-checker approved / statutory "filed" / document "verified" use a subtle abstracted round-stamp impression (in `brass`), not a generic green check. Icon set derived from muster marks (P/A/L/half/H) with **square terminals** echoing ruled paper — explicitly not rounded-friendly Lucide defaults.

### Ban list (hard — do not ship any of these)
1. The KPI hero-card row (3–4 gradient-number tiles) — the register/ledger is the hero.
2. indigo-600 / blue-600 / teal as primary, and any violet→blue gradient (the entire incumbent field lives here).
3. Identical rounded-card grids for dense screens — dense screens are **ruled** (hairline grids, column rules), not carded.
4. Any cartoon assistant avatar / mascot bot (the Zia/Bella/Lisa lineage).
5. Gradient or glowing numerals — figures are flat, tabular, decimal-aligned, sacred.
6. Emoji / confetti / celebratory success states in data UI.
7. Stock photos of smiling office teams; corporate-Memphis blob illustration.
8. Decorative Indian kitsch of any kind: tricolour, saffron fields, paisley, rangoli, diya, mandala loaders, temple arches, fake-Devanagari-look Latin.
9. Uppercase tracked "eyebrow" labels as decoration — permitted **only** as functional monospaced ledger column heads.
10. Glassmorphism, side-stripe callout cards, dark-glow hero panels, editorial serif display, the retired greenboard forest-green + marigold + Plex Serif.

---

## 7. Starter `window.G` object

Drop-in flat object matching **Bahi & Brass**. Values are the resolved artifact for both modes (dev-canvas keeps both maps + a `mode` switch); OKLCH is the authored source, hex is the Babel-standalone inline-style fallback.

```js
window.G = {
  mode: 'light',

  // ── SEMANTIC COLOR (the tier components read) ──
  light: {
    bg:'#FCFBF8', surface:'#FEFDFB', raised:'#FFFFFF', border:'#E2E0DC',
    ink:'#27221D', inkMuted:'#6D6862',
    accent:'#B63132', accentSoft:'#F5E4E0', onAccent:'#FFFFFF',   // lac-red: record rule / focus / active
    action:'#27221D', onAction:'#FCFBF8',                          // primary button = ink (collision-free)
    brass:'#AF8433',                                               // verified / on-the-record signal
    success:'#317A45', warning:'#BB7E00', danger:'#D72E2D', info:'#2A7195',
    onSuccess:'#FFFFFF', onWarning:'#27221D', onDanger:'#FFFFFF', onInfo:'#FFFFFF'
  },
  dark: {
    bg:'#101318', surface:'#171B21', raised:'#20242B', border:'#2F333B',
    ink:'#EEEDEA', inkMuted:'#A1A5AB',
    accent:'#D86258', accentSoft:'#331A18', onAccent:'#101318',
    action:'#EEEDEA', onAction:'#101318',
    brass:'#DEB464',
    success:'#71C791', warning:'#E9B452', danger:'#EF675C', info:'#6DB5DA',
    onSuccess:'#08160B', onWarning:'#241A05', onDanger:'#2A0B09', onInfo:'#06171F'
  },
  _oklch: { accent:'oklch(.520 .170 25)', danger:'oklch(.575 .205 27)', brass:'oklch(.640 .110 80)',
            bg:'oklch(.988 .004 90)', ink:'oklch(.255 .012 70)' },

  // ── TYPOGRAPHY ──
  sans:        "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif",
  deva:        "'Mukta', 'Hanken Grotesk', system-ui, sans-serif",
  display:     "'Anek Latin', 'Hanken Grotesk', sans-serif",
  displayDeva: "'Anek Devanagari', 'Mukta', sans-serif",
  mono:        "'JetBrains Mono', ui-monospace, 'IBM Plex Mono', Menlo, monospace",
  fw: { r:400, m:500, sb:600, b:700 },
  // role → [px, lhLatin, lhDeva, weight, tracking]
  type: {
    display:[40,44,52,600,'-0.02em'], h1:[26,32,38,600,'-0.01em'], h2:[20,28,32,600,'-0.005em'],
    h3:[16,24,28,600,'0'], body:[14,20,24,400,'0'], caption:[12.5,18,20,400,'+0.004em'],
    cell:[13,18,22,400,'0'], figure:[13,18,18,500,'0']  // figure/cell add font-feature 'tnum' 'lnum'
  },

  // ── SPACE / RADIUS ──
  sp: {0:0, px:1, '0.5':2, 1:4, '1.5':6, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, 20:80, 24:96},
  r:  {none:0, xs:4, sm:6, md:8, lg:12, xl:16, '2xl':20, pill:9999},

  // ── ELEVATION (per-theme) ──
  el: {
    light:{0:'none',
      1:'0 1px 2px -1px rgba(22,28,45,.08), 0 1px 3px rgba(22,28,45,.06)',
      2:'0 4px 8px -2px rgba(22,28,45,.10), 0 2px 4px -2px rgba(22,28,45,.06)',
      3:'0 12px 24px -6px rgba(22,28,45,.14), 0 4px 8px -4px rgba(22,28,45,.08)',
      4:'0 24px 48px -12px rgba(22,28,45,.22), 0 8px 16px -8px rgba(22,28,45,.12)',
      5:'0 32px 64px -16px rgba(22,28,45,.28), 0 12px 24px -12px rgba(22,28,45,.16)'},
    dark:{0:'none',
      1:'inset 0 1px 0 rgba(255,255,255,.05)',
      2:'inset 0 1px 0 rgba(255,255,255,.06), 0 4px 12px rgba(0,0,0,.4)',
      3:'inset 0 1px 0 rgba(255,255,255,.07), 0 16px 40px rgba(0,0,0,.5)',
      4:'0 24px 56px rgba(0,0,0,.6)'}
  },
  surf: { canvas:'#101318', 1:'#171B21', 2:'#20242B', 3:'#262B33', 4:'#2C313A' },
  surfBorder: 'rgba(255,255,255,.07)',

  // ── MOTION ──
  mo: {
    dur:{instant:75, fast:120, base:180, slow:280, slower:420},
    ease:{outQuart:'cubic-bezier(.25,1,.5,1)', outQuint:'cubic-bezier(.22,1,.36,1)',
          outExpo:'cubic-bezier(.16,1,.3,1)', inOutQuart:'cubic-bezier(.76,0,.24,1)',
          standard:'cubic-bezier(.2,0,0,1)', outBack:'cubic-bezier(.34,1.56,.64,1)'},
    hover:'120ms cubic-bezier(.25,1,.5,1)', press:'90ms cubic-bezier(.25,1,.5,1)',
    enter:'180ms cubic-bezier(.16,1,.3,1)', exit:'140ms cubic-bezier(.25,1,.5,1)',
    expand:'200ms cubic-bezier(.76,0,.24,1)', page:'280ms cubic-bezier(.76,0,.24,1)',
    modal:'280ms cubic-bezier(.16,1,.3,1)',
    reduced:{hover:'80ms linear', press:'0ms', enter:'80ms linear', exit:'80ms linear',
             expand:'0ms', page:'100ms linear', modal:'100ms linear'}
  }
};
```

**Migration note for the canvas:** this `light`/`dark`/`mode` shape is the interim ergonomic form. The *authoritative* structure is the three-tier `G.ref` / `G.sys` / `G.cmp` in §5, emitted by codegen from one DTCG source; the flat `G.light.accent` keys map 1:1 onto `G.sys.color.accent.*` when codegen lands. Add a `G.c = G[G.mode]` resolver so canvas scripts read `G.c.accent` without hardcoding which sub-map they touch.

---

## Token-architecture detail (from the architecture researcher)

The three-tier system above is backed by a concrete build plan:
- **Folder:** `design/tokens/source/{ref.color.json, ref.space.json, ref.radius.json, ref.shadow.json, ref.type.json, sys.light.json, sys.dark.json, cmp.*.json}` + `build/{window.G.js, tokens.css, tailwind.theme.css, naveya_tokens.dart}` + `codegen.mjs`.
- **Rule:** primitives never flip; semantics carry two value-maps (`sys.light` / `sys.dark`) selecting which primitive each key resolves to; component tokens authored once.
- **Codegen from day one**, wired under `check-contract-sync` exactly as GraphQL SDL / OpenAPI drift is blocked. Hand-authoring any single target is banned.
- **Back-compat shim** during migration (`G.marigold → G.ref.color…`, `G.r.lg → G.ref.radius.lg`), deleted once call sites move.
