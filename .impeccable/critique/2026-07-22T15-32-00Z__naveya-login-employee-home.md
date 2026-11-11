---
target: Naveya Login + Employee Home
total_score: 27
p0_count: 1
p1_count: 3
timestamp: 2026-07-22T15-32-00Z
slug: naveya-login-employee-home
---
# Critique — Naveya Login + Employee Home
Method: dual-agent (A: design review · B: detector+visual). Register: product.

## Design Health: 27/40 (Good). Visual craft is high; held down by undesigned error/edge states + interactive-semantics gaps.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
|1|Visibility of status|3|Continue has no loading/pending state|
|2|Match real world|3|Unglossed jargon: "in lieu of EL", "Effective", "Comp-off"|
|3|User control/freedom|2|Nav is div onClick (no keyboard exit/activation)|
|4|Consistency|3|Identity mismatch + 3 payslip affordances|
|5|Error prevention|2|No validation, misleading password placeholder|
|6|Recognition|3|Icon+label nav helps|
|7|Flexibility|3|Quick actions duplicate nav|
|8|Aesthetic/minimal|4|Genuinely restrained/premium — strongest axis|
|9|Error recovery|2|error prop exists but no error/empty/failed-auth state designed|
|10|Help/docs|2|Footer Support only; no inline help|

## Anti-patterns verdict
Not slop — real craft (OKLCH tokens, ruled rows not card-grid, tabular-mono money, color-never-alone, light/dark parity). Detector detect.mjs: CLEAN (empty) but limited reach (JSX inline-styles invisible to HTML scanner). Tells that remain: identity incoherence (login k.bhardwaj vs home Ananya Rao), "Good morning" at 13:16, fake-filled password placeholder, "Apply leave" ×3.

## Priority issues
- [P0] Most-urgent CTA (Action needed → Respond, police verification) is buried in the right column AND clipped off-canvas; two-column layout overflows instead of reflowing. Fix: promote to full-width banner atop main column when pending; minWidth:0 + wrap, never horizontal clip. → layout, then harden.
- [P1] No error/loading/empty states anywhere (login auth-failure, upload failure undesigned) — worst moment for anxious non-technical users. → harden.
- [P1] Product-truth incoherence: two identities across the flow; greeting not derived from clock; fake password placeholder. → clarify + audit.
- [P1/a11y] Nav + QuickActions are <div onClick> (no role/tabindex/key handler) — unreachable by keyboard/SR; Button lacks :focus-visible; "Forgot?/Support/Privacy" are spans not links. → harden/audit.
- [P2] Redundant competing CTAs (Apply leave ×3; QuickActions re-lists nav). → distill.
- [P2] "Phone-first for desk-less teachers" shipped as 224px desktop sidebar with sub-44px targets; English-only except "आज" vs "bilingual by construction". → adapt + onboard.

## Persona red flags
- Sam (a11y): keyboard cannot reach nav; invisible button focus; span-links not announced. Input focus ring + aria-labels on icon buttons are good. Small muted text (dark subtitles, light footer) likely <4.5:1.
- Casey (mobile): no mobile layout; nav top-left unreachable one-handed; urgent Respond small + clipped.
- Meena (Hindi-first PGT on phone): English wall; two unexplained sign-in paths; jargon (PGT/EMP-014/EL/Comp-off/SSO); police verification unexplained. Anchor that works: the big ₹68,240.00 "Paid".

## Minor
Break segment uses warning(amber) color for a normal lunch break (muddy in dark); "View admin console" role-leaks into employee bar; the "register-is-hero" home is actually a card-and-list dashboard (register/Ledger/Seal unused on the primary surface); bell has no unread count; Vacation "—" ambiguous; Seal unused where Paid pill is.
