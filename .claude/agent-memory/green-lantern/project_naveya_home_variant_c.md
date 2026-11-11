---
name: naveya-home-variant-c
description: design/v2/variants/home-c.jsx + design/v2-c.html — "compact icon rail, data as hero" Employee Home variant, one of 3 parallel Home variants (a/b/c) answering the "colour is all over, sidebar isn't looking good" feedback on STAFFROOM v2
metadata:
  type: project
---

Built alongside [[project_staffroom_v2_build]] as one of three parallel Employee-Home
variants (`design/v2/variants/home-{a,b,c}.jsx`, each a self-contained
`window.HomeVariants.<X>` + its own `design/v2-<x>.html` entry) dispatched to
answer live coordinator feedback: v2's shell colours BOTH the chrome (terracotta
sidebar+topbar) and the data, so nothing leads the eye — "Keka looks good"
because Keka keeps chrome calm and puts colour only in data.

Variant C pushes furthest on chrome-quieting: a ~64px icon-only rail (`c.surface`
background, `c.border` hairline, monogram circle top, avatar-as-signout bottom,
active state = `c.accentSoft` fill + 3px `c.accent` left bar), zero top bar
(controls float unboxed top-right: a locally-styled calm LangSwitcher +
kit `ThemeToggle` + notification icon button, in a `position:sticky` row that's
the same colour as the canvas so it reads as "no bar" while scrolling), and
every full-width hero row (Today, Weekly pattern, Leave balances) sized up
(`HoursRing` size 176, `LeaveDonut` size 132) to spend the width the rail frees.

Rail icon buttons keep a real `aria-label` always (never rely on the
hover/focus tooltip alone) — tooltip is a separate absolutely-positioned
`role="tooltip"` div toggled by local `hover || focus` state (mouse AND
keyboard both trigger it), styled `c.ink` bg / `c.bg` text regardless of
theme (a deliberate "always-dark chip" tooltip look, not theme-flipped).

Files: `design/v2/variants/home-c.jsx` (composes only `window.G2`/`window.UI2`,
does not touch `tokens.jsx`/`kit.jsx`), `design/v2-c.html` (standalone entry,
`?mode=`/`?lang=` query params for verification convenience).

See [[feedback_grid_row_sync_gap]] for a layout bug caught and fixed during
this build (CSS Grid template-areas syncing unrelated column heights left a
dead gap mid-page) — a reusable pitfall for any future dashboard-grid work.
