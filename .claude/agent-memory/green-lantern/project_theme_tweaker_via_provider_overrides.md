---
name: project-theme-tweaker-via-provider-overrides
description: pattern for building a live design-token tweaker that previews real screens (not a reimplemented sample surface)
metadata:
  type: project
---

`design/playground.jsx` (v1 precedent) is a fully standalone reimplementation of a sample surface (its own copy of Button/Field/Register/etc.) driven by locally-mutable palette objects — it never touches the real `window.UI`/`window.Screens`, so it can drift from what's actually shipped.

For `design/v2/tweaker.jsx` I used a different, higher-fidelity approach: added an optional `overrides` prop to `kit.jsx`'s `ThemeProvider` — `{ light: {...partialColorMap}, dark: {...partialColorMap} }`, shallow-merged onto `G2.theme(mode)` before being put on context. Default `undefined` so the shipped app (`v2.html`) is completely unaffected. The tweaker then renders the REAL `Screens2.Login`/`Screens2.Employee` inside `<ThemeProvider overrides={...}>`, so every pixel previewed is byte-identical to production — edit a hex field, the actual Home screen repaints live, including the pages' own `ThemeToggle`/`LangSwitcher`.

Control rail lives INSIDE the same `ThemeProvider`/`LangProvider` (not above it) so it can read `mode`/`toggle` via `useTheme()` and stay in sync with the preview without duplicating mode state.

For chip-tint/text companion tokens (e.g. `presentTint`/`presentText`), don't expose all three per role in the rail (too many fields) — auto-derive tint/text from the edited solid via a `mix()` towards white/black (light) or black/white (dark), and label the export panel as an approximation that needs hand contrast-verification before promotion into `tokens.jsx`.

**How to apply:** reach for the `ThemeProvider(overrides)` pattern whenever asked for a "design system tweaker/playground" on a canvas that already has a real kit — it's strictly more valuable than a reimplemented sample surface and is a small, additive, backward-compatible change to the provider. See [[project_staffroom_v2_build]].

**Layering multiple override sources (preset + fine-tune):** when the user later asked for a preset switcher (4 whole shell/colour directions) ON TOP of the existing per-token editor, the clean shape was a 3-layer merge computed in one `useMemo`: `{...G.theme(mode), ...deriveFullOverride(selectedPreset[mode]), ...deriveForMode(userEdits[mode])}`, passed as the single `overrides` prop. Each layer is a plain partial-color object; later layers win via spread order. "Reset" just clears the top (edits) layer, so it naturally falls back to the preset layer rather than the hardcoded base — no special-casing needed. Switching preset should also clear the edits layer (fresh fine-tuning canvas per direction) or old edits will look like nonsensical overrides on the new palette.

**Deriving a full palette from a short "core" list:** don't hand-author every token (tint/text pairs, accentSoft, action/onAction, chrome overlays) per preset — reverse-engineer the mix() ratios from ONE already-authored palette (e.g. solve `tint = mix(solid, white, t)` for the shipped Terracotta tokens to recover `t≈0.84` light / `t≈0.78` dark, `text = mix(solid, black, 0.38)` light / `mix(solid, white, 0.35)` dark), then apply that same formula to every preset's hand-specified core solids. This keeps N presets consistent with each other and with the shipped app while only requiring ~12 hand-picked hex values per preset instead of ~30+.
