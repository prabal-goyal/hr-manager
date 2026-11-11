---
name: project-naveya-token-system
description: Naveya's design system is LOCKED to "Peacock & Slate" (2026-07-22); design/tokens.jsx + DESIGN.md are now the binding source, retiring "Greenboard & Chalk" entirely.
metadata:
  type: project
---

`docs/design-tokens-research.md` (dated 2026-07-22) proposed three OKLCH-authored directions for Naveya's design system ("Bahi & Brass", "Peacock & Slate", "Jamun & Ash") to replace the retired "Greenboard & Chalk" (forest green/marigold/Plex Serif). **The pick is now resolved: "Peacock & Slate" won** (near-monochrome cool teal-slate field, single peacock-teal `#007B88`/`#28BAC1` accent, ink-graphite primary buttons, brass `#7E7350`/`#C9B678` for verification). `design/tokens.jsx` (`window.G`) is the canonical living token source; `DESIGN.md` at the repo root is the binding written spec (theme, color table, typography, component vocabulary, layout, elevation/motion, absolute bans). `PRODUCT.md` at the repo root carries users/purpose/positioning/principles.

Type system: Hanken Grotesk (Latin UI sans), Mukta (Devanagari UI), Anek Latin/Devanagari (display ≥26px only, never tables), JetBrains Mono (all figures, `tnum`/`lnum`). `G.t(role, script)` builds the style object — always use it instead of hand-rolling font-family/line-height per screen so the Deva +20% line-height and 0-letter-spacing rules aren't silently dropped.

**Why:** a 5-researcher synthesis + a follow-up decision cycle resolved the open direction choice; the 2026-07-22 build-out dispatch (kit.jsx + screens.jsx + repointed canvas/prototype) was the first real implementation against the locked system.

**How to apply:** treat `design/tokens.jsx` + `DESIGN.md` as authoritative for ANY new Naveya design work (canvas, prototype, or eventual `frontend/`) — never hardcode hex, always read `window.G`. Do not resurrect Bahi & Brass or Jamun & Ash language. See [naveya component kit](project_naveya_component_kit.md) for the shared `window.UI` kit built on top of these tokens, and [theme toggle single-instance](feedback_theme_toggle_single_instance.md) for a UX pitfall hit while wiring the toggle.
