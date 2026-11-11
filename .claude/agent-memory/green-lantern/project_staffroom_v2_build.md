---
name: project-staffroom-v2-build
description: where the STAFFROOM v2 ("Terracotta Clay") design-system reset lives and how its files relate to v1
metadata:
  type: project
---

Built 2026-08-10: a from-scratch v2 design system under `design/v2/` after "Peacock & Slate" (v1, `design/tokens.jsx`+`kit.jsx`+`screens.jsx`) was rejected as "too bland and robotic." v1 files were left untouched — v2 is fully parallel (`window.G2`/`window.UI2`/`window.Screens2`, own `design/v2.html` entry).

Files: `design/v2/tokens.jsx` (G2 — shell terracotta gradient, 4 vivid attendance-state roles + 4 leave-TYPE roles, warm-brown-black dark parity, Figtree/Mukta/JetBrains Mono), `design/v2/kit.jsx` (UI2 — outline-stroke `Glyph` character set, `HoursRing`, `LeaveDonut`, `DayTimeline`, `WeekStripChart`, `DayLogRow` row-tint+pill, `PaydayMoment`, illustrated `EmptyState`, i18n `LangProvider`/`useLang`/`t()`), `design/v2/screens.jsx` (`Login`, `Employee` shell + Home), `design/v2/tweaker.jsx` + `design/v2-tweaker.html` (live token tweaker, see [[project_theme_tweaker_via_provider_overrides]]).

Reference: `design/shell-options.html` (4 shell-color mockups, option B/Terracotta Clay approved) is the visual contract for the shell gradient + hours-ring + glyph energy — check it before any v2 visual dispute.

Do not edit v1 (`design/tokens.jsx`, `kit.jsx`, `screens.jsx`, `screens/`, `index.html`, `prototype.html`) while iterating on v2; they're kept intact for comparison/rollback until v2 is formally approved.
