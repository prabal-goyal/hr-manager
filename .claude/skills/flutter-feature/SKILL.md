---
name: flutter-feature
description: Use when adding any Flutter screen or feature to Naveya's app/ — scaffolds the full MVVM slice (screen, ViewModel, repository wiring, drift table if offline data, ARB strings, tests) in the required layering.
---

# Flutter Feature (MVVM slice)

Dispatch to **nightwing** unless trivially small. Stack: Flutter, MVVM, Riverpod, drift (offline), graphql/dio. Steps:

1. **Read** `app/CLAUDE.md` (layering, offline, i18n rules) and the feature's `docs/development-specification.md` module section.

2. **ViewModel first, TDD:** write a failing test for the Riverpod `AsyncNotifier` (states: loading → data → error → offline). Then the ViewModel. Widgets never call repositories directly.

3. **Repository + data sources:** remote (strawberry-django GraphQL via `graphql`, or the DRF REST edge via `dio`) and, if the feature must work offline (attendance punch, leave apply, payslip view, notices), a **drift** table + local-first write with sync replay. Never log PII locally in plain text.

4. **View:** screen built from theme tokens only (the canonical design system in `DESIGN.md` (v3 "Staffroom Terracotta"; tokens live in `design/v3/tokens.jsx`, components in `design/v3/kit.jsx`) — read values from there, never re-type hex codes or font names); every data view gets empty/error/offline states; goldens for **employee AND HR-admin** mode if the screen serves both. Mask PII (PAN/Aadhaar/bank/salary) per the design.

5. **i18n:** all copy in ARB (**en + hi keys created together — never en-only**).

6. **Gate:** `flutter analyze` clean, `dart format` applied, goldens pass; two-face audit for any new screen; update nightwing's `.claude/agent-memory/nightwing/MEMORY.md` if a pattern emerged. Note: `live`/impeccable browser tooling is web-only and does not apply to `app/`.
