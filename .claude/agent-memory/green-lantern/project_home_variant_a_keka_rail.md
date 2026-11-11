---
name: home-variant-a-keka-rail
description: Variant A of the Employee Home A/B/C parallel dispatch (2026-08-10/11) — Keka-faithful narrow dark rail + thin brand top bar; the chrome-vs-data colour-discipline pattern to reuse.
metadata:
  type: project
---

Built `design/v2/variants/home-a.jsx` (+ `design/v2-a.html` standalone entry) as one of THREE parallel variants (A/B/C, different agents) responding to user feedback on `design/v2/screens.jsx`: "design looks better but the colour is all over, and the sidebar isn't looking good. Keka looks good." Diagnosis: v2 made both the CHROME (big gradient terracotta sidebar + top bar) and the DATA colourful — colour had no hierarchy.

**The reusable pattern (CALM CHROME + COLOURFUL DATA):**
- Rail sidebar narrow (84px), icon-over-label, ONE soft active fill — not a big saturated brand-gradient slab.
- Rail colour: derive a "deep neutral tinted toward the brand hue" by MIXING two existing tokens (`G2.surf.canvas` + the theme's `c.shell`) rather than inventing a new hex literal or reusing the shell gradient directly — keeps `guard-hardcoded-values` clean and reads as calm/receding in both light and dark (same dark rail regardless of app theme, like the live Keka reference).
- Top bar stays thin (~56px) and CAN carry the brand colour as a flat (not gradient) band — this is fine per Keka's own live pattern; the sin was the SIDEBAR being an oversized saturated slab, not any brand colour existing at all. `LangSwitcher` and `ThemeToggle(onDark)` from kit.jsx are hardcoded for shell/onShell colours — only place them on a chrome surface using those tokens (flat `c.shell`), not on a white/light topbar (their internal colours assume a dark/branded bg and would lose contrast on white).
- All colour energy goes to DATA components already in the kit: HoursRing, WeekStripChart, LeaveDonut, DayLogRow tinting, Glyph, Chip — reuse them unmodified.

**Process note:** three variants shared the SAME `/private/tmp/.../scratchpad/pptest/` dir concurrently (parallel dispatch) — another agent's `verify.js`/http-server got overwritten/killed mid-verification. Not a problem if you've already captured your screenshots before that happens; screenshot files were named uniquely per variant (`home-a-*.png` vs `c-*.png`) so no collision. Do the screenshot capture pass early/atomically per variant rather than assuming the scratchpad is exclusively yours.

See also [design canvas conventions](project_design_canvas_conventions.md), [content width balance](project_naveya_content_width_balance.md) (same CONTENT_MAX=1200 pattern reused here), [live reference capture mid-task](project_live_reference_capture_midtask.md) if that name exists once written.
