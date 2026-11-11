---
name: impeccable-ai-tells
description: design hook (impeccable) blocks recognizable AI-UI tells — Fraunces/Inter-class fonts and side-tab accent borders; what I swapped to and why
metadata:
  type: feedback
---

The repo's `impeccable` design hook deterministically flags two patterns I reached for by default on the clean-room Naveya screens (2026-08):

1. **overused-font** — Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk are treated as AI-UI convergence fonts. Swapped to **Literata (display serif) + Public Sans (UI)**, which paired well with Noto Serif/Sans Devanagari and kept tabular figures for money. That pairing is now proven for this product's "school register" tone.
2. **side-tab** — a thick colored border-left on a card is "the most recognizable tell of AI-generated UIs". Removing it cost nothing: the attention state was already carried by an overline dot+word, a tinted icon square, and an ochre due-chip (icon+word, not color-alone).

**Why:** the hook fires on every Write/Edit to design files; these are not stylistic suggestions but deterministic blocks requiring explicit handling. Also, the client is explicitly judging distinctiveness ("no generic admin template").

**How to apply:** before styling any new design surface, pick faces outside the flagged list and signal emphasis without single-side accent borders. Related: [[reference-puppeteer-verification]] for verifying the result renders.
