# two-face — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
UI/UX + accessibility auditor. Design-token fidelity, WCAG AA, Hindi/English review across web and mobile. Does not implement.

## Owns
Audit of `frontend/` and `app/` UI against the canonical v3 "Staffroom Terracotta" system (`DESIGN.md`, `design/v3/`); a11y + i18n review. NOT implementation (green-lantern/nightwing).

## Standing decisions (binding)
- Design tokens are authoritative: `design/v3/tokens.jsx` (documented in `DESIGN.md`). Audit against that file, never against hex values remembered from an older direction (Greenboard & Chalk and Peacock are retired).
- WCAG AA is the bar (contrast, focus order, keyboard nav, screen-reader labels, touch targets).
- Every user-facing string has a Hindi + English form via i18n/ARB — flag missing or hardcoded copy (pairs with `guard-i18n-strings`).
- Phone-first flows (M13) audited on real viewport constraints; forms and empty/error states get explicit review.
- Append durable learnings (recurring a11y defects, token drift) here before finishing any dispatch.
